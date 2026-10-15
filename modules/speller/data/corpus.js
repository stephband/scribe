import transpose from "../transpose.js";
import { encode, encodeTargets } from "../sequence-encoder.js";
import { tpcToMidiPitchClass } from "../key-tpc.js";

/**
 * Generates an annotated note event and target tuple
 * Note event: [beat, 'note', midi, gain, duration]
 * Target: { tpc, key }
 */
function makeNote(beat, tpc, octave = 4, duration = 1.0, key = 0, gain = 0.8) {
    const pc = tpcToMidiPitchClass(tpc);
    const midi = (octave + 1) * 12 + pc;
    return {
        event: [beat, "note", midi, gain, duration],
        target: { tpc, key },
    };
}

/**
 * Builds canonical musical progression templates with exact ground truth TPCs and local keys
 */
export function createBaseProgressions() {
    const progressions = [];

    // --- 1. Diatonic Major Scales & Arpeggios (C major, key = 0) ---
    {
        // C D E F G A B C
        const tpcs = [0, 2, 4, -1, 1, 3, 5, 0];
        const notes = [];
        const targets = [];
        let b = 0;
        for (const tpc of tpcs) {
            const n = makeNote(b, tpc, 4, 0.5, 0);
            notes.push(n.event);
            targets.push(n.target);
            b += 0.5;
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "major_scale",
        });
    }

    // --- 2. Cadences: I - IV - V7 - I (C major, key = 0) ---
    {
        // C - E - G | F - A - C | G - B - D - F | C - E - G
        const chords = [
            { beat: 0, tpcs: [0, 4, 1] }, // C maj
            { beat: 2, tpcs: [-1, 3, 0] }, // F maj
            { beat: 4, tpcs: [1, 5, 2, -1] }, // G7
            { beat: 6, tpcs: [0, 4, 1] }, // C maj
        ];
        const notes = [];
        const targets = [];
        for (const ch of chords) {
            for (const tpc of ch.tpcs) {
                const n = makeNote(ch.beat, tpc, 4, 1.0, 0);
                notes.push(n.event);
                targets.push(n.target);
            }
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "cadence_I_IV_V_I",
        });
    }

    // --- 3. Secondary Dominants: V/V -> V (D7 -> G in C major) ---
    {
        // C (0, 4, 1) -> D7 (2, 6, 3, 0) [F# leads to G] -> G (1, 5, 2) -> C (0, 4, 1)
        const chords = [
            { beat: 0, tpcs: [0, 4, 1], key: 0 },
            { beat: 2, tpcs: [2, 6, 3, 0], key: 1 }, // Local key 1 (G), D7 has F# (tpc 6)
            { beat: 4, tpcs: [1, 5, 2], key: 1 }, // G tonicized
            { beat: 6, tpcs: [0, 4, 1], key: 0 }, // Return to C
        ];
        const notes = [];
        const targets = [];
        for (const ch of chords) {
            for (const tpc of ch.tpcs) {
                const n = makeNote(ch.beat, tpc, 4, 1.0, ch.key);
                notes.push(n.event);
                targets.push(n.target);
            }
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "secondary_dominant_V_of_V",
        });
    }

    // --- 4. Secondary Dominants: V/ii -> ii (A7 -> Dm in C major) ---
    {
        // C (0, 4, 1) -> A7 (3, 7, 4, 1) [C# leads to D] -> Dm (2, -1, 3) -> G7 (1, 5, 2, -1) -> C (0, 4, 1)
        const chords = [
            { beat: 0, tpcs: [0, 4, 1], key: 0 },
            { beat: 2, tpcs: [3, 7, 4, 1], key: 2 }, // A7 has C# (tpc 7), tonicizing Dm (key 2)
            { beat: 4, tpcs: [2, -1, 3], key: 0 }, // Dm (F is -1)
            { beat: 6, tpcs: [1, 5, 2, -1], key: 0 }, // G7
            { beat: 8, tpcs: [0, 4, 1], key: 0 }, // C
        ];
        const notes = [];
        const targets = [];
        for (const ch of chords) {
            for (const tpc of ch.tpcs) {
                const n = makeNote(ch.beat, tpc, 4, 1.0, ch.key);
                notes.push(n.event);
                targets.push(n.target);
            }
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "secondary_dominant_V_of_ii",
        });
    }

    // --- 5. Harmonic & Melodic Minor: A minor (key = 0) with G# and F# ---
    {
        // In A minor (relative to C major, key = 0):
        // A4 (3), C5 (0), E5 (4), G#4 (8 -> leading tone), A4 (3)
        // Melodic ascending: F#4 (6), G#4 (8), A4 (3)
        // Melodic descending: G4 (1), F4 (-1), E4 (4)
        const seq = [
            { beat: 0.0, tpc: 3, oct: 4, dur: 1.0 }, // A
            { beat: 1.0, tpc: 0, oct: 5, dur: 1.0 }, // C
            { beat: 2.0, tpc: 4, oct: 5, dur: 1.0 }, // E
            { beat: 3.0, tpc: 8, oct: 4, dur: 1.0 }, // G# (tpc 8) -> harmonic minor leading tone!
            { beat: 4.0, tpc: 3, oct: 4, dur: 1.0 }, // A
            { beat: 5.0, tpc: 6, oct: 4, dur: 0.5 }, // F# (tpc 6) -> melodic minor ascending
            { beat: 5.5, tpc: 8, oct: 4, dur: 0.5 }, // G# (tpc 8)
            { beat: 6.0, tpc: 3, oct: 5, dur: 1.0 }, // A
            { beat: 7.0, tpc: 1, oct: 5, dur: 0.5 }, // G (tpc 1) -> melodic minor descending
            { beat: 7.5, tpc: -1, oct: 5, dur: 0.5 }, // F (tpc -1)
            { beat: 8.0, tpc: 4, oct: 5, dur: 1.0 }, // E
        ];
        const notes = [];
        const targets = [];
        for (const s of seq) {
            const n = makeNote(s.beat, s.tpc, s.oct, s.dur, 0);
            notes.push(n.event);
            targets.push(n.target);
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "a_minor_harmonic_melodic",
        });
    }

    // --- 6. Chromatic Passing Notes: Ascending Sharps ---
    {
        // Full ascending chromatic scale with sharps: C -> C# -> D -> D# -> E -> F -> F# -> G -> G# -> A -> A# -> B -> C
        const chromaticAscending = [
            { tpc: 0, oct: 4 }, // C
            { tpc: 7, oct: 4 }, // C#
            { tpc: 2, oct: 4 }, // D
            { tpc: 9, oct: 4 }, // D#
            { tpc: 4, oct: 4 }, // E
            { tpc: -1, oct: 4 }, // F
            { tpc: 6, oct: 4 }, // F#
            { tpc: 1, oct: 4 }, // G
            { tpc: 8, oct: 4 }, // G#
            { tpc: 3, oct: 4 }, // A
            { tpc: 10, oct: 4 }, // A#
            { tpc: 5, oct: 4 }, // B
            { tpc: 0, oct: 5 }, // C
        ];
        const notes = [];
        const targets = [];
        let b = 0.0;
        for (const s of chromaticAscending) {
            const n = makeNote(b, s.tpc, s.oct, 0.5, 0);
            notes.push(n.event);
            targets.push(n.target);
            b += 0.5;
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "chromatic_ascending_sharps",
        });
    }

    // --- 7. Chromatic Passing Notes: Descending Flats ---
    {
        // Full descending chromatic scale with flats: C -> B -> Bb -> A -> Ab -> G -> Gb -> F -> E -> Eb -> D -> Db -> C
        const chromaticDescending = [
            { tpc: 0, oct: 5 }, // C
            { tpc: 5, oct: 4 }, // B
            { tpc: -2, oct: 4 }, // Bb
            { tpc: 3, oct: 4 }, // A
            { tpc: -4, oct: 4 }, // Ab
            { tpc: 1, oct: 4 }, // G
            { tpc: -6, oct: 4 }, // Gb
            { tpc: -1, oct: 4 }, // F
            { tpc: 4, oct: 4 }, // E
            { tpc: -3, oct: 4 }, // Eb
            { tpc: 2, oct: 4 }, // D
            { tpc: -5, oct: 4 }, // Db
            { tpc: 0, oct: 4 }, // C
        ];
        const notes = [];
        const targets = [];
        let b = 0.0;
        for (const s of chromaticDescending) {
            const n = makeNote(b, s.tpc, s.oct, 0.5, 0);
            notes.push(n.event);
            targets.push(n.target);
            b += 0.5;
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "chromatic_descending_flats",
        });
    }

    // --- 8. Chromatic Neighbor Tones (Lower chromatic neighbors = #) ---
    {
        // G (1) -> F# (6) -> G (1); D (2) -> C# (7) -> D (2); A (3) -> G# (8) -> A (3)
        const seq = [
            { beat: 0.0, tpc: 1, oct: 4, dur: 0.5 },
            { beat: 0.5, tpc: 6, oct: 4, dur: 0.5 }, // F# lower neighbor
            { beat: 1.0, tpc: 1, oct: 4, dur: 1.0 },
            { beat: 2.0, tpc: 2, oct: 4, dur: 0.5 },
            { beat: 2.5, tpc: 7, oct: 4, dur: 0.5 }, // C# lower neighbor
            { beat: 3.0, tpc: 2, oct: 4, dur: 1.0 },
        ];
        const notes = [];
        const targets = [];
        for (const s of seq) {
            const n = makeNote(s.beat, s.tpc, s.oct, s.dur, 0);
            notes.push(n.event);
            targets.push(n.target);
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "chromatic_lower_neighbors",
        });
    }

    // --- 9. Modal Mixture / Minor Subdominant (iv in major) ---
    {
        // C (0, 4, 1) -> F ( -1, 3, 0) -> Fm (-1, -4, 0) [has Ab, tpc -4] -> C (0, 4, 1)
        const chords = [
            { beat: 0, tpcs: [0, 4, 1], key: 0 },
            { beat: 2, tpcs: [-1, 3, 0], key: 0 },
            { beat: 4, tpcs: [-1, -4, 0], key: 0 }, // Fm has Ab (-4)
            { beat: 6, tpcs: [0, 4, 1], key: 0 },
        ];
        const notes = [];
        const targets = [];
        for (const ch of chords) {
            for (const tpc of ch.tpcs) {
                const n = makeNote(ch.beat, tpc, 4, 1.0, ch.key);
                notes.push(n.event);
                targets.push(n.target);
            }
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "modal_mixture_minor_iv",
        });
    }

    // --- 10. Melodic Chromatic Passing: Ascending Sharps and Descending Flats ---
    {
        // C4 -> E4 -> F#4 -> G4 -> Gb4 -> F4 -> E4
        const seq = [
            { beat: 0.0, tpc: 0, oct: 4, dur: 1.0, key: 0 }, // C
            { beat: 1.0, tpc: 4, oct: 4, dur: 1.0, key: 0 }, // E
            { beat: 2.0, tpc: 6, oct: 4, dur: 0.5, key: 0 }, // F# (leads to G)
            { beat: 2.5, tpc: 1, oct: 4, dur: 1.0, key: 0 }, // G
            { beat: 3.5, tpc: -6, oct: 4, dur: 0.5, key: 0 }, // Gb (leads to F)
            { beat: 4.0, tpc: -1, oct: 4, dur: 1.0, key: 0 }, // F
            { beat: 5.0, tpc: 4, oct: 4, dur: 1.0, key: 0 }, // E
        ];
        const notes = [];
        const targets = [];
        for (const s of seq) {
            const n = makeNote(s.beat, s.tpc, s.oct, s.dur, s.key);
            notes.push(n.event);
            targets.push(n.target);
        }
        progressions.push({
            initialKey: 0,
            notes,
            targets,
            name: "melodic_chromatic_passing",
        });
    }

    return progressions;
}

/**
 * Builds the full training dataset with Line of Fifths augmentations (Delta k in [-6, +6])
 *
 * @returns {Array} Array of encoded training samples
 */
export function buildTrainingDataset() {
    const baseProgressions = createBaseProgressions();
    const dataset = [];

    for (const prog of baseProgressions) {
        // Augment along Line of Fifths by Delta k in [-6, +6]
        for (let deltaK = -6; deltaK <= 6; deltaK++) {
            const aug = transpose(
                prog.notes,
                prog.targets,
                deltaK,
                prog.initialKey,
            );
            if (!aug) continue;

            const enc = encode(aug.noteEvents, {
                initialKey: aug.initialKey,
            });
            const targets = encodeTargets(aug.targets);

            dataset.push({
                features: enc.features,
                noteCount: enc.noteCount,
                initialKey: enc.initialKey,
                targets,
                name: `${prog.name}_delta_${deltaK}`,
            });
        }
    }

    return dataset;
}
