
import nothing from 'fn/nothing.js';
import { noteNames, toNoteNumber, toRootNumber, toNoteOctave } from 'midi/note.js';
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

export default function toSpelling(keynumber, event, transpose = 0) {
    const key = keys[mod12(keynumber + transpose)];
    let n, a, o;

    if (typeof event[2] === 'string') {
        let [notename, octave] = rpitch.exec(event[2]) || [event[2]];

        if (octave) {
            // pitch is note name like "C4", deconstruct it and put it back together
            n = toNoteNumber(event[2]) + transpose;
            a = key.spellings[mod12(n)];
            o = toNoteOctave(n - a);
        }
        else {
            // pitch is root name like "C"
            n = toRootNumber(event[2]) + transpose;
            a = key.spellings[mod12(n)];
            o = '';
        }
    }
    else if (event[1] === 'chord') {
        // pitch is root name like "C"
        n = toRootNumber(event[2]) + transpose;
        a = key.spellings[mod12(n)];
        o = '';
    }
    else {
        // pitch is a number
        n = event[2] + transpose;
        a = key.spellings[mod12(n)];
        o = toNoteOctave(n - a);
    }

    // key.spellings makes sure name is a natural note name
    const name = noteNames[mod12(n - a)];
    const accidental = accidentals[a];

    if (window.DEBUG && name === undefined) {
        throw new Error('Incorrect spelling for pitch number ' + n + ': "' + name + '"');
    }

    return name + accidental + o;
}
