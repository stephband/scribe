/**
 * Transposes a sequence and its target annotations along the Line of Fifths
 *
 * @param {Array} noteEvents - Array of [beat, 'note', midi, gain, duration]
 * @param {Array} targets - Array of { tpc, key } or [tpc, key]
 * @param {number} deltaK - Integer shift on Line of Fifths (e.g. -6 to +6)
 * @param {number} [initialKey=0] - Base key number
 * @returns {Object|null} Transposed { noteEvents, targets, initialKey } or null if out of bounds
 */
export default function transpose(noteEvents, targets, deltaK, initialKey = 0) {
    if (deltaK === 0) {
        return { noteEvents, targets, initialKey };
    }

    // 1. Calculate semitone pitch shift (nearest octave transposition)
    let semitoneShift = ((deltaK * 7) % 12 + 12) % 12;
    if (semitoneShift > 6) {
        semitoneShift -= 12;
    }

    // 2. Check bounds across all target TPCs
    const newInitialKey = initialKey + deltaK;
    if (newInitialKey < -15 || newInitialKey > 19) return null;

    const newTargets = [];
    for (let t = 0; t < targets.length; t++) {
        const item = targets[t];
        const oldTpc = item.tpc !== undefined ? item.tpc : item[0];
        const oldKey = item.key !== undefined ? item.key : item[1];

        const newTpc = oldTpc + deltaK;
        const newKey = oldKey + deltaK;

        // Validate bounds in 35-class range [-15, 19]
        if (newTpc < -15 || newTpc > 19 || newKey < -15 || newKey > 19) {
            return null;
        }

        newTargets.push({ tpc: newTpc, key: newKey });
    }

    // 3. Transpose note events
    const newNoteEvents = [];
    for (let t = 0; t < noteEvents.length; t++) {
        const e = noteEvents[t];
        const beat = e[0];
        const type = e[1];
        const oldMidi = e[2];
        const gain = e[3];
        const duration = e[4];

        const newMidi = oldMidi + semitoneShift;
        if (newMidi < 0 || newMidi > 127) return null;

        newNoteEvents.push([beat, type, newMidi, gain, duration]);
    }

    return {
        noteEvents: newNoteEvents,
        targets: newTargets,
        initialKey: newInitialKey,
    };
}
