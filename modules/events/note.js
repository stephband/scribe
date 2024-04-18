
import { toNoteNumber } from '../../../midi/modules/note.js';
import mod12 from '../maths.js';
import toKey from '../keys.js';

const names = {
    0:  'C',
    2:  'D',
    4:  'E',
    5:  'F',
    7:  'G',
    9:  'A',
    11: 'B'
};

const accidentals = {
    '-1': '♭',
    '0':  '',
    '1':  '♯'
};

export function toKeySpelling(key, notename) {
    const k        = toKey(key);
    const n        = toNoteNumber(notename + '0');
console.log('NOTE', n);
    const spelling = k.spellings[mod12(n)];
    const name     = names[mod12(n - spelling)];

    if (window.DEBUG && name === undefined) {
        throw new Error('Incorrect spelling for note number ' + n + ': ' + name)
    }

    return name + accidentals[spelling];
}
