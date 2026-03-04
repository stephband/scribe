
import run from 'fn/test.js';
import detectRhythm from '../modules/rhythm.js';


run('No events', [
    { beat: 0,   duration: 4, rhythm: 0 },
], ({ equals, matches }, done) => {
    matches(detectRhythm(0, 4, []));
    done();
});

run('Singlets', [
    // 4/4 bar
    { beat: 0,   duration: 4, divisor: 1, rhythm: 1 }, // One quarter note
    { beat: 0,   duration: 4, divisor: 2, rhythm: 2 },

    { beat: 0,   duration: 2, divisor: 2, rhythm: 2 },
    { beat: 2,   duration: 2, divisor: 2, rhythm: 2 },

    { beat: 0,   duration: 1, divisor: 2, rhythm: 2 },
    { beat: 1,   duration: 1, divisor: 2, rhythm: 2 },
    { beat: 2,   duration: 1, divisor: 2, rhythm: 2 },
    { beat: 3,   duration: 1, divisor: 2, rhythm: 2 },

    { beat: 0,   duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 0.5, duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 1,   duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 1.5, duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 2,   duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 2.5, duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 3,   duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 3.5, duration: 0.5, divisor: 2, rhythm: 2 },

    // 3/4 bar
    { beat: 0,   duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 0.5, duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 1,   duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 1.5, duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 2,   duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 2.5, duration: 0.5, divisor: 2, rhythm: 2 },
    { beat: 0,   duration: 3,               rhythm: 0 },
    { beat: 0,   duration: 3,               rhythm: 0 }
], ({ equals, matches }, done) => {
    matches(detectRhythm(0, 4, [[0,   'note', 60, 0.1, 1]])); // Note at beat 0
    matches(detectRhythm(0, 4, [[2,   'note', 60, 0.1, 1]])); // Note at beat 2

    matches(detectRhythm(0, 4, [[1,   'note', 60, 0.1, 1]])); // Note at beat 1
    matches(detectRhythm(0, 4, [[3,   'note', 60, 0.1, 1]])); // Note at beat 3

    matches(detectRhythm(0, 4, [[0.5, 'note', 60, 0.1, 1]])); // Note at beat 0.5
    matches(detectRhythm(0, 4, [[1.5, 'note', 60, 0.1, 1]])); // Note at beat 1.5
    matches(detectRhythm(0, 4, [[2.5, 'note', 60, 0.1, 1]])); // Note at beat 2.5
    matches(detectRhythm(0, 4, [[3.5, 'note', 60, 0.1, 1]])); // Note at beat 3.5

    matches(detectRhythm(0, 4, [[0.25, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 4, [[0.75, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 4, [[1.25, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 4, [[1.75, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 4, [[2.25, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 4, [[2.75, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 4, [[3.25, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 4, [[3.75, 'note', 60, 0.1, 1]]));

    matches(detectRhythm(0, 3, [[0.25, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 3, [[0.75, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 3, [[1.25, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 3, [[1.75, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 3, [[2.25, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 3, [[2.75, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 3, [[3.25, 'note', 60, 0.1, 1]]));
    matches(detectRhythm(0, 3, [[3.75, 'note', 60, 0.1, 1]]));

    done();
});

run('Duplets', [
    { beat: 0, duration: 4,   divisor: 2, rhythm: 3 },
    { beat: 0, duration: 2,   divisor: 2, rhythm: 3 },
    { beat: 0, duration: 1,   divisor: 2, rhythm: 3 },
    { beat: 0, duration: 0.5, divisor: 2, rhythm: 3 },
    { beat: 0, duration: 0.25,divisor: 2, rhythm: 3 },

    { beat: 0, duration: 2,   divisor: 2, rhythm: 2 },
    { beat: 0, duration: 2,   divisor: 2, rhythm: 2 },
    { beat: 1, duration: 1,   divisor: 2, rhythm: 3 },
    { beat: 1, duration: 0.5, divisor: 2, rhythm: 3 },
    { beat: 1, duration: 0.25,divisor: 2, rhythm: 3 },

    { beat: 0, duration: 4,   divisor: 2, rhythm: 2 },
    { beat: 2, duration: 2,   divisor: 2, rhythm: 3 },
    { beat: 2, duration: 1,   divisor: 2, rhythm: 3 },
    { beat: 2, duration: 0.5, divisor: 2, rhythm: 3 },
    { beat: 2, duration: 0.25,divisor: 2, rhythm: 3 },

    { beat: 0, duration: 1,   divisor: 1, rhythm: 1 }, // Quarter note followed by triplets
    { beat: 0, duration: 1,   divisor: 2, rhythm: 3 }  // Duplets followed by triplets
], ({ equals, matches }, done) => {
    matches(detectRhythm(0, 4, [[0,   'note', 60, 0.1, 0.5], [2,    'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[0,   'note', 60, 0.1, 0.5], [1,    'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[0,   'note', 60, 0.1, 0.5], [0.5,  'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[0,   'note', 60, 0.1, 0.5], [0.25, 'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[0,   'note', 60, 0.1, 0.5], [0.125,'note', 60, 0.1, 0.5]]));

    matches(detectRhythm(0, 4, [[1,   'note', 60, 0.1, 0.5], [3,    'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[1,   'note', 60, 0.1, 0.5], [2,    'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[1,   'note', 60, 0.1, 0.5], [1.5,  'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[1,   'note', 60, 0.1, 0.5], [1.25, 'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[1,   'note', 60, 0.1, 0.5], [1.125,'note', 60, 0.1, 0.5]]));

    matches(detectRhythm(0, 4, [[2,   'note', 60, 0.1, 0.5], [4,    'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[2,   'note', 60, 0.1, 0.5], [3,    'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[2,   'note', 60, 0.1, 0.5], [2.5,  'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[2,   'note', 60, 0.1, 0.5], [2.25, 'note', 60, 0.1, 0.5]]));
    matches(detectRhythm(0, 4, [[2,   'note', 60, 0.1, 0.5], [2.125,'note', 60, 0.1, 0.5]]));

    // Quarter note followed by triplets, should only detect the duplets up to duration 1
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 1],
        [1,    'note', 60, 0.1, 0.33],
        [1.33, 'note', 60, 0.1, 0.33],
        [1.67, 'note', 60, 0.1, 0.33]
    ]));
    // Duplets followed by triplets, should only detect the duplets up to duration 1
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.5],
        [0.5,  'note', 60, 0.1, 0.5],
        [1,    'note', 60, 0.1, 0.33],
        [1.33, 'note', 60, 0.1, 0.33],
        [1.67, 'note', 60, 0.1, 0.33]
    ]));

    done();
});

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
    //{ beat: 0, duration: 2, divisor: 3, rhythm: 4 }
    { beat: 0, duration: 4, divisor: 3, rhythm: 2 },
    { beat: 0, duration: 2, divisor: 3, rhythm: 4 },
    { beat: 0,   duration: 1, divisor: 3,  rhythm: 7 },  // Triplets followed by duplets
    { beat: 0,   duration: 1, divisor: 3,  rhythm: 5 },  // Triplets are allowed to have holes
    { beat: 0,   duration: 1, divisor: 3,  rhythm: 4 },
    { beat: 0,   duration: 1, divisor: 3,  rhythm: 4 }
], ({ equals, matches }, done) => {
    // First two of three
    matches(detectRhythm(0, 4, [
        [0,     'note', 60, 0.1, 0.33],
        [0.33,  'note', 60, 0.1, 0.33]
    ]));
    // All three
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.33],
        [0.33, 'note', 60, 0.1, 0.33],
        [0.67, 'note', 60, 0.1, 0.33]
    ]));
    // Second and third only
    matches(detectRhythm(0, 4, [
        [0.33, 'note', 60, 0.1, 0.33],
        [0.67, 'note', 60, 0.1, 0.33]
    ]));
    // First two only
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.33],
        [0.33, 'note', 60, 0.1, 0.33]
    ]));
    // Second note only
    matches(detectRhythm(0, 4, [
        [0.33, 'note', 60, 0.1, 0.33]
    ]));
    // Slightly loose timing
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.33],
        [0.33, 'note', 60, 0.1, 0.33],
        [0.7,  'note', 60, 0.1, 0.3]
    ]));
    // Human performance timing
    matches(detectRhythm(0, 4, [
        [0.04, 'note', 60, 0.1, 0.2],
        [0.32, 'note', 60, 0.1, 0.33],
        [0.7,  'note', 60, 0.1, 0.3]
    ]));
    // Quarter note triplets, first two
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.67],
        [0.67, 'note', 60, 0.1, 0.67]
    ]));
    // Quarter note triplets across bars
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.67],
        [0.67, 'note', 60, 0.1, 0.67],
        [1.33, 'note', 60, 0.1, 0.67]
    ]));
    // Quarter note triplets, second and third
    matches(detectRhythm(0, 4, [
        [0.67, 'note', 60, 0.1, 0.67],
        [1.33, 'note', 60, 0.1, 0.67]
    ]));
    // Quarter note triplets, third only
    matches(detectRhythm(0, 4, [
        [1.33, 'note', 60, 0.1, 0.67]
    ]));

    matches(detectRhythm(0, 4, [
        [1.33, 'note', 60, 0.1, 0.67]
    ], 0, { maxDivision: 1 }));

    // Triplets followed by duplets, should only detect the triplets up to duration 1
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.33],
        [0.33, 'note', 60, 0.1, 0.33],
        [0.67, 'note', 60, 0.1, 0.33],
        [1,    'note', 60, 0.1, 0.5],
        [1.5,  'note', 60, 0.1, 0.5]
    ]));
    // Triplets are allowed to have holes
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.33],
        [0.67, 'note', 60, 0.1, 0.33],
        [1,    'note', 60, 0.1, 0.5],
        [1.5,  'note', 60, 0.1, 0.5]
    ]));
    //
    matches(detectRhythm(0, 4, [
        [0.67, 'note', 60, 0.1, 0.33],
        [1,    'note', 60, 0.1, 0.5],
        [1.5,  'note', 60, 0.1, 0.5]
    ]));
    //
    matches(detectRhythm(0, 4, [
        [0.67, 'note', 60, 0.1, 0.33],
        [1.5,  'note', 60, 0.1, 0.5]
    ]));

    done();
});

