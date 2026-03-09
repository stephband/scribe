
/* Pitches */

function getMinPitchRow(stave, part, pitches) {
    let n = -1, row = 0;
    let pitch, r;
    while (pitches[++n]) {
        r = stave.getRow(part, pitches[n]);
        // r may be out of range oof this stave
        if (r === undefined) continue;
        // The bigger r, the lower the pitch
        if (r > row) {
            row   = r;
            pitch = pitches[n];
        }
    }
    return { row, pitch };
}

function getMaxPitchRow(stave, part, pitches) {
    let n = -1, row = 128;
    let pitch, r;
    while (pitches[++n]) {
        r = stave.getRow(part, pitches[n]);
        // r may be out of range oof this stave
        if (r === undefined) continue;
        // The smaller r, the higher the pitch
        if (r < row) {
            row   = r;
            pitch = pitches[n];
        }
    }
    return { row, pitch };
}



/* Stems */

export function stemupFromRows(stave, part, minRow, maxRow) {
    const centerRow = part.centerRow || stave.centerRow;
    const minDiff   = minRow - centerRow;
    const maxDiff   = maxRow - centerRow;
    return maxDiff + minDiff > 0;
}

export function stemupFromPitches(stave, part, pitches) {
    const { row: minRow } = getMinPitchRow(stave, part, pitches);
    const { row: maxRow } = getMaxPitchRow(stave, part, pitches);
    return stemupFromRows(stave, part, minRow, maxRow);
}

export function stemupFromSymbols(stave, part, symbols) {
    const pitches = [];
    let n = -1, symbol;
    while (symbol = symbols[++n]) {
        if (symbol.type === 'note') pitches.push(symbol.pitch);
    }
    return stemupFromPitches(stave, part, pitches);
}
