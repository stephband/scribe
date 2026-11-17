/**
analyseKeys(numbers)

We use a truncated cos wave centred on the dorian as a weighting window that
describes the probability of a given note number falling within a key on the
circle of fifths. Weights are multiplied together to give a set of probabilities
that a set of note numbers belongs to each key.

                D
         G             A

   C                         E


 F              ●              B


   B♭                        F♯

       E♭/D♯          C♯/D♭
              A♭/G♯

**/


import fifths from 'sequence/modules/transforms/fifths.js';

const { cos, PI } = Math;
const deg30   = PI / 6;
const weights = [
    1,                  //
    1,                  //
    1,                  // Dorian centre
    1,                  //
    1,                  //
    1,                  //
    1 + cos(4 * deg30), //
    1 + cos(5 * deg30), //
    0,                  // The one note key alone cannot know how to spell
    1 + cos(7 * deg30), //
    1 + cos(8 * deg30), //
    1                   //
];

const scores = [];

export default function analyseKeys(numbers) {
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
