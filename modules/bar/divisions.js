
import { eq }  from '../number/float.js';
import { P24 } from '../constants.js';

export function isDivision(divisions, beat) {
    let n = -1;
    while (divisions[++n]) if (eq(divisions[n], beat, P24)) return true;
    return false;
}

export function getDivisionBefore(divisions, beat) {
    let n = -1;
    while (divisions[++n] <= beat);
    return divisions[n - 1] || 0;
}

export function getDivisionAfter(divisions, beat) {
    let n = -1;
    while (divisions[++n] <= beat);
    return divisions[n];
}
