
import { noteNames, toNoteNumber, toNoteOctave } from '../../../midi/modules/note.js';
import { mod12 } from '../maths.js';
import keys from '../keys.js';

const accidentals = {
    '-2': '𝄫',
    '-1': '♭',
    '0':  '',
    '1':  '♯',
    '2':  '𝄪'
};

export default function toSpelling(keyname, notename) {
    const n      = toNoteNumber(notename) ;
    const octave = toNoteOctave(notename) ;
    const key    =
        typeof keyname === 'number' ? keys[keyname] :
        typeof keyname === 'string' ? keys.find((key) => key.name === keyname) :
        keyname ;

    const spelling = key.spellings[mod12(n)];
    const name     = noteNames[mod12(n - spelling)];

    if (window.DEBUG && name === undefined) {
        throw new Error('Incorrect spelling for note number ' + n + ': ' + name)
    }

console.log(name + accidentals[spelling] + octave);
    return name + accidentals[spelling] + octave;
}
