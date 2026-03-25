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
import getStopBeat from './event/to-stop-beat.js';
import config     from './config.js';

const barDivisions = {
    // The last number in bar divisions is the bar duration
    // 2/2
    '4,2': [2,4],
    // 3/2
    '6,2': [2,4,6],
    // 2/4
    '2,1': [1,2],
    // 3/4
    '3,1': [1,2,3],
    // 4/4
    '4,1': [2,4],
    // 5/4
    '5,1': [3,5],
    // 6/4
    '6,1': [3,6],
    // 7/4
    '7,1': [4,7],
    // 9/4
    '9,1': [3,6,9],
    // 5/8
    '2.5,0.5': [1.5,2.5],
    // 6/8
    '3,0.5': [1.5,3],
    // 6/8
    '3,1.5': [1.5,3],
    // 7/8
    '3.5,0.5': [1,2,3.5],
    // 9/8
    '4.5,0.5': [1.5,3,4.5],
    // 12/8
    '6,0.5': [1.5,3,4.5,6],
    // 13/8
    '6.5,0.5': [1.5,3,6.5]
};

const rslashbass = /\/\{(\d{1,2})\}$/;

function getDivisions(duration, divisor) {
    return barDivisions[duration + ',' + divisor] || nothing;
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

function createBarSymbols(bar, stave, key, accidentals, events, settings) {
    const { symbols } = bar;
    let n = -1;
    let event;

    while (event = events[++n]) switch (event[1]) {
        case "key": {
            const key = toKeyNumber(event[2]);
            updateAccidentals(accidentals, key);
            // TODO: Key is global and added to the side bar, we need to think about
            // how to make key signature changes
            // symbols.push.apply(symbols, stave.createKeySymbols(key));
            bar.key = key;
            break;
        }

        case "meter": {
            //console.log('METER', event[3] === 1.5, event[2] / 0.5, event[2] / event[3], event);
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

export function createBar(count, beat, duration, divisor, stave, key, events, parts, sequence, settings = config) {
    const symbols = [];

    // Track end of sequence and shove in a double bar line
    if (sequence) {
        const sequenceStop = toStopBeat(sequence);
        if (sequenceStop > beat && sequenceStop <= beat + duration) {
            events.push(sequence);
        }
    }

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
        symbols,
        ties: []
    };

    // Populate symbols with events
    createBarSymbols(bar, stave, key, accidentals, events, config);

    // Populate symbols with parts
    //const centers = stave.parts.reduce((centers, part) => part.centerRow ?
    //    centers.add(part.centerRow) :
    //    centers,
    //    new Set()
    //);
    //if (!centers.size) centers.add(stave.centerRow);

    let part;
    for (part of stave.parts) {
        const events = parts[part.name];
        if (!events || !events.length) continue;
        // Don't process the default center
        //centers.delete(part.centerRow || stave.centerRow);
        stave.createPartSymbols(bar, accidentals, part, events, settings);
    }

    //let center;
    //for (center of centers) {
    //    //stave.createPartSymbols(bar, accidentals, { centerRow: center }, events, settings);
    //}

    return bar;
}
