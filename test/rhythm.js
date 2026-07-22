
import {
    assert,
    assertEquals as equals,
    assertStrictEquals as is,
    assertObjectMatch as matches
} from 'jsr:@std/assert@1';

import detect from '../modules/detect-rhythm.js';


Deno.test('Duplets', () => {
    matches(detect(0, 4, [[0],      [1/4], [3/8]]),        [{ beat: 0,   duration: 1/4, divisor: 2, rhythm: 1, index: 0, count: 1 }, { beat: 0.25, duration: 0.25, divisor: 2, rhythm: 3, index: 1, count: 2 }]);
    //matches(detect(0, 4, [[0], [0], [1/4], [3/8]]),        { beat: 0,   duration: 1/4, divisor: 2, rhythm: 1, index: 0, count: 2 });
    matches(detect(0, 4, [          [1/8]]),               [{ beat: 0,   duration: 1/4, divisor: 2, rhythm: 2, index: 0, count: 1 }]);
    matches(detect(0, 4, [[0],      [1/8]]),               [{ beat: 0,   duration: 1/4, divisor: 2, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 4, [[0], [0], [1/8]]),               [{ beat: 0,   duration: 1/4, divisor: 2, rhythm: 3, index: 0, count: 3 }]);
    matches(detect(0, 4, [          [1/4], [3/8]]),        [{ beat: 1/4, duration: 1/4, divisor: 2, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 4, [          [1/4], [3/8], [3/8]]), [{ beat: 1/4, duration: 1/4, divisor: 2, rhythm: 3, index: 0, count: 3 }]);
    //matches(detect(0, 4, [[0],      [1/2], [3/4]]),        { beat: 0,   duration: 1/2, divisor: 2, rhythm: 1, index: 0, count: 1 });
    //matches(detect(0, 4, [[0], [0], [1/2], [3/4]]),        { beat: 0,   duration: 1/2, divisor: 2, rhythm: 1, index: 0, count: 2 });
    matches(detect(0, 4, [          [1/4]]),               [{ beat: 0,   duration: 1/2, divisor: 2, rhythm: 2, index: 0, count: 1 }]);
    matches(detect(0, 4, [[0],      [1/4]]),               [{ beat: 0,   duration: 1/2, divisor: 2, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 4, [[0], [0], [1/4]]),               [{ beat: 0,   duration: 1/2, divisor: 2, rhythm: 3, index: 0, count: 3 }]);
    matches(detect(0, 4, [          [1/2], [3/4]]),        [{ beat: 1/2, duration: 1/2, divisor: 2, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 4, [          [1/2], [3/4], [3/4]]), [{ beat: 1/2, duration: 1/2, divisor: 2, rhythm: 3, index: 0, count: 3 }]);
    //matches(detect(0, 4, [[0],      [1],   [3/2]]),        { beat: 0,   duration: 1,   divisor: 2, rhythm: 1, index: 0, count: 1 });
    //matches(detect(0, 4, [[0], [0], [1],   [3/2]]),        { beat: 0,   duration: 1,   divisor: 2, rhythm: 1, index: 0, count: 2 });
    matches(detect(0, 4, [          [1/2]]),               [{ beat: 0,   duration: 1,   divisor: 2, rhythm: 2, index: 0, count: 1 }]);
    matches(detect(0, 4, [[0],      [1/2]]),               [{ beat: 0,   duration: 1,   divisor: 2, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 4, [[0], [0], [1/2]]),               [{ beat: 0,   duration: 1,   divisor: 2, rhythm: 3, index: 0, count: 3 }]);
    matches(detect(0, 4, [          [1],   [3/2]]),        [{ beat: 1,   duration: 1,   divisor: 2, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 4, [          [1],   [3/2], [3/2]]), [{ beat: 1,   duration: 1,   divisor: 2, rhythm: 3, index: 0, count: 3 }]);
    //matches(detect(0, 4, [[0],      [2],   [3]]),          { beat: 0,   duration: 2,   divisor: 2, rhythm: 1, index: 0, count: 1 });
    //matches(detect(0, 4, [[0], [0], [2],   [3]]),          { beat: 0,   duration: 2,   divisor: 2, rhythm: 1, index: 0, count: 2 });
    matches(detect(0, 4, [          [1]]),                 [{ beat: 0,   duration: 2,   divisor: 2, rhythm: 2, index: 0, count: 1 }]);
    matches(detect(0, 4, [[0],      [1]]),                 [{ beat: 0,   duration: 2,   divisor: 2, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 4, [[0], [0], [1]]),                 [{ beat: 0,   duration: 2,   divisor: 2, rhythm: 3, index: 0, count: 3 }]);
    matches(detect(0, 4, [          [2],   [3]]),          [{ beat: 2,   duration: 2,   divisor: 2, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 4, [          [2],   [3],   [3]]),   [{ beat: 2,   duration: 2,   divisor: 2, rhythm: 3, index: 0, count: 3 }]);
    matches(detect(0, 4, [[0]]),                           [{ beat: 0,   duration: 4,   divisor: 2, rhythm: 1, index: 0, count: 1 }]);
    matches(detect(0, 4, [          [2]]),                 [{ beat: 0,   duration: 4,   divisor: 2, rhythm: 2, index: 0, count: 1 }]);
    matches(detect(0, 4, [[0],      [2]]),                 [{ beat: 0,   duration: 4,   divisor: 2, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 4, [[0], [0], [2]]),                 [{ beat: 0,   duration: 4,   divisor: 2, rhythm: 3, index: 0, count: 3 }]);
});

Deno.test('Triplets', () => {
    matches(detect(0, 5, [          [1/12]]),                                [{ beat: 0,   duration: 1/4, divisor: 3, rhythm: 2, index: 0, count: 1 }]);
    matches(detect(0, 5, [[0],      [1/12]]),                                [{ beat: 0,   duration: 1/4, divisor: 3, rhythm: 3, index: 0, count: 2 }]);
    matches(detect(0, 5, [                        [2/12]]),                  [{ beat: 0,   duration: 1/4, divisor: 3, rhythm: 4, index: 0, count: 1 }]); // Potentially ambiguous
    matches(detect(0, 5, [                        [2/12],           [1/4]]), [{ beat: 0,   duration: 1/4, divisor: 3, rhythm: 4, index: 0, count: 1 }, { beat: 1/4,   duration: 1/4, divisor: 2, rhythm: 1, index: 1, count: 1 }]);
    matches(detect(0, 5, [[0],                    [2/12]]),                  [{ beat: 0,   duration: 1/4, divisor: 3, rhythm: 5, index: 0, count: 2 }]); // Potentially ambiguous
    matches(detect(0, 5, [[0],                    [2/12],           [1/4]]), [{ beat: 0,   duration: 1/4, divisor: 3, rhythm: 5, index: 0, count: 2 }, { beat: 1/4,   duration: 1/4, divisor: 2, rhythm: 1, index: 2, count: 1 }]);
    matches(detect(0, 5, [          [1/12],       [2/12]]),                  [{ beat: 0,   duration: 1/4, divisor: 3, rhythm: 6, index: 0, count: 2 }]);
    matches(detect(0, 5, [[0],      [1/12],       [2/12]]),                  [{ beat: 0,   duration: 1/4, divisor: 3, rhythm: 7, index: 0, count: 3 }]);
//    matches(detect(0, 4, [          [1/6]]),                                 { beat: 0,   duration: 1/2, divisor: 3, rhythm: 2, index: 0, count: 1 }); // Already tested above
//    matches(detect(0, 4, [[0],      [1/6]]),                                 { beat: 0,   duration: 1/2, divisor: 3, rhythm: 3, index: 0, count: 2 }); // Already tested above
    matches(detect(0, 5, [                        [2/6]]),                   [{ beat: 0,   duration: 1/2, divisor: 3, rhythm: 4, index: 0, count: 1 }]); // Potentially ambiguous
    matches(detect(0, 5, [                        [2/6],           [1/2]]),  [{ beat: 0,   duration: 1/2, divisor: 3, rhythm: 4, index: 0, count: 1 }, { beat: 1/2,   duration: 1/2, divisor: 2, rhythm: 1, index: 1, count: 1 }]);
    matches(detect(0, 5, [[0],                    [2/6]]),                   [{ beat: 0,   duration: 1/2, divisor: 3, rhythm: 5, index: 0, count: 2 }]); // Potentially ambiguous
    matches(detect(0, 5, [[0],                    [2/6],           [1/2]]),  [{ beat: 0,   duration: 1/2, divisor: 3, rhythm: 5, index: 0, count: 2 }, { beat: 1/2,   duration: 1/2, divisor: 2, rhythm: 1, index: 2, count: 1 }]);
    matches(detect(0, 5, [          [1/6],        [2/6]]),                   [{ beat: 0,   duration: 1/2, divisor: 3, rhythm: 6, index: 0, count: 2 }]);
    matches(detect(0, 5, [[0],      [1/6],        [2/6]]),                   [{ beat: 0,   duration: 1/2, divisor: 3, rhythm: 7, index: 0, count: 3 }]);
//    matches(detect(0, 4, [          [1/3]]),                                 { beat: 0,   duration: 1, divisor: 3, rhythm: 2, index: 0, count: 1 }); // Already tested above
//    matches(detect(0, 4, [[0],      [1/3]]),                                 { beat: 0,   duration: 1, divisor: 3, rhythm: 3, index: 0, count: 2 }); // Already tested above
    matches(detect(0, 5, [                        [2/3]]),                   [{ beat: 0,   duration: 1, divisor: 3, rhythm: 4, index: 0, count: 1 }]); // Potentially ambiguous
    matches(detect(0, 5, [                        [2/3],           [1]]),    [{ beat: 0,   duration: 1, divisor: 3, rhythm: 4, index: 0, count: 1 }, { beat: 1,   duration: 1, divisor: 2, rhythm: 1, index: 1, count: 1 }]);
    matches(detect(0, 5, [[0],                    [2/3]]),                   [{ beat: 0,   duration: 1, divisor: 3, rhythm: 5, index: 0, count: 2 }]); // Potentially ambiguous
    matches(detect(0, 5, [[0],                    [2/3],           [1]]),    [{ beat: 0,   duration: 1, divisor: 3, rhythm: 5, index: 0, count: 2 }, { beat: 1,   duration: 1, divisor: 2, rhythm: 1, index: 2, count: 1 }]);
    matches(detect(0, 5, [          [1/3],        [2/3]]),                   [{ beat: 0,   duration: 1, divisor: 3, rhythm: 6, index: 0, count: 2 }]);
    matches(detect(0, 5, [[0],      [1/3],        [2/3]]),                   [{ beat: 0,   duration: 1, divisor: 3, rhythm: 7, index: 0, count: 3 }]);
//    matches(detect(0, 4, [          [2/3]]),                                 { beat: 0,   duration: 2, divisor: 3, rhythm: 2, index: 0, count: 1 }); // Already tested above
//    matches(detect(0, 4, [[0],      [2/3]]),                                 { beat: 0,   duration: 2, divisor: 3, rhythm: 3, index: 0, count: 2 }); // Already tested above
    matches(detect(0, 5, [                        [4/3]]),                   [{ beat: 0,   duration: 2, divisor: 3, rhythm: 4, index: 0, count: 1 }]); // Potentially ambiguous
    matches(detect(0, 5, [                        [4/3],           [2]]),    [{ beat: 0,   duration: 2, divisor: 3, rhythm: 4, index: 0, count: 1 }, { beat: 2,   duration: 2, divisor: 2, rhythm: 1, index: 1, count: 1 }]);
    matches(detect(0, 5, [[0],                    [4/3]]),                   [{ beat: 0,   duration: 2, divisor: 3, rhythm: 5, index: 0, count: 2 }]); // Potentially ambiguous
    matches(detect(0, 5, [[0],                    [4/3],           [2]]),    [{ beat: 0,   duration: 2, divisor: 3, rhythm: 5, index: 0, count: 2 }, { beat: 2,   duration: 2, divisor: 2, rhythm: 1, index: 2, count: 1 }]);
    matches(detect(0, 5, [          [2/3],        [4/3]]),                   [{ beat: 0,   duration: 2, divisor: 3, rhythm: 6, index: 0, count: 2 }]);
    matches(detect(0, 5, [[0],      [2/3],        [4/3]]),                   [{ beat: 0,   duration: 2, divisor: 3, rhythm: 7, index: 0, count: 3 }]);
//    matches(detect(0, 4, [          [4/3]]),                                 { beat: 0,   duration: 4, divisor: 3, rhythm: 2, index: 0, count: 1 }); // Already tested above
//    matches(detect(0, 4, [[0],      [4/3]]),                                 { beat: 0,   duration: 4, divisor: 3, rhythm: 3, index: 0, count: 2 }); // Already tested above
    matches(detect(0, 5, [                        [8/3]]),                   [{ beat: 0,   duration: 4, divisor: 3, rhythm: 4, index: 0, count: 1 }]); // Potentially ambiguous
    matches(detect(0, 5, [                        [8/3],           [4]]),    [{ beat: 0,   duration: 4, divisor: 3, rhythm: 4, index: 0, count: 1 }, { beat: 4,   duration: 1, divisor: 2, rhythm: 1, index: 1, count: 1 }]);
    matches(detect(0, 5, [[0],                    [8/3]]),                   [{ beat: 0,   duration: 4, divisor: 3, rhythm: 5, index: 0, count: 2 }]); // Potentially ambiguous
    matches(detect(0, 5, [[0],                    [8/3],           [4]]),    [{ beat: 0,   duration: 4, divisor: 3, rhythm: 5, index: 0, count: 2 }, { beat: 4,   duration: 1, divisor: 2, rhythm: 1, index: 2, count: 1 }]);
    matches(detect(0, 5, [          [4/3],        [8/3]]),                   [{ beat: 0,   duration: 4, divisor: 3, rhythm: 6, index: 0, count: 2 }]);
    matches(detect(0, 5, [[0],      [4/3],        [8/3]]),                   [{ beat: 0,   duration: 4, divisor: 3, rhythm: 7, index: 0, count: 3 }]);
});

Deno.test('Quintuplets', () => {
    matches(detect(0, 6, [[0],    [1/10], [2/10]]),                          [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 7,  index: 0, count: 3 }]);
    matches(detect(0, 6, [        [1/10], [2/10], [3/10]]),                  [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 14, index: 0, count: 3 }]);
//    matches(detect(0, 6, [[0],            [2/10],         [4/10]]),          [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 21, index: 0, count: 3 }]); // Ambiguous
    matches(detect(0, 6, [[0],            [2/10],         [4/10], [1/2]]),   [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 21, index: 0, count: 3 }, {}]);
    matches(detect(0, 6, [[0],    [1/10], [2/10],         [4/10]]),          [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 23, index: 0, count: 4 }]);
    matches(detect(0, 6, [[0],    [1/10], [2/10],         [4/10], [1/2]]),   [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 23, index: 0, count: 4 }, {}]);
    matches(detect(0, 6, [                [2/10], [3/10], [4/10]]),          [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 28, index: 0, count: 3 }]);
    matches(detect(0, 6, [[0],            [2/10], [3/10], [4/10]]),          [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 29, index: 0, count: 4 }]);
    matches(detect(0, 6, [[0],            [2/10], [3/10], [4/10], [1/2]]),   [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 29, index: 0, count: 4 }, {}]);
    matches(detect(0, 6, [[0],    [1/10], [2/10], [3/10], [4/10]]),          [{ beat: 0,   duration: 1/2, divisor: 5, rhythm: 31, index: 0, count: 5 }]);

    matches(detect(0, 6, [[0],    [1/5],  [2/5]]),                           [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 7,  index: 0, count: 3 }]);
    matches(detect(0, 6, [        [1/5],  [2/5],  [3/5]]),                   [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 14, index: 0, count: 3 }]);
//    matches(detect(0, 6, [[0],            [2/5],         [4/5]]),          [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 21, index: 0, count: 3 }]); // Ambiguous
    matches(detect(0, 6, [[0],            [2/5],          [4/5],  [1]]),     [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 21, index: 0, count: 3 }, {}]);
    matches(detect(0, 6, [[0],    [1/5],  [2/5],          [4/5]]),           [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 23, index: 0, count: 4 }]);
    matches(detect(0, 6, [[0],    [1/5],  [2/5],          [4/5],  [1]]),     [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 23, index: 0, count: 4 }, {}]);
    matches(detect(0, 6, [                [2/5],  [3/5],  [4/5]]),           [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 28, index: 0, count: 3 }]);
    matches(detect(0, 6, [[0],            [2/5],  [3/5],  [4/5]]),           [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 29, index: 0, count: 4 }]);
    matches(detect(0, 6, [[0],            [2/5],  [3/5],  [4/5],  [1]]),     [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 29, index: 0, count: 4 }, {}]);
    matches(detect(0, 6, [[0],    [1/5],  [2/5],  [3/5],  [4/5]]),           [{ beat: 0,   duration: 1,   divisor: 5, rhythm: 31, index: 0, count: 5 }]);

    matches(detect(0, 6, [[0],    [2/5],  [4/5]]),                           [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 7,  index: 0, count: 3 }]);
    matches(detect(0, 6, [        [2/5],  [4/5],  [6/5]]),                   [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 14, index: 0, count: 3 }]);
