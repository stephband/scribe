
//import get                   from 'fn/get.js';
import nothing               from 'fn/nothing.js';
import { noteNames, toNoteName, toNoteNumber, toNoteOctave, toRootNumber } from 'midi/note.js';
import mod12                 from 'sequence/modules/number/mod-12.js';
import toStopBeat            from '../event/to-stop-beat.js';
import { ceilPow2 }          from '../number/power-of-2.js';
import grainOfBeat           from '../bar/grain-of-beat.js';
import { createAccents }     from '../symbol/accent.js';
import { createAccidentals } from '../symbol/accidental.js';
import { createLedges }      from '../symbol/ledge.js';
import { createNotes }       from '../symbol/note.js';
import { getDivisionBefore } from '../bar/divisions.js';
import { accidentalsFromKey } from '../accidentals.js';
import { toKeyNumber }       from 'sequence/modules/event/key.js';
import { rrootname, rpitch, rflatsharp, accidentalChars, fathercharles } from '../pitch.js';
import config                from '../config.js';
import * as glyphs           from "../glyphs.js";
import { GR as ratio }       from '../constants.js';


const DEBUG = globalThis.DEBUG;
const { floor, min } = Math;

const keys = {
    //                                             C      D       E  F      G      A       B
    '-8': { name: 'F♭', symbol: 'F♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, -2, -1, -1] },
    '-7': { name: 'C♭', symbol: 'C♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },  // (Should have Ebb?)
    '-6': { name: 'G♭', symbol: 'G♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },  // (Should have Ebb?)
    '-5': { name: 'D♭', symbol: 'D♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },
    '-4': { name: 'A♭', symbol: 'A♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },
    '-3': { name: 'E♭', symbol: 'E♭∆', spellings: [0, -1, 0, -1,  0, 0, -1, 0, -1, 0, -1, -1] },
    '-2': { name: 'B♭', symbol: 'B♭∆', spellings: [0, -1, 0, -1,  0, 0, -1, 0, -1, 0, -1,  0] },
    '-1': { name: 'F',  symbol: 'F∆',  spellings: [0, -1, 0, -1,  0, 0,  1, 0, -1, 0, -1,  0] },
    '0':  { name: 'C',  symbol: 'C∆',  spellings: [0,  1, 0, -1,  0, 0,  1, 0, -1, 0, -1,  0] },
    '1':  { name: 'G',  symbol: 'G∆',  spellings: [0,  1, 0, -1,  0, 0,  1, 0,  1, 0, -1,  0] },
    '2':  { name: 'D',  symbol: 'D∆',  spellings: [0,  1, 0,  1,  0, 0,  1, 0,  1, 0, -1,  0] },
    '3':  { name: 'A',  symbol: 'A∆',  spellings: [0,  1, 0,  1,  0, 0,  1, 0,  1, 0,  1,  0] },
    '4':  { name: 'E',  symbol: 'E∆',  spellings: [0,  1, 0,  1,  0, 1,  1, 0,  1, 0,  1,  0] },
    '5':  { name: 'B',  symbol: 'B∆',  spellings: [1,  1, 0,  1,  0, 1,  1, 0,  1, 0,  1,  0] },
    '6':  { name: 'F♯', symbol: 'F♯∆', spellings: [1,  1, 0,  1,  2, 1,  1, 0,  1, 0,  1,  0] }, // (Should have G##?)
    '7':  { name: 'C♯', symbol: 'C♯∆', spellings: [1,  1, 0,  1,  2, 1,  1, 0,  1, 0,  1,  2] }, // (Should have G##?)
    '8':  { name: 'G♯', symbol: 'G♯∆', spellings: [1,  1, 0,  1,  2, 1,  1, 2,  1, 0,  1,  2] }
};

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
    getNoteHTML(pitch, dynamic, duration) {
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

    /**
    .getSpelling(pitch, key, withOctave)
    Gets spelling of a given pitch. Returns a pitch name string.
    **/
/*    getSpelling(pitch, key = 0, withOctave = false) {
        const keyData = keys[key];

        if (!withOctave) {
            if (typeof pitch === 'string') {
                const match = rrootname.exec(pitch);
                if (match) {
                    const [, letter, accidental] = match;
                    const acc =
                        accidental === '##' || accidental === '𝄪' ? '𝄪' :
                        accidental === 'bb' || accidental === '𝄫' ? '𝄫' :
                        accidental === '#'  || accidental === '♯' ? '♯' :
                        accidental === 'b'  || accidental === '♭' ? '♭' :
                        (accidental || '');
                    return letter + acc;
                }
            }
            const n = toRootNumber(pitch);
            const a = keyData.spellings[n];
            return noteNames[mod12(n - a)] + accidentalChars[a];
        }

        let n, a, o;

        if (typeof pitch === 'string') {
            // [BRANCH 2026-spelling]: If pitch is already an explicit note string (e.g. "C#4", "Db4", "C4"),
            // preserve its spelling rather than deconstructing to MIDI and re-spelling via keyData.spellings.
            // Normalize ASCII '#' -> '♯', 'b' -> '♭', '##' -> '𝄪', 'bb' -> '𝄫'.
            const match = rpitch.exec(pitch);
            if (match) {
                const [, letter, accidental, octave] = match;
                if (octave !== undefined) {
                    const acc =
                        accidental === '##' || accidental === '𝄪' ? '𝄪' :
                        accidental === 'bb' || accidental === '𝄫' ? '𝄫' :
                        accidental === '#'  || accidental === '♯' ? '♯' :
                        accidental === 'b'  || accidental === '♭' ? '♭' :
                        (accidental || '');
                    return letter + acc + octave;
                }
            }

            /* --- ORIGINAL CODE START (preserved for easy rollback) ---
            let [notename, letter, accidental, octave] = rpitch.exec(pitch) || [pitch];
            if (octave) {
                // pitch is note name like "C4", deconstruct it and put it back together
                n = toNoteNumber(pitch);
                a = keyData.spellings[mod12(n)];
                o = toNoteOctave(n - a);
            }
            --- ORIGINAL CODE END --- * /
        }
        else {
            // pitch is a number
            n = pitch;
            a = keyData.spellings[mod12(n)];
            o = toNoteOctave(n - a);
        }

        // key.spellings makes sure name is a natural note name
        const name = noteNames[mod12(n - a)];
        const accidental = accidentalChars[a];

        if (DEBUG && name === undefined) {
            throw new Error('Incorrect spelling for pitch number ' + n + ': "' + name + '"');
        }

        return name + accidental + o;
    }
*/
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

    createNoteSymbols(symbols, bar, voice, accidentals, notes, beat, duration, settings, staccato = false) {
        // Create note heads
        const noteSymbols = createNotes(this, bar.key, voice, notes, beat, duration, staccato);
        // Notes may not appear on stave in which case noteSymbols will be empty
        if (!noteSymbols.length) return noteSymbols;
        // Create ledges, accidentals and accents
        createLedges(symbols, this, voice, beat, noteSymbols);
        createAccidentals(symbols, voice, accidentals, beat, noteSymbols);
        createAccents(symbols, this, voice, beat, noteSymbols, settings);
        // Push in note heads
        symbols.push.apply(symbols, noteSymbols);
        // Return symbols
        return noteSymbols;
    }

    createDupletNoteSymbols1(symbols, bar, voice, accidentals, notes, startBeat, stopBeat, settings) {
        const b1    = startBeat - bar.beat;
        const b2    = stopBeat  - bar.beat;
        const grain = grainOfBeat(bar.divisions, b1);
        const d1    = getDivisionBefore(bar.divisions, b1);
        const d2    = getDivisionBefore(bar.divisions, b2);

        let b = b1;

        // Loop through notes
        let i = -1;
        while (notes[++i]) {
            const b3 = toStopBeat(notes[i]) - bar.beat;
            // If any are longer than the available space, set b to end of space
            if (b3 >= b2) {
                b = b2;
                break;
            }
            // Set b to the end of the longest note
            if (b3 > b)   {
                b = b3;
            }
        }

        let g = grain;
        let staccato = false;

        // If b1 and b2 are both bar divisions, the event duration passes the
        // threshold to fill the space, and the space is a valid note duration
        // ━━━━
        //     ━━━━
        // ━━━━━━━━
        // ┃.❘.|.❘.┃.❘.|.❘.┃
        if (b1 === d1 && b2 === d2 && b >= (b2 - bar.divisor + ratio * bar.divisor) && noteDurations.includes(b2 - b1)) {
            b = b2;
//console.log('start and stop on divisions', grain, b2 - b1);
        }
        // If event duration is longer than 5g and a (double dotted) 7g takes us
        // to a more than a 4x grain before or at b2
        //  ━━━━━━━
        // ┃.❘.|.❘.┃.❘.|.❘.┃
        else if (b > b1 + 5 * grain && b1 + 7 * grain <= b2 && grainOfBeat(bar.divisions, b1 + 7 * grain) > 4 * grain) {
            b = b1 + 7 * grain;
//console.log('4g..', grain, 7 * grain);
        }
        // Duration is longer than 2g and a dotted 3g takes us to a more than a
        // 2x grain grain before or at b2
        //  ━━━
        // ┃.❘.|.❘.┃.❘.|.❘.┃
        else if (b > b1 + 2 * grain && b1 + 3 * grain <= b2 && grainOfBeat(bar.divisions, b1 + 3 * grain) > 2 * grain) {
            b = b1 + 3 * grain;
//console.log('2g.', grain, 3 * grain);
        }
        // Duration is longer than 1.5g and a 2g takes us to a more than 1x grain
        // grain before or at b2, which can happen if note ends on a bar division
        //     ━━━━
        // ┃.❘.|.❘.┃.❘.|.❘.┃
        // QUESTIONABLE!!!!
        else if (b > b1 + 1.5 * grain && b1 + 2 * grain <= b2 && grainOfBeat(bar.divisions, b1 + 2 * grain) > grain) {
            b = b1 + 2 * grain;
//console.log('2g', grain, 2 * grain);
        }
        // Duration is longer than (0.5 + 0.5 * ratio) * g (or ratio * g when g <= bar.divisor)
        // and takes us before or at b2 (a 1g always takes us to a more than 1x grain)
        //     ━━━━
        // ┃.❘.|.❘.┃.❘.|.❘.┃
        else if (b > b1 + (grain > bar.divisor ? (0.5 + 0.5 * ratio) : ratio) * grain && b1 + 1 * grain <= b2) {
            b = b1 + grain;
//console.log('1g', grain, grain);
        }
        // If b is not at stopBeat (so we are not butting up against the next
        // event or bar end), duration is min(grain, bar.divisor) or less, and
        // there is room: quantise to subdivisions with staccato
        else if (b < b2 && b <= b1 + min(grain, bar.divisor) && b1 + min(grain, bar.divisor) <= b2) {
            const maxD = min(grain, bar.divisor);
            let d = 2 * maxD;

            while ((d /= 2) >= 0.125 && b < b1 + ratio * d);
            if (d < maxD) {
                d *= 2;
                staccato = true;
            }

            b = b1 + d;
        }
        // Loop through smaller grains down to a 32nd
        else while ((g /= 2) >= 0.125) {
            // Duration is longer than g double dotted, and g is an 8th or more
            if (b > b1 + (1 + ratio) * g && g >= 0.5) {
                if (b < b2 && b1 + 2 * g <= b2) {
                    b = b1 + 2 * g;
                    break;
                }
                if (b1 + 1.75 * g <= b2) {
                    b = b1 + 1.75 * g;
                    break;
                }
            }
            // Duration is longer than g dotted, and g is an 16th or more
            if (b > b1 + (1 + 0.5 * ratio) * g && g >= 0.25 && b1 + 1.5 * g <= b2) {
                b = b1 + 1.5 * g;
//console.log('g.', g, 1.5 * g);
                break;
            }
            // Duration is longer than g
            if (b > b1 + (0.5 + 0.5 * ratio) * g && b1 + g <= b2) {
                b = b1 + g;
//console.log('g', g, g);
                break;
            }
        }

        const duration = b - b1;
        return this.createNoteSymbols(symbols, bar, voice, accidentals, notes, b1, duration, settings, staccato);
    }

    createDupletNoteSymbols(symbols, bar, voice, accidentals, notes, startBeat, stopBeat, settings) {
        const b1    = startBeat - bar.beat;
        const b2    = stopBeat  - bar.beat;
        const grain = grainOfBeat(bar.divisions, b1);
        const d1    = getDivisionBefore(bar.divisions, b1);
        const d2    = getDivisionBefore(bar.divisions, b2);

        let b = b1;
        let i = -1;
        while (notes[++i]) {
            const b3 = toStopBeat(notes[i]) - bar.beat;
            if (b3 >= b2) { b = b2; break; }
            if (b3 > b)   { b = b3; }
        }

        let staccato = false;

        // 1. Start and stop on bar divisions
        if (b1 === d1 && b2 === d2 && b >= (b2 - bar.divisor + ratio * bar.divisor) && noteDurations.includes(b2 - b1)) {
            b = b2;
        }
        // 2. Unified grain search from 4 * grain down to 0.125
        else {
            let g = 8 * grain;
            while ((g /= 2) >= 0.125) {
                // Double-dotted g (1.75g)
                if (g >= 0.5 && b > b1 + (1 + ratio) * g && b1 + 1.75 * g <= b2 && (2 * g <= grain ? grainOfBeat(bar.divisions, b1 + 1.5 * g) === 0.5 * g : grainOfBeat(bar.divisions, b1 + 1.75 * g) > g)) {
                    b = b1 + 1.75 * g;
                    break;
                }
                // Dotted g (1.5g)
                if (g >= 0.25 && 0.5 * g <= grain && b > b1 + (1 + 0.5 * ratio) * g && b1 + 1.5 * g <= b2 && (
                    grainOfBeat(bar.divisions, b1 + 1.5 * g) > g ||
                    (2 * g <= grain && (b1 + 1.5 * g === b2 || (b1 + 2 * g <= b2 && grainOfBeat(bar.divisions, b1 + 2 * g) >= 2 * g)))
                )) {
                    b = b1 + 1.5 * g;
                    break;
                }
                // Whole g (1.0g)
                if (b > b1 + (g > 1 || g > grain ? (0.5 + 0.5 * ratio) : ratio) * g) {
                    if (g < grain && g < bar.divisor && b < b2 && b1 + 2 * g <= b2) {
                        b = b1 + 2 * g;
                        staccato = true;
                        break;
                    }
                    if (b1 + g <= b2 && grainOfBeat(bar.divisions, b1 + g) >= (g <= grain ? g : 2 * g)) {
                        b = b1 + g;
                        break;
                    }
                }
            }
        }

        return this.createNoteSymbols(symbols, bar, voice, accidentals, notes, b1, b - b1, settings, staccato);
    }
}
