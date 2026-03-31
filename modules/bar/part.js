
//import by                    from 'fn/by.js';
//import get                   from 'fn/get.js';
import matches               from 'fn/matches.js';
import toStopBeat            from '../event/to-stop-beat.js';
import last                  from '../object/last.js';
import push                  from '../object/push.js';
import { eq, gte, lte, lt, gt } from '../number/float.js';
import nearest               from '../number/nearest.js';
import { createRests }       from '../symbol/rest.js';
import { createBeam, closeBeam } from '../symbol/beam.js';
import { closeTuplet }       from '../symbol/tuplet.js';
import { getDivisionBefore } from '../bar/divisions.js';
import detectRhythm, { straighten, hasHoles } from '../rhythm.js';
import { P24, GR }           from '../constants.js';


const notes  = [];


function createTuplet(settings, stave, part, startBeat, data) {
    switch (data.divisor) {
        case 2:
            // If we are rendering swing rhythms decide whether a duplet
            // should render as a tuplet
            if (data.rhythm === 1) {
                return;
            }
            else if (data.duration === 1) {
                if (!settings.swingAsStraight8ths) return;
            }
            else if (data.duration === 0.5) {
                if (!settings.swingAsStraight16ths) return;
            }
            else {
                return;
            }

        case 3:
            // Convert eighth note swing rhythms to duplets
            if (settings.swingAsStraight8ths && data.duration === 1) {
                straighten(data);
                if (data.divisor === 2) return;
            }

            // Convert sixteenth note shuffle rhythms to duplets
            if (settings.swingAsStraight16ths && data.duration === 0.5) {
                straighten(data);
                if (data.divisor === 2) return;
            }
    }

    return {
        type: 'tuplet',
        part,
        beat:     data.beat - startBeat,
        duration: data.duration,
        divisor:  data.divisor,
        rhythm:   data.rhythm,
        stave
    };
}

function updateBeamWithNoteSymbols(symbols, bar, stave, part, beat, duration, noteSymbols, beam) {
    // If notes have a duration too long for a beam
    if (duration >= 1) {
        // ...and there is a beam, close it
        if (beam) beam = closeBeam(symbols, stave, part, beam);
        return;
    }

    // If there is a beam and notes are in a new bar division
    if (beam && getDivisionBefore(bar.divisions, beam.beat) !== getDivisionBefore(bar.divisions, beat)) {
        beam = closeBeam(symbols, stave, part, beam);
    }

    // Make sure there is a beam
    if (!beam) {
        beam = createBeam(part, beat);
    }

    // Push note symbols on to it
    push(beam, ...noteSymbols);

    return beam;
}

function createTies(symbols, bar, part, notes, noteSymbols, beat, duration) {
    let n = noteSymbols.length;
    let m = 0;

    while (n--) {
        const event = noteSymbols[n].event;
        //const b4    = toRoundedStopBeat(bar, event);
        //const b4 = toStopBeat(event) - bar.beat - 0.5 * bar.divisor;
        const b4 = toStopBeat(event) - bar.beat;

        if (lte(beat + duration, b4, P24)) {
            const i = notes.indexOf(event);
            notes.splice(i, 1);
            ++m;
        }
//           else if (grainOfBeat(bar.divisions, toStopBeat(notes[n]) - bar.beat) < grain) {
//               console.log('SPLICING OUT NOTE');
//               notes.splice(n, 1);
//           }
        else {
            symbols.push({
                type:   'tie',
                beat,
                pitch: noteSymbols[n].pitch,
                duration,
                stemup: noteSymbols[n].stemup,
                part,
                event
            });
        }
    }

/*
    while ((event = notes[++n]) && events[n][0] <= b1) {
        if (toStopBeat(events[n]) <= b2) {
            notes.splice(n, 1);
            ++m;
        }
        else {
            symbols.push({
                type:   'tie',
                beat,
                pitch: noteSymbols[n].pitch,
                duration,
                stemup: noteSymbols[n].stemup,
                part,
                event
            });
        }
    }
*/
    return m;
}

