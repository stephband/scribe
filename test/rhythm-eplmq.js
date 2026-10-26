
import {
    assert,
    assertEquals as equals,
    assertStrictEquals as is,
    assertObjectMatch as matches
} from 'jsr:@std/assert@1';

import detect from '../modules/rhythm-eplmq.js';


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

Deno.test('Swing 8ths (60% and 65%)', () => {
    // Single beat 60% swing (modern bop, e.g. Scofield)
    matches(detect(0, 1, [[0], [0.60]]), [{ beat: 0, duration: 1, divisor: 3, rhythm: 5, index: 0, count: 2 }]);
    // Single beat 65% swing (classic bop, e.g. Rollins)
    matches(detect(0, 1, [[0], [0.65]]), [{ beat: 0, duration: 1, divisor: 3, rhythm: 5, index: 0, count: 2 }]);
    // Offbeat swing 8th note
    matches(detect(0, 1, [[0.60]]), [{ beat: 0, duration: 1, divisor: 3, rhythm: 4, index: 0, count: 1 }]);
    matches(detect(0, 1, [[0.65]]), [{ beat: 0, duration: 1, divisor: 3, rhythm: 4, index: 0, count: 1 }]);

    // Multi-beat lines of 60% swing
    matches(detect(0, 4, [[0], [0.60], [1.0], [1.60], [2.0], [2.60], [3.0], [3.60]]), [
        { beat: 0, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 1, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 2, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 3, duration: 1, divisor: 3, rhythm: 5, count: 2 }
    ]);

    // Multi-beat lines of 65% swing
    matches(detect(0, 4, [[0], [0.65], [1.0], [1.65], [2.0], [2.65], [3.0], [3.65]]), [
        { beat: 0, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 1, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 2, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 3, duration: 1, divisor: 3, rhythm: 5, count: 2 }
    ]);

    // Syncopated offbeat swing setup (John Scofield — G7 Half-Whole Diminished line)
    matches(detect(0, 4, [[0.60], [1.0], [1.60], [2.0], [2.60], [3.0], [3.60]]), [
        { beat: 0, duration: 1, divisor: 3, rhythm: 4, count: 1 },
        { beat: 1, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 2, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 3, duration: 1, divisor: 3, rhythm: 5, count: 2 }
    ]);

    // Continuous swing range check (0.60 to 0.70 detected as swing 8ths without dead-zone fracturing)
    for (let r = 60; r <= 70; r++) {
        matches(detect(0, 1, [[0], [r / 100]]), [{ beat: 0, duration: 1, divisor: 3, rhythm: 5, count: 2 }]);
    }

    // Straight 8ths range check (0.50 to 0.59 detected as straight 8ths duplets)
    for (let r = 50; r <= 59; r++) {
        matches(detect(0, 1, [[0], [r / 100]]), [{ beat: 0, duration: 1, divisor: 2, rhythm: 3, count: 2 }]);
    }
});

Deno.test('Swing 8ths push and drag', () => {
    // 60% swing with push (-0.01) and drag (+0.01)
    matches(detect(0, 2, [[0], [0.59], [1.0], [1.59]]), [
        { beat: 0, duration: 1, divisor: 2, rhythm: 3, count: 2 },
        { beat: 1, duration: 1, divisor: 2, rhythm: 3, count: 2 }
    ]);
    matches(detect(0, 2, [[0], [0.61], [1.0], [1.61]]), [
        { beat: 0, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 1, duration: 1, divisor: 3, rhythm: 5, count: 2 }
    ]);
    matches(detect(0, 2, [[0], [0.66], [1.0], [1.66]]), [
        { beat: 0, duration: 1, divisor: 3, rhythm: 5, count: 2 },
        { beat: 1, duration: 1, divisor: 3, rhythm: 5, count: 2 }
    ]);
    matches(detect(0, 2, [[0], [1.25]]), [
        { beat: 0, duration: 1,   divisor: 2, rhythm: 1, count: 1 },
        { beat: 1, duration: 0.5, divisor: 2, rhythm: 2, count: 1 }
    ]);
    matches(detect(0, 2, [[0], [0.625]]), [
        { beat: 0, duration: 1, divisor: 3, rhythm: 5, count: 2 }
    ]);
});

