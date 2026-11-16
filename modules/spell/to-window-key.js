/**
toWindowKey(numbers, key, debug)
Scores each of the 12 keys on the circle of fifths using a rolling 7-note
diatonic window with soft edges and an out-of-key penalty, plus a gentle
bias toward the prior key.
**/

import { fifths } from './circle.js';

const { cos, round, PI } = Math;
const deg30 = PI / 6;

// Template relative to key centre k (fifths k-1 .. k+5 are in the major scale):
//   core [k .. k+4]  -> +1.0
//   edges k-1, k+5   -> +0.9
//   outside (5 notes) -> -1.0
const TEMPLATE = [
    1.0,  // k     (I)
    1.0,  // k + 1 (V)
    1.0,  // k + 2 (II / Dorian centre)
    1.0,  // k + 3 (VI)
    1.0,  // k + 4 (III)
    0.9,  // k + 5 (VII)
   -1.0,  // k + 6
   -1.0,  // k + 7
   -1.0,  // k + 8
   -1.0,  // k + 9
   -1.0,  // k + 10
    0.9   // k - 1 (IV)
];

const BIAS = 0.25;

export function scoreKeys(numbers, key = 0) {
    const counts = new Array(12).fill(0);
    let n = numbers.length;
    while (n--) counts[fifths(numbers[n])]++;

    const scores = new Array(12);
    for (let f = 0; f < 12; f++) {
        let score = BIAS * cos((f - key) * deg30);
        for (let i = 0; i < 12; i++) {
            score += counts[(f + i) % 12] * TEMPLATE[i];
        }
        scores[f] = score;
    }

    return { counts, scores };
}

export function toWindowKey(numbers, key = 0, debug) {
    if (!numbers.length) return key;

    const { counts, scores } = scoreKeys(numbers, key);

    let bestF = 0;
    let bestScore = -Infinity;
    for (let f = 0; f < 12; f++) {
        if (scores[f] > bestScore) {
            bestScore = scores[f];
            bestF = f;
        }
    }

    // Unwrap onto the line of fifths centred on key + push (key / 2)
    const result = bestF - 12 * round((bestF - key - key / 2) / 12);

    if (debug) {
        debug.counts = counts;
        debug.scores = scores;
        debug.bestScore = bestScore;
        debug.key = result;
    }

    return result;
}
