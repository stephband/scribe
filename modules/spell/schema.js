
import fifths      from 'sequence/modules/transforms/fifths.js';
import analyseKeys from './analyse.js';

const { log1p } = Math;

export const IN_DIM  = 30;
export const OUT_DIM = 19;

/**
Schema
**/

export default {
    inDim: IN_DIM,
    layers: [
        { hiddenDim: 12, bidirectional: true }
    ],
    priming: null,
    heads: [
        {
            name: 'key',
            layerIndex: 0,
            outDim: OUT_DIM,
            lossWeight: 1.0
        }
    ]
};


/**
encode(head)

Encodes a linked list of beat slices from `batch(events)` into a flat
`Float32Array(T * 30)` input buffer for `RecurrentNetwork`.

Input vector per beat slice (30 floats):
- [0..11]  12 notes present in slice (0 or 1), indexed by circle of fifths
- [12..23] 12 analyseKey(slice) scores on the circle of fifths (0..11)
- [24]     dtPrev: log1p(slice.beat - slice.prev.beat)
- [25]     dtNext: log1p(slice.next.beat - slice.beat)
- [26]     minDur: log1p(minDuration)
- [27]     maxDur: log1p(maxDuration)
- [28]     homeKey: slice.key / 9
- [29]     grain: raw slice.grain
**/

export function encode(head) {
    const data = new Float32Array(head.count * IN_DIM);
    let offset = 0;
    let slice = head;

    while (slice && slice.length) {
        // [0..11] 12 circle-of-fifths note presence flags (0 or 1)
        let n = slice.length;
        while (n--) {
            data[offset + fifths(slice[n])] = 1;
        }

        // [12..23] 12 circle-of-fifths analyseKeys() scores
        const scores = analyseKeys(slice);
        let w = 12;
        while (w--) {
            data[offset + 12 + w] = scores[w];
        }

        // [24..25] Beat gaps from previous and to next slice
        data[offset + 24] = slice.prev ? log1p(slice.beat - slice.prev.beat) : 0;
        data[offset + 25] = slice.next ? log1p(slice.next.beat - slice.beat) : 0;

        // [26..27] Shortest and longest event durations in the slice
        let minDur = Infinity;
        let maxDur = 0;
        let s = 0, event;
        while (event = slice[--s]) {
            const duration = event[4];
            if (duration < minDur) minDur = duration;
            if (duration > maxDur) maxDur = duration;
        }
        data[offset + 26] = minDur < Infinity ? log1p(minDur) : 0;
        data[offset + 27] = log1p(maxDur);

        // [28] Home key normalised to [-1..+1] for keys -9..+9
        data[offset + 28] = slice.key / 9;

        // [29] Metric grain at slice beat
        data[offset + 29] = slice.grain || 0;

        offset += IN_DIM;
        slice = slice.next;
    }

    return data;
}


/**
decode(head, outputs)

Applies the predicted momentary keys (`0..18` -> `-9..+9`) from `outputs`
back onto each slice and spells its note and chord events in place.
**/

export function decode(head, outputs) {
    const preds = outputs.key ? outputs.key.preds : outputs;
    let t = 0;
    let slice = head;

    while (slice && slice.length) {
        const key = preds[t++] - 9;

        let s = 0, event;
        while (event = slice[--s]) switch (event.type) {
            case 'note':
            case 'chord':
                event.key = key;
                break;
        }

        slice = slice.next;
    }

    return head;
}

