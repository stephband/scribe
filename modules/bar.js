import matches from 'fn/matches.js';
import nothing from 'fn/nothing.js';
import { toRootName, toRootNumber } from 'midi/note.js';
import { toKeyNumber, keyToRootNumber, rootToKeyNumber } from 'sequence/modules/event/keys.js';
import { toChordName } from 'sequence/modules/event/chords.js';
import mod12       from './number/mod-12.js';
import toStopBeat from './event/to-stop-beat.js';
import { keyToNumbers, keyWeightsForEvent, chooseKeyFromWeights } from './keys.js';
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

const rslashbass = /\/\{(\d{1,2})\}$/;

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
    const numbers = keyToNumbers(key);

    numbers.reduce((accidentals, n, i) => {
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

function substituteSpelling(settings, name) {
    if (name === 'C♭' && settings.spellChordRootCFlatAsB)  return 'B';
    if (name === 'E♯' && settings.spellChordRootESharpAsF) return 'F';
    if (name === 'B♯' && settings.spellChordRootBSharpAsC) return 'C';
    if (name === 'F♭' && settings.spellChordRootFFlatAsE)  return 'E';
    return name;
}

function createBarSymbols(symbols, bar, stave, key, accidentals, events, settings) {
    let n = -1;
    let event;

    while (event = events[++n]) switch (event[1]) {
        case "key": {
            const key  = toKeyNumber(event[2]);
            const root = keyToRootNumber(event[2]);

            updateAccidentals(accidentals, key);

            // TODO: Key is global and added to the side bar, we need to think about
            // how to make key signature changes
            // symbols.push.apply(symbols, stave.createKeySymbols(key));

            bar.key = root;
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
            const extension  = toChordName(event[3]);
            const slashbass  = rslashbass.exec(extension);

            let root, bass, name;

            if (slashbass) {
                const n = parseInt(slashbass[1], 10);
                root = stave.getSpelling(keyNumber, mod12(event[2] - n));
                bass = stave.getSpelling(keyNumber, event[2]);
                name = substituteSpelling(settings, root) + extension.replace(rslashbass, '/' + substituteSpelling(settings, bass));
            }
            else {
                root = stave.getSpelling(keyNumber, event[2]);
                name = substituteSpelling(settings, root) + extension;
            }

            symbols.push({
                type: 'chord',
                beat,
                name,
                // Does chord cross into next bar? The symbol should not
                duration: event[0] + event[4] > bar.beat + bar.duration ?
                    bar.duration - beat :
                    event[4],
                event,
                stave
            });

            break;
        }

        case "text": {
            const beat = event[0] - bar.beat;
            symbols.push({
                type: 'text',
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

export function createBar(count, beat, duration, divisor, stave, root, events, parts, sequence, settings = config) {
    const symbols = [];

    // Track end of sequence and shove in a double bar line
    if (sequence) {
        const sequenceStop = toStopBeat(sequence);
        if (sequenceStop > beat && sequenceStop <= beat + duration) {
            events.push(sequence);
        }
    }

    // Populate accidentals with key signature sharps and flats
    const key = rootToKeyNumber(root);
    const accidentals = updateAccidentals({}, key);

    const bar = {
        type: 'bar',
        beat,
        duration,
        key: root,
        divisor: divisor || 4,
        divisions: getDivisions(duration, divisor),
        stave,
        count,
        symbols
    };

    // Populate symbols with events
    createBarSymbols(symbols, bar, stave, root, accidentals, events, config);

    // Populate symbols with parts
    const centers = stave.parts.reduce((centers, part) => part.centerRow ?
        centers.add(part.centerRow) :
        centers,
        new Set()
    );
    if (!centers.size) centers.add(stave.centerRow);

    let part;
    for (part of stave.parts) {
        const events = parts[part.name];
        if (!events || !events.length) continue;
        centers.delete(part.centerRow || stave.centerRow);
        createPart(symbols, bar, stave, root, accidentals, part, events, settings);
    }

    let center;
    for (center of centers) {
        createPart(symbols, bar, stave, root, accidentals, { centerRow: center }, [], settings);
    }

    return bar;
}
