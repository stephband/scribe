
import matches           from 'fn/matches.js';
import slugify           from 'fn/slugify.js';
import { toDrumName, toNoteNumber } from 'midi/note.js';
import * as glyphs       from "../glyphs.js";
import config            from '../config.js';
import Stave             from './stave.js';
import { eq, gte, lte, lt, gt } from '../number/float.js';
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
import { getDivisionBefore, getDivisionAfter } from '../bar/divisions.js';


const global = globalThis || window;
const assign = Object.assign;
const notes  = [];
const { abs, ceil, floor, min, max, pow, sqrt, round } = Math;
const noteDurations = [
    0.125,
    0.25,  0.375,
    0.5,   0.75,   0.875,
    1,     1.5,    1.75
];


function toDrumSlug(number) {
    return slugify(toDrumName(number));
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
//console.log('b3', b3);
    while (noteDurations[--j] > b3 - b1);

    // If that duration does not span exactly to b2 or bar division
    return b1 + noteDurations[j] !== b3 ?
        // ...reject dotted durations
        floorPow2(noteDurations[j]) :
        // ...use duration as-is
        noteDurations[j] ;
}

function getGrain(divisions, beat) {
    const minGrain = 0.125;
    const maxGrain = 2;
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
        staff:  'main',
        beam:   'drums-beam',
        stemup: false
    }, {
        name:   'cymbals',
        staff:  'main',
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

    getNotesAtBeat(beat, division, events) {
        // Fill notes with events playing during division
        //notes.length = 0;
        while (events[0] && events[0][0] < beat + 0.5 * division) {
            notes.push(events.shift());
        }
        // Sort notes by pitch order, descending (ascending row order)
        //if (stave.pitched) notes.sort(byRow);
        return notes;
    }

    createNoteSymbols(symbols, bar, part, accidentals, notes, beat, duration, settings) {
        const stave = this;
        // Create note heads
        const noteSymbols = createNotes(stave, bar.key, part, notes, beat, duration);
        // Create ledgers, accidentals and accents
        createLedges(symbols, stave, part, beat, noteSymbols);
        createAccents(symbols, stave, part, beat, noteSymbols, settings);
        // Push in note heads
        symbols.push.apply(symbols, noteSymbols);
        // Drum notation does not tie notes
        notes.length = 0;
        // Return symbols
        return noteSymbols;
    }

    createDupletNoteSymbols(symbols, bar, part, accidentals, beam, notes, n, startBeat, stopBeat, settings) {
        const stave    = this;
        const b1       = startBeat - bar.beat;
        const b2       = stopBeat - bar.beat;
        const grain    = getGrain(bar.divisions, b1);
        const v1       = getDivisionBefore(bar.divisions, b1);
        const v2       = getDivisionAfter(bar.divisions, b1);
        const v3       = getDivisionBefore(bar.divisions, b2);
        const duration = getNotesAtBeatDuration(bar.divisions, grain, b1, b2, v1, v2, v3);

        // Create note heads
        const noteSymbols = createNotes(stave, bar.key, part, notes, b1, duration);
        // Drum notation does not tie notes
        notes.length = 0;

        // Extend duration of notes
        //setDurations(noteSymbols, duration);
        const beat = b1 + duration + bar.beat;

        // If last notes have a duration too long for a beam
        if (gte(1, duration, P24)) {
            // ...and there is a beam, close it
            if (beam) beam = closeBeam(symbols, stave, part, beam);
        }
        // If notes are in the same bar division as rhythm division
        else if (v1 === v3 && (
            // ...and note stop brings us up to division
            beat === b2 + bar.beat
            // ...or note duration is the same duration as the gap
            || duration === b2 + bar.beat - beat
        )) {
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

        // Create ledgers, accidentals and accents
        createLedges(symbols, stave, part, b1, noteSymbols);
        createAccents(symbols, stave, part, b1, noteSymbols, settings);
        // Push in note heads
        symbols.push.apply(symbols, noteSymbols);

        return { beat, beam, notes };
    }
}
