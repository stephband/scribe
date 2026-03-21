
import slugify           from 'fn/slugify.js';
import { toDrumName, toNoteNumber } from 'midi/note.js';
import * as glyphs       from "../glyphs.js";
import config            from '../config.js';
import Stave             from './stave.js';
import { eq, gte, lte, lt, gt } from '../number/float.js';
import nearest           from '../number/nearest.js';
import grainPow2         from '../number/grain-pow-2.js';
import { floorPow2 }     from '../number/power-of-2.js';
import push              from '../object/push.js';
import { createAccents } from '../symbol/accent.js';
import { createLedges }  from '../symbol/ledge.js';
import { createNotes }   from '../symbol/note.js';
import { createRests }   from '../symbol/rest.js';
import { createBeam, closeBeam } from '../symbol/beam.js';
import { closeTuplet }   from '../symbol/tuplet.js';
import getStopBeat       from '../event/to-stop-beat.js';
import detectRhythm, { straighten, hasHoles } from '../rhythm.js';
import { P24, GR }       from '../constants.js';


const global  = globalThis || window;
const assign  = Object.assign;
const { abs, ceil, floor, min, max, pow, sqrt, round } = Math;
const symbols = [];
const notes   = [];


function toDrumSlug(number) {
    return slugify(toDrumName(number));
}

function toMaxStopBeat(n, event) {
    return max(n, getStopBeat(event));
}

const noteDurations = [
    0.125,
    0.25,  0.375,
    0.5,   0.75,   0.875,
    1,     1.5,    1.75
];


