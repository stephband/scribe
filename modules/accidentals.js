
import { toRootName }   from 'midi/note.js';
import { keyToNumbers } from './keys.js';
import { major }        from './scale.js';


/* Accidentals */

function intoAccidentals(accidentals, n, i) {
    const acci = n - major[i];
    if (acci !== 0) {
        const name = toRootName(major[i]);
        let n = 10;
        while (n--) accidentals[name + n] = acci;
    }
    return accidentals;
}

export function accidentalsFromKey(key) {
    const numbers = keyToNumbers(key);
    return numbers.reduce(intoAccidentals, {});
}
