import {
    assert,
    assertEquals as equals
} from 'jsr:@std/assert@1';

import Event      from 'sequence/modules/event.js';
import Sequence   from 'sequence/module.js';
import analyseKeys from '../modules/spell/analyse.js';
import batch       from '../modules/spell/batch.js';
import { encode, decode, IN_DIM } from '../modules/spell/schema.js';
import spell       from '../modules/tree/spell.js';

Deno.test('analyseKeys() scores scales, tritones, and chromatic clusters', () => {
    const cMaj = analyseKeys([60, 62, 64, 65, 67, 69, 71]);
    equals(cMaj.length, 12);
    equals(cMaj[0], 1);
    assert(cMaj[1] < 1 && cMaj[11] < 1);

    const gMaj = analyseKeys([67, 69, 71, 72, 74, 76, 78]);
    equals(gMaj[1], 1);

    // F + B tritone peaks symmetrically at C (0) and F#/Gb (6)
    const tritone = analyseKeys([65, 71]);
    equals(tritone[0], 1);
    equals(tritone[6], 1);

    // 12-note chromatic cluster zeroes every position
    const chromatic = analyseKeys([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71]);
    equals(chromatic, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

Deno.test('batch() groups concurrent events into slices and counts them', () => {
    const empty = batch([]);
    equals(empty.length, 0);
    equals(empty.count, 1);

    const events = [
        Event.key(0, 'D'),
        Event.meter(0, 0b1010, 1),
        Event.note(0, 62, 0.1, 1),
        Event.note(0.01, 66, 0.1, 1),
        Event.note(1, 69, 0.1, 2)
    ];
    const head = batch(events);
    equals(head.count, 2);
    equals(head.key, 2);
    equals(head.grain, 4);
    equals(head.length, 2);
    equals(head.next.beat, 1);
    equals(head.next.grain, 1);
    equals(head.next.prev, head);
    equals(head.next.length, 1);
});

Deno.test('encode() produces 30-dim slice vectors and decode() writes event.key', () => {
    const events = [
        Event.key(0, 'A'),
        Event.meter(0, 0b1010, 1),
        Event.note(0, 69, 0.1, 1),
        Event.note(1, 73, 0.1, 1)
    ];
    const head = batch(events);
    const data = encode(head);
    equals(data.length, 2 * IN_DIM);
    // Home key = A (+3) normalised by / 9
    equals(Math.abs(data[28] - 3 / 9) < 1e-6, true);
    equals(data[29], 4);
    equals(data[IN_DIM + 29], 1);

    decode(head, new Uint32Array([12, 12]));
    equals(events[2].key, 3);
    equals(events[3].key, 3);
    equals(events[2].spell(events[2].key), 'A4');
    equals(events[3].spell(events[3].key), 'C♯5');
});

Deno.test('spell() handles empty arrays, G♯/A♭ context, and Giant Steps', async () => {
    equals(await spell([]), undefined);

    // Pickup G♯4 before E7 -> Am vs A♭4 before Fm -> C
    const sharpEvents = Sequence.parse(`
        0 key C
        0 C4 1
        0 E4 1
        0 G4 1
        1 G♯4 1
        2 E4 2
        2 G♯4 2
        2 B4 2
        2 D5 2
        4 A4 2
    `).events;
    await spell(sharpEvents);
    equals(sharpEvents.find((e) => e.type === 'note' && e[0] === 1).spell(
        sharpEvents.find((e) => e.type === 'note' && e[0] === 1).key
    ), 'G♯4');

    const flatEvents = Sequence.parse(`
        0 key C
        0 C4 1
        0 E4 1
        0 G4 1
        1 A♭4 1
        2 F4 2
        2 A♭4 2
        2 C5 2
        4 C4 2
    `).events;
    await spell(flatEvents);
    equals(flatEvents.find((e) => e.type === 'note' && e[0] === 1).spell(
        flatEvents.find((e) => e.type === 'note' && e[0] === 1).key
    ), 'A♭4');

    // Giant Steps (keyless chart modulating B -> G -> Eb)
    const gsText = await Deno.readTextFile(new URL('../data/training/giant-steps.sequence', import.meta.url));
    const gsEvents = Array.from(Sequence.parse(gsText));
    await spell(gsEvents);
    for (const event of gsEvents) {
        if (event.type !== 'note') continue;
        equals(event.spell(event.key), event.sourcePitch);
    }
});
