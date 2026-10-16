import roundPow2 from "sequence/modules/number/round-pow-2.js";
import { toNoteNumber } from "midi/note.js";
import { classToTpc, toKeyName, tpcToClass } from "./key-tpc.js";

export { roundPow2 };
export const FEATURE_DIM = 32;

/**
 * Maps arbitrary continuous duration in beats to an 8-bucket index [0..7]:
 * - Bucket 0: 1/16 beat (64th note)
 * - Bucket 1: 1/8 beat  (32nd note)
 * - Bucket 2: 1/4 beat  (16th note)
 * - Bucket 3: 1/2 beat  (8th note)
 * - Bucket 4: 1 beat    (Quarter note)
 * - Bucket 5: 2 beats   (Half note)
 * - Bucket 6: 4 beats   (Whole note)
 * - Bucket 7: 8 beats   (Double whole / Breve)
 */
export function durationToBucketIndex(duration) {
    const rounded = roundPow2(duration);
    const clamped = Math.max(1 / 16, Math.min(8, rounded));
    const exp = Math.round(Math.log2(clamped));
    return exp + 4; // exp in [-4..3] -> index in [0..7]
}

/**
 * Maps inter-onset delta beat (time since previous note onset) to 12-bucket index [0..11]:
 * - Bucket 0:  0.0 beat        (Simultaneous chord note)
 * - Bucket 1:  1/16 beat       (64th note gap / rapid ornament)
 * - Bucket 2:  1/8 beat        (32nd note gap)
 * - Bucket 3:  1/4 beat        (16th note gap)
 * - Bucket 4:  1/2 beat        (8th note gap)
 * - Bucket 5:  1 beat          (Quarter note pulse)
 * - Bucket 6:  2 beats         (Half note gap)
 * - Bucket 7:  4 beats         (1 bar gap in 4/4)
 * - Bucket 8:  8 beats         (2 bars gap)
 * - Bucket 9:  16 beats        (4 bars gap)
 * - Bucket 10: 32 beats        (8 bars gap)
 * - Bucket 11: >= 64 beats     (16+ bars / multi-measure rest)
 */
export function deltaToBucketIndex(delta) {
    if (delta <= 1e-5) return 0; // Simultaneous chord note

    const rounded = roundPow2(delta);
    const clamped = Math.max(1 / 16, Math.min(64, rounded));
    const exp = Math.round(Math.log2(clamped)); // -4 to +6
    return exp + 5; // exp in [-4..6] -> index in [1..11]
}

/**
 * Encodes a sequence of events into numeric feature matrices for the BiGRU network:
 * - D_in = 32 dimensions:
 *   - [0..11]:  One-hot Pitch Class (12)
 *   - [12..19]: One-hot Duration Buckets (8)
 *   - [20..31]: One-hot Inter-Onset Delta Timing (12)
 * - Meter-agnostic & Octave-invariant.
 *
 * @param {Array} events - Array of Sequence events
 * @param {Object} [options] - Optional configuration (e.g. initialKey)
 * @returns {Object} { features: Float32Array, noteCount: number, initialKey: number, notes: Array }
 */
export function encode(events, options = {}) {
    let initialKey = options.initialKey ?? 0; // Default to C (0)
    const list = events.events || events;
    const notes = [];

    for (const e of list) {
        const type = e.type || e[1];
        if (type === "key" || type === 5) {
            if (notes.length === 0) {
                initialKey = e[2];
            }
        } else if (type === "note" || type === 2) {
            notes.push(e);
        }
    }

    const T = notes.length;
    if (T === 0) {
        throw new Error("Sequence contains no note events to encode");
    }

    // Allocate flat Float32Array: shape [T x FEATURE_DIM]
    const features = new Float32Array(T * FEATURE_DIM);
    let prevBeat = 0;

    for (let t = 0; t < T; t++) {
        const note = notes[t];
        const beat = Number(note[0]);
        const midi = typeof note[2] === "number" ? note[2] : toNoteNumber(note[2]);
        const duration = Number(note[4]);

        const pitchClass = ((midi % 12) + 12) % 12;
        const offset = t * FEATURE_DIM;

        // 1. One-hot pitch class: features 0..11
        features[offset + pitchClass] = 1.0;

        // 2. One-hot 8-bucket duration: features 12..19
        const durBucket = durationToBucketIndex(duration);
        features[offset + 12 + durBucket] = 1.0;

        // 3. One-hot 12-bucket inter-onset delta timing: features 20..31
        const delta = t === 0 ? 0.0 : Math.max(0.0, beat - prevBeat);
        const deltaBucket = deltaToBucketIndex(delta);
        features[offset + 20 + deltaBucket] = 1.0;

        prevBeat = beat;
    }

    return {
        features,
        noteCount: T,
        initialKey,
        notes,
    };
}

/**
 * Prepares ground truth training target arrays from annotated notes
 *
 * @param {Array} annotatedNotes - Array of { tpc, key } or [tpc, key]
 * @returns {Object} { targetSpelling: Uint32Array, targetKey: Uint32Array }
 */
export function encodeTargets(annotatedNotes) {
    const T = annotatedNotes.length;
    const targetSpelling = new Uint32Array(T);
    const targetKey = new Uint32Array(T);

    for (let t = 0; t < T; t++) {
        const item = annotatedNotes[t];
        const tpc = item.tpc !== undefined ? item.tpc : item[0];
        const key = item.key !== undefined ? item.key : item[1];

        targetSpelling[t] = tpcToClass(tpc);
        targetKey[t] = tpcToClass(key);
    }

    return { targetSpelling, targetKey };
}

/**
 * Decodes model prediction class indices [T] back to note names and TPC coordinates
 *
 * @param {Uint32Array|Array} predSpellingClasses - Predicted spelling class indices [0..34]
 * @param {Uint32Array|Array} [predKeyClasses=null] - Predicted key class indices [0..34]
 * @returns {Array} Array of { tpc, key, name, keyName }
 */
export function decodePredictions(predSpellingClasses, predKeyClasses = null) {
    const T = predSpellingClasses.length;
    const results = [];

    for (let t = 0; t < T; t++) {
        const tpc = classToTpc(predSpellingClasses[t]);
        const key = predKeyClasses ? classToTpc(predKeyClasses[t]) : null;

        results.push({
            tpc,
            key,
            name: toKeyName(tpc),
            keyName: key !== null ? toKeyName(key) : null,
        });
    }

    return results;
}