//    matches(detect(0, 6, [[0],            [4/5],         [8/5]]),          [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 21, index: 0, count: 3 }]); // Ambiguous
    matches(detect(0, 6, [[0],            [4/5],          [8/5],  [2]]),     [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 21, index: 0, count: 3 }, {}]);
    matches(detect(0, 6, [[0],    [2/5],  [4/5],          [8/5]]),           [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 23, index: 0, count: 4 }]);
    matches(detect(0, 6, [[0],    [2/5],  [4/5],          [8/5],  [2]]),     [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 23, index: 0, count: 4 }, {}]);
    matches(detect(0, 6, [                [4/5],  [6/5],  [8/5]]),           [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 28, index: 0, count: 3 }]);
    matches(detect(0, 6, [[0],            [4/5],  [6/5],  [8/5]]),           [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 29, index: 0, count: 4 }]);
    matches(detect(0, 6, [[0],            [4/5],  [6/5],  [8/5],  [2]]),     [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 29, index: 0, count: 4 }, {}]);
    matches(detect(0, 6, [[0],    [2/5],  [4/5],  [6/5],  [8/5]]),           [{ beat: 0,   duration: 2,   divisor: 5, rhythm: 31, index: 0, count: 5 }]);

    matches(detect(0, 6, [[0],    [4/5],  [8/5]]),                           [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 7,  index: 0, count: 3 }]);
    matches(detect(0, 6, [        [4/5],  [8/5],  [12/5]]),                  [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 14, index: 0, count: 3 }]);
