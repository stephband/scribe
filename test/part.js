
import {
    assert,
    assertEquals as equals,
    assertStrictEquals as is,
    assertThrows
} from 'jsr:@std/assert@1';

import Part from '../modules/part.js';
import Stave from '../modules/stave.js';

Deno.test('Part constructor expects stave to be a stave object', () => {
    const treble = Stave['treble'];
    assert(treble, 'Stave["treble"] should exist');

    const part = new Part('Melody', treble, 0, { 1: 0 });
    is(part.stave, treble);
    is(part.name, 'Melody');
    is(part.transpose, 0);
    equals(part.routing, { 1: 0 });
    is(part.buffers, undefined);
    is(part.symbols, undefined);
    is(part.display, undefined);

    // Throws if stave is a string or invalid
    assertThrows(() => {
        new Part('Melody', 'treble');
    }, TypeError);

    assertThrows(() => {
        new Part('Melody', null);
    }, TypeError);
});

Deno.test('Part constructor defaults name and routing', () => {
    const bass = Stave['bass'];
    const part = new Part(undefined, bass);

    is(part.stave, bass);
    is(part.name, '');
    is(part.transpose, 0);
    equals(part.routing, { 0: 0 });
});

Deno.test('Part.from() resolves string stave and destructures to constructor', () => {
    const part1 = Part.from({ stave: 'grand', name: 'Piano', transpose: 2, routing: { 2: 'rh', 1: 'lh' } });
    is(part1.stave, Stave['grand']);
    is(part1.name, 'Piano');
    is(part1.transpose, 2);
    equals(part1.routing, { 2: 'rh', 1: 'lh' });

    // Also supports 'staff' property
    const part2 = Part.from({ staff: 'bass', name: 'Bass' });
    is(part2.stave, Stave['bass']);
    is(part2.name, 'Bass');
    equals(part2.routing, { 0: 0 });

    // Clones if already a Part
    const clone1 = Part.from(part1);
    is(clone1 === part1, false);
    is(clone1 instanceof Part, true);
    is(clone1.name, part1.name);
    is(clone1.stave, part1.stave);
    equals(clone1.routing, part1.routing);
    is(clone1.symbols, undefined);
    is(clone1.buffers, undefined);

    // Throws on unknown staff
    assertThrows(() => {
        Part.from({ staff: 'non-existent' });
    });
});
