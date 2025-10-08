
import nothing        from 'fn/nothing.js';
import { toNoteName, toNoteNumber, toNoteOctave } from 'midi/note.js';
import { spellRoot, spellPitch } from '../spelling.js';
import { rflatsharp } from '../pitch.js';
import * as glyphs    from "../glyphs.js";

const assign = Object.assign;
const { round } = Math;


/* Stave */

export default class Stave {
    constructor() {}

    /**
    .clef
    String containing single clef glyph.
    **/
    clef = '';

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

    getNoteHTML(pitch, dynamic, duration) {
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

    /**
    .minPitch, .bottomPitch, .centerPitch, .topPitch, .maxPitch
    Minimum and maximum pitch names supported by the stave corresponding to the
    first and last row names in `.rows`, and lower, middle and upper stave pitches
    corresponding to the lower, middle and upper lines of the stave.
    **/

    get minPitch() {
        return this.rows[0];
    }

    get bottomPitch() {
        return this.rows[round(0.5 * this.rows.length) - 4];
    }

    get centerPitch() {
        return this.rows[round(0.5 * this.rows.length)];
    }

    get topPitch() {
        return this.rows[round(0.5 * this.rows.length) + 4];
    }

    get maxPitch() {
        return this.rows[this.rows.length - 1];
    }

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
        name:   'main',
        top:    'stave-top',
        center: 'stave-center',
        bottom: 'stave-bottom',
        default: true
    }];

    getPart(pitch) {
        return this.parts[0];
    }

    /**
    .getRowDiff(pitch1, pitch2)
    Given two pitches `pitch1` and `pitch2`, returns the difference in rows
    between their rendered positions.
    **/
    getRowDiff(pitch1, pitch2) {
        const row1 = pitch1.replace(rflatsharp, '');
        const row2 = pitch2.replace(rflatsharp, '');
        const i1 = this.rows.indexOf(row1);
        const i2 = this.rows.indexOf(row2);

        if (i1 === -1) { throw new Error('Pitch "' + pitch1 + '" is not supported by stave ' + this.constructor.name); }
        if (i2 === -1) { throw new Error('Pitch "' + pitch2 + '" is not supported by stave ' + this.constructor.name); }

        return i2 - i1;
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
