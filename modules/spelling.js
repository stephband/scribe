
import nothing from 'fn/nothing.js';
import { noteNames, toNoteNumber, toRootNumber, toNoteOctave } from 'midi/note.js';
import mod12      from './number/mod-12.js';
import keys       from './keys.js';
import { rpitch } from './pitch.js';

const accidentals = {
    '-2': '𝄫',
    '-1': '♭',
    '0':  '',
    '1':  '♯',
    '2':  '𝄪'
};

export function spellRoot(key, pitch) {
    const keyData = keys[key];
    const n = toRootNumber(pitch);
    const a = keyData.spellings[mod12(n)];
    return noteNames[mod12(n - a)] + accidentals[a];
}

export function spellPitch(key, pitch) {
    const keyData = keys[key];
    let n, a, o;

    if (typeof pitch === 'string') {
        let [notename, letter, accidental, octave] = rpitch.exec(pitch) || [pitch];
        if (octave) {
            // pitch is note name like "C4", deconstruct it and put it back together
            n = toNoteNumber(pitch);
            a = keyData.spellings[mod12(n)];
            o = toNoteOctave(n - a);
        }
    }
    else {
        // pitch is a number
        n = pitch;
        a = keyData.spellings[mod12(n)];
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
