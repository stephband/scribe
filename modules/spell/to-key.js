/**

                D
         G             A

   C                         E


 F              ●              B


   B♭                        F♯

       E♭/D♯          C♯/D♭
              A♭/G♯

**/


import { fifths } from './circle.js';
import Vector from './vector.js';

const { PI } = Math;
const deg30  = PI / 6;
const coords = [
    // Coordinates of fifths on the circle
    Vector.from({ x: 1, y: 0 }),
    Vector.from({ r: 1, a: 1 * deg30 }),
    Vector.from({ r: 1, a: 2 * deg30 }),
    Vector.from({ x: 0, y: 1 }),
    Vector.from({ r: 1, a: 4 * deg30 }),
    Vector.from({ r: 1, a: 5 * deg30 }),
    Vector.from({ x: -1, y: 0 }),
    Vector.from({ r: 1, a: 7 * deg30 }),
    Vector.from({ r: 1, a: 8 * deg30 }),
    Vector.from({ x: 0, y: -1 }),
    Vector.from({ r: 1, a: 10 * deg30 }),
    Vector.from({ r: 1, a: 11 * deg30 })
];


/**
toDorianVector(numbers)
Returns the vector of the average point inside a circle of fifths of a set of
note number points around the circle.
**/

function toDorianVector(numbers) {
    // Get the cartesian average of the note numbers on the circle of fifths
    let n = numbers.length;
    let f;
    let x = 0;
    let y = 0;
    while (n--) {
        f = fifths(numbers[n]);
        x += coords[f].x;
        y += coords[f].y;
    }
    x /= numbers.length;
    y /= numbers.length;

    return Vector.of(x, y);
}

/*
function toDorianCentre(numbers) {
    // Get the cartesian average of the note numbers on the circle of fifths
    let n = numbers.length;

    const vector = Vector.of(1, 0);

    let f;
    let x = 0;
    let y = 0;
    while (n--) {
        f = fifths(numbers[n]);
        x += cos(numbers[f * angle]);
        y += sin(numbers[f * angle]);
    }
    x /= numbers.length;
    y /= numbers.length;

    return vector;
}*/

const biasRatio = 0.15;

export function toDorianCentre(numbers, biasDorian = 2, debug) {
    // Get vector of dorian for numbers
    const dorian = toDorianVector(numbers);
    if (debug) debug.raw = Vector.from({ x: dorian.x, y: dorian.y });

    // Prepare key centre bias vector proportional to raw radius (bounded angular pull)
    const r = Math.max(dorian.r, 1e-6) * biasRatio;
    const vector = Vector.from({ r, a: biasDorian * deg30 });
    if (debug) debug.bias = vector;

    // Add bias vector in to the average vector
    dorian.x += vector.x;
    dorian.y += vector.y;
    if (debug) debug.dorian = Vector.from({ x: dorian.x, y: dorian.y });

    if (dorian.r < 1e-15) return Vector.from({ r, a: biasDorian * deg30 });

    return dorian;
}

export function toKeyCentre(numbers, key = 0, debug) {
    if (!numbers.length) return key;
    // Get dorian centre vector
    const vector = toDorianCentre(numbers, key + 2, debug);
    // Rotate back to key centre
    vector.a -= 2 * deg30;
    if (debug) debug.rotated = Vector.from({ x: vector.x, y: vector.y });
    // Push towards flat or sharp keys along the line of fifths depending on key
    const push = deg30 * key / 2;
    vector.a -= push;
    const angle = vector.a + push;
    const result = Math.round(angle / deg30);

    if (debug) {
        debug.push = push;
        debug.angle = angle;
        debug.key = result;
        debug.radius = vector.r;
    }

    return result;
}
