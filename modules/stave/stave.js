
import nothing        from 'fn/nothing.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import { toKeyScale } from '../keys.js';
import { spellRoot, spellPitch } from '../spelling.js';
import { rflatsharp, byFatherCharlesPitch, accidentalChars } from '../pitch.js';
import config      from '../config.js';
import { major }   from '../scale.js';
import * as glyphs from "../glyphs.js";


const global = globalThis || window;
const assign = Object.assign;
const { floor, round } = Math;


/* Stave */

export default class Stave {
    constructor() {}

    /**
    .pitched
    A boolean indicating whether this stave supports keys and transposition.
    **/
    pitched = true;

    /**
    .rows
    An array of row names, from bottom to top of stave. Row names must correspond
    to those defined for a given stave in CSS.
    **/
    rows = nothing;

    /**
    .getNoteHTML(pitch, dynamic, duration)
    Get the HTML content used for a note of given `pitch`, `dynamic` and
    `duration`. For normal chromatic staves only `duration` really matters, but
    percussion staves may replace heads based on pitch and dynamics.
    **/

    getHeadHTML(pitch, dynamic, duration) {
        const name =
            // Semibreve
            duration >= 4 ? 'head4' :
            // Triplet semibreve
            Math.fround(duration) === Math.fround(2.666666667) ? 'head4' :
            // Minim
            duration >= 2 ? 'head2' :
            // Triplet minim
            Math.fround(duration) === Math.fround(1.333333333) ? 'head2' :
            // Everything else
            'head1' ;

        return `<span class="head" data-glyph="${ name }">${ glyphs[name] }</span>`;
    }

    getNoteHTML(pitch, dynamic, duration) {
        return dynamic < config.ghostThreshold ? `
            <span class="pre" data-glyph="headBracketLeft">${ glyphs.headBracketLeft }</span>
            ${ this.getHeadHTML(pitch, dynamic, duration) }
            <span class="post" data-glyph="headBracketRight">${ glyphs.headBracketRight }</span>` :
            this.getHeadHTML(pitch, dynamic, duration) ;
    }

    /**
    .minRow, .bottomRow, .centerRow, .topRow, .maxRow
    Minimum and maximum row numbers supported by the stave. Note that `.minRow`
    is greater than `.maxRow`. We are counting rows in pitch order.
    **/

    get maxRow()    { return 0; }
    get topRow()    { return this.centerRow - 4; }
    get centerRow() { return floor(0.5 * (this.rows.length - 1)); }
    get bottomRow() { return this.centerRow + 5; }
    get minRow()    { return this.rows.length - 1; }

    /**
    .minPitch, .bottomPitch, .centerPitch, .topPitch, .maxPitch
    Minimum and maximum pitch names supported by the stave corresponding to the
    first and last row names in `.rows`, and lower, middle and upper stave pitches
    corresponding to the lower, middle and upper lines of the stave.
    **/

    get maxPitch()    { return this.rows[this.maxRow]; }
    get topPitch()    { return this.rows[this.topRow]; }
    get centerPitch() { return this.rows[this.centerRow]; }
    get bottomPitch() { return this.rows[this.bottomRow]; }
    get minPitch()    { return this.rows[this.minRow]; }

    /**
    .movePitch(pitch, n)
    Chromatically transpose `pitch` by `n` semitones within the bounds of
    `.minPitch` and `.maxPitch`. Should a transposed pitch fall outside this
    range, returns `undefined`.
    **/
    movePitch(pitch, n) {
        // Chromatic transpose
        const min    = toNoteNumber(this.minPitch);
        const max    = toNoteNumber(this.maxPitch);
        const number = toNoteNumber(pitch) + n;
        // Don't transpose outside the limits of the stave
        return number >= min && number <= max ?
            number :
            undefined ;
    }

    /**
    .getPart(pitch)
    **/

    parts = [{
        name: 'main'
    }];

    getPart(number) {
        return this.parts[0];
    }

    /**
    .getRow(part, pitch)
    Returns the row index of a given pitch name or number. Multi-staff staves
    require part to know which staff they are positioned upon.
    **/
    getRow(part, pitch) {
        const name = typeof pitch === 'string' ? pitch : toNoteName(pitch) ;
        const row  = name.replace(rflatsharp, '');
        const i    = this.rows.indexOf(row);
        if (global.DEBUG && i === -1) throw new Error('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        if (i === -1) console.warn('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        return i > -1 ? i : undefined ;
    }

    /**
    .getPitch(row)
    Returns the pitch of a given row number.
    **/
    getPitch(row) {
        const names = this.rows[row];
        return names ?
            names.split(/\s+/)[0] :
            undefined ;
    }

    /**
    .getSpelling()
    Gets spelling of a given pitch. Returns a pitch name string.
    **/
    getSpelling(key, event) {
        return event[1] === 'chord' ?
            spellRoot(key, event[2]) :
            spellPitch(key, event[2]) ;
    }

    createKeySymbols(key) {
        const symbols   = [];
        const keynumber = toRootNumber(key);
        const keyscale  = toKeyScale(keynumber);

        // Add key signature
        symbols.push.apply(symbols, keyscale
            .map((n, i) => (n - major[i] && {
                type:  'acci',
                pitch: toRootName(major[i]) + accidentalChars[n - major[i]],
                value: n - major[i],
                part:  this.parts[0]
            }))
            .filter((o) => !!o)
            .sort(byFatherCharlesPitch)
        );

        return symbols;
    }

    createSignatureSymbols(key) {
        const symbols   = [{
            type: 'clef',
            clef: this.type,
            part: this.parts[0]
        }];

        return symbols.concat(this.createKeySymbols(key));
    }

    /**
    .yRatioToPitch(y)
    Used for converting pointer movements to pitch changes.
    **/
    yRatioToPitch(y) {
        const n = floor(y * this.pitches.length);
        return n < 0 ? this.pitches[0] :
            n > this.pitches.length - 1 ? this.pitches[this.pitches.length - 1] :
            this.pitches[n] ;
    }
}
