
import {
    assert,
    assertEquals as equals,
    assertGreaterOrEqual as gte,
    assertStrictEquals as is,
    assertObjectMatch as matches
} from 'jsr:@std/assert@1';

import { Sequence } from 'sequence/module.js';
import requestTree  from '../modules/tree.js';

Deno.test('Render', async () => {
    await requestTree(new Sequence([
        [0, "key", "Bb"],
        [0, "meter", 0b1010, 1],
        [1.333, "note", "D4", 0.1, 0.333],
        [1.667, "note", "C4", 0.1, 0.333],
        [1.667, "note", "E4", 0.1, 0.333],
        [1.667, "note", "G4", 0.1, 0.333],
        [2,     "note", "C5", 0.1, 1],
        [9,     "note", "C3", 0.1, 3]
    ]));
});
