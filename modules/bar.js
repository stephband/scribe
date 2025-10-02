import nothing from 'fn/nothing.js';
import { toRootName } from 'midi/note.js';
import toStopBeat from './event/to-stop-beat.js';
import { toKeyScale, toKeyNumber, cScale } from './keys.js';
import { createPart } from './part.js';
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

function createBarSymbols(symbols, bar, stave, key, events, config) {
    let n = -1;
    let event;

    while (event = events[++n]) switch (event[1]) {
        case "key": {
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
                    value: n - cScale[i],
                    stave
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
            const beat = event[0] - bar.beat;
            let root = stave.getSpelling(key, event);

            if (root === 'C♭' && config.spellChordRootCFlatAsB)  root = 'B';
            if (root === 'E♯' && config.spellChordRootESharpAsF) root = 'F';
            if (root === 'B♯' && config.spellChordRootBSharpAsC) root = 'C';
            if (root === 'F♭' && config.spellChordRootFFlatAsE)  root = 'E';

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
            symbols.push({ type: 'doublebarline', stave, event });
            // Put a bar count indicator at the start of the next bar TODO: How???
            symbols.push({ type: 'barcount', text: bar.count, stave });
            break;
        }

        default: {
            if (ignoreTypes.includes(event[1])) return;
            console.log('Scribe: ignoring event type "' + event[1] + '"');
        }
    };

    return symbols;
}

export function createBar(count, beat, duration, divisor, stave, key, events, parts, sequence, config) {
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
    const scale = toKeyScale(key * 7);

    // Populate accidentals with key signature sharps and flats
    const accidentals = scale.reduce((accidentals, n, i) => {
        const acci = n - cScale[i];
        if (acci !== 0) {
            const name = toRootName(cScale[i]);
            let n = 10;
            while (n--) accidentals[name + n] = acci;
        }
        return accidentals;
    }, {});

    const bar = {
        type: 'bar',
        beat,
        duration,
        //key,
        divisor,
        divisions: getDivisions(duration, divisor),
        stave,
        count,
        symbols
    };

    // Populate symbols with events
    createBarSymbols(symbols, bar, stave, key, events, config);

    // Populate symbols with parts
    let name;
    for (name in parts) {
        createPart(symbols, bar, stave, key, accidentals, name, parts[name], config);
    }

    // If no part was rendered at least render a rest
    if (!name) {
        createPart(symbols, bar, stave, key, accidentals, '0', [], config);
    }

    return bar;
}
