import nothing from 'fn/nothing.js';

const barDivisions = {
    // 2/2
    '2,2': [2],
    // 3/2
    '3,2': [2,4],
    // 2/4
    '2,1': [1],
    // 3/4
    '3,1': [1,2],
    // 4/4
    '4,1': [2],
    // 6/8
    '6,0.5': [1.5],
    // 12/8
    '12,0.5': [1.5,3,4.5]
};

/**
getBarDivisions(meter)
Gets bar divisions from `meter` event.
**/

export function getBarDivisions(meter) {
    return barDivisions[meter[2] + ',' + meter[3]] || nothing;
}

/**
getDivision(divisions, b1, b2)
Gets first bar division from `divisions` where `b1` is before and `b2` after or
on it.
**/

export function getDivision(divisions, b1, b2) {
    let n = -1;
    while (divisions[++n] && divisions[n] <= b1);
    // If divisions[n] is undefined, comparison evaluates to false, which is
    // what we want
    return b2 > divisions[n] ?
        divisions[n] :
        undefined ;
}

export function getLastDivision(divisions, b1, b2) {
    let n = divisions.length;
    while (divisions[--n] && divisions[n] >= b2);

    // If divisions[n] is undefined, comparison evaluates to false, which is
    // what we want
    return b1 < divisions[n] ?
        divisions[n] :
        undefined ;
}
