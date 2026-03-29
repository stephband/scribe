
//import by                    from 'fn/by.js';
//import get                   from 'fn/get.js';
import matches               from 'fn/matches.js';
import toStopBeat            from '../event/to-stop-beat.js';
import push                  from '../object/push.js';
import { eq, gte, lte, lt, gt } from '../number/float.js';
import { createRests }       from '../symbol/rest.js';
import { createBeam, closeBeam } from '../symbol/beam.js';
import { closeTuplet }       from '../symbol/tuplet.js';
import detectRhythm, { straighten, hasHoles } from '../rhythm.js';
import { P24, GR }           from '../constants.js';

// TEMP
import { createTies } from '../stave/stave.js';


const notes  = [];
//const byRow  = by(get('row'));


function getNotesAtBeat(beat, division, events, n = 0) {
    // Fill notes with events playing during division
    //notes.length = 0;
    while (events[n] && events[n][0] < beat + 0.5 * division) {
        notes.push(events.shift());
    }
    // Sort notes by pitch order, descending (ascending row order)
    //notes.sort(byRow);
    return notes;
}

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
                return;
            }

            // Convert sixteenth note shuffle rhythms to duplets
            if (settings.swingAsStraight16ths && data.duration === 0.5) {
                straighten(data);
                return;
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



export default function createPartSymbols(bar, stave, accidentals, name, events, settings) {
    const startBeat = bar.beat;
    const stopBeat  = bar.beat + bar.duration;
    const key       = bar.key;
    const symbols   = bar.symbols;
    const part      = stave.parts.find(matches({ name }));

    let beat = startBeat;
    let bbbbb;
    let n    = 0;
    let beam, event, tuplet, notes, data;

    // Loop through detected rhythms
    while (data = detectRhythm(beat, stopBeat - beat, events, n/*, { maxDivision: 1 }*/)) {
        // Normalise rhythm based on settings, create tuplet where needed
        const tuplet   = createTuplet(settings, stave, part, startBeat, data);
        const { rhythm, divisor } = data;
        const division = data.duration / divisor;
        const r        = rhythm.toString(2);

        if (tuplet) {
            // Update note durations to this division
            if (notes && notes.length) {
                const o = stave.createDupletNoteSymbols(symbols, bar, part, accidentals, beam, notes, n, bbbbb, stopBeat, settings);
                beat  = o.beat;
                beam  = undefined;
                notes = o.notes;
                n     = o.n;
            }
            // if there is a beam, close it
            if (beam) beam = closeBeam(symbols, stave, part, beam);
            // Fill with rests up to start of tuplet
            createRests(symbols, settings.restDurations, bar.divisions, stave, part, beat - startBeat, data.beat - startBeat);
            // Set beat to start of tuplet
            beat = data.beat;
            // Push tuplet in
            symbols.push(tuplet);
            // Loop through tuplet divisions
            let i = -1;
            while (++i < divisor) {
                // Query the binary from its end (the first division) backwards
                if (r[r.length - 1 - i] === '1') {
                    // Insert note symbols
                    notes = getNotesAtBeat(beat, division, events, 0);
                    const noteSymbols = stave.createNoteSymbols(symbols, bar, part, accidentals, notes, beat - startBeat, division, settings);
                    // Push note symbols on to tuplet
                    push(tuplet, ...noteSymbols);
                    // If division is short enough for a beam
                    if (division < 0.5) {
                        // ...make sure there is a beam
                        if (!beam) beam = createBeam(part, beat - startBeat);
                        // ...and push note symbols on to it
                        push(beam, ...noteSymbols);
                    }
                    // Splice out all notes that stop before b, events left in notes will be
                    createTies(symbols, bar, part, notes, noteSymbols, beat - startBeat, division);
                }
                else {
                    // Push in a tuplet division rest
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
                bbbbb = beat;
            }
            // Close tuplet
            closeTuplet(stave, part, tuplet);
            // if there is a beam, close it
            if (beam) beam = closeBeam(symbols, stave, part, beam);
        }
        else {
            // Loop through rhythm divisions
            let i = -1;
            while (++i < divisor) {
                // Query the binary string from its end (the first division)
                // backwards, ignore empty divisions
                if (r[r.length - 1 - i] !== '1') continue;

                // Update note durations to this division
                if (notes && notes.length) {
                    const o = stave.createDupletNoteSymbols(symbols, bar, part, accidentals, beam, notes, n, bbbbb, data.beat + i * division, settings);
                    beat  = o.beat;
                    beam  = o.beam;
                    notes = o.notes;
                    n     = o.n;
                    //createTies(symbols, bar, part, notes, noteSymbols, bbbbb, beat - bbbbb);
if (notes.length) { console.log(notes.length + ' notes tied over to this division'); }
                }

                // If gap is bigger than division stop the beam
                if (beam && gt(division, data.beat + i * division - beat, P24)) {
                    beam = closeBeam(symbols, stave, part, beam);
                }

                // Fill gap with rests
                createRests(symbols, settings.restDurations, bar.divisions, stave, part, beat - startBeat, data.beat + i * division - startBeat);
                // Update beat to division beginning
                beat  = data.beat + i * division;
                // Insert note symbols
                bbbbb = beat;
                notes = getNotesAtBeat(beat, division, events, 0);
                // Update beat to division end
                beat  = data.beat + i * division + division;
            }
        }

        // Update beat
        beat = data.beat + data.duration;
    }

if (DEBUG && events.length) throw new Error(`Something's up with note events, it should be empty here`);

    // Update note durations to end of bar
    while (notes && notes.length && bbbbb < bar.beat + bar.duration) {
        const o = stave.createDupletNoteSymbols(symbols, bar, part, accidentals, beam, notes, n, bbbbb, stopBeat, settings);
        beat  = o.beat;
        beam  = o.beam;
        notes = o.notes;
        //createTies(symbols, bar, part, notes, noteSymbols, bbbbb, beat - bbbbb);
        bbbbb = beat;
        n     = o.n;
    }

if (notes.length) {
console.log(notes.length + ' notes tied over to next bar', beat, bar.beat);
events.unshift.apply(events, notes);
}

    // If there's still a beam close it
    if (beam) beam = closeBeam(symbols, stave, part, beam);
    // Create rests to stopBeat
    createRests(symbols, settings.restDurations, bar.divisions, stave, part, beat - startBeat, stopBeat - startBeat);
    // Return symbols
    return bar;
}
