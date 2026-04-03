
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


const state = {};







// --------------

function createTuplet(settings, bar, stave, part, data) {
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
            break;

        case 3:
            if (settings.swingAsStraight8ths) switch (data.duration) {
                // Convert duration 1 swing rhythm 101 to duplet 11
                case 1:
                    straighten(data);
                    if (data.divisor === 2) return;
                    break;

                // Change duration 2 rhythm 110 to duplet duration 1 rhythm 11
                case 2:
                    if (data.rhythm === 3) {
                        data.divisor  = 2;
                        data.duration = 1;
                        return;
                    }
                    break;
            }

            if (settings.swingAsStraight16ths) switch (data.duration) {
                // Convert duration 0.5 shuffle rhythm 101 to duplet 11
                case 0.5:
                    straighten(data);
                    if (data.divisor === 2) return;
                    break;

                // Change duration 1 rhythm 110 to duplet duration 0.5 rhythm 11
                case 1:
                    if (data.rhythm === 3) {
                        data.divisor  = 2;
                        data.duration = 0.5;
                        return;
                    }
                    break;
            }
    }

    return {
        type: 'tuplet',
        part,
        beat:     data.beat - bar.beat,
        duration: data.duration,
        divisor:  data.divisor,
        rhythm:   data.rhythm,
        stave
    };
}

