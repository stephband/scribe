
import * as glyphs from "../glyphs.js";
import { toNoteName, toRootNumber, toRootName } from 'midi/note.js';
import { keyToNumbers } from '../keys.js';
import { rflatsharp, byFatherCharlesPitch, accidentalChars } from '../pitch.js';
import { major } from '../scale.js';
import Stave       from './stave.js';


const global = globalThis || window;
const assign = Object.assign;


/**
A simple piano grand stave which brute splits treble from bass at Bb3.
**/

export default class PianoStave extends Stave {
    type = 'piano';
    rows = [
        "rh-A6 soprano-A6 alto-A6",
        "rh-G6 soprano-G6 alto-G6",
        "rh-F6 soprano-F6 alto-F6",
        "rh-E6 soprano-E6 alto-E6",
        "rh-D6 soprano-D6 alto-D6",
        "rh-C6 soprano-C6 alto-C6",
        "rh-B5 soprano-B5 alto-B5",
        "rh-A5 soprano-A5 alto-A5",
        "rh-G5 soprano-G5 alto-G5",
        "rh-F5 soprano-F5 alto-F5",
        "rh-E5 soprano-E5 alto-E5",
        "rh-D5 soprano-D5 alto-D5",
        "rh-C5 soprano-C5 alto-C5",
        "rh-B4 soprano-B4 alto-B4",
        "rh-A4 soprano-A4 alto-A4",
        "rh-G4 soprano-G4 alto-G4",
        "rh-F4 soprano-F4 alto-F4",
        "rh-E4 soprano-E4 alto-E4",
        "rh-D4 soprano-D4 alto-D4",
        "rh-C4 soprano-C4 alto-C4",
        "rh-B3 soprano-B3 alto-B3",
        "lh-B4 rh-A3 soprano-A3 alto-A3 tenor-B4 bass-B4",
        "lh-A4 rh-G3 soprano-G3 alto-G3 tenor-A4 bass-A4",
        "lh-G4 rh-F3 soprano-F3 alto-F3 tenor-G4 bass-G4",
        "lh-F4 rh-E3 soprano-E3 alto-E3 tenor-F4 bass-F4",
        "lh-E4 rh-D3 soprano-D3 alto-D3 tenor-E4 bass-E4",
        "lh-D4 tenor-D4 bass-D4",
        "lh-C4 tenor-C4 bass-C4",
        "lh-B3 tenor-B3 bass-B3",
        "lh-A3 tenor-A3 bass-A3",
        "lh-G3 tenor-G3 bass-G3",
        "lh-F3 tenor-F3 bass-F3",
        "lh-E3 tenor-E3 bass-E3",
        "lh-D3 tenor-D3 bass-D3",
        "lh-C3 tenor-C3 bass-C3",
        "lh-B2 tenor-B2 bass-B2",
        "lh-A2 tenor-A2 bass-A2",
        "lh-G2 tenor-G2 bass-G2",
        "lh-F2 tenor-F2 bass-F2",
        "lh-E2 tenor-E2 bass-E2",
        "lh-D2 tenor-D2 bass-D2",
        "lh-C2 tenor-C2 bass-C2",
        "lh-B1 tenor-B1 bass-B1",
        "lh-A1 tenor-A1 bass-A1",
        "lh-G1 tenor-G1 bass-G1",
        "lh-F1 tenor-F1 bass-F1",
        "lh-E1 tenor-E1 bass-E1"
    ];

    getTimeSigHTML(numerator, denominator, eventId) {
        return `<span class="timesig" data-event="${ eventId }" data-part="rh">
            <sup>${ glyphs['timeSig' + numerator] }</sup>
            <sub>${ glyphs['timeSig' + denominator] }</sub>
        </span>
        <span class="timesig" data-event="${ eventId }" data-part="lh">
            <sup>${ glyphs['timeSig' + numerator] }</sup>
            <sub>${ glyphs['timeSig' + denominator] }</sub>
        </span>`;
    }

    staffs = ['bass', 'treble'];

    parts = [{}, {
        name:      'lh',
        staff:     'bass',
        topRow:    29,
        centerRow: 33,
        bottomRow: 38
    }, {
        name:      'rh',
        staff:     'treble',
        topRow:    9,
        centerRow: 13,
        bottomRow: 18
    }, {
        // Voice range C4-C6
        // Soprano sax Ab3-Eb6
        // Trumpet F#3-C6
        name:      'soprano',
        staff:     'treble',
        topRow:    9,
        centerRow: 13,
        bottomRow: 18,
        stemup:    true
    }, {
        // Voice range G3-G5
        // Flugel horn E3-Bb5
        // Alto sax rannge Db3-Ab5
        name:      'alto',
        staff:     'treble',
        topRow:    9,
        centerRow: 13,
        bottomRow: 18,
        stemup:    false
    }, {
        // Voice range C3-C5
        // Tenor Sax range Ab2-Eb5
        name:      'tenor',
        staff:     'bass',
        topRow:    29,
        centerRow: 33,
        bottomRow: 38,
        stemup:    true
    }, {
        // Voice range E2-C4
        // Trombone range E2-Bb4
        // Sousaphone Eb1-Bb4
        name:      'bass',
        staff:     'bass',
        topRow:    29,
        centerRow: 33,
        bottomRow: 38,
        stemup:    false
    }];

    /**
    .getRow(part, pitch)
    Returns the row index of a given pitch name or number.
    **/
    getRow(part, pitch) {
        pitch = typeof pitch === 'string' ? pitch : toNoteName(pitch) ;
        const name = part.name + '-' + pitch.replace(rflatsharp, '');
        const i = this.rows.findIndex((row) => row.includes(name));
        if (global.DEBUG && i === -1) throw new Error('Pitch "' + name + '" is not supported by ' + this.constructor.name);
        if (i === -1) console.warn('Pitch "' + name + '" is not supported by ' + this.constructor.name);
        return i > -1 ? i : undefined ;
    }

    getPart(number) {
        return typeof number === 'number' ?
            number < 60 ?
                this.parts[1] :
                this.parts[2] :
            /[012]$|[AC-G][b#♭♯𝄫𝄪]*3$/.test(number) ?
                this.parts[1] :
                this.parts[2] ;
    }

    createKeySymbols(key) {
        const symbols = [];
console.trace('IS NUMBER? MAKE SURE ITS A KEY NUMBER, NOT ROOT', key);
        const numbers = keyToNumbers(key);
        const keysig  = numbers
            .map((n, i) => (n - major[i] && {
                type: 'acci',
                pitch: toRootName(major[i]) + accidentalChars[n - major[i]],
                value: n - major[i]
            }))
            .filter((o) => !!o)
            .sort(byFatherCharlesPitch);

        // Add key signature to both staffs
        symbols.push.apply(symbols, keysig.map((symbol) => assign({ part: this.parts[1] }, symbol)));
        symbols.push.apply(symbols, keysig.map((symbol) => assign({ part: this.parts[2] }, symbol)));

        return symbols;
    }

    createSignatureSymbols(key) {
        const symbols = [{
            type:  'clef',
            clef:  'treble',
            part:  this.parts[1],
            stave: this
        }, {
            type:  'clef',
            clef:  'bass',
            part:  this.parts[2],
            stave: this
        }];

        return symbols.concat(this.createKeySymbols(key));
    }
}
