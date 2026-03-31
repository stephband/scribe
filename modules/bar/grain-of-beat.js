
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
    //const d2 = n === divisions.length ?
    //    // Beat is in the next bar, assume it is in the 1st division
    //    d1 + divisions[0] :
    //    // Beat is before the end of bar
    //    divisions[n] ;
    // Limit max grain to the next grain up from division duration
    //const maxGrain = ceilPow2(d2 - d1);
    const maxGrain = ceilPow2(divisions[divisions.length - 1]);
    return grainPow2(0.125, maxGrain, beat - d1);
}
