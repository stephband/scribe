import {
  KEYNUMBERS,
  KEYNAMES,
  toKeyName,
  toKeyNumber,
} from 'sequence/modules/event/key.js';
import { toNoteNumber } from 'midi/note.js';

export {
  KEYNUMBERS,
  KEYNAMES,
  toKeyName,
  toKeyNumber,
};

export const NUM_TPCS = 35;    // -15 (F𝄫) to +19 (B𝄪) inclusive
export const TPC_OFFSET = 15;  // Index = coordinate + 15
export const NUM_CLASSES = NUM_TPCS;

export const NUM_KEYS = 15;    // -7 (C♭) to +7 (C♯) inclusive
export const KEY_OFFSET = 7;   // Index = key + 7

/**
 * Maps Line-of-Fifths TPC coordinate (-15 to +19) to 0-based Softmax class index (0 to 34)
 */
export function tpcToClass(n) {
  const num = typeof n === "number" ? n : toKeyNumber(String(n).replace(/\d+$/, ""));
  if (num < -15 || num > 19) {
    throw new Error(`TPC coordinate ${num} outside valid range [-15, 19]`);
  }
  return num + TPC_OFFSET;
}

/**
 * Maps 0-based Softmax class index (0 to 34) back to Line-of-Fifths TPC coordinate (-15 to +19)
 */
export function classToTpc(idx) {
  if (idx < 0 || idx >= NUM_TPCS) {
    throw new Error(`TPC class index ${idx} outside valid range [0, ${NUM_TPCS - 1}]`);
  }
  return idx - TPC_OFFSET;
}

/**
 * Maps Key signature coordinate (-7 to +7) to 0-based class index (0 to 14)
 */
export function keyToClass(n) {
  const num = typeof n === "number" ? n : toKeyNumber(String(n).replace(/\d+$/, ""));
  if (num < -7 || num > 7) {
    throw new Error(`Key coordinate ${num} outside valid range [-7, 7]`);
  }
  return num + KEY_OFFSET;
}

/**
 * Maps 0-based class index (0 to 14) back to Key signature coordinate (-7 to +7)
 */
export function classToKey(idx) {
  if (idx < 0 || idx >= NUM_KEYS) {
    throw new Error(`Key class index ${idx} outside valid range [0, ${NUM_KEYS - 1}]`);
  }
  return idx - KEY_OFFSET;
}

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

const letters = ["F", "C", "G", "D", "A", "E", "B"];
const basePcs = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const accChars = { "-2": "𝄫", "-1": "♭", "0": "", "1": "♯", "2": "𝄪" };

/**
 * Maps MIDI note number (or pitch string) and Line-of-Fifths TPC (-15..19)
 * to a spelled pitch string with Unicode accidentals (e.g. "C4", "C♯4", "D♭4")
 */
export function tpcToSpelledPitch(midi, tpc) {
  const midiNum = typeof midi === "string" ? toNoteNumber(midi) : midi;
  const letter = letters[((tpc + 1) % 7 + 7) % 7];
  const accOffset = Math.floor((tpc + 1) / 7);
  const basePc = basePcs[letter];
  const octave = Math.round((midiNum - basePc - accOffset) / 12) - 1;
  const acc = accChars[accOffset] ?? "";
  return letter + acc + octave;
}
