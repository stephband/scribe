import nothing from 'fn/nothing.js';
import { toRootName, toRootNumber } from 'midi/note.js';
import toStopBeat from './event/to-stop-beat.js';
import { toKeyScale, keyWeightsForEvent, chooseKeyFromWeights } from './keys.js';
import { byFatherCharlesPitch, accidentalChars } from './pitch.js';
import { major } from './scale.js';
import { createPart } from './part.js';
import getStopBeat from './event/to-stop-beat.js';
import config     from './config.js';

const barDivisions = {
    // 2/2
    '2,2': [2],
    // 3/2
    '3,2': [2,4],
    // 2/4
    '2,1': [1],
    // 3/4
    '3,1': [1,2],
    // 4/4
    '4,1': [2],
    // 6/8
    '3,0.5': [1.5],
    // 6/8
    '3,1.5': [1.5],
    // 12/8
    '12,0.5': [1.5,3,4.5]
};

/**
getBarDivisions(meter)
Gets bar divisions from `meter` event.
**/

export function getBarDivisions(meter) {
    return barDivisions[meter[2] + ',' + meter[3]] || nothing;
}

export function getDivisions(duration, divisor) {
    return barDivisions[duration + ',' + divisor] || nothing;
}

/**
getDivision(divisions, b1, b2)
Gets first bar division from `divisions` where `b1` is before and `b2` after or
on it.
**/

export function getDivision(divisions, b1, b2) {
    let n = -1;
    while (divisions[++n] && divisions[n] <= b1);
    // If divisions[n] is undefined, comparison evaluates to false, which is
    // what we want
    return b2 > divisions[n] ?
        divisions[n] :
        undefined ;
}

export function getLastDivision(divisions, b1, b2) {
    let n = divisions.length;
    while (divisions[--n] && divisions[n] >= b2);

    // If divisions[n] is undefined, comparison evaluates to false, which is
    // what we want
    return b1 < divisions[n] ?
        divisions[n] :
        undefined ;
}



const ignoreTypes = [];

function updateAccidentals(accidentals, key) {
    const scale = toKeyScale(key);

    scale.reduce((accidentals, n, i) => {
        const acci = n - major[i];
        if (acci !== 0) {
            const name = toRootName(major[i]);
            let n = 10;
            while (n--) accidentals[name + n] = acci;
        }
        return accidentals;
    }, accidentals);

    return accidentals;
}

function createBarSymbols(symbols, bar, stave, key, accidentals, events, settings) {
    let n = -1;
    let event;

    while (event = events[++n]) switch (event[1]) {
        case "key": {
            // Get the key scale from keyname. This scale is not a true
            // 'scale' in an internal-data sense as it may not begin with a 0, but it
            // maps naturals to accidentals when compared against the C scale. Remember
            // keynumber is on a continuous scale of fourths, so multiply by 7 semitones
            // to get chromatic number relative to C.
            const key      = toRootNumber(event[2]);
            updateAccidentals(accidentals, key);

            // TODO: Key is global and added to the side bar, we need to think about
            // how to make key signature changes
            // symbols.push.apply(symbols, stave.createKeySymbols(key));

            bar.key = key;
            break;
        }

        case "meter": {
            symbols.push({
                type:        'timesig',
                beat:        0,
                numerator:   event[3] === 1.5 ? event[2] / 0.5 : event[2] / event[3],
                denominator: event[3] === 1.5 ? 8 : 4 / event[3],
                stave,
                event
            });

            break;
        }

        case "symbol": {
            symbols.push({
                type: 'symbol' + event[2],
                stave
            });

            break;
        }

        case "chord": {
            const beat       = event[0] - bar.beat;
            const keyWeights = keyWeightsForEvent(events, n, key);
            const keyNumber  = chooseKeyFromWeights(keyWeights);

            let root = stave.getSpelling(keyNumber, event);

            if (root === 'C♭' && settings.spellChordRootCFlatAsB)  root = 'B';
            if (root === 'E♯' && settings.spellChordRootESharpAsF) root = 'F';
            if (root === 'B♯' && settings.spellChordRootBSharpAsC) root = 'C';
            if (root === 'F♭' && settings.spellChordRootFFlatAsE)  root = 'E';

            symbols.push({
                type: 'chord',
                beat,
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
            // symbols.push({ type: 'doublebarline', stave, event });
            bar.doubleBarLine = true;
            break;
        }

        default: {
            if (ignoreTypes.includes(event[1])) return;
            console.log('Scribe: ignoring event type "' + event[1] + '"');
        }
    };

    return symbols;
}

export function createBar(count, beat, duration, divisor, stave, key, events, parts, sequence, settings = config) {
    const symbols = [];

    // Track end of sequence and shove in a double bar line
    if (sequence) {
        const sequenceStop = toStopBeat(sequence);
        if (sequenceStop > beat && sequenceStop <= beat + duration) {
            events.push(sequence);
        }
    }

    // Get the key scale from keyname. This scale is not a true
    // 'scale' in an internal-data sense as it may not begin with a 0, but it
    // maps naturals to accidentals when compared against the C scale. Remember
    // keynumber is on a continuous scale of fourths, so multiply by 7 semitones
    // to get chromatic number relative to C.
    //const scale = toKeyScale(key * 7);
//console.log('KEY', toRootName(key), 'scale', scale);

    // Populate accidentals with key signature sharps and flats
    const accidentals = updateAccidentals({}, key);

    const bar = {
        type: 'bar',
        beat,
        duration,
        key,
        divisor: divisor || 4,
        divisions: getDivisions(duration, divisor),
        stave,
        count,
        symbols
    };

    // Populate symbols with events
    createBarSymbols(symbols, bar, stave, key, accidentals, events, config);

    // Populate symbols with parts
    let index, p = 0;
    for (index in stave.parts) {
        const part   = stave.parts[index];
        const events = parts[part.name] || [];

        // Dont render anything if this is not a default part and there are no events
        if (!part.DEFAULT && !events.length) continue;
        createPart(symbols, bar, stave, key, accidentals, part, events, settings);
        ++p;
    }

    // But if no part was rendered at least render rests
    if (!p) {
        console.log('Stave has no parts defined SHOULD NOT BE');
        createPart(symbols, bar, stave, key, accidentals, stave.parts[0], [], settings);
    }

    return bar;
}