/*
run('Quadruplets', [
    { beat: 0, duration: 0.5, divisor: 2, rhythm: 3 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 7 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 15 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 14 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 13 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 11 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 7 },
    { beat: 0.5, duration: 0.5, divisor: 2, rhythm: 3 },
//    { beat: 0, duration: 1, divisor: 4, rhythm: 9 },
    { beat: 1, duration: 0.5, divisor: 2, rhythm: 3 },
    { beat: 1, duration: 1, divisor: 4, rhythm: 6 },
    { beat: 1, duration: 1, divisor: 4, rhythm: 10 },

//    { beat: 0, duration: 1, divisor: 4, rhythm: 2 },
//    { beat: 0, duration: 1, divisor: 4, rhythm: 8 },
    { beat: 0, duration: 1, divisor: 4, rhythm: 15 }
], ({ equals, matches }, done) => {
    // First two
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25]
    ]));
    // First three
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25]
    ]));
    // All four
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));
    // Last three
    matches(detectRhythm(0, 4, [
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));
    // First, third, fourth
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));
    // First, second, fourth
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));
    // First three only
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.25],
        [0.25, 'note', 60, 0.1, 0.25],
        [0.5,  'note', 60, 0.1, 0.25]
    ]));
    // Third and fourth
    matches(detectRhythm(0, 4, [
        [0.5,  'note', 60, 0.1, 0.25],
        [0.75, 'note', 60, 0.1, 0.25]
    ]));

 //   // First and fourth
 //   matches(detectRhythm(0, 4, [
 //       [0,    'note', 60, 0.1, 0.25],
 //       [0.75, 'note', 60, 0.1, 0.25]
 //   ]));
    // First two only
    matches(detectRhythm(0, 4, [
        [1,    'note', 60, 0.1, 0.25],
        [1.25, 'note', 60, 0.1, 0.25]
    ]));
    // Second and third
    matches(detectRhythm(0, 4, [
        [1.25, 'note', 60, 0.1, 0.25],
        [1.5,  'note', 60, 0.1, 0.25]
    ]));
    // Second and fourth
    matches(detectRhythm(0, 4, [
        [1.25, 'note', 60, 0.1, 0.25],
        [1.75, 'note', 60, 0.1, 0.25]
    ]));



 //   // Second only
 //   matches(detectRhythm(0, 4, [
 //       [0.25, 'note', 60, 0.1, 0.25]
 //   ]));
//
 //   // Fourth only
 //   matches(detectRhythm(0, 4, [
 //       [0.75, 'note', 60, 0.1, 0.25]
 //   ]));



    // Human performance timing
    matches(detectRhythm(0, 4, [
        [0.04, 'note', 60, 0.1, 0.25],
        [0.26, 'note', 60, 0.1, 0.23],
        [0.52, 'note', 60, 0.1, 0.18],
        [0.74, 'note', 60, 0.1, 0.3]
    ]));

    done();
});
*/

