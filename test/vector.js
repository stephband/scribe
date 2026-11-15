import {
    assertAlmostEquals as almost,
    assertEquals as equals
} from 'jsr:@std/assert@1';

import Vector from '../modules/spell/vector.js';

const { atan2, PI, sqrt } = Math;

Deno.test('Vector defaults to zero in both coordinate systems', () => {
    const v = new Vector();
    equals(v.x, 0);
    equals(v.y, 0);
    equals(v.r, 0);
    equals(v.a, 0);
});

Deno.test('Vector constructs from Cartesian inputs via of(), from(), and array', () => {
    const a = Vector.of(3, 4);
    equals(a.x, 3);
    equals(a.y, 4);
    equals(a.r, 5);
    almost(a.a, atan2(4, 3), 1e-12);

    const b = Vector.from([0, -2]);
    equals(b.x, 0);
    equals(b.y, -2);
    equals(b.r, 2);
    almost(b.a, -PI / 2, 1e-12);

    const c = Vector.from({ x: -3, y: 4 });
    equals(c.r, 5);
    almost(c.a, atan2(4, -3), 1e-12);
});

Deno.test('Vector constructs from Polar inputs regardless of property order', () => {
    const a = new Vector({ r: 2, a: PI / 6 });
    almost(a.x, sqrt(3), 1e-12);
    almost(a.y, 1, 1e-12);

    const b = new Vector({ a: PI / 3, r: 2 });
    almost(b.x, 1, 1e-12);
    almost(b.y, sqrt(3), 1e-12);
});

Deno.test('Vector preserves sibling coordinates across Cartesian and Polar mutations', () => {
    // Polar -> mutate x
    const a = new Vector({ r: 2, a: PI / 6 });
    a.x = 0;
    almost(a.y, 1, 1e-12);
    almost(a.r, 1, 1e-12);
    almost(a.a, PI / 2, 1e-12);

    // Polar -> mutate y
    const b = new Vector({ r: 2, a: PI / 3 });
    b.y = 0;
    almost(b.x, 1, 1e-12);
    almost(b.r, 1, 1e-12);
    almost(b.a, 0, 1e-12);

    // Cartesian -> mutate r
    const c = Vector.of(3, 4);
    c.r = 10;
    almost(c.x, 6, 1e-12);
    almost(c.y, 8, 1e-12);

    // Cartesian -> mutate a
    const d = Vector.of(1, 0);
    d.a = PI / 2;
    almost(d.r, 1, 1e-12);
    almost(d.x, 0, 1e-12);
    almost(d.y, 1, 1e-12);

    // Indexed setters [0] and [1]
    const e = Vector.of(1, 2);
    e[0] = 6;
    e[1] = 8;
    equals(e.r, 10);
});

Deno.test('Vector serialises via toJSON() and toString()', () => {
    const v = new Vector({ r: 2, a: PI / 2 });
    const json = v.toJSON();
    almost(json[0], 0, 1e-12);
    almost(json[1], 2, 1e-12);

    const w = Vector.of(3, 4);
    equals(JSON.stringify(w), '[3,4]');
    equals(String(w), '[3, 4]');
});
