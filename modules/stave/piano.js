
import * as glyphs from "../glyphs.js";
import { toNoteName, toRootNumber, toRootName } from 'midi/note.js';
import { toKeyScale } from '../keys.js';
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
        "rh-A6",
        "rh-G6",
        "rh-F6",
        "rh-E6",
        "rh-D6",
        "rh-C6",
        "rh-B5",
        "rh-A5",
        "rh-G5",
        "rh-F5",
        "rh-E5",
        "rh-D5",
        "rh-C5",
        "rh-B4",
        "rh-A4",
        "rh-G4",
        "rh-F4",
        "rh-E4",
        "rh-D4",
        "rh-C4",
        "rh-B3",
        "lh-B4 rh-A3",
        "lh-A4 rh-G3",
        "lh-G4 rh-F3",
        "lh-F4 rh-E3",
        "lh-E4 rh-D3",
        "lh-D4",
        "lh-C4",
        "lh-B3",
        "lh-A3",
        "lh-G3",
        "lh-F3",
        "lh-E3",
        "lh-D3",
        "lh-C3",
        "lh-B2",
        "lh-A2",
        "lh-G2",
        "lh-F2",
        "lh-E2",
        "lh-D2",
        "lh-C2",
        "lh-B1",
        "lh-A1",
        "lh-G1",
        "lh-F1",
        "lh-E1"
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

    parts = [{}, {
        name:        'lh',
        topRow:      29,
        centerRow:   33,
        bottomRow:   38,
        topPitch:    'A3',
        centerPitch: 'D3',
        bottomPitch: 'G2',
        stemup: false,
        DEFAULT: true
    }, {
        name:        'rh',
        topRow:      9,
        centerRow:   13,
        bottomRow:   18,
        topPitch:    'F5',
        centerPitch: 'B4',
        bottomPitch: 'E4',
        DEFAULT: true
    }, {
        name:        'soprano',
        topRow:      9,
        centerRow:   13,
        bottomRow:   18,
        topPitch:    'F5',
        centerPitch: 'B4',
        bottomPitch: 'E4',
        stemup: true
    }, {
        name:        'alto',
        topRow:      9,
        centerRow:   13,
        bottomRow:   18,
        topPitch:    'F5',
        centerPitch: 'B4',
        bottomPitch: 'E4',
        stemup: false
    }, {
        name:        'tenor',
        topRow:      29,
        centerRow:   33,
        bottomRow:   38,
        topPitch:    'A3',
        centerPitch: 'D3',
        bottomPitch: 'G2',
        stemup: true
    }, {
        name:        'bass',
        topRow:      29,
        centerRow:   33,
        bottomRow:   38,
        topPitch:    'A3',
        centerPitch: 'D3',
        bottomPitch: 'G2',
        stemup: false
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
        const symbols   = [];
        const keynumber = toRootNumber(key);
        const keyscale  = toKeyScale(keynumber);
        const keysig    = keyscale
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
            type: 'clef',
            clef: 'treble',
            part: this.parts[1],
            stave: this
        }, {
            type: 'clef',
            clef: 'bass',
            part: this.parts[2],
            stave: this
        }];

        return symbols.concat(this.createKeySymbols(key));
    }
}
