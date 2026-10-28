
import {
    assert,
    assertEquals as equals,
    assertGreaterOrEqual as gte,
    assertStrictEquals as is,
    assertObjectMatch as matches
} from 'jsr:@std/assert@1';

import { Sequence } from 'sequence/module.js';
import createTree   from '../modules/tree.js';

import Stave        from '../modules/stave/stave.js';
import { identify } from '../modules/event.js';

Deno.test('identify()', () => {
    is(identify('D'), undefined);
    is(identify(123), undefined);
    is(identify(null), undefined);
    is(identify(undefined), undefined);

    const event = [0, 'note', 60];
    const id = identify(event);
    assert(typeof id === 'number');
    is(identify(event), id);
});

Deno.test('createSignatureSymbols() with string key', () => {
    const stave = new Stave('treble');
    const symbols = stave.createSignatureSymbols('D');
    is(symbols.length, 3); // clef + 2 sharps (F#, C#)
    is(symbols[0].type, 'clef');
    is(symbols[1].type, 'acci');
    is(symbols[1].event, undefined);
    is(symbols[2].type, 'acci');
    is(symbols[2].event, undefined);
});

Deno.test('showAtConcertPitch: true preserves concert key on parts', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 4, 1],
        [0, "note", "C4", 0.5, 1]
    ]);
    const tree = await createTree(sequence, { showAtConcertPitch: true });
    assert(tree[0]);
    assert(tree[0][0]);
    is(tree[0][0].key, 0);
    is(tree[0][0].transpose, 0);
});
