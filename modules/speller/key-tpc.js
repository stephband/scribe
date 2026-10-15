import {
  KEYNUMBERS,
  KEYNAMES,
  toKeyName,
  toKeyNumber,
} from 'sequence/modules/event/key.js';

export {
  KEYNUMBERS,
  KEYNAMES,
  toKeyName,
  toKeyNumber,
};

export const NUM_CLASSES = 35; // -15 (F𝄫) to +19 (B𝄪) inclusive
export const TPC_OFFSET = 15;  // Index = coordinate + 15

/**
 * Maps Line-of-Fifths coordinate (-15 to +19) to 0-based Softmax class index (0 to 34)
 */
export function tpcToClass(n) {
  if (n < -15 || n > 19) {
    throw new Error(`TPC coordinate ${n} outside valid range [-15, 19]`);
  }
  return n + TPC_OFFSET;
}

/**
 * Maps 0-based Softmax class index (0 to 34) back to Line-of-Fifths coordinate (-15 to +19)
 */
export function classToTpc(idx) {
  if (idx < 0 || idx >= NUM_CLASSES) {
    throw new Error(`Class index ${idx} outside valid range [0, ${NUM_CLASSES - 1}]`);
  }
  return idx - TPC_OFFSET;
}

export const keyToClass = tpcToClass;
export const classToKey = classToTpc;

/**
 * Calculates MIDI pitch class (0 to 11, where C = 0) from Line-of-Fifths coordinate
 */
export function tpcToMidiPitchClass(n) {
  return ((n * 7) % 12 + 12) % 12;
}

/**
 * Returns the 7-note diatonic window [k - 1, k + 5] for key k
 */
export function getDiatonicRange(k) {
  return { min: k - 1, max: k + 5 };
}

/**
 * Checks if note TPC is diatonic (natural scale tone) in key k
 */
export function isDiatonicInKey(tpc, k) {
  return tpc >= k - 1 && tpc <= k + 5;
}

/**
 * Returns the number of accidentals for a key on the Line of Fifths
 */
export function getAccidentalCount(n) {
  return Math.abs(n);
}
