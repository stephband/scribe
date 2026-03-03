
import run from 'fn/test.js';
// import { detectTuplet } from '../modules/tuplet.js';
// import { detectRhythm as detectTuplet } from '../modules/detect-rhythm.js';
import { detectOsc as detectTuplet } from '../modules/detect-osc.js';


run('Duplets', [
    undefined,
    { beat: 0, duration: 4, divisor: 1,  rhythm: 1 },
    { beat: 0, duration: 4, divisor: 8,  rhythm: 3 },
    { beat: 0, duration: 4, divisor: 8,  rhythm: 2 },
    { beat: 0, duration: 4, divisor: 4,  rhythm: 2 },
    { beat: 0, duration: 4, divisor: 8,  rhythm: 8 },
    { beat: 0, duration: 4, divisor: 2,  rhythm: 2 },
    { beat: 0, duration: 4, divisor: 8,  rhythm: 48 },
    { beat: 0, duration: 4, divisor: 8,  rhythm: 48 },
    { beat: 0, duration: 4, divisor: 4,  rhythm: 12 },
    { beat: 0, duration: 4, divisor: 4,  rhythm: 12 },

/*    { beat: 0, duration: 1, divisor: 1,  rhythm: 1 },  // Quarter note followed by triplets
*/    { beat: 0, duration: 1, divisor: 2,  rhythm: 3 },  // Duplets followed by triplets
 /*   { beat: 0, duration: 1, divisor: 3,  rhythm: 7 },  // Triplets followed by duplets
    { beat: 0, duration: 1, divisor: 3,  rhythm: 5 },  // Triplets are allowed to have holes
    { beat: 0, duration: 1, divisor: 3,  rhythm: 4 },

    { beat: 0, duration: 4, divisor: 12, rhythm: 63 }, // Sextuplets
    { beat: 0, duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 0, duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 1, duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 1, duration: 2, divisor: 6,  rhythm: 63 }
/**/
], ({ equals, matches }, done) => {
    // No events
    matches(detectTuplet(0, 4, []));

    // Single crotchet
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1]
    ]));

    // Two eighth notes
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.5],
        [0.5, 'note', 60, 0.1, 0.5]
    ]));

    // Second eighth note only
    matches(detectTuplet(0, 4, [
        [0.5, 'note', 60, 0.1, 0.5]
    ]));

    // Third eighth note only
    matches(detectTuplet(0, 4, [
        [1,   'note', 60, 0.1, 0.5]
    ]));

    // Fourth eighth note only
    matches(detectTuplet(0, 4, [
        [1.5, 'note', 60, 0.1, 0.5]
    ]));

    // Fifth eighth note only
    matches(detectTuplet(0, 4, [
        [2,   'note', 60, 0.1, 0.5]
    ]));

    // Fifth and sixth eighth notes
    matches(detectTuplet(0, 4, [
        [2,   'note', 60, 0.1, 0.5],
        [2.5, 'note', 60, 0.1, 0.5]
    ]));

    // Fifth and sixth eighth notes, humanised data
    matches(detectTuplet(0, 4, [
        [2.01, 'note', 60, 0.1, 0.5],
        [2.51, 'note', 60, 0.1, 0.5]
    ]));

    // Third and fourth quarter notes
    matches(detectTuplet(0, 4, [
        [2,   'note', 60, 0.1, 1],
        [3,   'note', 60, 0.1, 1]
    ]));

    // Third and fourth quarter notes, humanised data
    matches(detectTuplet(0, 4, [
        [2.1, 'note', 60, 0.1, 1],
        [3.1, 'note', 60, 0.1, 1]
    ]));

/*
    // Quarter note followed by triplets, should only detect the duplets up to duration 1
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 1],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333]
    ]));
*/
    // Duplets followed by triplets, should only detect the duplets up to duration 1
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.5],
        [0.5,   'note', 60, 0.1, 0.5],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333]
    ]));
