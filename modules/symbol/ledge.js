export function createLedges(symbols, stave, part, beat, notes) {
    // Up ledger lines
    //const { row: maxRow, pitch: maxPitch } = getMaxPitchRow(stave, part, pitches);
    const maxRow   = notes[0].row;
    const maxPitch = notes[0].pitch;
    // Ledges begin two rows away from topPitch, which is the top line
    let rows = maxRow - (part.topRow || stave.topRow) + 1;
    if (rows < 0) symbols.push({
        type: 'ledge',
        beat,
        pitch: maxPitch,
        part,
        rows
    });

    // Down ledger lines
    //const { row: minRow, pitch: minPitch } = getMinPitchRow(stave, part, pitches);
    const minRow   = notes[notes.length - 1].row;
    const minPitch = notes[notes.length - 1].pitch;
    // Ledges begin two rows away from bottomPitch, which is the bottom line
    rows = minRow - (part.bottomRow || stave.bottomRow);
    if (rows > 0)  symbols.push({
        type: 'ledge',
        beat,
        pitch: minPitch,
        part,
        rows
    });
}
