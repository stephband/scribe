
import get        from 'fn/get.js';
import overload   from 'fn/overload.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import join       from './object/join.js';
import toStopBeat from './event/to-stop-beat.js';
import { getDivisions }  from './bar.js';
import { toKeyScale, toKeyNumber, cScale } from './keys.js';
import { createPartSymbols } from './create-part.js';
import config     from './config.js';


const ignoreTypes = [];

const accidentals = {
    '-2': '𝄫',
    '-1': '♭',
    '0': '',
    '1': '♯',
    '2': '𝄪'
};

const fathercharles = [
    // Father Charles Goes Down And Ends Battle,
    'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯',
    // Battle Ends And Down Goes Charles Father
    'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'
];

function byFatherCharlesPitch(a, b) {
    const ai = fathercharles.indexOf(a.pitch);
    const bi = fathercharles.indexOf(b.pitch);
    return ai > bi ? 1 : ai < bi ? -1 : 0;
}

function pushEventToPart(stave, parts, event) {
    const partIndex  = stave.getPartIndex(event[2]);
    const partEvents = parts[partIndex] || (parts[partIndex] = []);
    parts[partIndex].push(event);
}

function createBarSymbols(symbols, bar, stave, key, events, config) {
    let n = -1;
    let event;

    while (event = events[++n]) switch (event[1]) {
        case "key": {
            if (event[0] !== bar.beat) {
                throw new TypeError('Scribe: "key" event must occur at bar start – event [' + event.join(', ') + '] is on beat ' + (event[0] - bar.beat) + ' of bar');
            }

            // Get the key scale from keyname. This scale is not a true
            // 'scale' in an internal-data sense as it may not begin with a 0, but it
            // maps naturals to accidentals when compared against the C scale. Remember
            // keynumber is on a continuous scale of fourths, so multiply by 7 semitones
            // to get chromatic number relative to C.
            const keynumber = toKeyNumber(event[2]);
            const keyscale  = toKeyScale(keynumber * 7);

            // Add key signature
            symbols.push.apply(symbols, keyscale
                .map((n, i) => (n - cScale[i] && {
                    // No beat for key signature accidentals
                    type: 'acci',
                    pitch: toRootName(cScale[i]) + accidentals[n - cScale[i]],
                    value: n - cScale[i]
                }))
                .filter((o) => !!o)
                .sort(byFatherCharlesPitch)
            );

            break;
        }

        case "meter": {
            symbols.push({
                type:        'timesig',
                beat:        0,
                numerator:   event[2] / event[3],
                denominator: 4 / event[3]
            });

            break;
        }

        case "symbol": {
            symbols.push({
                type: 'symbol' + event[2]
            });

            break;
        }

        case "chord": {
            const beat = event[0] - bar.beat;
            let root = stave.getSpelling(key, event);

            if (root === 'C♭' && config.spellChordRootCFlatAsB)  root = 'B';
            if (root === 'E♯' && config.spellChordRootESharpAsF) root = 'F';
            if (root === 'B♯' && config.spellChordRootBSharpAsC) root = 'C';
            if (root === 'F♭' && config.spellChordRootFFlatAsE)  root = 'E';

            symbols.push({
                type: 'chord',
                beat: startBeat,
                // Does chord cross into next bar? The symbol should not
                duration: event[0] + event[4] > bar.beat + bar.duration ?
                    bar.duration - beat :
                    event[4],
                root,
                extension: event[3],
                event,
                stave
            });

            break;
        }

        case "lyric": {
            const beat = event[0] - bar.beat;
            symbols.push({
                type: 'lyric',
                beat,
                // Does chord cross into next bar? The symbol should not
                duration: event[0] + event[3] > bar.beat + bar.duration ?
                    bar.duration - beat :
                    event[3],
                value: event[2],
                event,
                stave
            });

            break;
        }

        case "sequence": {
            // Put a double bar line at the end of bar
            symbols.push({ type: 'doublebarline', stave, event });
            // Put a bar count indicator at the start of the next bar TODO: How???
            symbols.push({ type: 'barcount', text: bars.length + 1, stave });
            break;
        }

        default: {
            if (ignoreTypes.includes(event[1])) return;
            console.log('Scribe: ignoring event type "' + event[1] + '"');
        }
    };

    return symbols;
}