/*
    // Triplets followed by duplets, should only detect the triplets up to duration 1
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.5],
        [1.5,   'note', 60, 0.1, 0.5]
    ]));

    // Triplets are allowed to have holes
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.5],
        [1.5,   'note', 60, 0.1, 0.5]
    ]));

    matches(detectTuplet(0, 4, [
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.5],
        [1.5,   'note', 60, 0.1, 0.5]
    ]));

    // However, if it's sextuplets - no holes - it should know it's sextuplets
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333]
    ]));

    // But if the sextuplets are followed by another note, duration should only be 2,
    // up to the end of the sextuplets
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333],
        [2,     'note', 60, 0.1, 1]
    ]));

    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333],
        [3,     'note', 60, 0.1, 1]
    ]));

    // These groups start on beat 1, but the same logic applies
    matches(detectTuplet(0, 4, [
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333],
        [2,     'note', 60, 0.1, 0.333],
        [2.333, 'note', 60, 0.1, 0.333],
        [2.667, 'note', 60, 0.1, 0.333]
    ]));

    matches(detectTuplet(0, 4, [
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333],
        [2,     'note', 60, 0.1, 0.333],
        [2.333, 'note', 60, 0.1, 0.333],
        [2.667, 'note', 60, 0.1, 0.333],
        [3,     'note', 60, 0.1, 1]
    ]));
*/
    done();
});

