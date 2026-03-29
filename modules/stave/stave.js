
import by                    from 'fn/by.js';
import get                   from 'fn/get.js';
import nothing               from 'fn/nothing.js';
import matches               from 'fn/matches.js';
import { noteNames, toNoteName, toNoteNumber, toNoteOctave, toRootName, toRootNumber } from 'midi/note.js';
import { rootToKeyNumber }   from 'sequence/modules/event/keys.js';
import toStopBeat            from '../event/to-stop-beat.js';
import push                  from '../object/push.js';
import { eq, gte, lte, lt, gt } from '../number/float.js';
import mod12                 from '../number/mod-12.js';
import nearest               from '../number/nearest.js';
import { floorPow2, ceilPow2 } from '../number/power-of-2.js';
import grainOfBeat           from '../bar/grain-of-beat.js';
import { createAccents }     from '../symbol/accent.js';
import { createAccidentals } from '../symbol/accidental.js';
import { createLedges }      from '../symbol/ledge.js';
import { createNotes }       from '../symbol/note.js';
import { createRests }       from '../symbol/rest.js';
import { createBeam, closeBeam } from '../symbol/beam.js';
import { closeTuplet }       from '../symbol/tuplet.js';
import { isDivision, getDivisionBefore, getDivisionAfter } from '../bar/divisions.js';
import { keyToNumbers }      from '../keys.js';
import { rpitch, rflatsharp, byFatherCharlesPitch, accidentalChars } from '../pitch.js';
import config                from '../config.js';
import { major }             from '../scale.js';
import * as glyphs           from "../glyphs.js";
import detectRhythm, { straighten, hasHoles } from '../rhythm.js';
import { P24, GR }           from '../constants.js';


import createPartSymbols from './_part.js';


const accidentals = {
    '-2': '𝄫',
    '-1': '♭',
    '0':  '',
    '1':  '♯',
    '2':  '𝄪'
};

const global = globalThis || window;
const assign = Object.assign;
const notes  = [];
const { abs, ceil, floor, min, max, pow, sqrt, round } = Math;
const byRow  = by(get('row'));