export default function createPartSymbols(bar, stave, accidentals, name, notes, settings) {
    const startBeat = bar.beat;
    const stopBeat  = bar.beat + bar.duration;
    const key       = bar.key;
    const symbols   = bar.symbols;
    const part      = stave.parts.find(matches({ name }));

    let beat = startBeat;
    let beam, tuplet, data, n = 0, b1 = 0, b2 = 0;

    // Loop through detected rhythms
    while (data = detectRhythm(beat, stopBeat - beat, notes, n)) {
        // Normalise rhythm based on settings, create tuplet where needed
        const tuplet   = createTuplet(settings, stave, part, startBeat, data);
        const { rhythm, divisor } = data;
        const division = data.duration / divisor;
        const r        = rhythm.toString(2);

console.group('Rhythm beat', data.beat, 'duration', data.duration, 'divisor', divisor, 'division', division, 'rhythm', r);

        if (tuplet) {
            while (n && b1 < data.beat) {
                const noteSymbols = stave.createDupletNoteSymbols(symbols, bar, part, accidentals, notes, b1, b2, data.beat, settings);
                const duration    = noteSymbols[0].duration;
                // Splice out all notes that stop before notes end, notes left over are tied
                n -= createTies(symbols, bar, part, notes, noteSymbols, b1 - startBeat, duration);
                // If notes have a duration too long for a beam
                if (beam) {
                    if (duration >= 1) {
                        // ...and there is a beam, close it
                        beam = closeBeam(symbols, stave, part, beam);
                    }
                    // If there is a beam and it's in the same division as notes
                    else if (getDivisionBefore(bar.divisions, beam.beat) === getDivisionBefore(bar.divisions, b1)) {
                        // ...add notes to beam
                        push(beam, ...noteSymbols);
                    }
                }
                // Update b1
                b1 += duration;
                beat = b1;
            }

            // if there is a beam, close it
            if (beam) beam = closeBeam(symbols, stave, part, beam);

            if (n) {
                if (beat !== data.beat) throw new Error('Notes dont take us to division beginning! ' + beat +  ' ' + data.beat);
            }
            else {
                // Gap from beat to division
                const gap = data.beat - beat;
                // Fill with rests up to start of tuplet
console.log('Tuplet rests from ', beat, 'to', data.beat);
                createRests(symbols, settings.restDurations, bar.divisions, stave, part, beat - startBeat, data.beat - startBeat);
                // Set beat to start of tuplet
                beat = data.beat;
            }

            // Push tuplet in
            symbols.push(tuplet);

            // Loop through tuplet divisions
            let i = -1;
            while (++i < divisor) {
console.group('Tuplet beat', data.beat + i * division, beat, 'division', i, 'duration', division);
                b2 = beat + 0.5 * division;

                // Query the binary from its end (the first division) backwards
                if (r[r.length - 1 - i] === '1') {
                    // Advance n
                    --n;
                    while (notes[++n] && notes[n][0] < b2);
                }
                // Render note
                if (n) {
                    // Insert note symbols
                    const noteSymbols = stave.createNoteSymbols(symbols, bar, part, accidentals, notes, b2, beat - startBeat, division, settings);
console.log('Notes', n, noteSymbols.length);
                    // Push note symbols on to tuplet
                    push(tuplet, ...noteSymbols);
                    // If division is short enough for a beam
                    if (division < 0.5) {
                        // ...make sure there is a beam
                        if (!beam) beam = createBeam(part, beat - startBeat);
                        // ...and push note symbols on to it
                        push(beam, ...noteSymbols);
                    }
                    // Splice out all notes that stop before b, notes left in notes will be
                    n -= createTies(symbols, bar, part, notes, noteSymbols, beat - startBeat, division);
                }
                // Or a rest
                else {
                    symbols.push({
                        type:     'rest',
                        beat:     beat - startBeat,
                        duration: division,
                        stave,
                        part
                    });
                }
                // Set beat to division end
                beat = data.beat + i * division + division;
console.groupEnd();
            }
            // if there is a beam, close it
            if (beam) beam = closeBeam(symbols, stave, part, beam);
            // Close tuplet
            closeTuplet(stave, part, tuplet);
            // Set beat to rhythm end, insist that it falls on a 32nd
            beat = nearest(0.125, data.beat + data.duration);
            b1 = beat;
            //b2 = beat;
console.log('BEAT', b1);
        }
        else {
            // Loop through rhythm divisions
            let i = -1;
            while (++i < divisor) {
                // Query the binary string from its end (the first division)
                // backwards, ignore empty divisions
                if (r[r.length - 1 - i] !== '1') continue;
console.group('Duplet beat', data.beat + i * division, 'division', i, n + ' notes from previous division', b1, b2);
                // Update note durations to this division
                while(n && b1 < data.beat + i * division) {
                    const noteSymbols = stave.createDupletNoteSymbols(symbols, bar, part, accidentals, notes, b1, b2, data.beat + i * division, settings);
                    const duration    = noteSymbols[0].duration;
                    // Splice out all notes that stop before notes end, notes left over are tied
                    n   -= createTies(symbols, bar, part, notes, noteSymbols, b1 - startBeat, duration);
                    // Close, open or extend beam based on note symbols and bar divisions
                    beam = updateBeamWithNoteSymbols(symbols, bar, stave, part, b1 - startBeat, duration, noteSymbols, beam);
                    b1 += duration;
                    beat = b1;
                }

                if (n && beat !== data.beat + i * division) throw new Error('Notes dont take us to division beginning! ' + beat +  ' ' + (data.beat + i * division));

                if (!n) {
                    // Gap from beat to division
                    const gap = data.beat + i * division - beat;
                    // If gap is longer than last note in beam TODO: better condition!
                    if (beam && gap > last(beam).duration) {
                        beam = closeBeam(symbols, stave, part, beam);
                    }
                    // Fill gap with rests
console.log('Duplet rests from ', beat, 'to', data.beat + i * division);
                    createRests(symbols, settings.restDurations, bar.divisions, stave, part, beat - startBeat, data.beat + i * division - startBeat);
                    // Update beat to division beginning
                    beat = data.beat + i * division;
                }

                // Insert note symbols
                b1 = beat;
                b2 = beat + 0.5 * division;
                // Advance n
                --n;
                while (notes[++n] && notes[n][0] < b2);
                // Update beat to division end
                //beat = data.beat + i * division + division;
console.groupEnd();
            }
        }

        // Update beat
        beat = data.beat + data.duration;
console.groupEnd();
    }

console.group('End of bar from', beat, 'to', stopBeat, b1);
    // Update note durations to end of bar
    while (n && b1 < stopBeat) {
        const noteSymbols = stave.createDupletNoteSymbols(symbols, bar, part, accidentals, notes, b1, stopBeat, stopBeat, settings);
        const duration    = noteSymbols[0].duration;
console.log('b1', b1, 'duration', duration);
        // Splice out all notes that stop before b, notes left in notes will be tied
        n -= createTies(symbols, bar, part, notes, noteSymbols, b1 - startBeat, duration);
        // If notes have a duration too long for a beam
        if (beam) {
            if (duration >= 1) {
                // ...and there is a beam, close it
                beam = closeBeam(symbols, stave, part, beam);
            }
            // If there is a beam and it's in the same division as notes
            else if (getDivisionBefore(bar.divisions, beam.beat) === getDivisionBefore(bar.divisions, b1)) {
                // ...add notes to beam
                push(beam, ...noteSymbols);
            }
        }

        beat = b1 + duration;
        b1 = beat;
    }

console.log(beat);
if (n) console.log(n + ' notes tied over to next bar', beat, bar.beat);

    // If there's still a beam close it
    if (beam) beam = closeBeam(symbols, stave, part, beam);
    // Create rests to stopBeat
console.log('Duplet rests from ', beat, 'to', stopBeat);
    createRests(symbols, settings.restDurations, bar.divisions, stave, part, beat - startBeat, stopBeat - startBeat);
    // Return symbols
console.groupEnd();
    return bar;
}