run('Quintuplets', [
//    { beat: 0, duration: 1, divisor: 5, rhythm: 3 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 7 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 15 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 31 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 31 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 30 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 29 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 27 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 23 },
    { beat: 0, duration: 1, divisor: 5, rhythm: 15 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 28 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 25 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 19 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 7 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 14 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 24 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 17 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 3 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 6 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 12 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 2 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 4 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 8 },
//    { beat: 0, duration: 1, divisor: 5, rhythm: 16 }
], ({ equals, matches }, done) => {
//    // First two
//    matches(detectRhythm(0, 4, [
//        [0,   'note', 60, 0.1, 0.2],
//        [1/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // First three
//    matches(detectRhythm(0, 4, [
//        [0,   'note', 60, 0.1, 0.2],
//        [1/5, 'note', 60, 0.1, 0.2],
//        [2/5, 'note', 60, 0.1, 0.2]
//    ]));
    // First four
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ]));
    // All five
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));
    // All five - humanised
    matches(detectRhythm(0, 4, [
        [0.02,   'note', 60, 0.1, 0.2],
        [1/5 + 0.02, 'note', 60, 0.1, 0.2],
        [2/5 + 0.02, 'note', 60, 0.1, 0.2],
        [3/5 + 0.02, 'note', 60, 0.1, 0.2],
        [4/5 + 0.02, 'note', 60, 0.1, 0.2]
    ]));
    // Last four
    matches(detectRhythm(0, 4, [
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));
    // Skip second
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));
    // Skip third
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));
    // Skip fourth
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [4/5, 'note', 60, 0.1, 0.2]
    ]));
    // Skip fifth
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 0.2],
        [1/5, 'note', 60, 0.1, 0.2],
        [2/5, 'note', 60, 0.1, 0.2],
        [3/5, 'note', 60, 0.1, 0.2]
    ]));

