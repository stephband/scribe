
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
    { beat: 0, duration: 1, divisor: 2,  rhythm: 3 },  // Duplets followed by triplets
    { beat: 0, duration: 1, divisor: 3,  rhythm: 7 },  // Triplets followed by duplets
    { beat: 0, duration: 1, divisor: 3,  rhythm: 5 },  // Triplets are allowed to have holes
    { beat: 0, duration: 1, divisor: 3,  rhythm: 4 },

    { beat: 0, duration: 4, divisor: 12, rhythm: 63 }, // Sextuplets
    { beat: 0, duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 0, duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 1, duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 1, duration: 2, divisor: 6,  rhythm: 63 }
/**/
], (test, done) => {
    // No events
    test(detectTuplet([], 0, 4));

    // Single crotchet
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1]
    ], 0, 4));

    // Two eighth notes
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.5],
        [0.5, 'note', 60, 0.1, 0.5]
    ], 0, 4));

    // Second eighth note only
    test(detectTuplet([
        [0.5, 'note', 60, 0.1, 0.5]
    ], 0, 4));

    // Third eighth note only
    test(detectTuplet([
        [1,   'note', 60, 0.1, 0.5]
    ], 0, 4));

    // Fourth eighth note only
    test(detectTuplet([
        [1.5, 'note', 60, 0.1, 0.5]
    ], 0, 4));

    // Fifth eighth note only
    test(detectTuplet([
        [2,   'note', 60, 0.1, 0.5]
    ], 0, 4));

    // Fifth and sixth eighth notes
    test(detectTuplet([
        [2,   'note', 60, 0.1, 0.5],
        [2.5, 'note', 60, 0.1, 0.5]
    ], 0, 4));

    // Fifth and sixth eighth notes, humanised data
    test(detectTuplet([
        [2.1, 'note', 60, 0.1, 0.5],
        [2.6, 'note', 60, 0.1, 0.5]
    ], 0, 4));

    // Third and fourth quarter notes
    test(detectTuplet([
        [2,   'note', 60, 0.1, 1],
        [3,   'note', 60, 0.1, 1]
    ], 0, 4));

    // Third and fourth quarter notes, humanised data
    test(detectTuplet([
        [2.1, 'note', 60, 0.1, 1],
        [3.1, 'note', 60, 0.1, 1]
    ], 0, 4));

