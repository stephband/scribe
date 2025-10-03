
import detectTuplets from '../modules/tuplet.js';

console.log('Nothing');
console.log(detectTuplets(4, []));

console.log('Crotchets');
console.log(detectTuplets(4, [[0]]));

console.log('Duplets');
console.log(detectTuplets(4, [[0], [0.5]]));
console.log(detectTuplets(4, [     [0.5]]));

console.log('Triplets');
console.log(detectTuplets(4, [[0], [0.33]]));
console.log(detectTuplets(4, [[0], [0.333], [0.667]]));
console.log(detectTuplets(4, [     [0.333], [0.667]]));
console.log(detectTuplets(4, [[0], [0.333]         ]));
console.log(detectTuplets(4, [     [0.333]         ]));
console.log(detectTuplets(4, [[0], [0.333], [0.7]]));
console.log(detectTuplets(4, [[0.1], [0.3], [0.7]]), 'Human');

console.log(detectTuplets(4, [[0], [0.667]         ]));
console.log(detectTuplets(4, [[0], [0.667], [1.333]]));
console.log(detectTuplets(4, [     [0.667], [1.333]]));
console.log(detectTuplets(4, [              [1.333]]));

console.log('Quadruplets');
console.log(detectTuplets(4, [[0], [0.25]]));
console.log(detectTuplets(4, [[0], [0.25], [0.5]]));
console.log(detectTuplets(4, [[0], [0.25], [0.5], [0.75]]));
console.log(detectTuplets(4, [     [0.25], [0.5], [0.75]]));
console.log(detectTuplets(4, [[0],         [0.5], [0.75]]));
console.log(detectTuplets(4, [[0], [0.25],        [0.75]]));
console.log(detectTuplets(4, [[0], [0.25], [0.5]        ]));
console.log(detectTuplets(4, [             [0.5], [0.75]]));
console.log(detectTuplets(4, [[0],                [0.75]]));
console.log(detectTuplets(4, [[0], [0.25]               ]));
console.log(detectTuplets(4, [     [0.25], [0.5]        ]));
console.log(detectTuplets(4, [     [0.25],        [0.75]]));
console.log(detectTuplets(4, [     [0.25]               ]));
console.log(detectTuplets(4, [                    [0.75]]));
console.log(detectTuplets(4, [[0], [0.29], [0.52], [0.7]]), 'Human');

console.log('Quintuplets');
console.log(detectTuplets(4, [[0], [1/5]]));
console.log(detectTuplets(4, [[0], [1/5], [2/5]]));
console.log(detectTuplets(4, [[0], [1/5], [2/5], [3/5]]));
console.log(detectTuplets(4, [[0], [1/5], [2/5], [3/5], [4/5]]));
console.log(detectTuplets(4, [     [1/5], [2/5], [3/5], [4/5]]));
console.log(detectTuplets(4, [[0],        [2/5], [3/5], [4/5]]));
console.log(detectTuplets(4, [[0], [1/5],        [3/5], [4/5]]));
console.log(detectTuplets(4, [[0], [1/5], [2/5],        [4/5]]));
console.log(detectTuplets(4, [[0], [1/5], [2/5], [3/5]       ]));
console.log(detectTuplets(4, [            [2/5], [3/5], [4/5]]));
console.log(detectTuplets(4, [[0],               [3/5], [4/5]]));
console.log(detectTuplets(4, [[0], [1/5],               [4/5]]));
console.log(detectTuplets(4, [[0], [1/5], [2/5],             ]));
console.log(detectTuplets(4, [     [1/5], [2/5], [3/5]       ]));
console.log(detectTuplets(4, [                   [3/5], [4/5]]));
console.log(detectTuplets(4, [[0],                      [4/5]]));
console.log(detectTuplets(4, [[0], [1/5]                     ]));
console.log(detectTuplets(4, [     [1/5], [2/5]              ]));
console.log(detectTuplets(4, [            [2/5], [3/5]       ]));
console.log(detectTuplets(4, [     [1/5]                     ]));
console.log(detectTuplets(4, [            [2/5]              ]));
console.log(detectTuplets(4, [                   [3/5]       ]));
console.log(detectTuplets(4, [                          [4/5]]));

console.log('Septuplets');
console.log(detectTuplets(4, [[0], [1/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7], [3/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7], [3/7], [4/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7], [3/7], [4/7], [5/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7], [3/7], [4/7], [5/7], [6/7]]));
console.log(detectTuplets(4, [     [1/7], [2/7], [3/7], [4/7], [5/7], [6/7]]));
console.log(detectTuplets(4, [[0],        [2/7], [3/7], [4/7], [5/7], [6/7]]));
console.log(detectTuplets(4, [[0], [1/7],        [3/7], [4/7], [5/7], [6/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7],        [4/7], [5/7], [6/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7], [3/7],        [5/7], [6/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7], [3/7], [4/7],        [6/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7], [3/7], [4/7], [5/7]       ]));
console.log(detectTuplets(4, [            [2/7], [3/7], [4/7], [5/7], [6/7]]));
console.log(detectTuplets(4, [[0],               [3/7], [4/7], [5/7], [6/7]]));
console.log(detectTuplets(4, [[0], [1/7],               [4/7], [5/7], [6/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7],               [5/7], [6/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7], [3/7],               [6/7]]));
console.log(detectTuplets(4, [[0], [1/7], [2/7], [3/7], [4/7],             ]));
console.log(detectTuplets(4, [     [1/7], [2/7], [3/7], [4/7], [5/7]       ]));