//    // 3rd through 5th
//    matches(detectRhythm(0, 4, [
//        [2/5, 'note', 60, 0.1, 0.2],
//        [3/5, 'note', 60, 0.1, 0.2],
//        [4/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 1st and 4th-5th
//    matches(detectRhythm(0, 4, [
//        [0,   'note', 60, 0.1, 0.2],
//        [3/5, 'note', 60, 0.1, 0.2],
//        [4/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 1st-2nd and 5th
//    matches(detectRhythm(0, 4, [
//        [0,   'note', 60, 0.1, 0.2],
//        [1/5, 'note', 60, 0.1, 0.2],
//        [4/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 1st through 3rd
//    matches(detectRhythm(0, 4, [
//        [0,   'note', 60, 0.1, 0.2],
//        [1/5, 'note', 60, 0.1, 0.2],
//        [2/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 2nd through 4th
//    matches(detectRhythm(0, 4, [
//        [1/5, 'note', 60, 0.1, 0.2],
//        [2/5, 'note', 60, 0.1, 0.2],
//        [3/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 4th and 5th
//    matches(detectRhythm(0, 4, [
//        [3/5, 'note', 60, 0.1, 0.2],
//        [4/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 1st and 5th
//    matches(detectRhythm(0, 4, [
//        [0,   'note', 60, 0.1, 0.2],
//        [4/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 1st and 2nd
//    matches(detectRhythm(0, 4, [
//        [0,   'note', 60, 0.1, 0.2],
//        [1/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 2nd and 3rd
//    matches(detectRhythm(0, 4, [
//        [1/5, 'note', 60, 0.1, 0.2],
//        [2/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 3rd and 4th
//    matches(detectRhythm(0, 4, [
//        [2/5, 'note', 60, 0.1, 0.2],
//        [3/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 2nd only
//    matches(detectRhythm(0, 4, [
//        [1/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 3rd only
//    matches(detectRhythm(0, 4, [
//        [2/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 4th only
//    matches(detectRhythm(0, 4, [
//        [3/5, 'note', 60, 0.1, 0.2]
//    ]));
//
//    // 5th only
//    matches(detectRhythm(0, 4, [
//        [4/5, 'note', 60, 0.1, 0.2]
//    ]));

    done();
});

