
import mod from 'fn/mod.js';
import { eq } from '../number/float.js';
import { floorPow2, ceilPow2 } from '../number/power-of-2.js';



function grainPow2(min, max, n) {
    // If n is 0 we can say we are on the maximum grain
    if (eq(0, n, min / 2)) return floorPow2(max);
    let g = floorPow2(max) * 2;
    while ((g /= 2) > min) if (eq(0, mod(g, n), min / 2)) break;
    return g;
}

/*
grainOfBeat(divisions, beat)
*/

export default function grainOfBeat(divisions, beat) {
    let n = -1;
    while (divisions[++n] <= beat);
    // Division before beat
    const d1 = divisions[n - 1] || 0;
    // Division after beat
    const maxGrain = n === 0 || n === divisions.length ?
        // Beat is first division or next bar, maxGrain is ceil of bar length
        ceilPow2(divisions[divisions.length - 1]) :
        // Beat is before the end of bar, maxGrain is ceil of division
        ceilPow2(divisions[n] - d1) ;

    return grainPow2(0.125, maxGrain, beat - d1);
}
