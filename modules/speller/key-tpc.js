import { toKeyNumber } from 'sequence/modules/event/key.js';
import { toNoteNumber } from 'midi/note.js';

export const NUM_IN_KEYS   = 15;  // -7 (C♭) to +7 (C♯) inclusive
export const IN_KEY_OFFSET = 7;   // Index = key + 7

export const NUM_KEYS   = 25;     // -12 (D𝄫) to +12 (B♯) inclusive
export const KEY_OFFSET = 12;     // Index = key + 12

export const NUM_ACCIDENTALS = 5; // -2 (𝄫), -1 (♭), 0 (♮), +1 (♯), +2 (𝄪)
export const ACC_OFFSET = 2;      // Index = accOffset + 2 in [0..4]

/**
 * Maps input Key signature coordinate (-7 to +7) to 0-based feature index (0 to 14)
 */
export function inKeyToClass(n) {
  const num = typeof n === "number" ? n : toKeyNumber(String(n).replace(/\d+$/, ""));
  if (num < -7 || num > 7) {
    throw new Error(`Input key coordinate ${num} outside valid range [-7, 7]`);
  }
  return num + IN_KEY_OFFSET;
}

/**
 * Maps output local Key coordinate (-12 to +12) to 0-based class index (0 to 24)
 */
export function keyToClass(n) {
  const num = typeof n === "number" ? n : toKeyNumber(String(n).replace(/\d+$/, ""));
  if (num < -12 || num > 12) {
    throw new Error(`Key coordinate ${num} outside valid range [-12, 12]`);
  }
  return num + KEY_OFFSET;
}

/**
 * Maps 0-based class index (0 to 24) back to Key signature coordinate (-12 to +12)
 */
export function classToKey(idx) {
  if (idx < 0 || idx >= NUM_KEYS) {
    throw new Error(`Key class index ${idx} outside valid range [0, ${NUM_KEYS - 1}]`);
  }
  return idx - KEY_OFFSET;
}

/**
 * Maps Line-of-Fifths TPC coordinate (-15 to +19) to 0-based accidental class index (0 to 4)
 * representing [𝄫, ♭, ♮, ♯, 𝄪]
 */
export function tpcToAccClass(n) {
  const num = typeof n === "number" ? n : toKeyNumber(String(n).replace(/\d+$/, ""));
  if (num < -15 || num > 19) {
    throw new Error(`TPC coordinate ${num} outside valid range [-15, 19]`);
  }
  const accOffset = Math.floor((num + 1) / 7); // -2..+2
  return accOffset + ACC_OFFSET;
}

/**
 * Maps 0-based accidental class index (0 to 4) and MIDI note / pitch class
 * back to the exact Line-of-Fifths TPC coordinate (-15 to +19).
 * If the predicted accidental bucket does not contain a spelling for the given
 * pitch class, snaps to the nearest valid accidental bucket for that pitch class.
 */
export function accidentalToTpc(accClass, midi) {
  if (accClass < 0 || accClass >= NUM_ACCIDENTALS) {
    throw new Error(`Accidental class index ${accClass} outside valid range [0, ${NUM_ACCIDENTALS - 1}]`);
  }
  const midiNum = typeof midi === "string" ? toNoteNumber(midi) : midi;
  const pc = ((midiNum % 12) + 12) % 12;

  let bestTpc = 0;
  let bestDist = Infinity;

  for (let tpc = -15; tpc <= 19; tpc++) {
    if ((((tpc * 7) % 12) + 12) % 12 === pc) {
      const candidateAccClass = Math.floor((tpc + 1) / 7) + ACC_OFFSET;
      const dist = Math.abs(candidateAccClass - accClass);
      if (dist < bestDist || (dist === bestDist && Math.abs(tpc) < Math.abs(bestTpc))) {
        bestDist = dist;
        bestTpc = tpc;
      }
    }
  }

  return bestTpc;
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
