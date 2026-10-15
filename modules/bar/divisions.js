
export function isDivision(divisions, beat) {
    return beat === 0 || divisions.includes(beat);
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
