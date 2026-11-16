import {
    assert,
    assertEquals as equals
} from 'jsr:@std/assert@1';

import { toKeyCentre } from '../modules/spell/to-key.js';

Deno.test('toKeyCentre() identifies 7-note diatonic major scales', () => {
    equals(toKeyCentre([60, 62, 64, 65, 67, 69, 71]),  0); // C
    equals(toKeyCentre([67, 69, 71, 72, 74, 76, 78]),  1); // G
    equals(toKeyCentre([62, 64, 66, 67, 69, 71, 73]),  2); // D
    equals(toKeyCentre([65, 67, 69, 70, 72, 74, 76]), -1); // F
    equals(toKeyCentre([70, 72, 74, 75, 77, 79, 81]), -2); // Bb
    equals(toKeyCentre([63, 65, 67, 68, 70, 72, 74]), -3); // Eb
});

Deno.test('toKeyCentre() identifies triads with key bias', () => {
    // C major triad -> C (0)
    equals(toKeyCentre([60, 64, 67]), 0);
    // A minor triad in C (0) -> C (0); in G (1) -> G (1)
    equals(toKeyCentre([69, 72, 76], 0), 0);
    equals(toKeyCentre([69, 72, 76], 1), 1);
    // G major triad in C (0) stays in C (V of C); in G (1) -> G (1)
    equals(toKeyCentre([67, 71, 74], 0), 0);
    equals(toKeyCentre([67, 71, 74], 1), 1);
    // D major tetrad (D, F#, G, C#) in C (0) -> D (+2) despite G/C# tritone shrinking raw.r
    equals(toKeyCentre([62, 66, 67, 73], 0), 2);
    // F major triad in C (0) -> F (-1)
    equals(toKeyCentre([65, 69, 72], 0), -1);
});

Deno.test('toKeyCentre() handles C minor / Eb and chromatic addition', () => {
    // Full Eb major / C natural minor scale -> Eb (-3)
    equals(toKeyCentre([60, 62, 63, 65, 67, 68, 70]), -3);

    // 6-note C, D, Eb, F, G, Ab in C (0) pulls slightly toward Bb (-2) or Eb (-3)
    const k6 = toKeyCentre([60, 62, 63, 65, 67, 68], 0);
    assert(k6 === -2 || k6 === -3, `Expected -2 or -3, got ${ k6 }`);

    // Adding Db (61) stays in Eb (-3) or shifts to Ab (-4)
    const k7 = toKeyCentre([60, 61, 62, 63, 65, 67, 68], -3);
    assert(k7 === -3 || k7 === -4, `Expected -3 or -4, got ${ k7 }`);
});

Deno.test('toKeyCentre() falls back on symmetric and empty input', () => {
    equals(toKeyCentre([], 2), 2);

    equals(toKeyCentre([60, 66], 0), 0);
    equals(toKeyCentre([60, 66], 2), 2);
    equals(toKeyCentre([60, 66], -3), -3);

    equals(toKeyCentre([60, 63, 66, 69], 0), 0);
    equals(toKeyCentre([60, 63, 66, 69], -4), -4);
});

Deno.test('toKeyCentre() wraps enharmonic boundaries according to input key', () => {
    // Gb/F# major scale -> Gb (-6) in C (0), F# (+6) in E (4)
    equals(toKeyCentre([66, 68, 70, 71, 73, 75, 77], 0), -6);
    equals(toKeyCentre([66, 68, 70, 71, 73, 75, 77], 4), 6);
});

Deno.test('toKeyCentre() populates debug vectors when debug object is passed', () => {
    const debug = {};
    const key = toKeyCentre([60, 64, 67], 0, debug);
    equals(key, 0);
    assert('raw' in debug);
    assert('bias' in debug);
    assert('dorian' in debug);
    assert('rotated' in debug);
    equals(debug.key, 0);
    equals(debug.push, 0);
});
