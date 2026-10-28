import floorPow2 from "sequence/modules/number/floor-pow-2.js";
import { toKeyName, toKeyNumber } from "sequence/modules/event/key.js";
import { toChordHSID, toChordName } from "sequence/modules/event/chord.js";
import { hsidToNumbers } from "sequence/modules/harmony/hsid.js";
import { toNoteNumber, toRootNumber } from "midi/note.js";
import { accidentalToTpc, classToKey, inKeyToClass, keyToClass, NUM_IN_KEYS, tpcToAccClass, tpcToSpelledPitch, tpcToSpelledRoot } from "./key-tpc.js";

export const FEATURE_DIM = 24 + NUM_IN_KEYS; // 39 (12 pitch class + 4 duration + 8 delta + 15 key)

const rslashbass = /\/\{(\d{1,2})\}$/;

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
    let T = 0;

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
            T += 1;
        } else if (type === "chord" || type === 7) {
            const hsid = typeof e[3] === "number" ? e[3] : toChordHSID(e[3]);
            const numbers = hsidToNumbers(hsid);
            notes.push(e);
            noteKeys.push(currentKey);
            T += numbers.length;
        }
    }

    if (initialKey === null) {
        initialKey = 0; // Default to C (0)
    }

    if (T === 0) {
        throw new Error("Sequence contains no note events to encode");
    }

    // Allocate flat Float32Array: shape [T x FEATURE_DIM]
    const features = new Float32Array(T * FEATURE_DIM);
    let prevBeat = 0;
    let t = 0;

    for (let i = 0; i < notes.length; i++) {
        const event = notes[i];
        const type = event.type || event[1];
        const beat = Number(event[0]);
        const duration = Number(event[4]);
        const durBucket = durationToBucketIndex(duration);
        const keyClass = inKeyToClass(noteKeys[i]);

        if (type === "chord" || type === 7) {
            const root = typeof event[2] === "number" ? event[2] : toRootNumber(event[2]);
            const hsid = typeof event[3] === "number" ? event[3] : toChordHSID(event[3]);
            const numbers = hsidToNumbers(hsid);

            for (let k = 0; k < numbers.length; k++) {
                const pitchClass = (((root + numbers[k]) % 12) + 12) % 12;
                const offset = t * FEATURE_DIM;

                // 1. One-hot pitch class: features 0..11
                features[offset + pitchClass] = 1.0;

                // 2. One-hot 4-bucket duration: features 12..15
                features[offset + 12 + durBucket] = 1.0;

                // 3. One-hot 8-bucket inter-onset delta timing: features 16..23
                const delta = t === 0 ? 0.0 : Math.max(0.0, beat - prevBeat);
                const deltaBucket = deltaToBucketIndex(delta);
                features[offset + 16 + deltaBucket] = 1.0;

                // 4. One-hot 15-class current key signature: features 24..38
                features[offset + 24 + keyClass] = 1.0;

                prevBeat = beat;
                t++;
            }
        } else {
            const midi = typeof event[2] === "number" ? event[2] : toNoteNumber(event[2]);
            const pitchClass = ((midi % 12) + 12) % 12;
            const offset = t * FEATURE_DIM;

            // 1. One-hot pitch class: features 0..11
            features[offset + pitchClass] = 1.0;

            // 2. One-hot 4-bucket duration: features 12..15
            features[offset + 12 + durBucket] = 1.0;

            // 3. One-hot 8-bucket inter-onset delta timing: features 16..23
            const delta = t === 0 ? 0.0 : Math.max(0.0, beat - prevBeat);
            const deltaBucket = deltaToBucketIndex(delta);
            features[offset + 16 + deltaBucket] = 1.0;

            // 4. One-hot 15-class current key signature: features 24..38
            features[offset + 24 + keyClass] = 1.0;

            prevBeat = beat;
            t++;
        }
    }

    return {
        features,
        noteCount: T,
        initialKey,
        notes,
    };
}

/**
 * Prepares ground truth training target arrays keyed by head name ("spelling", "key")
 *
 * @param {Array} annotatedNotes - Array of { tpc, key } or [tpc, key]
 * @returns {Object} { spelling: Uint32Array, key: Uint32Array }
 */
export function encodeTargets(annotatedNotes) {
    const T = annotatedNotes.length;
    const spelling = new Uint32Array(T);
    const key = new Uint32Array(T);

    for (let t = 0; t < T; t++) {
        const item = annotatedNotes[t];
        const tpcVal = item.tpc !== undefined ? item.tpc : item[0];
        const keyVal = item.key !== undefined ? item.key : item[1];

        spelling[t] = tpcToAccClass(tpcVal);
        key[t] = keyToClass(keyVal);
    }

    return { spelling, key };
}

/**
 * Decodes model prediction class indices [T] back to note names and TPC coordinates
 *
 * @param {Uint32Array|Array} accidentals - Predicted accidental class indices [0..4]
 * @param {Uint32Array|Array} [keys=null] - Predicted key class indices [0..24]
 * @param {Array} notes - Original note and chord events
 * @returns {Array} Array of events with assigned spelling properties
 */
export function decodePredictions(accidentals, keys, notes) {
    let i = -1;
    let t = 0;
    while (++i < notes.length) {
        const event = notes[i];
        const type  = event.type || event[1];

        if (type === "chord" || type === 7) {
            const root      = typeof event[2] === "number" ? event[2] : toRootNumber(event[2]);
            const hsid      = typeof event[3] === "number" ? event[3] : toChordHSID(event[3]);
            const numbers   = hsidToNumbers(hsid);
            const extension = event.extension ?? toChordName(hsid);
            const slashbass = rslashbass.exec(extension);
            const tpc       = accidentalToTpc(accidentals[t], root);

            event.tpc         = tpc;
            event.keySpelling = classToKey(keys[t]);

            if (slashbass) {
                const n       = parseInt(slashbass[1], 10);
                const k       = numbers.indexOf(12 - n);
                const rootNum = (root + 12 - n) % 12;
                const rootTpc = accidentalToTpc(accidentals[t + (k > -1 ? k : 0)], rootNum);
                event.rootSpelling = tpcToSpelledRoot(rootTpc);
                event.bassSpelling = tpcToSpelledRoot(tpc);
            } else {
                event.rootSpelling = tpcToSpelledRoot(tpc);
            }

            t += numbers.length;
        } else {
            const tpc = accidentalToTpc(accidentals[t], event[2]);

            event.tpc           = tpc;
            event.keySpelling   = classToKey(keys[t]);
            event.pitchSpelling = tpcToSpelledPitch(event[2], tpc);
            t += 1;
        }
    }

    return notes;
}