/*
run('Triplets', [
    { beat: 0, duration: 1, divisor: 3, rhythm: 3 },
    { beat: 0, duration: 1, divisor: 3, rhythm: 7 },
    { beat: 0, duration: 1, divisor: 3, rhythm: 6 },
    { beat: 0, duration: 1, divisor: 3, rhythm: 3 },
    { beat: 0, duration: 1, divisor: 3, rhythm: 2 },
    { beat: 0, duration: 1, divisor: 3, rhythm: 7 },
    { beat: 0, duration: 1, divisor: 3, rhythm: 7 },
    { beat: 0, duration: 2, divisor: 3, rhythm: 3 },
    { beat: 0, duration: 2, divisor: 3, rhythm: 7 },
    { beat: 0, duration: 2, divisor: 3, rhythm: 6 },
    { beat: 0, duration: 2, divisor: 3, rhythm: 4 }
], ({ equals, matches }, done) => {
    // First two of three
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.333],
        [0.33,  'note', 60, 0.1, 0.333]
    ]));

    // All three
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333]
    ]));

    // Second and third only
    matches(detectTuplet(0, 4, [
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333]
    ]));

    // First two only
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333]
    ]));

    // Second note only
    matches(detectTuplet(0, 4, [
        [0.333, 'note', 60, 0.1, 0.333]
    ]));

    // Slightly loose timing
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.7,   'note', 60, 0.1, 0.3]
    ]));

    // Human performance timing
    matches(detectTuplet(0, 4, [
        [0.1,   'note', 60, 0.1, 0.2],
        [0.3,   'note', 60, 0.1, 0.333],
        [0.7,   'note', 60, 0.1, 0.3]
    ]));

    // Half note triplets, first two
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.667],
        [0.667, 'note', 60, 0.1, 0.667]
    ]));

    // Half note triplets across bars
    matches(detectTuplet(0, 4, [
        [0,     'note', 60, 0.1, 0.667],
        [0.667, 'note', 60, 0.1, 0.667],
        [1.333, 'note', 60, 0.1, 0.667]
    ]));

    // Half note triplets, second and third
    matches(detectTuplet(0, 4, [
        [0.667, 'note', 60, 0.1, 0.667],
        [1.333, 'note', 60, 0.1, 0.667]
    ]));

    // Half note triplets, third only
    matches(detectTuplet(0, 4, [
        [1.333, 'note', 60, 0.1, 0.667]
    ]));

    done();
});


run('Quadruplets', [
    { beat: 0, duration: 1, divisor: 4, rhythm: 3 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 7 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 15 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 14 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 13 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 11 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 7 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 12 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 9 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 3 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 6 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 10 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 2 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 8 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 15 }
], ({ equals, matches }, done) => {
    // First two
    matches(detectTuplet(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25]
    ]));

    // First three
    matches(detectTuplet(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25]
    ]));

    // All four
    matches(detectTuplet(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));

    // Last three
    matches(detectTuplet(0, 4, [
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));

    // First, third, fourth
    matches(detectTuplet(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));

    // First, second, fourth
    matches(detectTuplet(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));

    // First three only
    matches(detectTuplet(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25]
    ]));

    // Third and fourth
    matches(detectTuplet(0, 4, [
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));

    // First and fourth
    matches(detectTuplet(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));

    // First two only
    matches(detectTuplet(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25]
    ]));

    // Second and third
    matches(detectTuplet(0, 4, [
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25]
    ]));

    // Second and fourth
    matches(detectTuplet(0, 4, [
        [0.25, 'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));

    // Second only
    matches(detectTuplet(0, 4, [
        [0.25, 'note', 60, 0.1, 0.25]
    ]));

    // Fourth only
    matches(detectTuplet(0, 4, [
        [0.75, 'note', 60, 0.1, 0.25]
    ]));

    // Human performance timing
    matches(detectTuplet(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.29, 'note', 60, 0.1, 0.23],
        [0.52, 'note', 60, 0.1, 0.18],
        [0.7,  'note', 60, 0.1, 0.3]
    ]));

    done();
});


run('Quintuplets', [
    { beat: 0, duration: 1, divisor: 5, rhythm: 3 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 7 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 15 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 31 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 30 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 29 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 27 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 23 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 15 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 28 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 25 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 19 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 7 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 14 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 24 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 17 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 3 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 6 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 12 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 2 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 4 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 8 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 16 }
], ({ equals, matches }, done) => {
    // First two
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2]
    ]));

    // First three
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2]
    ]));

    // First four
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ]));

    // All five
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // Last four
    matches(detectTuplet(0, 4, [
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // Skip second
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // Skip third
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // Skip fourth
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // Skip fifth
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ]));

    // 3rd through 5th
    matches(detectTuplet(0, 4, [
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // 1st and 4th-5th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // 1st-2nd and 5th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // 1st through 3rd
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2]
    ]));

    // 2nd through 4th
    matches(detectTuplet(0, 4, [
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ]));

    // 4th and 5th
    matches(detectTuplet(0, 4, [
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // 1st and 5th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    // 1st and 2nd
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2]
    ]));

    // 2nd and 3rd
    matches(detectTuplet(0, 4, [
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2]
    ]));

    // 3rd and 4th
    matches(detectTuplet(0, 4, [
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ]));

    // 2nd only
    matches(detectTuplet(0, 4, [
        [1/5, 'note', 60, 0.1, 0.2]
    ]));

    // 3rd only
    matches(detectTuplet(0, 4, [
        [2/5, 'note', 60, 0.1, 0.2]
    ]));

    // 4th only
    matches(detectTuplet(0, 4, [
        [3/5, 'note', 60, 0.1, 0.2]
    ]));

    // 5th only
    matches(detectTuplet(0, 4, [
        [4/5, 'note', 60, 0.1, 0.2]
    ]));

    done();
});


run('Septuplets', [
    { beat: 0, duration: 1, divisor: 7, rhythm: 3 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 7 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 15 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 31 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 63 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 127 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 126 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 125 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 123 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 119 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 111 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 95 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 63 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 124 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 121 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 115 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 103 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 79 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 31 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 62 }
], ({ equals, matches }, done) => {
    // First two
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7]
    ]));

    // First three
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7]
    ]));

    // First four
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7]
    ]));

    // First five
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7]
    ]));

    // First six
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7]
    ]));

    // All seven
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // Last six
    matches(detectTuplet(0, 4, [
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // Skip 2nd
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // Skip 3rd
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // Skip 4th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // Skip 5th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // Skip 6th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // Skip 7th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7]
    ]));

    // 3rd through 7th
    matches(detectTuplet(0, 4, [
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // 1st and 4th through 7th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // 1st-2nd and 5th through 7th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // 1st-3rd and 6th-7th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // 1st-4th and 7th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));

    // 1st through 5th
    matches(detectTuplet(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7]
    ]));

    // 2nd through 6th
    matches(detectTuplet(0, 4, [
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7]
    ]));

    done();
});
/**/
