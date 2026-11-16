import {
    assert,
    assertEquals as equals
} from 'jsr:@std/assert@1';

import { toWindowKey, scoreKeys } from '../modules/spell/to-window-key.js';

Deno.test('toWindowKey() identifies 7-note diatonic major scales', () => {
    equals(toWindowKey([60, 62, 64, 65, 67, 69, 71]),  0); // C
    equals(toWindowKey([67, 69, 71, 72, 74, 76, 78]),  1); // G
    equals(toWindowKey([62, 64, 66, 67, 69, 71, 73]),  2); // D
    equals(toWindowKey([65, 67, 69, 70, 72, 74, 76]), -1); // F
    equals(toWindowKey([70, 72, 74, 75, 77, 79, 81]), -2); // Bb
    equals(toWindowKey([63, 65, 67, 68, 70, 72, 74]), -3); // Eb
});

Deno.test('toWindowKey() gives higher score to full 7-note scale than 5-note subset', () => {
    const full = {};
    const pent = {};
    toWindowKey([60, 62, 64, 65, 67, 69, 71], 0, full);
    toWindowKey([60, 62, 64, 67, 69], 0, pent);
    assert(full.bestScore > pent.bestScore, `Expected full (${ full.bestScore }) > pentatonic (${ pent.bestScore })`);
});

Deno.test('toWindowKey() identifies triads and D major tetrad with tritone', () => {
    equals(toWindowKey([60, 64, 67], 0), 0); // C major triad
    equals(toWindowKey([69, 72, 76], 0), 0); // A minor triad in C -> C
    equals(toWindowKey([67, 71, 74], 0), 1); // G major triad -> G
    equals(toWindowKey([65, 69, 72], 0), -1); // F major triad -> F
    equals(toWindowKey([62, 66, 67, 73], 0), 2); // D, F#, G, C# -> D
});

Deno.test('toWindowKey() keeps both tritone candidates alive and resolves via key bias', () => {
    // Tritone F (65) + B (71): C (0) and F#/Gb (6) tie on template score
    const { scores } = scoreKeys([65, 71], 0);
    // In C (0), C beats F#/Gb; in Gb (-6), Gb beats C
    equals(toWindowKey([65, 71], 0), 0);
    equals(toWindowKey([65, 71], -6), -6);
    assert(scores[0] > scores[1] && scores[6] > scores[5]);
});

Deno.test('toWindowKey() handles symmetric and empty input', () => {
    equals(toWindowKey([], 2), 2);
    // Dim7 [C, Eb, F#, A] has 3 notes in G (1), Bb (-2), Db (-5), E (4); bias picks closest to key
    equals(toWindowKey([60, 63, 66, 69], 0), 1);
    equals(toWindowKey([60, 63, 66, 69], -4), -5);
});

Deno.test('toWindowKey() wraps enharmonic boundaries according to input key', () => {
    equals(toWindowKey([66, 68, 70, 71, 73, 75, 77], 0), -6); // Gb in C
    equals(toWindowKey([66, 68, 70, 71, 73, 75, 77], 4), 6);  // F# in E
});