function updateBeamWithNoteSymbols(symbols, bar, stave, part, beam, noteSymbols) {
    const { beat, duration } = noteSymbols[0];

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

function createTies(symbols, bar, part, state, notes, noteSymbols) {
    // No notes to tie
    if (!state.n) return;

    let n = -1;
    while (noteSymbols[++n]) {
        const { beat, event, pitch, duration, stemup } = noteSymbols[n];
        const b4 = toStopBeat(event) - bar.beat;

        // If there is less than a 32nd of this note left splice it out
        if (beat + duration > b4 - 0.125) {
            const i = notes.indexOf(event);
            notes.splice(i, 1);
            --state.n;
        }
        // Otherwise leave it in and create a tie symbol
        else {
            symbols.push({
                type: 'tie',
                beat,
                pitch,
                duration,
                // TODO: We now handle this in CSS with .note + .tie selector
                stemup,
                part,
                event
            });
        }
    }
}

function fillNotes(symbols, bar, stave, part, accidentals, notes, state, settings, stopBeat) {
    const length      = notes.length;
    const noteSymbols = stave.createDupletNoteSymbols(symbols, bar, part, accidentals, notes, state.beat, state.beatConsumed, stopBeat, settings);
    state.n -= length - notes.length;
    createTies(symbols, bar, part, state, notes, noteSymbols);
    return noteSymbols;
}

function fillToBeat(symbols, bar, stave, part, accidentals, notes, state, settings, stopBeat) {
    while (state.n && state.beat < stopBeat) {
        const noteSymbols = fillNotes(symbols, bar, stave, part, accidentals, notes, state, settings, stopBeat);
        const duration    = noteSymbols[0].duration;

        // If notes have a duration too long for a beam
        if (state.beam) {
            if (duration >= 1) {
                // ...and there is a beam, close it
                state.beam = closeBeam(symbols, stave, part, state.beam);
            }
            // If there is a beam and it's in the same division as notes
            else if (getDivisionBefore(bar.divisions, state.beam.beat) === getDivisionBefore(bar.divisions, state.beat - bar.beat)) {
                // ...add notes to beam
                push(state.beam, ...noteSymbols);
            }
        }

        // Update beat
        state.beat += duration;
    }

    // If there is a beam close it
    if (state.beam) state.beam = closeBeam(symbols, stave, part, state.beam);

    // How much space is left to stopBeat
    const gap = stopBeat - state.beat;
    if (state.n && gap) throw new Error('Notes dont take us to division beginning! beat: ' + state.beat +  ' stopBeat: ' + stopBeat + ' gap: ' + gap);

    if (gap) {
        // Fill with rests up to stopBeat
        createRests(symbols, settings.restDurations, bar.divisions, stave, part, state.beat - bar.beat, stopBeat - bar.beat);
        state.beat = stopBeat;
    }

    return state;
}

function advanceToConsumed(state, notes, beat) {
    let n = state.n - 1;
    while (notes[++n] && notes[n][0] < beat);
    state.n = n;
    state.beatConsumed = beat;
    return state;
}

export default function createPartSymbols(bar, stave, accidentals, name, notes, settings) {
    const startBeat = bar.beat;
    const stopBeat  = bar.beat + bar.duration;
    const key       = bar.key;
    const symbols   = bar.symbols;
    const part      = stave.parts.find(matches({ name }));

    let beat = startBeat;
    let beatAnalysed = bar.beat;
    let tuplet, data, n = 0;

    state.beatConsumed = bar.beat;
    state.beat = bar.beat;
    state.n    = 0;
    state.beam = undefined;

    // Loop through detected rhythms
    while (data = detectRhythm(beatAnalysed, stopBeat - beatAnalysed, notes, state.n)) {
        beatAnalysed = data.beat + data.duration;

        // Normalise rhythm based on settings, create tuplet where needed
        const tuplet   = createTuplet(settings, bar, stave, part, data);
        const { rhythm, divisor } = data;
        const division = data.duration / divisor;
        const r        = rhythm.toString(2);

        if (tuplet) {
            fillToBeat(symbols, bar, stave, part, accidentals, notes, state, settings, data.beat);
            // Push tuplet in
            symbols.push(tuplet);
            // Loop through tuplet divisions
            let i = -1;
            while (++i < divisor) {
//console.group('Tuplet beat', data.beat + i * division, beat, 'division', i, 'duration', division);
                // Query the binary from its end (the first division) backwards,
                // advance state to indicate what beat and event index (n) to be consumed
                if (r[r.length - 1 - i] === '1') {
                    advanceToConsumed(state, notes, state.beat + 0.5 * division);
                }

                // Render note
                if (state.n) {
                    // Insert note symbols
                    const length = notes.length;
                    const noteSymbols = stave.createNoteSymbols(symbols, bar, part, accidentals, notes, state.beatConsumed, state.beat - startBeat, division, settings);
                    // Reduce n by the number of notes that were spliced out
                    state.n -= length - notes.length;
                    createTies(symbols, bar, part, state, notes, noteSymbols);
                    // If division is short enough for a beam
                    if (division < 0.5) {
                        // ...make sure there is a beam
                        if (!state.beam) state.beam = createBeam(part, state.beat - startBeat);
                        // ...and push note symbols on to it
                        push(state.beam, ...noteSymbols);
                    }

                    // Push note symbols on to tuplet
                    push(tuplet, ...noteSymbols);
                }
                // Or a rest
                else {
                    symbols.push({
                        type:     'rest',
                        beat:     state.beat - startBeat,
                        duration: division,
                        stave,
                        part
                    });
                }

                state.beat += division;
//console.groupEnd();
            }
            // if there is a beam, close it
            if (state.beam) state.beam = closeBeam(symbols, stave, part, state.beam);
            // Close tuplet
            closeTuplet(stave, part, tuplet);
            // Round rendered beat to avoid floating point errors
            state.beat = nearest(0.125, state.beat);
        }
        else {
            // Loop through rhythm divisions
            let i = -1;
            while (++i < divisor) {
                // Query the binary string from its end (the first division)
                // backwards, ignore empty divisions
                if (r[r.length - 1 - i] !== '1') continue;
//console.group('Duplet beat', data.beat + i * division, 'division', i, n + ' notes from previous division');

                const divisionBeat = data.beat + i * division;

                // Update note durations to this division
                while(state.n && state.beat < divisionBeat) {
                    const length = notes.length;
                    const noteSymbols = stave.createDupletNoteSymbols(symbols, bar, part, accidentals, notes, state.beat, state.beatConsumed, divisionBeat, settings);
                    state.n -= length - notes.length;
                    const duration    = noteSymbols[0].duration;
                    createTies(symbols, bar, part, state, notes, noteSymbols);
                    // Close, open or extend beam based on note symbols and bar divisions
                    state.beam = updateBeamWithNoteSymbols(symbols, bar, stave, part, state.beam, noteSymbols);
                    state.beat += duration;
                }

                const gap = divisionBeat - state.beat;

                if (state.n && gap) throw new Error('Notes dont take us to division beginning! ' + state.beat +  ' ' + divisionBeat);

                if (gap) {
                    // If gap is longer than last note in beam TODO: better condition!
                    if (state.beam && gap > last(state.beam).duration) {
                        state.beam = closeBeam(symbols, stave, part, state.beam);
                    }
                    // Fill gap with rests
                    createRests(symbols, settings.restDurations, bar.divisions, stave, part, state.beat - bar.beat, divisionBeat - bar.beat);
                    // Update beat to division beginning
                    state.beat = divisionBeat;
                }

                // Set consumed state to half way through division
                advanceToConsumed(state, notes, divisionBeat + 0.5 * division);
//console.groupEnd();
            }
        }
    }

    beatAnalysed = bar.beat + bar.duration;

//console.group('End of bar from', beat, 'to', stopBeat, 'notes', n, notes.length);
    // Update note durations to end of bar
    fillToBeat(symbols, bar, stave, part, accidentals, notes, state, settings, stopBeat);
    //if (n) console.log(n + ' notes tied over to next bar', beat, bar.beat);
//console.groupEnd();
    return bar;
}