run('Sextuplets', [
    { beat: 0,   duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 0,   duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 0,   duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 1,   duration: 2, divisor: 6,  rhythm: 63 },
    { beat: 1,   duration: 2, divisor: 6,  rhythm: 63 }
], ({ equals, matches }, done) => {
    // However, if it's sextuplets - no holes - it should know it's sextuplets
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.33],
        [0.33, 'note', 60, 0.1, 0.33],
        [0.67, 'note', 60, 0.1, 0.33],
        [1,    'note', 60, 0.1, 0.33],
        [1.33, 'note', 60, 0.1, 0.33],
        [1.67, 'note', 60, 0.1, 0.33]
    ]));
    // But if the sextuplets are followed by another note, duration should only be 2,
    // up to the end of the sextuplets
    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.33],
        [0.33, 'note', 60, 0.1, 0.33],
        [0.67, 'note', 60, 0.1, 0.33],
        [1,    'note', 60, 0.1, 0.33],
        [1.33, 'note', 60, 0.1, 0.33],
        [1.67, 'note', 60, 0.1, 0.33],
        [2,    'note', 60, 0.1, 1]
    ]));

    matches(detectRhythm(0, 4, [
        [0,    'note', 60, 0.1, 0.33],
        [0.33, 'note', 60, 0.1, 0.33],
        [0.67, 'note', 60, 0.1, 0.33],
        [1,    'note', 60, 0.1, 0.33],
        [1.33, 'note', 60, 0.1, 0.33],
        [1.67, 'note', 60, 0.1, 0.33],
        [3,    'note', 60, 0.1, 1]
    ]));
    // These groups start on beat 1, but the same logic applies
    matches(detectRhythm(0, 4, [
        [1,    'note', 60, 0.1, 0.33],
        [1.33, 'note', 60, 0.1, 0.33],
        [1.67, 'note', 60, 0.1, 0.33],
        [2,    'note', 60, 0.1, 0.33],
        [2.33, 'note', 60, 0.1, 0.33],
        [2.67, 'note', 60, 0.1, 0.33]
    ]));

    matches(detectRhythm(0, 4, [
        [1,    'note', 60, 0.1, 0.33],
        [1.33, 'note', 60, 0.1, 0.33],
        [1.67, 'note', 60, 0.1, 0.33],
        [2,    'note', 60, 0.1, 0.33],
        [2.33, 'note', 60, 0.1, 0.33],
        [2.67, 'note', 60, 0.1, 0.33],
        [3,    'note', 60, 0.1, 1]
    ]));

    done();
});