const keys = {
    //                                             C      D       E  F      G      A       B
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
    '7':  { name: 'C♯', symbol: 'C♯∆', spellings: [1,  1, 0,  1,  2, 1,  1, 0,  1, 0,  1,  2] }  // (Should have G##?)
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


export function createTuplet(settings, stave, part, startBeat, data) {
    switch (data.divisor) {
        case 2:
            // If we are rendering swing rhythms decide whether a duplet
            // should render as a tuplet
            if (data.rhythm === 1) {
                return;
            }
            else if (data.duration === 1) {
                if (!settings.swingAsStraight8ths) return;
            }
            else if (data.duration === 0.5) {
                if (!settings.swingAsStraight16ths) return;
            }
            else {
                return;
            }

        case 3:
            // Convert eighth note swing rhythms to duplets
            if (settings.swingAsStraight8ths && data.duration === 1) {
                straighten(data);
                return;
            }

            // Convert sixteenth note shuffle rhythms to duplets
            if (settings.swingAsStraight16ths && data.duration === 0.5) {
                straighten(data);
                return;
            }
    }

    return {
        type: 'tuplet',
        part,
        beat:     data.beat - startBeat,
        duration: data.duration,
        divisor:  data.divisor,
        rhythm:   data.rhythm,
        stave:    this
    };
}

function setDurations(symbols, duration) {
    let n = symbols.length;
    while (n--) symbols[n].duration = duration;
    return symbols;
}

function getNotesAtBeatDuration(divisions, grain, b1, b2, v1, v2, v3) {
    let j = noteDurations.length;

    // Reject noteDurations greater than grain
    while (noteDurations[--j] > grain);
    ++j;

    // Reject noteDurations greater than available space up to b2 or bar
    // division, whichever is first
    const b3 = v1 === v3 ? b2 : v2 ;

    while (noteDurations[--j] > b3 - b1);

    // If that duration does not span exactly to b2 or bar division
    return b1 + noteDurations[j] !== b3 ?
        // ...reject dotted durations
        floorPow2(noteDurations[j]) :
        // ...use duration as-is
        noteDurations[j] ;
}

function toRoundedStopBeat(bar, event) {
    // The event's stop beat rounded to the nearest bar divisor in such a way
    // that values over 1/3 bar divisor round up, values under 1/3 bar divisor
    // round down
    return max(bar.divisor, nearest(bar.divisor, toStopBeat(event) - bar.beat + bar.divisor / 6));
}

function createTies(symbols, bar, part, notes, noteSymbols, beat, duration) {
    let n = notes.length;
    while (n--) {
        const b4 = toRoundedStopBeat(bar, notes[n]);

        if (b4 <= beat + duration) {
            notes.splice(n, 1);
        }
//           else if (grainOfBeat(bar.divisions, toStopBeat(notes[n]) - bar.beat) < grain) {
//               console.log('SPLICING OUT NOTE');
//               notes.splice(n, 1);
//           }
        else {
            symbols.push({
                type:   'tie',
                beat,
                pitch: noteSymbols[n].pitch,
                duration,
                stemup: noteSymbols[n].stemup,
                part,
                event: notes[n]
            });
        }
    }
}


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

    staffs = ['main'];

    parts = [{
        name:  'main',
        staff: 'main'
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
        //if (global.DEBUG && i === -1) throw new Error('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
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
    .getSpelling(key, pitch, withOctave)
    Gets spelling of a given pitch. Returns a pitch name string.
    **/
    getSpelling(key, pitch, withOctave = false) {
        const keyData = keys[key];

        if (!withOctave) {
            const n = toRootNumber(pitch);
            const a = keyData.spellings[n];
            return noteNames[mod12(n - a)] + accidentals[a];
        }

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

    createKeySymbols(key) {
        const numbers = keyToNumbers(key);
        return Array.from(numbers, (n, i) => (n - major[i] && {
            type:  'acci',
            pitch: toRootName(major[i]) + accidentalChars[n - major[i]],
            value: n - major[i],
            part:  this.parts[0]
        }))
        .filter((o) => !!o)
        .sort(byFatherCharlesPitch);
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

    getNotesAtBeat(beat, division, events, n = 0) {
        // Fill notes with events playing during division
        //notes.length = 0;
        while (events[n] && events[n][0] < beat + 0.5 * division) {
            notes.push(events.shift());
        }
        // Sort notes by pitch order, descending (ascending row order)
        notes.sort(byRow);
        return notes;
    }

    createSymbols(symbols, bar, part, accidentals, notes, beat, duration, settings) {
        const stave = this;
        // Create note heads
        const noteSymbols = createNotes(stave, bar.key, part, notes, beat, duration);
        // Create ledgers, accidentals and accents
        createLedges(symbols, stave, part, beat, noteSymbols);
        createAccidentals(symbols, part, accidentals, beat, noteSymbols);
        createAccents(symbols, stave, part, beat, noteSymbols, settings);
        // Push in note heads
        symbols.push.apply(symbols, noteSymbols);
        // Return symbols
        return noteSymbols;
    }

    // TODO: RENAME THIS METHOD
    updateNotesDuration(symbols, bar, part, accidentals, beam, notes, startBeat, stopBeat, settings) {
        const stave = this;
        const b1    = startBeat - bar.beat;
        const b2    = stopBeat  - bar.beat;
        const grain = grainOfBeat(bar.divisions, b1);
        const d1    = getDivisionBefore(bar.divisions, b1);
        const d2    = getDivisionBefore(bar.divisions, b2);

        let b = b1;
        let n = -1;
        let event;
        while (event = notes[++n]) {
            const b4 = toRoundedStopBeat(bar, notes[n]);
            // Division of stop beat
            const d3 = getDivisionBefore(bar.divisions, b4);
            // If event stops in the same division as b1
            const b3 = d3 === d1 ? b4 : d3 ;
            //
            if (b3 >= b2) { b = b2; break; }
            if (b3 > b)   { b = b3; }
        }

        // Do we need this? Can we avoid having to do this?
        if (b === b1) {
console.log('AVOID THIS? Notes of duration 0! -----------------------');
            notes.length = 0;
            // TODO: Remove ties from symbols??
            return { beat: bar.beat + b, beam, notes };
        }

console.log('start', b1, 'stop', b, 'duration', b - b1, 'grain', grain);

        const b3 = b;
        let g = grain;

        // Note starts on a bar division, stops on (or crosses) a bar division or
        // bar end, and that duration is a valid note duration
        if (b >= b2 && b1 === d1 && b2 === d2 && noteDurations.includes(b2 - b1)) {
            b = b2;
//console.log('start and stop on divisions', grain, b2 - b1);
        }
        // Duration is longer than 4g double dotted (7g), and that takes us to a more than a 4x grain
        else if (b >= b1 + 7 * grain && grainOfBeat(bar.divisions, b1 + 7 * grain) > 4 * grain) {
            b = b1 + 7 * grain;
//console.log('4g..', grain, 7 * grain);
        }
        // Duration is longer than 2g dotted (3g), and that takes us to a more than a 2x grain
        else if (b >= b1 + 3 * grain && grainOfBeat(bar.divisions, b1 + 3 * grain) > 2 * grain) {
            b = b1 + 3 * grain;
//console.log('2g.', grain, 3 * grain);
        }
        // Duration is longer than 2g, and that takes us to a more than 1x grain,
        // which can happen if note ends on a bar division
        else if (b >= b1 + 2 * grain && grainOfBeat(bar.divisions, b1 + 2 * grain) > grain) {
            b = b1 + 2 * grain;
//console.log('2g', grain, 2 * grain);
        }
        // Duration is longer than 1g, which always takes us to a more than 1x grain
        else if (b >= b1 + grain) {
            b = b1 + grain;
//console.log('1g', grain, grain, grainOfBeat(bar.divisions, b1 + 2 * grain), b1);
        }
        // Loop through smaller grains down to a 32nd
        else while ((g /= 2) >= 0.125) {
            // Duration is longer than g double dotted, and g is an 8th or more
            if (b >= b1 + 1.75 * g && g >= 0.5) {
                b = b1 + 1.75 * g;
//console.log('g..', g, 1.75 * g);
                break;
            }
            // Duration is longer than g dotted, and g is an 16th or more
            if (b >= b1 + 1.5 * g && g >= 0.25) {
                b = b1 + 1.5 * g;
//console.log('g.', g, 1.5 * g);
                break;
            }
            // Duration is longer than g
            if (b >= b1 + g) {
                b = b1 + g;
//console.log('g', g, g);
                break;
            }
        }

        const duration    = b - b1;
        const noteSymbols = this.createSymbols(symbols, bar, part, accidentals, notes, b1, duration, settings);

        // Splice out all notes that stop before b, events left in notes will be
        // tied
        createTies(symbols, bar, part, notes, noteSymbols, b1, duration);


        //// If last notes have a duration too long for a beam
        //if (gte(1, duration, P24)) {
        //    // ...and there is a beam, close it
        //    if (beam) beam = closeBeam(symbols, stave, part, beam);
        //}
        //// If notes are in the same bar division as rhythm division
        //else if (v1 === v3 && (
        //    // ...and note stop brings us up to division
        //    beat === b2 + startBeat
        //    // ...or note duration is the same duration as the gap
        //    || duration === b2 + startBeat - beat
        //)) {
        //    // ...make sure there is a beam
        //    if (!beam) beam = createBeam(part, b1);
        //    // ...and push note symbols on to it
        //    push(beam, ...noteSymbols);
        //}
        //// If there is a beam
        //else if (beam) {
        //    // ...push last note symbols on to it
        //    push(beam, ...noteSymbols);
        //    // ...and close it
        //    beam = closeBeam(symbols, stave, part, beam);
        //}


        const beat = bar.beat + b;
        return { beat, beam, notes };
    }

    createPartSymbols(bar, accidentals, name, events, settings) {
        const startBeat = bar.beat;
        const stopBeat  = bar.beat + bar.duration;
        const key       = bar.key;
        const symbols   = bar.symbols;
        const stave     = this;
        const part      = this.parts.find(matches({ name }));

        let beat = startBeat;
        let bbbbb;
        let n    = 0;
        let beam, event, tuplet, notes, data;

        // Loop through detected rhythms
        while (data = detectRhythm(beat, stopBeat - beat, events, 0/*, { maxDivision: 1 }*/)) {
            // Normalise rhythm based on settings, create tuplet where needed
            const tuplet   = createTuplet(settings, stave, part, startBeat, data);
            const { rhythm, divisor } = data;
            const division = data.duration / divisor;
            const r        = rhythm.toString(2);

            if (tuplet) {
                // Update note durations to this division
                if (notes && notes.length) {
                    const o = this.updateNotesDuration(symbols, bar, part, accidentals, beam, notes, bbbbb, stopBeat, settings);
                    beat  = o.beat;
                    beam  = undefined;
                    notes = o.notes;
                }
                // if there is a beam, close it
                if (beam) beam = closeBeam(symbols, stave, part, beam);
                // Fill with rests up to start of tuplet
                createRests(symbols, settings.restDurations, bar.divisions, this, part, beat - startBeat, data.beat - startBeat);
                // Set beat to start of tuplet
                beat = data.beat;
                // Push tuplet in
                symbols.push(tuplet);
                // Loop through tuplet divisions
                let i = -1;
                while (++i < divisor) {
                    // Query the binary from its end (the first division) backwards
                    if (r[r.length - 1 - i] === '1') {
                        // Insert note symbols
                        notes = this.getNotesAtBeat(beat, division, events, 0);
                        //noteSymbols = this.createSymbols(symbols, bar, part, key, beat - startBeat, division, division, events, 0, settings);
                        const noteSymbols = this.createSymbols(symbols, bar, part, accidentals, notes, beat - startBeat, division, settings);
                        // Push note symbols on to tuplet
                        push(tuplet, ...noteSymbols);
                        // If division is short enough for a beam
                        if (division < 0.5) {
                            // ...make sure there is a beam
                            if (!beam) beam = createBeam(part, beat - startBeat);
                            // ...and push note symbols on to it
                            push(beam, ...noteSymbols);
                        }
                        // Splice out all notes that stop before b, events left in notes will be
                        createTies(symbols, bar, part, notes, noteSymbols, beat - startBeat, division);
                    }
                    else {
                        // Push in a tuplet division rest
                        symbols.push({
                            type:     'rest',
                            beat:     beat - startBeat,
                            duration: division,
                            stave,
                            part
                        });
                    }
                    // Set beat to division end
                    beat = data.beat + i * division + division;
                    bbbbb = beat;
                }
                // Close tuplet
                closeTuplet(this, part, tuplet);
                // if there is a beam, close it
                if (beam) beam = closeBeam(symbols, stave, part, beam);
            }
            else {
                // Loop through rhythm divisions
                let i = -1;
                while (++i < divisor) {
                    // Query the binary string from its end (the first division)
                    // backwards, ignore empty divisions
                    if (r[r.length - 1 - i] !== '1') continue;

                    // Update note durations to this division
                    if (notes && notes.length) {
                        const o = this.updateNotesDuration(symbols, bar, part, accidentals, beam, notes, bbbbb, data.beat + i * division, settings);
                        beat  = o.beat;
                        beam  = o.beam;
                        notes = o.notes;
if (notes.length) { console.log(notes.length + ' notes tied over to this division'); }
                    }

                    // If gap is bigger than division stop the beam
                    if (beam && gt(division, data.beat + i * division - beat, P24)) {
                        beam = closeBeam(symbols, stave, part, beam);
                    }

                    // Fill gap with rests
                    createRests(symbols, settings.restDurations, bar.divisions, this, part, beat - startBeat, data.beat + i * division - startBeat);
                    // Update beat to division beginning
                    beat  = data.beat + i * division;
                    // Insert note symbols
                    bbbbb = beat;
                    notes = this.getNotesAtBeat(beat, division, events, 0);
                    // Update beat to division end
                    beat  = data.beat + i * division + division;
                }
            }

            // Update beat
            beat = data.beat + data.duration;
        }

if (DEBUG && events.length) throw new Error(`Something's up with note events, it should be empty here`);

        // Update note durations to end of bar
        while (notes && notes.length && bbbbb < bar.beat + bar.duration) {
            const o = this.updateNotesDuration(symbols, bar, part, accidentals, beam, notes, bbbbb, stopBeat, settings);
            beat  = o.beat;
            beam  = o.beam;
            notes = o.notes;
            bbbbb = beat;
        }

if (notes.length) {
    console.log(notes.length + ' notes tied over to next bar', beat, bar.beat);
    events.unshift.apply(events, notes);
}

        // If there's still a beam close it
        if (beam) beam = closeBeam(symbols, stave, part, beam);
        // Create rests to stopBeat
        createRests(symbols, settings.restDurations, bar.divisions, this, part, beat - startBeat, stopBeat - startBeat);
        // Return symbols
        return bar;
    }
}

//Stave.prototype.createPartSymbols = createPartSymbols;
