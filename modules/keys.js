
import overload                  from 'fn/overload.js';
import { toNoteNumber, toRootNumber, toRootName } from 'midi/note.js';
import { isChordEvent, isNoteEvent } from 'sequence/modules/event.js';
import { hsidToNumbers }         from 'sequence/modules/event/hsid.js';
import { toHSID }                from 'sequence/modules/event/chords.js';
import toStopBeat                from './event/to-stop-beat.js';
import { transposeScale, major } from './scale.js';

export default [
    //                                       C      D       E  F      G      A       B
    { name: 'C',  symbol: 'C∆',  spellings: [0,  1, 0, -1,  0, 0,  1, 0, -1, 0, -1,  0] },
    { name: 'D♭', symbol: 'D♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },
    { name: 'D',  symbol: 'D∆',  spellings: [0,  1, 0,  1,  0, 0,  1, 0,  1, 0, -1,  0] },
    { name: 'E♭', symbol: 'E♭∆', spellings: [0, -1, 0, -1,  0, 0, -1, 0, -1, 0, -1, -1] },
    { name: 'E',  symbol: 'E∆',  spellings: [0,  1, 0,  1,  0, 1,  1, 0,  1, 0,  1,  0] },
    { name: 'F',  symbol: 'F∆',  spellings: [0, -1, 0, -1,  0, 0,  1, 0, -1, 0, -1,  0] },
    { name: 'F♯', symbol: 'F♯∆', spellings: [1,  1, 0,  1,  0, 1,  1, 0,  1, 0,  1,  0] },  // (Should have G##?)
  //{ name: 'G♭', symbol: 'G♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },  // (Should have Ebb?)
    { name: 'G',  symbol: 'G∆',  spellings: [0,  1, 0, -1,  0, 0,  1, 0,  1, 0, -1,  0] },
    { name: 'A♭', symbol: 'A♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },
    { name: 'A',  symbol: 'A∆',  spellings: [0,  1, 0,  1,  0, 0,  1, 0,  1, 0,  1,  0] },
    { name: 'B♭', symbol: 'B♭∆', spellings: [0, -1, 0, -1,  0, 0, -1, 0, -1, 0, -1,  0] },
    { name: 'B',  symbol: 'B∆',  spellings: [1,  1, 0,  1,  0, 1,  1, 0,  1, 0,  1,  0] }
];

export function toKeyScale(key) {
    return transposeScale(major, key);
}



const { abs } = Math;

const degreeWeights = Float32Array.of(
//  Root b9   9    min3 maj3 11   #11  5    b6   13   7    maj7
    1,   0.9, 0.8, 1,   1,   0.8, 0.8, 1,   0.9, 1,   1,   1
);

const modulationWeights = [
    // Influence of ...
    // Cycle of  Minor   Major
    // fourths   thirds  thirds
    1,                          // Root
    (1/6       + 0     + 0),    // b9
    (4/6       + 0     + 0),    // 9
    (3/6       + 1/9   + 0),    // min3
    (2/6       + 0     + 1/5),  // maj3
    (5/6       + 0     + 0),    // 11
    (0         + 1/11  + 0),    // #11
    (5/6       + 0     + 0),    // 5
    (2/6       + 0     + 1/5),  // b6
    (3/6       + 1/8   + 0),    // 13
    (4/6       + 0     + 0),    // 7
    (1/6       + 0     + 0)     // maj7
];

const factors = {
    3: [10/16, 13/16, 10/16],
    4: [10/16, 13/16, 10/16, 12/16]
};

function keysContainingNote(number) {
    const keys = new Float32Array(12);
    let n = toRootNumber(number + 2);
    let i = 7;
    while (i--) {
        n = toRootNumber(n + 5);
        keys[n] = 1;
    }
    return keys;
}

function multiplyWeights(weights1, weights2, factor) {
//const a = Array.from(weights1, (weight) => weight === 0 ? '     ' : weight.toFixed(3)).join(' ');

    let n = weights1.length;
    while (n--) weights1[n] *= (1 - factor) + factor * weights2[n];
/*
console.log('x weights', factor, '\n'
    + Array.from({ length: 12 }, (n, i) => (toRootName(i) + '       ').slice(0, 5)).join(' ') + '\n'
    + a + '\n'
    + Array.from(weights2, (weight) => weight === 0 ? '     ' : weight.toFixed(3)).join(' ') + '\n'
    + Array.from(weights1, (weight) => weight === 0 ? '     ' : weight.toFixed(3)).join(' ')
);
*/
    return weights1;
}

const types = {
    note: (weights, event, influence = 1) => {
        const number = toNoteNumber(event[2]);
        const probs  = keysContainingNote(number);

        return multiplyWeights(weights, probs, influence
            // Weight bass notes more importantly than treble notes
            * (1 - number / 192)
        );
    },

    chord: (weights, event, influence = 1) => {
        const r       = toRootNumber(event[2]);
        const numbers = hsidToNumbers(event[3]);

        let n = numbers.length, probs;
        while (n--) {
            probs = keysContainingNote(r + numbers[n]);
            multiplyWeights(weights, probs, (influence / numbers.length)
                // Weight notes based on chord degree
                * degreeWeights[numbers[n]]
            );
        }

        return weights;
    }
}

export function keyWeightsForEvent(events, n, currentKey) {
    let event = events[n];

    const beat    = event[0];
    const weights =
        isNoteEvent(event)  ? keysContainingNote(toNoteNumber(event[2])) :
        isChordEvent(event) ? types.chord(Float32Array.of(1,1,1,1,1,1,1,1,1,1,1,1), event) :
        0 ;

    // Weight by influence of current key
    if (currentKey !== undefined) {
        const probs = Float32Array.from({ length: 12 }, (n, i) => modulationWeights[(i + 12 - currentKey) % 12]);
        multiplyWeights(weights, probs, 0.3);
    }

    // Weight by influence of surrounding events
    let m = n;
    while (event = events[--m]) {
        const fn = types[event[1]];
        if (!fn) continue;

        const stopBeat = toStopBeat(event);

        // Events that are playing concurrently
        if (stopBeat > beat) {
//console.log('STOPBEAT', event[1]);
            // Fairly influential 0.5
            fn(weights, event, 0.5);
        }
        // Notes that recently stopped
        else if (event[1] === 'note' && beat - stopBeat < 3) {
            if ((1 - (beat - stopBeat) / 3) > 1) throw new Error('Influence should never be > 1 ' + beat + ' ' + stopBeat);
//console.log('RECENT NOTE', event[2], 0.25 * (1 - (beat - stopBeat) / 3));
            // Weight by distance from stopBeat to beat
            fn(weights, event, 0.25 * (1 - (beat - event[0]) / 3));
        }
    }

    m = n;
    // Events in the future
    while ((event = events[++m]) && event[0] - beat < 2) {
        if (!isNoteEvent(event)) continue;

        const fn = types[event[1]];
        if (!fn) continue;
        if ((1 - (event[0] - beat) / 2) > 1) throw new Error('Influence should never be > 1 ' + beat + ' ' + stopBeat);
//console.log('FUTURE NOTE', event[2], 0.3 * (1 - (event[0] - beat) / 2));
        // Weight by distance to startBeat from beat
        fn(weights, event, 0.3 * (1 - (event[0] - beat) / 2));
    }

    return weights;
}


// Order search from keys with more accidentals to fewer accidentals so that if
// we see two keys weighted the same we end up with the one with fewer accidentals
const order = [0,7,5,2,10,9,3,4,8,11,1,6];

export function chooseKeyFromWeights(weights) {
    let n = order.length;
    let value = 0, key;
    while(n--) if (weights[order[n]] > value) {
        value = weights[order[n]];
        key   = order[n];
    }
    return key;
}
