
import nothing from '../../../fn/modules/nothing.js';
import { noteNames, toNoteNumber, toRootNumber, toNoteOctave } from '../../../midi/modules/pitch.js';
import { mod12 } from '../maths.js';
import keys from '../keys.js';

const accidentals = {
    '-2': '𝄫',
    '-1': '♭',
    '0':  '',
    '1':  '♯',
    '2':  '𝄪'
};

const rpitch = /^[A-G][b#♭♯𝄫𝄪]?(-?\d)?$/;

export default function toSpelling(key, pitch, type, transpose = 0) {
    // Make sure key is a key object
    key = typeof key === 'number' ? keys[key] :
        typeof key === 'string' ? keys.find((o) => o.name === key) :
        key ;

    let n, a, o;

    if (typeof pitch === 'string') {
        let [name, octave] = rpitch.exec(pitch) || [name];

        if (octave) {
            // pitch is note name, deconstruct it and put it back together
            n = toNoteNumber(pitch) + transpose;
            a = key.spellings[mod12(n)];
            o = toNoteOctave(n - a);
        }
        else {
            // pitch is kay name
            n = toRootNumber(pitch) + transpose;
            a = key.spellings[mod12(n)];
            o = '';
        }
    }
    else {
        // pitch is a number
        n = pitch + transpose;
        a = key.spellings[mod12(n)];
        o = toNoteOctave(n - a);
    }

    // key.spellings makes sure name is a natural note name
    const name = noteNames[mod12(n - a)];
    const accidental = accidentals[a];

    if (window.DEBUG && name === undefined) {
        throw new Error('Incorrect spelling for pitch number ' + n + ': "' + name + '"')
    }

    return name + accidental + o;
}