function createTuplet(settings, stave, part, startBeat, data) {
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

function isDivision(divisions, beat) {
    let n = -1;
    while (divisions[++n]) if (eq(divisions[n], beat, P24)) return true;
    return false;
}

function getDivisionBefore(divisions, beat) {
    let n = -1;
    while (divisions[++n] <= beat);
    return divisions[n - 1] || 0;
}

function getDivisionAfter(divisions, beat) {
    let n = -1;
    while (divisions[++n] <= beat);
    return divisions[n];
}

function getNotesDuration(divisions, b1, b2) {
    const v1 = getDivisionBefore(divisions, b1);
    const v2 = getDivisionAfter(divisions, b1);
    const v3 = getDivisionBefore(divisions, b2);
    return v1 === v3 ?
        // Duration up to rhythm divisor
        noteDurations.includes(b2 - b1) ? b2 - b1 : undefined : // floorPow2(min(1, b2 - b1)) :
        // Duration up to next bar division
        noteDurations.includes(v2 - b1) ? v2 - b1 : undefined ; // floorPow2(min(1, v2 - b1)) ;
}

function getGrain(divisions, beat) {
    const minGrain = 0.125;
    const maxGrain = 1;
    const div      = getDivisionBefore(divisions, beat);
    return grainPow2(minGrain, maxGrain, beat - div);
}

export default class DrumStave extends Stave {
    type = 'drum';

    pitched = false;

    rows = [
        "",
        "",
        "",
        /* Splash, Chinese */
        toDrumSlug(55) + ' ' + toDrumSlug(52),
        /* Crash 2 */
        toDrumSlug(57),
        /* Crash 1 */
        toDrumSlug(49),
        /* Ride Cymbal, Ride Bell, Ride Cymbal 2 */
        toDrumSlug(51) + ' ' + toDrumSlug(53) + ' ' + toDrumSlug(59),
        /* Closed Hi-hat, Open Hi-hat - Top line */
        toDrumSlug(42) + ' ' + toDrumSlug(46),
        /* High tom, Cowbell */
        toDrumSlug(50) + ' ' + toDrumSlug(56),
        /* Low mid tom, High mid tom */
        toDrumSlug(48) + ' ' + toDrumSlug(47),
        /* Snare drum 1, Snare drum 2 */
        toDrumSlug(38) + ' ' + toDrumSlug(40),
        /* Low tom, Sticks, Hand clap, Tambourine */
        toDrumSlug(45) + ' ' + toDrumSlug(31) + ' ' + toDrumSlug(39) + ' ' + toDrumSlug(54),
        /* High floor tom */
        toDrumSlug(43),
        /* Low floor tom */
        toDrumSlug(41),
        /* Low bass drum, High bass drum */
        toDrumSlug(35) + ' ' + toDrumSlug(36),
        /* Bottom line */
        "",
        /* Pedal Hi-hat */
        toDrumSlug(44),
        "",
        "",
        "",
        "",
        "",
        ""
    ];

    #headnames = {
        31: 'headX',          // Sticks
        37: 'headCircle',     // Side Stick
        39: 'headX',          // Hand Clap
        42: 'headX',          // Closed Hi-Hat
        44: 'headX',          // Pedal Hi-Hat
        46: 'headCircleX',    // Open Hi-Hat
        49: 'headCircleX',    // Crash Cymbal 1
        51: 'headX',          // Ride Cymbal 1
        52: 'headCircleX',    // Chinese Cymbal
        53: 'headDiamond',    // Ride Bell
        54: 'headX',          // Tambourine
        55: 'headX',          // Splash Cymbal
        56: 'headTriangleUp', // Cowbell
        57: 'headCircleX',    // Crash Symbol 2
        58: 'headTriangleUp', // Vibraslap
        59: 'headX'           // Ride Cymbal 2
    };

    #ghostables = {
        31: true, // Sticks
        35: true, // Low bass drum
        36: true, // High bass drum
        37: true, // Side Stick
        38: true, // Snare drum 1
        40: true, // Snare drum 2
        41: true, // Low floor tom
        42: true, // Closed Hi-Hat
        43: true, // High floot tom
        45: true, // Low tom
        47: true, // Low mid tim
        48: true, // High mid tom
        50: true, // High tom
        56: true  // Cowbell
    };

    getNoteHTML(pitch, dynamic, duration) {
        const number    = toNoteNumber(pitch);
        const name      = this.#headnames[number];
        const ghostable = this.#ghostables[number];
        const html      = name ?
            `<span class="head" data-glyph="${ name }">${ glyphs[name] }</span>` :
            this.getHeadHTML(pitch, dynamic, duration) ;

        // Ghost note gets brackets
        return ghostable && dynamic < config.ghostThreshold ? `
            <span class="pre" data-glyph="headBracketLeft">${ glyphs.headBracketLeft }</span>
            ${ html }
            <span class="post" data-glyph="headBracketRight">${ glyphs.headBracketRight }</span>
            ` :
            html ;
    }

    parts = [{
        name:   'drums',
        beam:   'drums-beam',
        stemup: false
    }, {
        name:   'cymbals',
        beam:   'cymbals-beam',
        stemup: true
    }];

    getPart(number) {
        // Split drums stave into drums and cymbals parts
        return [35, 36, 37, 38, 40, 41, 43, 44, 45, 47, 48, 50].includes(toNoteNumber(number)) ?
            this.parts[0] :
            this.parts[1] ;
    }

    /**
    .getRow(pitch)
    Returns the row index of a given pitch name or number.
    **/
    getRow(part, n) {
        const pitch = typeof n === 'string' ? n : toDrumSlug(n) ;
        if (!pitch) throw new Error('Number not found for pitch ' + n);
        const i = this.rows.findIndex((row) => row.includes(pitch));
        //if (global.DEBUG && i === -1) throw new Error('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        if (i === -1) console.warn('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        return i > -1 ? i : undefined ;
    }

    getSpelling(key, number) {
        return toDrumSlug(number);
    }

    createSignatureSymbols(key) {
        return [{
            type: 'clef',
            clef: this.type
        }];
    }

    yRatioToPitch(y) {
        const i = floor(y * this.rows.length);
        const j = i < 4 ? 4 : i > 17 ? 17 : i ;
        return this.pitches[j];
    }

    createSymbols(symbols, divisions, part, key, tuplet, notes, beat, duration, settings, fn) {
        // Inside this fn beat is relative to bar
        const stave = this;

        // Insert heads
        const noteSymbols = createNotes(stave, key, part, notes);
        if (!noteSymbols.length) return noteSymbols;

        // Create ledgers, accidentals and accents
        createLedges(symbols, stave, part, beat, noteSymbols);
        //createAccidentals(symbols, bar, part, accidentals, beat, noteSymbols);
        createAccents(symbols, stave, part, beat, noteSymbols, settings);

        // Push note symbols on to tuplet
        if (tuplet) push(tuplet, ...noteSymbols);

        // Assign beat, duration to note symbols and push into symbols
        let n = -1;
        while (noteSymbols[++n]) symbols.push(assign(noteSymbols[n], {
            beat,
            duration,
            grain: grainPow2(divisions, beat)
        }));

        // Return note symbols
        return noteSymbols;
    }

    createPartSymbols(key, accidentals, part, events, beat, duration, barDivisions, barDivisor, settings) {
        const startBeat   = beat;
        const stopBeat    = beat + duration;
        const stave       = this;

        let n = -1;
        let beam, event, tuplet, noteSymbols;

        symbols.length = 0;

        // Ignore events that stop before beat, an extra cautious measure,
        // events array should already start with events at beat
        //while ((event = events[++n]) && lte(beat, event[0] + event[4], P24));
        while ((event = events[++n]) && lt(beat, event[0], P24));
        --n;

        let data, previousData;
        while (data = detectRhythm(beat, stopBeat - beat, events, n + 1, { maxDivision: 1 })) {
            // Tuplet
            const { rhythm, duration, divisor } = data;
            const tuplet   = createTuplet(settings, stave, part, startBeat, data);
            const division = duration / divisor;
            const r        = rhythm.toString(2);

            if (tuplet) {
                // Push it in
                symbols.push(tuplet);
                // Fill with rests up to start of tuplet
                createRests(symbols, settings.restDurations, barDivisor, this, part, beat - startBeat, data.beat - startBeat);
                // Set beat to start of tuplet
                beat = data.beat;
                // if there is a beam, close it
                if (beam) beam = closeBeam(symbols, stave, part, beam);
                // Loop through tuplet divisions
                let i = -1;
                while (++i < divisor) {
                    // Query the binary from its end (the first division) backwards
                    if (r[r.length - 1 - i] === '1') {
                        // Fill notes with events playing during division
                        notes.length = 0;
                        while ((event = events[++n]) && event[0] < beat + 0.5 * division) notes.push(event);
                        --n;
                        // Sort notes by pitch order, descending (ascending row order)
                        //if (stave.pitched) notes.sort(byRow);
                        // Impose max note duration, drum notation only has black notes
                        const d = min(1, division);
                        // Insert note symbols
                        noteSymbols = this.createSymbols(symbols, barDivisions, part, key, tuplet, notes, beat - startBeat, d, settings);
                        // If division is short enough for a beam
                        if (division < 0.5) {
                            // ...make sure there is a beam
                            if (!beam) beam = createBeam(part, beat - startBeat);
                            // ...and push note symbols on to it
                            push(beam, ...noteSymbols);
                        }
                    }
                    else {
                        // Push in a tuplet division rest
                        symbols.push({
                            type: 'rest',
                            beat:     beat - startBeat,
                            duration: division,
                            stave,
                            part
                        });
                    }

                    // Set beat to division end
                    beat = data.beat + i * division + division;
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
                    // Query the binary string from its end (the first division) backwards
                    if (r[r.length - 1 - i] === '1') {
                        // Render up to division
                        if (noteSymbols && noteSymbols.length) {
                            const b1 = noteSymbols[0].beat;
                            const b2 = data.beat + i * division - startBeat;
                            const v1 = getDivisionBefore(barDivisions, b1);
                            const v2 = getDivisionAfter(barDivisions, b1);
                            const v3 = getDivisionBefore(barDivisions, b2);
                            const duration = v1 === v3 ?
                                // Duration up to rhythm divisor
                                noteDurations.includes(b2 - b1) ? b2 - b1 : noteSymbols[0].duration : // floorPow2(min(1, b2 - b1)) :
                                // Duration up to next bar division
                                noteDurations.includes(v2 - b1) ? v2 - b1 : noteSymbols[0].duration ; // floorPow2(min(1, v2 - b1)) ;

                            // If last notes have a duration too long for a beam
                            if (gte(1, duration, P24)) {
                                // ...and there is a beam, close it
                                if (beam) beam = closeBeam(symbols, stave, part, beam);
                            }
                            // If notes are in the same bar division as rhythm division
                            else if (v1 === v3) {
                                // ...make sure there is a beam
                                if (!beam) beam = createBeam(part, b1);
                                // ...and push note symbols on to it
                                push(beam, ...noteSymbols);
                            }
                            // If there is a beam
                            else if (beam) {
                                // ...push last note symbols on to it
                                push(beam, ...noteSymbols);
                                // ...and close it
                                beam = closeBeam(symbols, stave, part, beam);
                            }

                            // Extend duration of notes
                            setDurations(noteSymbols, duration);
                            beat = b1 + duration + startBeat;
                        }

                        // If gap is bigger than division stop the beam
                        if (beam && gt(division, data.beat + i * division - beat, P24)) {
                            beam = closeBeam(symbols, stave, part, beam);
                        }
                        // Fill gap with rests
                        createRests(symbols, settings.restDurations, barDivisor, this, part, beat - startBeat, data.beat + i * division - startBeat);
                        // Update beat to division beginning
                        beat = data.beat + i * division;
                        // Fill notes with events playing during division, leaving event
                        // as first event in the next division
                        notes.length = 0;
                        while ((event = events[++n]) && event[0] < beat + 0.5 * division) notes.push(event);
                        --n;
                        // Sort notes by pitch order, descending (ascending row order)
                        //if (stave.pitched) notes.sort(byRow);
                        // Impose max note duration, drum notation only has black notes
                        const d = min(1, division);
                        // Insert note symbols
                        noteSymbols = this.createSymbols(symbols, barDivisions, part, key, tuplet, notes, beat - startBeat, d, settings);
                        // Update beat to division end
                        beat = data.beat + i * division + division;
                    }
                }
            }

            // Update beat
            beat = data.beat + data.duration;
            n = data.index + data.count - 1;
        }

        if (noteSymbols && noteSymbols.length) {
            const b1       = noteSymbols[0].beat;
            const b2       = stopBeat - startBeat;
            const duration = getNotesDuration(barDivisions, b1, b2) || noteSymbols[0].duration;

            // If duration is not beamable, close beam
            if (gte(1, duration, P24)) {
                // ...and there is a beam, close it
                if (beam) beam = closeBeam(symbols, stave, part, beam);
            }
            else if (beam) {
                // Push note symbols on to it
                push(beam, ...noteSymbols);
            }

            // Set duration of notes
            setDurations(noteSymbols, duration);
            beat = nearest(P24, b1 + duration + startBeat);
        }

        // If there's still a beam close it
        if (beam) beam = closeBeam(symbols, stave, part, beam);
        // Create rests to stopBeat
        createRests(symbols, settings.restDurations, barDivisor, this, part, beat - startBeat, stopBeat - startBeat);

        return symbols;
    }
}
