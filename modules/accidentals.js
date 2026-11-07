
import { toKeyNumber }   from 'sequence/modules/event/key.js';
import { fathercharles } from './pitch.js';

const sharpRoots = fathercharles.slice(0, 7).map((p) => p[0]);
const flatRoots  = fathercharles.slice(7, 14).map((p) => p[0]);


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
