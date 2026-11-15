import {
    assertAlmostEquals as almost,
    assertEquals as equals
} from 'jsr:@std/assert@1';

import Vector3D from '../modules/spell/vector-3d.js';

const { atan2, PI, sqrt } = Math;

Deno.test('Vector3D defaults to zero in both coordinate systems', () => {
    const v = new Vector3D();
    equals(v.x, 0);
    equals(v.y, 0);
    equals(v.z, 0);
    equals(v.r, 0);
    equals(v.a, 0);
    equals(v.b, 0);
});

Deno.test('Vector3D constructs from Cartesian inputs via of(), from(), and array', () => {
    // (3, 4, 12) -> r = 13
    const a = Vector3D.of(3, 4, 12);
    equals(a.x, 3);
    equals(a.y, 4);
    equals(a.z, 12);
    equals(a.r, 13);
    almost(a.a, atan2(4, 3), 1e-12);
    almost(a.b, atan2(12, 5), 1e-12);

    const b = Vector3D.from([0, 0, -5]);
    equals(b.r, 5);
    almost(b.b, -PI / 2, 1e-12);

    // Reduces cleanly to 2D Vector when z = 0
    const c = Vector3D.from({ x: 3, y: 4 });
    equals(c.z, 0);
    equals(c.r, 5);
    almost(c.a, atan2(4, 3), 1e-12);
    equals(c.b, 0);
});

Deno.test('Vector3D constructs from Spherical inputs regardless of property order', () => {
    const a = new Vector3D({ r: 2, a: PI / 4, b: PI / 6 });
    almost(a.x, sqrt(3) * sqrt(2) / 2, 1e-12);
    almost(a.y, sqrt(3) * sqrt(2) / 2, 1e-12);
    almost(a.z, 1, 1e-12);

    const b = new Vector3D({ b: PI / 3, a: PI / 2, r: 2 });
    almost(b.x, 0, 1e-12);
    almost(b.y, 1, 1e-12);
    almost(b.z, sqrt(3), 1e-12);
});

Deno.test('Vector3D preserves sibling coordinates across Cartesian and Spherical mutations', () => {
    // Spherical -> mutate x
    const a = new Vector3D({ r: 2, a: PI / 6, b: 0 });
    a.x = 0;
    almost(a.y, 1, 1e-12);
    almost(a.z, 0, 1e-12);
    almost(a.r, 1, 1e-12);
    almost(a.a, PI / 2, 1e-12);
    almost(a.b, 0, 1e-12);

    // Spherical -> mutate z
    const b = new Vector3D({ r: 2, a: 0, b: PI / 6 });
    b.z = sqrt(3);
    almost(b.x, sqrt(3), 1e-12);
    almost(b.y, 0, 1e-12);
    almost(b.r, sqrt(6), 1e-12);
    almost(b.b, PI / 4, 1e-12);

    // Cartesian -> mutate r
    const c = Vector3D.of(3, 4, 12);
    c.r = 26;
    almost(c.x, 6, 1e-12);
    almost(c.y, 8, 1e-12);
    almost(c.z, 24, 1e-12);

    // Cartesian -> mutate a and b
    const d = Vector3D.of(1, 0, 0);
    d.b = PI / 2;
    almost(d.r, 1, 1e-12);
    almost(d.x, 0, 1e-12);
    almost(d.y, 0, 1e-12);
    almost(d.z, 1, 1e-12);

    // Indexed setters [0], [1], [2]
    const e = Vector3D.of(1, 2, 3);
    e[0] = 3;
    e[1] = 4;
    e[2] = 12;
    equals(e.r, 13);
});

Deno.test('Vector3D serialises via toJSON() and toString()', () => {
    const v = new Vector3D({ r: 2, a: 0, b: PI / 2 });
    const json = v.toJSON();
    almost(json[0], 0, 1e-12);
    almost(json[1], 0, 1e-12);
    almost(json[2], 2, 1e-12);

    const w = Vector3D.of(3, 4, 12);
    equals(JSON.stringify(w), '[3,4,12]');
    equals(String(w), '[3, 4, 12]');
});
