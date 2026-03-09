
export function createAccents(symbols, stave, part, beat, notes, settings) {
    // Find max dynamic among all notes
    let maxDynamic = -Infinity;
    let n = -1, note, event;
    while (note = notes[++n]) if (note.dynamic > maxDynamic) {
        maxDynamic = note.dynamic;
        event      = note.event;
    }

    // If max dynamic exceeds accent threshold, create an accent
    if (notes.length && maxDynamic >= settings.accentThreshold) {
        const minMaxNote = notes[0].stemup ? notes[notes.length - 1] : notes[0];
        symbols.push({
            type:    'accent',
            beat,
            pitch:   minMaxNote.pitch,
            dynamic: maxDynamic,
            stemup:  minMaxNote.stemup,
            stave,
            part,
            event
        });
    }
}
