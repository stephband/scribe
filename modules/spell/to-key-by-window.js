/**

                D
         G             A

   C                         E


 F              ●              B


   B♭                        F♯

       E♭/D♯          C♯/D♭
              A♭/G♯

**/


import mod12 from 'sequence/modules/number/mod-12.js';
import { fifths } from './circle.js';

const { abs, cos, pow, PI } = Math;
const deg30 = PI / 6;

const weights = [
    // We use a truncated cos wave centred on the dorian as a weighting window
    // that describes the probability of a given fifth falling within that key
    1,                  // C
    1,                  // G
    1,                  // D Dorian centre
    1,                  // A
    1,                  // E
    1,                  // B
    1 + cos(4 * deg30), // F♯
    1 + cos(5 * deg30), // C♯/D♭
    0,                  // A♭/G♯ The one note key alone cannot know how to spell
    1 + cos(7 * deg30), // E♭/D♯
    1 + cos(8 * deg30), // B♭
    1                   // F
];

const scores = [];

export function roll(numbers) {
    scores.length = 0;
    // For each window position...
    let w = 12;
    while (w--) {
        let score = 1;
        // score each number...
        let n = numbers.length;
        while (n--) {
            score *= weights[(fifths(numbers[n]) + 12 - w) % 12];
        }
        scores[w] = score;
    }

    return scores;
}




// This hard limit super gaussian window decides how far we can push
// along the line of fifths into flats or sharps
const lineOfFifthWeights = [
    supergaussian(20, 8, -9), // B𝄫
    supergaussian(20, 8, -8), // F♭
    supergaussian(20, 8, -7), // C♭
    supergaussian(20, 8, -6), // G♭
    supergaussian(20, 8, -5), // D♭
    supergaussian(20, 8, -4), // A♭
    supergaussian(20, 8, -3), // E♭
    supergaussian(20, 8, -2), // B♭
    supergaussian(20, 8, -1), // F
    supergaussian(20, 8, 0),  // C
    supergaussian(20, 8, 1),  // G
    supergaussian(20, 8, 2),  // D
    supergaussian(20, 8, 3),  // A
    supergaussian(20, 8, 4),  // E
    supergaussian(20, 8, 5),  // B
    supergaussian(20, 8, 6),  // F♯
    supergaussian(20, 8, 7),  // C♯
    supergaussian(20, 8, 8),  // G♯
    supergaussian(20, 8, 9)   // D♯
];


/*
supergaussian(s, w, x)

A bell curve with a central peak of `1` at `x = 0`.

- `w` ±range where the curve passes through 0.5
- `s` an even integer describing the steepness of the sides and flatness of the
      top of the curve (`s = 2` is a standard normal distribution, the higher
      `s` is the more of a brick-wall bandpass, and negative `s` turns it into
      a brick-wall notch)
*/

export function supergaussian(s = 2, w = 1, x = 0) {
    return pow(1/2, pow(abs(x / w), s));
}

export function toKey(numbers, key = 0) {
    if (!numbers.length) return key;

    // The probability of notes per key in circle of fifths
    const circleOfFifthWeights = roll(numbers);
    let highscore = 0;
    let winner = key;

    // Weight circular key probabilities by harmonic closeness at `key` and
    // key-signature readability centred at C (0) along the line of fifths
    let k = -10;
    while (++k < 10) {
        const circleWeight = circleOfFifthWeights[mod12(k)];
        // This gentle gaussian window tracks key to prefer closer keys where
        // more than one key has the same score
        const keyWeight    = supergaussian(2,  12,  k - key);
        // This hard limit super gaussian window decides how far we can push
        // along the line of fifths into flats or sharps
        const lineWeight   = lineOfFifthWeights[k + 9];

        const score = circleWeight * keyWeight * lineWeight;

        if (score > highscore) {
            highscore = score;
            winner = k;
        }
    }

    return winner;
}
