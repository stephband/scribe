
import overload           from 'fn/overload.js';
import { toNoteNumber, toRootNumber } from 'midi/note.js';
import { isChordEvent, isNoteEvent } from 'sequence/event.js';
import toStopBeat         from './event/to-stop-beat.js';
import { transposeScale } from './scale.js';
import { major }          from './scale.js';

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

const extensions = {
    "":       [0,4,7],
    "∆":      [0,4,7,11],
    "∆7":     [0,4,7,11],
    "∆♯11":   [0,4,6,7,11],
    "7":      [0,4,7,10],
    "13":     [0,4,7,9,10],
    "7sus":   [0,5,7,10],
    "-":      [0,3,7],
    "-7":     [0,3,7,10],
    "-11":    [0,3,5,7],
    "-13":    [0,3,7,9],
    "-♭6":    [0,3,7,8],
    "7sus♭9": [0,1,5,7,10],
    "ø":      [0,3,6,10],
    "-∆":     [0,3,7,11],
    "7♯11":   [0,4,6,7,10],
    "∆♭6":    [0,4,7,8],
    "-♭9":    [0,1,3,7],
    "ø7":     [0,2,3,6,10],
    "∆♯5":    [0,2,4,6,8,9,11],
    "7alt":   [0,1,3,4,6,8,10],
    "°":      [0,3,6,9],
    "7♭9":    [0,1,4,7,10],
    "7♯9":    [0,3,4,7,10],
    "7♭13":   [0,4,7,8,10],
    "+":      [0,2,4,6,8,10],
    "+7":     [0,2,4,6,8,10],
    "dim":    [0,3,6,9],
};

const degreeWeights = Float32Array.of(
//  Root b9   9    min3 maj3 11   #11  5    b6   13   7    maj7
    0.9, 0.9, 0.8, 1,   1,   0.8, 0.8, 0.8, 0.9, 1,   1,   1
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
    (3/6       + 1/9   + 0),    // 13
    (4/6       + 0     + 0),    // 7
    (1/6       + 0     + 0)     // maj7
];

const factors = {
    3: [10/16, 13/16, 10/16],
    4: [10/16, 13/16, 10/16, 12/16]
};

/*function toChordKeys(root, ext) {
    const r       = toRootNumber(root);
    const notes   = extensions[ext];
    const weights = Float32Array.of(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
    const facts   = factors[notes.length];
    let n = notes.length, number, keys;
    while (n--) {
        number = r + notes[n];
        keys   = keysContainingNote(number);
        multiplyWeights(weights, keys, facts[n]);
    }
    return weights;
}*/

function toChordNotes(root, ext) {
    const r = toRootNumber(root);
    return extensions[ext].map((n) => toRootNumber(r + n)).sort();
}

function keysContainingNote(number) {
    const keys = new Float32Array(12);
    let n = toRootNumber(number + 2);
    let i = 7;
    while (i--) keys[n = toRootNumber(n + 5)] = 1;
    return keys;
}

function multiplyWeights(weights1, weights2, factor) {
    let n = weights1.length;
    while (n--) weights1[n] *= (1 - factor) + factor * weights2[n];
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
        const r = toRootNumber(event[2]);
        const degrees = extensions[event[3].replace(/\(|\)/g, '')];

        if (!degrees) {
            console.warn('No scale for chord extension "' + event[3] + '"');
            return weights;
        }

        const notes = degrees.map((n) => toRootNumber(r + n));

        let n = notes.length, probs;
        while (n--) {
            probs = keysContainingNote(notes[n]);
            multiplyWeights(weights, probs, influence
                // Weight notes based on chord degree
                * degreeWeights[degrees[n]]
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
            // Fairly influential 0.5
            fn(weights, event, 0.5);
        }
        // Notes that recently stopped
        else if (event[1] === 'note' && beat - stopBeat < 3) {
            if ((1 - (beat - stopBeat) / 3) > 1) throw new Error('Influence should never be > 1 ' + beat + ' ' + stopBeat);
            // Weight by distance from stopBeat to beat
            fn(weights, event, 0.25 * (1 - (beat - stopBeat) / 3));
        }
    }

    m = n;
    // Events in the future
    while ((event = events[++m]) && event[0] - beat < 2) {
        if (!isNoteEvent(event)) continue;

        const fn = types[event[1]];
        if (!fn) continue;
        if ((1 - (event[0] - beat) / 2) > 1) throw new Error('Influence should never be > 1 ' + beat + ' ' + stopBeat);

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
