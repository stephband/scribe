
import { toKeyNumber }   from 'sequence/modules/event/key.js';

export const fathercharles = [
    // Father Charles Goes Down And Ends Battle,
    'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯',
    // Battle Ends And Down Goes Charles Father
    'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'
];

const sharpRoots = fathercharles.slice(0, 7).map((p) => p[0]);
const flatRoots  = fathercharles.slice(7, 14).map((p) => p[0]);

/*
export function byFatherCharlesPitch(a, b) {
    const ai = fathercharles.indexOf(a.pitch);
    const bi = fathercharles.indexOf(b.pitch);
    return ai > bi ? 1 : ai < bi ? -1 : 0;
}
*/

/**
accidentalsFromKey(key)
Returns a map of natural root numbers against `1` or `-1` to denote sharps
or flats.
**/

export function accidentalsFromKey(key) {
    const k = toKeyNumber(key);
    const accidentals = {};

    if (k > 0) {
        const count = Math.min(k, 7);
        for (let i = 0; i < count; i++) {
            const root = sharpRoots[i];
            let n = 10;
            while (n--) accidentals[root + n] = 1;
        }
    }
    else if (k < 0) {
        const count = Math.min(-k, 7);
        for (let i = 0; i < count; i++) {
            const root = flatRoots[i];
            let n = 10;
            while (n--) accidentals[root + n] = -1;
        }
    }

    return accidentals;
}
