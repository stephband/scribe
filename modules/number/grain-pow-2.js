
import mod from 'fn/mod.js';
import { eq } from './float.js';
import { floorPow2 } from './power-of-2.js';

/*
grainPower2(n)
grainPower2(n, min, max)
Finds the closest power-of-two number that fits into number `n` with no
remainder. Where given, `min` and `max` must be power-of-two numbers.
*/

export default function grainPower2(min, max, n) {
    // If n is 0 we can say we are on the maximum grain
    if (eq(0, n, min / 2)) return floorPow2(max);
    let g = floorPow2(max) * 2;
    while ((g /= 2) > min) if (eq(0, mod(g, n), min / 2)) break;
    return g;
}
