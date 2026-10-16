import floorPow2 from "sequence/modules/number/floor-pow-2.js";
import { toNoteNumber } from "midi/note.js";
import { accClassToTpc, classToKey, classToTpc, keyToClass, NUM_KEYS, toKeyName, toKeyNumber, tpcToAccClass } from "./key-tpc.js";

export { floorPow2 };
export const FEATURE_DIM = 24 + NUM_KEYS; // 39 (12 pitch class + 4 duration + 8 delta + 15 key)

/**
 * Maps arbitrary continuous duration in beats to a 4-bucket index [0..3]:
 * - Bucket 0: 1/16 beat (64th note and shorter)
 * - Bucket 1: 1/8 beat  (32nd note)
 * - Bucket 2: 1/4 beat  (16th note)
 * - Bucket 3: >= 1/2 beat (8th note and longer)
 */
export function durationToBucketIndex(duration) {
    const floored = floorPow2(duration);
    const clamped = Math.max(1 / 16, Math.min(1 / 2, floored));
    const exp = Math.round(Math.log2(clamped));
    return exp + 4; // exp in [-4..-1] -> index in [0..3]
}

/**
 * Maps inter-onset delta beat (time since previous note onset) to an 8-bucket index [0..7]:
 * - Bucket 0: < 1/16 beat      (Simultaneous chord note / grace note)
 * - Bucket 1: 1/16 beat        (64th note gap / rapid ornament)
 * - Bucket 2: 1/8 beat         (32nd note gap)
 * - Bucket 3: 1/4 beat         (16th note gap)
 * - Bucket 4: 1/2 beat         (8th note gap)
 * - Bucket 5: 1 beat           (Quarter note pulse)
 * - Bucket 6: 2 beats          (Half note gap)
 * - Bucket 7: >= 4 beats       (1+ bar gap in 4/4)
 */
export function deltaToBucketIndex(delta) {
    if (delta < 1 / 16) return 0; // Simultaneous chord note or < 1/16 beat

    const floored = floorPow2(delta);
    const clamped = Math.max(1 / 16, Math.min(4, floored));
    const exp = Math.round(Math.log2(clamped)); // -4 to +2
    return exp + 5; // exp in [-4..2] -> index in [1..7]
}

/**
 * Encodes a sequence of events into numeric feature matrices for the BiGRU network:
 * - D_in = 39 dimensions:
 *   - [0..11]:  One-hot Pitch Class (12)
 *   - [12..15]: One-hot Duration Buckets (4: 1/16 to 1/2)
 *   - [16..23]: One-hot Inter-Onset Delta Timing (8: 0, 1/16 to 4)
 *   - [24..38]: One-hot Current Key Signature (15, C♭=-7 to C♯=+7)
 * - Meter-agnostic & Octave-invariant.
 *
 * @param {Array} events - Array of Sequence events
 * @param {Object} [options] - Optional configuration (e.g. initialKey)
 * @returns {Object} { features: Float32Array, noteCount: number, initialKey: number, notes: Array }
 */
export function encode(events, options = {}) {
    let initialKey = options.initialKey !== undefined
        ? (typeof options.initialKey === "number" ? options.initialKey : toKeyNumber(options.initialKey))
        : null;
    let currentKey = initialKey ?? 0;

    const list = events.events || events;
    const notes = [];
    const noteKeys = [];

    for (const e of list) {
        const type = e.type || e[1];
        if (type === "key" || type === 5) {
            const keyVal = e[2];
            currentKey = typeof keyVal === "number" ? keyVal : toKeyNumber(keyVal);
            if (initialKey === null) {
                initialKey = currentKey;
            }
        } else if (type === "note" || type === 2) {
            notes.push(e);
            noteKeys.push(currentKey);
        }
    }

    if (initialKey === null) {
        initialKey = 0; // Default to C (0)
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

        // 2. One-hot 4-bucket duration: features 12..15
        const durBucket = durationToBucketIndex(duration);
        features[offset + 12 + durBucket] = 1.0;

        // 3. One-hot 8-bucket inter-onset delta timing: features 16..23
        const delta = t === 0 ? 0.0 : Math.max(0.0, beat - prevBeat);
        const deltaBucket = deltaToBucketIndex(delta);
        features[offset + 16 + deltaBucket] = 1.0;

        // 4. One-hot 15-class current key signature: features 24..38
        const keyClass = keyToClass(noteKeys[t]);
        features[offset + 24 + keyClass] = 1.0;

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

        targetSpelling[t] = tpcToAccClass(tpc);
        targetKey[t] = keyToClass(key);
    }

    return { targetSpelling, targetKey };
}

/**
 * Decodes model prediction class indices [T] back to note names and TPC coordinates
 *
 * @param {Uint32Array|Array} predSpellingClasses - Predicted accidental class indices [0..4]
 * @param {Uint32Array|Array} [predKeyClasses=null] - Predicted key class indices [0..14]
 * @param {Array} [notes=null] - Original note events (used to combine MIDI pitch class with accidental class)
 * @returns {Array} Array of { tpc, key, name, keyName }
 */
export function decodePredictions(predSpellingClasses, predKeyClasses = null, notes = null) {
    const T = predSpellingClasses.length;
    const results = [];

    for (let t = 0; t < T; t++) {
        const note = notes ? notes[t] : null;
        const midi = note ? (note[2] !== undefined ? note[2] : (note.pitch ?? note.midi ?? note)) : null;
        const tpc = midi !== null && midi !== undefined
            ? accClassToTpc(predSpellingClasses[t], midi)
            : classToTpc(predSpellingClasses[t]);
        const key = predKeyClasses ? classToKey(predKeyClasses[t]) : null;

        results.push({
            tpc,
            key,
            name: toKeyName(tpc),
            keyName: key !== null ? toKeyName(key) : null,
        });
    }

    return results;
}
