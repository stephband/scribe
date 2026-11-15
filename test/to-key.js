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

Deno.test('toKeyCentre() identifies triads', () => {
    // C major triad: C (0), G (+1), E (+4) -> Dorian D (+2) -> key C (0)
    equals(toKeyCentre([60, 64, 67]), 0);
    // A minor triad: C (0), A (+3), E (+4) -> G (1)
    equals(toKeyCentre([69, 72, 76]), 1);
    // G major triad: G (+1), D (+2), B (+5) -> Dorian A (+3) -> key G (+1)
    equals(toKeyCentre([67, 71, 74]), 1);
    // F major triad: F (-1), C (0), A (+3) -> tie between Bb (-2) and F (-1)
    const f = toKeyCentre([65, 69, 72]);
    assert(f === -1 || f === -2, `Expected -1 or -2, got ${ f }`);
});

Deno.test('toKeyCentre() handles 6-note C minor / Eb cluster and chromatic addition', () => {
    // C, D, Eb, F, G, Ab -> Dorian F (-1) -> key Eb (-3)
    equals(toKeyCentre([60, 62, 63, 65, 67, 68]), -3);

    // Adding Db (61) stays cleanly in Eb (-3) or shifts to Ab (-4)
    const k = toKeyCentre([60, 61, 62, 63, 65, 67, 68]);
    assert(k === -3 || k === -4, `Expected -3 or -4, got ${ k }`);
});

Deno.test('toKeyCentre() pulls symmetric chords toward the input key', () => {
    equals(toKeyCentre([60, 66], 0), 0);
    equals(toKeyCentre([60, 66], 2), 2);
    equals(toKeyCentre([60, 66], -3), -3);

    equals(toKeyCentre([60, 63, 66, 69], 0), 0);
    equals(toKeyCentre([60, 63, 66, 69], -4), -4);
});

Deno.test('toKeyCentre() wraps enharmonic boundaries according to input key', () => {
    // Ab (68, fifths = 8 / -4) -> -6 (Gb) in key of C (0)
    equals(toKeyCentre([68], 0), -6);
    // In sharp keys, the push shifts the ±π seam clockwise
    equals(toKeyCentre([68], 4), 6);
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