//    matches(detect(0, 4, [[0],            [8/5],         [16/5]]),         [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 21, index: 0, count: 3 }]); // Ambiguous
    matches(detect(0, 6, [[0],            [8/5],           [16/5],  [4]]),   [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 21, index: 0, count: 3 }, {}]);
    matches(detect(0, 6, [[0],    [4/5],  [8/5],           [16/5]]),         [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 23, index: 0, count: 4 }]);
    matches(detect(0, 6, [[0],    [4/5],  [8/5],           [16/5],  [4]]),   [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 23, index: 0, count: 4 }, {}]);
    matches(detect(0, 6, [                [8/5],  [12/5],  [16/5]]),         [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 28, index: 0, count: 3 }]);
    matches(detect(0, 6, [[0],            [8/5],  [12/5],  [16/5]]),         [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 29, index: 0, count: 4 }]);
    matches(detect(0, 6, [[0],            [8/5],  [12/5],  [16/5],  [4]]),   [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 29, index: 0, count: 4 }, {}]);
    matches(detect(0, 6, [[0],    [4/5],  [8/5],  [12/5],  [16/5]]),         [{ beat: 0,   duration: 4,   divisor: 5, rhythm: 31, index: 0, count: 5 }]);
});

Deno.test('Septuplets', () => {
    matches(detect(0, 5, [[0],    [1/7],  [2/7],  [3/7],  [4/7]]),                 [{ beat: 0,   duration: 1, divisor: 7, rhythm: 31,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],  [3/7],          [5/7]]),         [{ beat: 0,   duration: 1, divisor: 7, rhythm: 47,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],          [4/7],  [5/7]]),         [{ beat: 0,   duration: 1, divisor: 7, rhythm: 55,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],          [3/7],  [4/7],  [5/7]]),         [{ beat: 0,   duration: 1, divisor: 7, rhythm: 59,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [2/7],  [3/7],  [4/7],  [5/7]]),         [{ beat: 0,   duration: 1, divisor: 7, rhythm: 61,  index: 0, count: 5 }]);
    matches(detect(0, 5, [        [1/7],  [2/7],  [3/7],  [4/7],  [5/7]]),         [{ beat: 0,   duration: 1, divisor: 7, rhythm: 62,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],  [3/7],  [4/7],  [5/7]]),         [{ beat: 0,   duration: 1, divisor: 7, rhythm: 63,  index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],  [3/7],                  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 79,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],          [4/7],          [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 87,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],          [3/7],  [4/7],          [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 91,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [2/7],  [3/7],  [4/7],          [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 93,  index: 0, count: 5 }]);
    matches(detect(0, 5, [        [1/7],  [2/7],  [3/7],  [4/7],          [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 94,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],  [3/7],  [4/7],          [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 95,  index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],                  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 103, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],          [3/7],          [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 107, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [2/7],  [3/7],          [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 109, index: 0, count: 5 }]);
    matches(detect(0, 5, [        [1/7],  [2/7],  [3/7],          [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 110, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],  [3/7],          [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 111, index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [1/7],                  [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 115, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [2/7],          [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 117, index: 0, count: 5 }]);
    matches(detect(0, 5, [        [1/7],  [2/7],          [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 118, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],          [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 119, index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],                    [3/7],  [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 121, index: 0, count: 5 }]);
    matches(detect(0, 5, [        [1/7],          [3/7],  [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 122, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [1/7],          [3/7],  [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 123, index: 0, count: 6 }]);
    matches(detect(0, 5, [                [2/7],  [3/7],  [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 124, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [2/7],  [3/7],  [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 125, index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [1/7],  [2/7],  [3/7],  [4/7],  [5/7],  [6/7]]), [{ beat: 0,   duration: 1, divisor: 7, rhythm: 127, index: 0, count: 7 }]);

    matches(detect(0, 5, [[0],    [2/7],  [4/7],  [6/7],  [8/7]]),                 [{ beat: 0,   duration: 2, divisor: 7, rhythm: 31,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],  [6/7],          [10/7]]),        [{ beat: 0,   duration: 2, divisor: 7, rhythm: 47,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],          [8/7],  [10/7]]),        [{ beat: 0,   duration: 2, divisor: 7, rhythm: 55,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],          [6/7],  [8/7],  [10/7]]),        [{ beat: 0,   duration: 2, divisor: 7, rhythm: 59,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [4/7],  [6/7],  [8/7],  [10/7]]),        [{ beat: 0,   duration: 2, divisor: 7, rhythm: 61,  index: 0, count: 5 }]);
    matches(detect(0, 5, [        [2/7],  [4/7],  [6/7],  [8/7],  [10/7]]),        [{ beat: 0,   duration: 2, divisor: 7, rhythm: 62,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],  [6/7],  [8/7],  [10/7]]),        [{ beat: 0,   duration: 2, divisor: 7, rhythm: 63,  index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],  [6/7],                  [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 79,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],          [8/7],          [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 87,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],          [6/7],  [8/7],          [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 91,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [4/7],  [6/7],  [8/7],          [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 93,  index: 0, count: 5 }]);
    matches(detect(0, 5, [        [2/7],  [4/7],  [6/7],  [8/7],          [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 94,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],  [6/7],  [8/7],          [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 95,  index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],                  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 103, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],          [6/7],          [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 107, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [4/7],  [6/7],          [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 109, index: 0, count: 5 }]);
    matches(detect(0, 5, [        [2/7],  [4/7],  [6/7],          [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 110, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],  [6/7],          [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 111, index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [2/7],                  [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 115, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [4/7],          [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 117, index: 0, count: 5 }]);
    matches(detect(0, 5, [        [2/7],  [4/7],          [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 118, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],          [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 119, index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],                    [6/7],  [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 121, index: 0, count: 5 }]);
    matches(detect(0, 5, [        [2/7],          [6/7],  [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 122, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [2/7],          [6/7],  [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 123, index: 0, count: 6 }]);
    matches(detect(0, 5, [                [4/7],  [6/7],  [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 124, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [4/7],  [6/7],  [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 125, index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [2/7],  [4/7],  [6/7],  [8/7],  [10/7], [12/7]]),[{ beat: 0,   duration: 2, divisor: 7, rhythm: 127, index: 0, count: 7 }]);

    matches(detect(0, 5, [[0],    [4/7],  [8/7],  [12/7], [16/7]]),                [{ beat: 0,   duration: 4, divisor: 7, rhythm: 31,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],  [12/7],         [20/7]]),        [{ beat: 0,   duration: 4, divisor: 7, rhythm: 47,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],          [16/7], [20/7]]),        [{ beat: 0,   duration: 4, divisor: 7, rhythm: 55,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],          [12/7], [16/7], [20/7]]),        [{ beat: 0,   duration: 4, divisor: 7, rhythm: 59,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [8/7],  [12/7], [16/7], [20/7]]),        [{ beat: 0,   duration: 4, divisor: 7, rhythm: 61,  index: 0, count: 5 }]);
    matches(detect(0, 5, [        [4/7],  [8/7],  [12/7], [16/7], [20/7]]),        [{ beat: 0,   duration: 4, divisor: 7, rhythm: 62,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],  [12/7], [16/7], [20/7]]),        [{ beat: 0,   duration: 4, divisor: 7, rhythm: 63,  index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],  [12/7],                 [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 79,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],          [16/7],         [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 87,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],          [12/7], [16/7],         [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 91,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [8/7],  [12/7], [16/7],         [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 93,  index: 0, count: 5 }]);
    matches(detect(0, 5, [        [4/7],  [8/7],  [12/7], [16/7],         [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 94,  index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],  [12/7], [16/7],         [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 95,  index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],                  [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 103, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],          [12/7],         [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 107, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [8/7],  [12/7],         [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 109, index: 0, count: 5 }]);
    matches(detect(0, 5, [        [4/7],  [8/7],  [12/7],         [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 110, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],  [12/7],         [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 111, index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [4/7],                  [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 115, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [8/7],          [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 117, index: 0, count: 5 }]);
    matches(detect(0, 5, [        [4/7],  [8/7],          [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 118, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],          [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 119, index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],                    [12/7], [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 121, index: 0, count: 5 }]);
    matches(detect(0, 5, [        [4/7],          [12/7], [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 122, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],    [4/7],          [12/7], [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 123, index: 0, count: 6 }]);
    matches(detect(0, 5, [                [8/7],  [12/7], [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 124, index: 0, count: 5 }]);
    matches(detect(0, 5, [[0],            [8/7],  [12/7], [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 125, index: 0, count: 6 }]);
    matches(detect(0, 5, [[0],    [4/7],  [8/7],  [12/7], [16/7], [20/7], [24/7]]),[{ beat: 0,   duration: 4, divisor: 7, rhythm: 127, index: 0, count: 7 }]);
});

Deno.test('Duplets 0.04 beat push and drag', () => {
    matches(detect(0, 4, [[0], [0.96], [2]]),    [{ beat: 0, duration: 2, divisor: 2, rhythm: 3, count: 2 }, { beat: 2, duration: 2, rhythm: 1, count: 1 }]);
    matches(detect(0, 4, [[0], [1.04], [2]]),    [{ beat: 0, duration: 2, divisor: 2, rhythm: 3, count: 2 }, { beat: 2, duration: 2, rhythm: 1, count: 1 }]);
    matches(detect(0, 4, [[0], [1],    [1.96]]), [{ beat: 0, duration: 2, divisor: 2, rhythm: 3, count: 3 }, { beat: 2, duration: 2, rhythm: 1, count: 0 }]);
    matches(detect(0, 4, [[0], [1],    [2.04]]), [{ beat: 0, duration: 2, divisor: 2, rhythm: 3, count: 2 }, { beat: 2, duration: 2, rhythm: 1, count: 1 }]);
    matches(detect(0, 4, [[0.04],  [1],   [2]]), [{ beat: 0, duration: 2, divisor: 2, rhythm: 3, count: 2 }, { beat: 2, duration: 2, rhythm: 1, count: 1 }]);
    matches(detect(0, 4, [[-0.04], [1],   [2]]), [{ beat: 0, duration: 2, divisor: 2, rhythm: 3, count: 1 }, { beat: 2, duration: 2, rhythm: 1, count: 1 }]);
});

Deno.test('Triplets 0.02 beat push', () => {
    const drag = -0.02;
    matches(detect(0, 4, [            [drag + 1/3]]),                           [{ beat: 0, duration: 0.5, divisor: 3, rhythm: 4, index: 0, count: 1 }]);
    matches(detect(0, 4, [[drag + 0], [drag + 1/3]]),                           [{ beat: 0, duration: 0.5, divisor: 3, rhythm: 5, index: 1, count: 1 }]);
    matches(detect(0, 4, [                          [drag + 2/3]]),             [{ beat: 0, duration: 1,   divisor: 3, rhythm: 4, index: 0, count: 1 }]); // Potentially ambiguous
    matches(detect(0, 4, [[drag + 0],               [drag + 2/3]]),             [{ beat: 0, duration: 1,   divisor: 3, rhythm: 5, index: 1, count: 1 }]); // Potentially ambiguous
    matches(detect(0, 4, [            [drag + 1/3], [drag + 2/3]]),             [{ beat: 0, duration: 1,   divisor: 3, rhythm: 6, index: 0, count: 2 }]);
    matches(detect(0, 4, [[drag + 0], [drag + 1/3], [drag + 2/3]]),             [{ beat: 0, duration: 1,   divisor: 3, rhythm: 7, index: 1, count: 2 }]);
    matches(detect(0, 4, [                          [drag + 2/3], [drag + 1]]), [{ beat: 0, duration: 1,   divisor: 3, rhythm: 4, index: 0, count: 2 }, { beat: 1, duration: 1, rhythm: 1, index: 2, count: 0 }]);
    matches(detect(0, 4, [[drag + 0],               [drag + 2/3], [drag + 1]]), [{ beat: 0, duration: 1,   divisor: 3, rhythm: 5, index: 1, count: 2 }, { beat: 1, duration: 1, rhythm: 1, index: 3, count: 0 }]);
});

Deno.test('Triplets 0.02 beat drag', () => {
    const drag = 0.02;
    matches(detect(0, 4, [            [drag + 1/3]]),                           [{ beat: 0, duration: 0.5, divisor: 3, rhythm: 4, index: 0, count: 1 }]);
    matches(detect(0, 4, [[drag + 0], [drag + 1/3]]),                           [{ beat: 0, duration: 0.5, divisor: 3, rhythm: 5, index: 0, count: 2 }]);
    matches(detect(0, 4, [                          [drag + 2/3]]),             [{ beat: 0, duration: 1,   divisor: 3, rhythm: 4, index: 0, count: 1 }]); // Potentially ambiguous
    matches(detect(0, 4, [[drag + 0],               [drag + 2/3]]),             [{ beat: 0, duration: 1,   divisor: 3, rhythm: 5, index: 0, count: 2 }]); // Potentially ambiguous
    matches(detect(0, 4, [            [drag + 1/3], [drag + 2/3]]),             [{ beat: 0, duration: 1,   divisor: 3, rhythm: 6, index: 0, count: 2 }]);
    matches(detect(0, 4, [[drag + 0], [drag + 1/3], [drag + 2/3]]),             [{ beat: 0, duration: 1,   divisor: 3, rhythm: 7, index: 0, count: 3 }]);
    matches(detect(0, 4, [                          [drag + 2/3], [drag + 1]]), [{ beat: 0, duration: 1,   divisor: 3, rhythm: 4, index: 0, count: 1 }, { beat: 1, duration: 1, divisor: 2, rhythm: 1, index: 1, count: 1 }]);
    matches(detect(0, 4, [[drag + 0],               [drag + 2/3], [drag + 1]]), [{ beat: 0, duration: 1,   divisor: 3, rhythm: 5, index: 0, count: 2 }, { beat: 1, duration: 1, divisor: 2, rhythm: 1, index: 2, count: 1 }]);
});
