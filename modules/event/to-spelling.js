
import nothing from '../../../fn/modules/nothing.js';
import { noteNames, toRootNumber, toNoteOctave } from '../../../midi/modules/note.js';
import { mod12 } from '../maths.js';
import keys from '../keys.js';

const accidentals = {
    '-2': '𝄫',
    '-1': '♭',
    '0':  '',
    '1':  '♯',
    '2':  '𝄪'
};

const rroot = /^[A-G][b#♭♯𝄫𝄪]?/;

export default function toSpelling(key, note, type, transpose) {
    key = mod12(key + transpose);

    // Make sure key is a key object
    key = typeof key === 'number' ? keys[key] :
        typeof key === 'string' ? keys.find((o) => o.name === key) :
        key ;

    let r, rest;

    if (typeof note === 'string') {
        const root = (rroot.exec(note) || nothing)[0];

        if (window.DEBUG && !root) {
            throw new Error('toSpelling(key, note) note string must start with valid note name "' + note + '"');
        }

        r    = toRootNumber(root);
        rest = note.slice(root.length);
    }
    else {
        r    = toRootNumber(note);
        rest = toNoteOctave(note) || '' ;
    }

    const spelling   = key.spellings[mod12(r + transpose)];
    const name       = noteNames[mod12(r + transpose - spelling)];
    const accidental = accidentals[spelling];

    if (window.DEBUG && name === undefined) {
        throw new Error('Incorrect spelling for note number ' + r + ': ' + name)
    }

/*console.log(note, name + accidental + rest + ' in the key of ' + key.name);*/

    return name + accidental + rest;
}