/*
    // Quarter note followed by triplets, should only detect the duplets up to duration 1
    test(detectTuplet([
        [0,     'note', 60, 0.1, 1],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333]
    ], 0, 4));

    // Duplets followed by triplets, should only detect the duplets up to duration 1
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.5],
        [0.5,   'note', 60, 0.1, 0.5],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333]
    ], 0, 4));

    // Triplets followed by duplets, should only detect the triplets up to duration 1
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.5],
        [1.5,   'note', 60, 0.1, 0.5]
    ], 0, 4));

    // Triplets are allowed to have holes
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.5],
        [1.5,   'note', 60, 0.1, 0.5]
    ], 0, 4));

    test(detectTuplet([
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.5],
        [1.5,   'note', 60, 0.1, 0.5]
    ], 0, 4));

    // However, if it's sextuplets - no holes - it should know it's sextuplets
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333]
    ], 0, 4));

    // But if the sextuplets are followed by another note, duration should only be 2,
    // up to the end of the sextuplets
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333],
        [2,     'note', 60, 0.1, 1]
    ], 0, 4));

    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333],
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333],
        [3,     'note', 60, 0.1, 1]
    ], 0, 4));

    // These groups start on beat 1, but the same logic applies
    test(detectTuplet([
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333],
        [2,     'note', 60, 0.1, 0.333],
        [2.333, 'note', 60, 0.1, 0.333],
        [2.667, 'note', 60, 0.1, 0.333]
    ], 0, 4));

    test(detectTuplet([
        [1,     'note', 60, 0.1, 0.333],
        [1.333, 'note', 60, 0.1, 0.333],
        [1.667, 'note', 60, 0.1, 0.333],
        [2,     'note', 60, 0.1, 0.333],
        [2.333, 'note', 60, 0.1, 0.333],
        [2.667, 'note', 60, 0.1, 0.333],
        [3,     'note', 60, 0.1, 1]
    ], 0, 4));
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
], (test, done) => {
    // First two of three
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.333],
        [0.33,  'note', 60, 0.1, 0.333]
    ], 0, 4));

    // All three
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333]
    ], 0, 4));

    // Second and third only
    test(detectTuplet([
        [0.333, 'note', 60, 0.1, 0.333],
        [0.667, 'note', 60, 0.1, 0.333]
    ], 0, 4));

    // First two only
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333]
    ], 0, 4));

    // Second note only
    test(detectTuplet([
        [0.333, 'note', 60, 0.1, 0.333]
    ], 0, 4));

    // Slightly loose timing
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.333],
        [0.333, 'note', 60, 0.1, 0.333],
        [0.7,   'note', 60, 0.1, 0.3]
    ], 0, 4));

    // Human performance timing
    test(detectTuplet([
        [0.1,   'note', 60, 0.1, 0.2],
        [0.3,   'note', 60, 0.1, 0.333],
        [0.7,   'note', 60, 0.1, 0.3]
    ], 0, 4));

    // Half note triplets, first two
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.667],
        [0.667, 'note', 60, 0.1, 0.667]
    ], 0, 4));

    // Half note triplets across bars
    test(detectTuplet([
        [0,     'note', 60, 0.1, 0.667],
        [0.667, 'note', 60, 0.1, 0.667],
        [1.333, 'note', 60, 0.1, 0.667]
    ], 0, 4));

    // Half note triplets, second and third
    test(detectTuplet([
        [0.667, 'note', 60, 0.1, 0.667],
        [1.333, 'note', 60, 0.1, 0.667]
    ], 0, 4));

    // Half note triplets, third only
    test(detectTuplet([
        [1.333, 'note', 60, 0.1, 0.667]
    ], 0, 4));

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
], (test, done) => {
    // First two
    test(detectTuplet([
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // First three
    test(detectTuplet([
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25]
    ], 0, 4));

    // All four
    test(detectTuplet([
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // Last three
    test(detectTuplet([
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // First, third, fourth
    test(detectTuplet([
        [0,    'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // First, second, fourth
    test(detectTuplet([
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // First three only
    test(detectTuplet([
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25]
    ], 0, 4));

    // Third and fourth
    test(detectTuplet([
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // First and fourth
    test(detectTuplet([
        [0,    'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // First two only
    test(detectTuplet([
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // Second and third
    test(detectTuplet([
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25]
    ], 0, 4));

    // Second and fourth
    test(detectTuplet([
        [0.25, 'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // Second only
    test(detectTuplet([
        [0.25, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // Fourth only
    test(detectTuplet([
        [0.75, 'note', 60, 0.1, 0.25]
    ], 0, 4));

    // Human performance timing
    test(detectTuplet([
        [0,    'note', 60, 0.1, 0.25],
        [0.29, 'note', 60, 0.1, 0.23],
        [0.52, 'note', 60, 0.1, 0.18],
        [0.7,  'note', 60, 0.1, 0.3]
    ], 0, 4));

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
], (test, done) => {
    // First two
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // First three
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // First four
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // All five
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // Last four
    test(detectTuplet([
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // Skip second
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // Skip third
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // Skip fourth
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // Skip fifth
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 3rd through 5th
    test(detectTuplet([
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 1st and 4th-5th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 1st-2nd and 5th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 1st through 3rd
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 2nd through 4th
    test(detectTuplet([
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 4th and 5th
    test(detectTuplet([
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 1st and 5th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 1st and 2nd
    test(detectTuplet([
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 2nd and 3rd
    test(detectTuplet([
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 3rd and 4th
    test(detectTuplet([
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 2nd only
    test(detectTuplet([
        [1/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 3rd only
    test(detectTuplet([
        [2/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 4th only
    test(detectTuplet([
        [3/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

    // 5th only
    test(detectTuplet([
        [4/5, 'note', 60, 0.1, 0.2]
    ], 0, 4));

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
], (test, done) => {
    // First two
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // First three
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // First four
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // First five
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // First six
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // All seven
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // Last six
    test(detectTuplet([
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // Skip 2nd
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // Skip 3rd
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // Skip 4th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // Skip 5th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // Skip 6th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // Skip 7th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // 3rd through 7th
    test(detectTuplet([
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // 1st and 4th through 7th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // 1st-2nd and 5th through 7th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // 1st-3rd and 6th-7th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // 1st-4th and 7th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // 1st through 5th
    test(detectTuplet([
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    // 2nd through 6th
    test(detectTuplet([
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7]
    ], 0, 4));

    done();
});
/**/
