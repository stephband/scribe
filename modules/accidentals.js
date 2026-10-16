
import { toKeyNumber }   from 'sequence/modules/event/key.js';
import { fathercharles } from './pitch.js';

const sharpRoots = fathercharles.slice(0, 7).map((p) => p[0]);
const flatRoots  = fathercharles.slice(7, 14).map((p) => p[0]);


/* Accidentals */

export function accidentalsFromKey(key) {
    const keyNum = key && key[2] !== undefined ? key[2] : key;
    const k      = typeof keyNum === 'number' ? keyNum : toKeyNumber(keyNum || 0);
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