Deno.test('Chords with human timing spread', () => {
    // Chords with slight flams / non-identical timestamps across notes
    const chordTrack = [[-0.008], [0.0], [0.012], [0.995], [1.002], [1.01]];
    matches(detect(0, 2, chordTrack), [
        { beat: 0, duration: 2, divisor: 2, rhythm: 3 }
    ]);
});




Deno.test("EPL-MQ: Expressive Phase Drift Tracking (Groove following)", () => {
    // Performer consistently dragging by +0.03 beats per beat across 4 beats
    const draggingTrack = [
        [0.03], [0.53],
        [1.03], [1.53],
        [2.03], [2.53],
        [3.03], [3.53]
    ];
    const result = detect(0, 4, draggingTrack);
    equals(result.length, 4);
    for (let b = 0; b < 4; b++) {
        matches(result[b], { beat: b, duration: 1, divisor: 2, rhythm: 3 });
        assert(result[b].drift !== undefined, "Expected drift to be reported");
    }
});

Deno.test("EPL-MQ: Elastic Restoring Spring back to absolute pulse", () => {
    // Performer drifts on beats 0 and 1 (+0.03 beats), pauses on beat 2 (rest), then plays on beat 3
    const driftThenRestTrack = [
        [0.03], [0.53],
        [1.03], [1.53],
        // Beat 2 is rest
        [3.00], [3.50]
    ];
    const result = detect(0, 4, driftThenRestTrack);
    equals(result.length, 3);
    matches(result[0], { beat: 0, duration: 1, divisor: 2, rhythm: 3 });
    matches(result[1], { beat: 1, duration: 1, divisor: 2, rhythm: 3 });
    matches(result[2], { beat: 3, duration: 1, divisor: 2, rhythm: 3 });
});

Deno.test("EPL-MQ: Per-slot rhythm event counts", () => {
    // 1. Single upbeat note in a duplet: { rhythm: 2, 0: 0, 1: 1 }
    const upbeat = detect(0, 1, [[0.5]]);
    equals(upbeat.length, 1);
    matches(upbeat[0], { rhythm: 2, divisor: 2, 0: 0, 1: 1 });

    // 2. Thick 7-note chord on upbeat: { rhythm: 2, 0: 0, 1: 7 }
    const chordUpbeat = detect(0, 1, [
        [0.49], [0.50], [0.50], [0.51], [0.50], [0.495], [0.505]
    ]);
    equals(chordUpbeat.length, 1);
    matches(chordUpbeat[0], { rhythm: 2, divisor: 2, 0: 0, 1: 7 });

    // 3. Duplet with 1 note on downbeat, 1 note on upbeat: { rhythm: 3, 0: 1, 1: 1 }
    const twoNotes = detect(0, 1, [[0.0], [0.5]]);
    equals(twoNotes.length, 1);
    matches(twoNotes[0], { rhythm: 3, divisor: 2, 0: 1, 1: 1 });

    // 4. Triplet with 2 notes on slot 0, 0 on slot 1, 1 on slot 2: { rhythm: 5, 0: 2, 1: 0, 2: 1 }
    const triplet = detect(0, 1, [[0.0], [0.0], [2 / 3]]);
    equals(triplet.length, 1);
    matches(triplet[0], { rhythm: 5, divisor: 3, 0: 2, 1: 0, 2: 1 });

    // 5. Triplet with slot 2 only: { rhythm: 4, 0: 0, 1: 0, 2: 1 }
    const tripletSlot2 = detect(0, 1, [[2 / 3]]);
    equals(tripletSlot2.length, 1);
    matches(tripletSlot2[0], { rhythm: 4, divisor: 3, 0: 0, 1: 0, 2: 1 });
});