function createBar(beat, duration, divisor, stave, key, events, parts, sequence, config) {
    const symbols = [];

    // Track end of sequence and shove in a double bar line
    if (sequence) {
        const sequenceStop = toStopBeat(sequence);
        if (sequenceStop > beat && sequenceStop <= beat + duration) {
            events.push(sequence);
        }
    }

    const bar = {
        type: 'bar',
        beat,
        duration,
        //stave,
        //key,
        divisor,
        divisions: getDivisions(duration, divisor),
        symbols
    };

    // Populate symbols with events
    createBarSymbols(symbols, bar, stave, key, events, config);

    // Populate accidentals with key signature sharps and flats
    const accidentals = key.reduce((accidentals, n, i) => {
        const acci = n - cScale[i];
        if (acci !== 0) {
            const name = toRootName(cScale[i]);
            let n = 10;
            while (n--) accidentals[name + n] = acci;
        }
        return accidentals;
    }, {});

    // Populate symbols with parts
    let name;
    for (name in parts) {
        createPartSymbols(symbols, bar, stave, key, accidentals, name, parts[name], config);
    }

    return bar;
}

export default function createBars(sequence, stave, settings = config) {
    const bars = [];

    let beat   = 0;
    let events = [];
    let ties   = [];
    let parts  = {};
    let key    = cScale;
    let duration, divisor, event, sequenceEvent;

    // Extract events from sequence iterator
    for (event of sequence) {
        // If event is beyond current duration create bars
        while (event[0] >= beat + duration) {
            // Close current bar, push to bars
            bars.push(createBar(beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings));

            // Update beat, start new arrays
            beat = beat + duration;
            events = [];
            parts  = {};

            let t = -1;
            while (ties[++t]) {
                pushEventToPart(stave, parts, ties[t]);
                // If event does not extend beyond bar remove it from ties
                if (toStopBeat(ties[t]) < beat + duration) ties.splice(t--, 1);
            }
        }

        switch (event[1]) {
            case "note": {
                // Note events are pushed to parts
                pushEventToPart(stave, parts, event);
                // If event extends beyond bar push it into ties
                if (toStopBeat(event) > beat + duration) ties.push(event);
                break;
            }

            case "sequence": {
                if (event.sequence !== sequence) console.log('SEQUENCE NOT TOP LEVEL');
                sequenceEvent = event;
                break;
            }

            case "key": {
                if (event[0] !== beat) {
                    new TypeError('Scribe: "key" event must occur at bar start – event [' + event.join(', ') + '] is on beat ' + (event[0] - beat) + ' of bar');
                }

                // Get the key scale from keyname. This scale is not a true
                // 'scale' in an internal-data sense as it may not begin with a 0, but it
                // maps naturals to accidentals when compared against the C scale. Remember
                // keynumber is on a continuous scale of fourths, so multiply by 7 semitones
                // to get chromatic number relative to C.
                const keynumber = toKeyNumber(event[2]);
                key = toKeyScale(keynumber * 7);
            }

            case "meter": {
                duration = event[2];
                divisor  = event[3];

                // If meter event does not land on current bar beat
                if (event[0] !== beat) {
                    // Create bar prematurely and start a new one, or error out?
                    console.log('TODO');
                }
            }

            default: {
                events.push(event);
            }
        }
    }

    // There are still events with long durations to symbolise into bars
    while (ties.length) {
        // Close current bar, push to bars
        bars.push(createBar(beat, duration, divisor, stave, key, events, parts));

        // Update beat, start new arrays
        beat = beat + duration;
        events = [];
        parts  = {};

        let t = -1;
        while (event = ties[++t]) {
            pushEventToPart(stave, parts, event);
            // If event does not extend beyond bar remove it from ties
            if (toStopBeat(event) < beat + duration) ties.splice(t--, 1);
        }
    }

    // Close final bar, push to bars
    bars.push(createBar(beat, duration, divisor, stave, key, events, parts));

    // Return bars
    return bars;
}
