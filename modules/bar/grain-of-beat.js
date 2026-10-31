
import grainPow2 from '../number/grain-pow-2.js';
import { ceilPow2 } from '../number/power-of-2.js';

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
