
/* Pitches */

function getMinPitchRow(stave, voice, pitches) {
    let n = -1, row = 0;
    let pitch, r;
    while (pitches[++n]) {
        r = stave.getRow(voice, pitches[n]);
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

function getMaxPitchRow(stave, voice, pitches) {
    let n = -1, row = 128;
    let pitch, r;
    while (pitches[++n]) {
        r = stave.getRow(voice, pitches[n]);
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

export function stemupFromRows(stave, voice, minRow, maxRow) {
    const centerRow = voice.centerRow || stave.centerRow;
    const minDiff   = minRow - centerRow;
    const maxDiff   = maxRow - centerRow;
    return maxDiff + minDiff > 0;
}

export function stemupFromPitches(stave, voice, pitches) {
    const { row: minRow } = getMinPitchRow(stave, voice, pitches);
    const { row: maxRow } = getMaxPitchRow(stave, voice, pitches);
    return stemupFromRows(stave, voice, minRow, maxRow);
}

export function stemupFromSymbols(stave, voice, symbols) {
    const pitches = [];
    let n = -1, symbol;
    while (symbol = symbols[++n]) {
        if (symbol.type === 'note') pitches.push(symbol.pitch);
    }
    return stemupFromPitches(stave, voice, pitches);
}