run('Septuplets', [
//    { beat: 0, duration: 1, divisor: 7, rhythm: 3 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 7 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 15 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 31 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 63 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 127 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 126 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 125 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 123 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 119 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 111 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 95 },
    { beat: 0, duration: 1, divisor: 7, rhythm: 63 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 124 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 121 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 115 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 103 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 79 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 31 },
//    { beat: 0, duration: 1, divisor: 7, rhythm: 62 }
], ({ equals, matches }, done) => {

//    // First two
//    matches(detectRhythm(0, 4, [
 //       [0,   'note', 60, 0.1, 1/7],
 //       [1/7, 'note', 60, 0.1, 1/7]
 //   ]));
//
//    // First three
//    matches(detectRhythm(0, 4, [
 //       [0,   'note', 60, 0.1, 1/7],
//        [1/7, 'note', 60, 0.1, 1/7],
 //       [2/7, 'note', 60, 0.1, 1/7]
 //   ]));
//
//    // First four
//    matches(detectRhythm(0, 4, [
 //       [0,   'note', 60, 0.1, 1/7],
//        [1/7, 'note', 60, 0.1, 1/7],
 //       [2/7, 'note', 60, 0.1, 1/7],
 //       [3/7, 'note', 60, 0.1, 1/7]
 //   ]));
//
//    // First five
//    matches(detectRhythm(0, 4, [
 //       [0,   'note', 60, 0.1, 1/7],
//        [1/7, 'note', 60, 0.1, 1/7],
 //       [2/7, 'note', 60, 0.1, 1/7],
 //       [3/7, 'note', 60, 0.1, 1/7],
 //       [4/7, 'note', 60, 0.1, 1/7]
 //   ]));
    // First six
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7]
    ]));
    // All seven
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));
    // Last six
    matches(detectRhythm(0, 4, [
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));
    // Skip 2nd
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));
    // Skip 3rd
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));
    // Skip 4th
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));
    // Skip 5th
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));
    // Skip 6th
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [6/7, 'note', 60, 0.1, 1/7]
    ]));
    // Skip 7th
    matches(detectRhythm(0, 4, [
        [0,   'note', 60, 0.1, 1/7],
        [1/7, 'note', 60, 0.1, 1/7],
        [2/7, 'note', 60, 0.1, 1/7],
        [3/7, 'note', 60, 0.1, 1/7],
        [4/7, 'note', 60, 0.1, 1/7],
        [5/7, 'note', 60, 0.1, 1/7]
    ]));

//    // 3rd through 7th
//    matches(detectRhythm(0, 4, [
//       [2/7, 'note', 60, 0.1, 1/7],
//        [3/7, 'note', 60, 0.1, 1/7],
//       [4/7, 'note', 60, 0.1, 1/7],
//       [5/7, 'note', 60, 0.1, 1/7],
//       [6/7, 'note', 60, 0.1, 1/7]
//   ]));
//
//    // 1st and 4th through 7th
//    matches(detectRhythm(0, 4, [
//       [0,   'note', 60, 0.1, 1/7],
//        [3/7, 'note', 60, 0.1, 1/7],
//       [4/7, 'note', 60, 0.1, 1/7],
//       [5/7, 'note', 60, 0.1, 1/7],
//       [6/7, 'note', 60, 0.1, 1/7]
//   ]));
//
//    // 1st-2nd and 5th through 7th
//   matches(detectRhythm(0, 4, [
//       [0,   'note', 60, 0.1, 1/7],
//        [1/7, 'note', 60, 0.1, 1/7],
//       [4/7, 'note', 60, 0.1, 1/7],
//       [5/7, 'note', 60, 0.1, 1/7],
//       [6/7, 'note', 60, 0.1, 1/7]
//   ]));
//
//    // 1st-3rd and 6th-7th
//    matches(detectRhythm(0, 4, [
//       [0,   'note', 60, 0.1, 1/7],
//        [1/7, 'note', 60, 0.1, 1/7],
//       [2/7, 'note', 60, 0.1, 1/7],
//       [5/7, 'note', 60, 0.1, 1/7],
//       [6/7, 'note', 60, 0.1, 1/7]
//   ]));
//
//    // 1st-4th and 7th
//    matches(detectRhythm(0, 4, [
//       [0,   'note', 60, 0.1, 1/7],
//        [1/7, 'note', 60, 0.1, 1/7],
//       [2/7, 'note', 60, 0.1, 1/7],
//       [3/7, 'note', 60, 0.1, 1/7],
//       [6/7, 'note', 60, 0.1, 1/7]
//   ]));
//
//    // 1st through 5th
//    matches(detectRhythm(0, 4, [
//       [0,   'note', 60, 0.1, 1/7],
//       [1/7, 'note', 60, 0.1, 1/7],
//       [2/7, 'note', 60, 0.1, 1/7],
//       [3/7, 'note', 60, 0.1, 1/7],
//       [4/7, 'note', 60, 0.1, 1/7]
//   ]));
//
//   // 2nd through 6th
//   matches(detectRhythm(0, 4, [
//       [1/7, 'note', 60, 0.1, 1/7],
//       [2/7, 'note', 60, 0.1, 1/7],
//       [3/7, 'note', 60, 0.1, 1/7],
//       [4/7, 'note', 60, 0.1, 1/7],
//       [5/7, 'note', 60, 0.1, 1/7]
//   ]));

    done();
});
/**/
