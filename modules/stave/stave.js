
//import get                   from 'fn/get.js';
import nothing               from 'fn/nothing.js';
import { toNoteName, toNoteNumber } from 'midi/note.js';
import toStopBeat            from '../event/to-stop-beat.js';
import grainOfBeat           from '../bar/grain-of-beat.js';
import { createAccents }     from '../symbol/accent.js';
import { createAccidentals } from '../symbol/accidental.js';
import { createLedges }      from '../symbol/ledge.js';
import { createNotes }       from '../symbol/note.js';
import { createTies }        from '../symbol/tie.js';
import { getDivisionBefore } from '../bar/divisions.js';
import { accidentalsFromKey } from '../accidentals.js';
import { toKeyNumber }       from 'sequence/modules/event/key.js';
import { rflatsharp, accidentalChars, fathercharles } from '../pitch.js';
import config                from '../config.js';
import * as glyphs           from "../glyphs.js";


const DEBUG = globalThis.DEBUG;
const { floor } = Math;
const { durationThreshold, staccatoThreshold } = config;
const noteDurations = [
    0.125,
    0.25,  0.375,
    0.5,   0.75,   0.875,
    1,     1.5,    1.75,
    2,     3,
    4,     6,
    8
];


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
    getGlyphName(pitch, dynamic, duration)
    **/
    getGlyphName(number, dynamic, duration) {
            // Semibreve
        return duration >= 4 ? 'head4' :
            // Triplet semibreve
            Math.fround(duration) === Math.fround(2.666666667) ? 'head4' :
            // Minim
            duration >= 2 ? 'head2' :
            // Triplet minim
            Math.fround(duration) === Math.fround(1.333333333) ? 'head2' :
            // Everything else
            'head1' ;
    }

    /**
    .getNoteHTML(pitch, dynamic, duration)
    Get the HTML content used for a note of given `pitch`, `dynamic` and
    `duration`. For normal chromatic staves only `duration` really matters, but
    percussion staves may replace heads based on pitch and dynamics.
    **/
    getNoteHTML(pitch, dynamic, duration, staccato, tenuto) {
        const number = toNoteNumber(pitch);
        const name   = this.getGlyphName(number, dynamic, duration);
        return dynamic < config.ghostThreshold ? `
            <span class="pre" glyph="headBracketLeft">${ glyphs.headBracketLeft }</span>
            <span class="head" glyph="${ name }">${ glyphs[name] }</span>
            <span class="post" glyph="headBracketRight">${ glyphs.headBracketRight }</span>` :
            `<span class="head" glyph="${ name }">${ glyphs[name] }</span>` ;
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
    .getVoice(pitch)
    **/

    staffs = ['main'];

    voices = [{
        name:  'main',
        staff: 'main'
    }];

    getVoice(number) {
        return this.voices[0];
    }

    getPart(number) {
        return this.getVoice(number);
    }

    /**
    .getRow(voice, pitch)
    Returns the row index of a given pitch name or number. Multi-staff staves
    require part to know which staff they are positioned upon.
    **/
    getRow(voice, pitch) {
        const name = typeof pitch === 'string' ? pitch : toNoteName(pitch) ;
        const row  = name.replace(rflatsharp, '');
        const i    = this.rows.indexOf(row);
        //if (DEBUG && i === -1) throw new Error('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        if (i === -1) console.warn('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        return i > -1 ? i : undefined ;
    }

    /**
    .getPitches(key)
    **/
    getPitches(key) {
        throw new Error('TODO!!!');
    }

    /**
    .getPitch(row)
    Returns the pitch of a given row number.
    **/
    getPitch(row, key = 0) {
        const names = this.rows[row];
        if (!names) return;
        const name        = names.split(/\s+/)[0];
        const accidentals = accidentalsFromKey(key);
        const modifier    = accidentals[name];
        return modifier ?
            name[0] + accidentalChars[modifier] + name.slice(1) :
            name ;
    }

    createKeySymbols(event) {
        if (!this.pitched) return [];

        const key = event && event[2] !== undefined ? event[2] : event;
        const k   = typeof key === 'number' ? key : toKeyNumber(key || 0);
        const ev  = event && typeof event === 'object' ? event : undefined;

        if (k > 0) {
            const count = Math.min(k, 7);
            const symbols = [];
            for (let i = 0; i < count; i++) {
                symbols.push({
                    type:  'acci',
                    pitch: fathercharles[i],
                    value: 1,
                    voice: this.voices[0],
                    event: ev
                });
            }
            return symbols;
        }

        if (k < 0) {
            const count = Math.min(-k, 7);
            const symbols = [];
            for (let i = 0; i < count; i++) {
                symbols.push({
                    type:  'acci',
                    pitch: fathercharles[7 + i],
                    value: -1,
                    voice: this.voices[0],
                    event: ev
                });
            }
            return symbols;
        }

        return [];
    }

    createSignatureSymbols(keyEvent) {
        const symbols   = [{
            type: 'clef',
            clef: this.type,
            voice: this.voices[0]
        }];

        return symbols.concat(this.createKeySymbols(keyEvent));
    }

    createNoteSymbols(symbols, bar, voice, accidentals, notes, beat, duration, settings, staccato = false, tolerance = 0.125) {
        // Create note heads
        const noteSymbols = createNotes(this, voice, notes, beat, duration, staccato);
        // Notes may not appear on stave in which case noteSymbols will be empty
        if (!noteSymbols.length) return noteSymbols;
        // Create ledges, accidentals and accents
        createLedges(symbols, this, voice, beat, noteSymbols);
        createAccidentals(symbols, voice, accidentals, beat, noteSymbols);
        createAccents(symbols, this, voice, beat, noteSymbols, settings);
        // Push in note heads
        symbols.push.apply(symbols, noteSymbols);
        // Create ties and splice finished notes out of notes
        createTies(symbols, bar, voice, notes, noteSymbols, tolerance);
        // Return symbols
        return noteSymbols;
    }

    createDupletNoteSymbols(symbols, bar, voice, accidentals, notes, startBeat, stopBeat, settings) {
        const { durationThreshold, staccatoThreshold } = settings;
        const b1    = startBeat - bar.beat;
        const b2    = stopBeat  - bar.beat;
        const grain = grainOfBeat(bar.divisions, b1);
        const d1    = getDivisionBefore(bar.divisions, b1);
        const d2    = getDivisionBefore(bar.divisions, b2);

        let b = b1;
        let tied = false;
        let i = -1;
        while (notes[++i]) {
            if (notes[i][0] < startBeat) tied = true;
            const b3 = toStopBeat(notes[i]) - bar.beat;
            if (b3 >= b2) { b = b2; break; }
            if (b3 > b)   { b = b3; }
        }

        let staccato = false;
        let g = 4 * grain;

        // If b1 and b2 are both bar divisions, the event duration passes the
        // threshold to fill the space, and the space is a valid note duration
        // ━━━━
        //     ━━━━
        // ━━━━━━━━
        // ┃.❘.|.❘.┃.❘.|.❘.┃
        if (b1 === d1 && b2 === d2 && b >= (b2 - bar.divisor + durationThreshold * bar.divisor) && noteDurations.includes(b2 - b1)) {
            b = b2;
        }
        // Grain search from 2 * grain down to 0.0625
        else {
            while ((g /= 2) >= 0.125) {
                // Double-dotted 1.75g
                if (g >= 0.5                                          // The second dot is at least a 32nd note
                    && 2 * g <= grain                                 // Never start a double-dotted note on a weaker off-beat grain
                    && b > b1 + (b2 !== d2 && b1 + 1.75 * g === b2 ? 1.75 * durationThreshold : 1 + durationThreshold) * g // Duration passes the double-dotted threshold (or fills non-division window b2)
                    && b1 + 1.75 * g <= b2                            // Fits within the available window
                    && grainOfBeat(bar.divisions, b1 + 1.5 * g) === 0.5 * g  // The first dot is an internal subdivision rather than a bar division
                ) {
                    b = b1 + 1.75 * g;
                    break;
                }

                // Dotted 1.5g
                if (g >= 0.25                                         // The dot is at least a 32nd note
                    && 0.5 * g <= grain                               // The dot is never coarser than the beat it starts on
                    && b > b1 + (b2 !== d2 && b1 + 1.5 * g === b2 ? 1.5 * durationThreshold : 1 + 0.5 * durationThreshold) * g // Duration passes the dotted threshold (or fills non-division window b2)
                    && (g <= grain || b <= b1 + (1 + durationThreshold) * g)      // On a weaker beat, do not overshoot into a note that still needs a tie
                    && b1 + 1.5 * g <= b2                             // Fits within the available window
                    && (grainOfBeat(bar.divisions, b1 + 1.5 * g) > g  // Either lands on a stronger division...
                        || (2 * g <= grain && (                       // or subdivides a beat...
                            b1 + 1.5 * g === b2                       // and stops at the end of the window...
                            || (b1 + 2 * g <= b2 && grainOfBeat(bar.divisions, b1 + 2 * g) >= 2 * g) // or its enclosing 2g unit does not cross a division
                        ))
                    )
                ) {
                    b = b1 + 1.5 * g;
                    break;
                }

                // Whole 1g
                // Higher threshold above a beat or grain so smaller dotted notes are not rounded up
                if (b > b1 + (g > 1 || g > grain ? (0.5 + 0.5 * durationThreshold) : staccatoThreshold) * g) {
                    // Staccato 2g
                    if (!tied                                         // Tied notes cannot be staccato
                        && g < grain                                  // Shorter than the beat's grain
                        && g < bar.divisor                            // Shorter than the bar divisor
                        && b < b2                                     // Followed by silence
                        && b1 + 2 * g <= b2                           // Room to double the written duration
                    ) {
                        b = b1 + 2 * g;
                        staccato = true;
                        break;
                    }

                    // Standard 1g
                    if (b1 + g <= b2                                  // Fits within the available window
                        && grainOfBeat(bar.divisions, b1 + g) >= (g <= grain ? g : 2 * g) // Subdivisions must not cross an irregular division; off-beats must resolve onto a stronger boundary
                    ) {
                        b = b1 + g;
                        break;
                    }
                }
            }

            // Staccato 2g (32nd note)
            if (g === 0.0625) {  // Anything shorter than already detected is a staccato 32nd note
                b = b1 + 2 * g <= b2 ? b1 + 2 * g : b2;
                staccato = !tied && b1 + 2 * g <= b2;
            }
        }

        return this.createNoteSymbols(symbols, bar, voice, accidentals, notes, b1, b - b1, settings, staccato);
    }
}
