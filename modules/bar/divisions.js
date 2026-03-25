
import nothing from 'fn/nothing.js';
import { eq }  from '../number/float.js';
import { P24 } from '../constants.js';

const barDivisions = {
    // The last number in bar divisions is the bar duration
    // 2/2
    '4,2': [2,4],
    // 3/2
    '6,2': [2,4,6],
    // 2/4
    '2,1': [1,2],
    // 3/4
    '3,1': [1,2,3],
    // 4/4
    '4,1': [2,4],
    // 5/4
    '5,1': [3,5],
    // 6/4
    '6,1': [3,6],
    // 7/4
    '7,1': [4,7],
    // 9/4
    '9,1': [3,6,9],
    // 5/8
    '2.5,0.5': [1.5,2.5],
    // 6/8
    '3,0.5': [1.5,3],
    // 6/8
    '3,1.5': [1.5,3],
    // 7/8
    '3.5,0.5': [1,2,3.5],
    // 9/8
    '4.5,0.5': [1.5,3,4.5],
    // 12/8
    '6,0.5': [1.5,3,4.5,6],
    // 13/8
    '6.5,0.5': [1.5,3,6.5]
};

export function getDivisions(duration, divisor) {
    return barDivisions[duration + ',' + divisor] || nothing;
}

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
