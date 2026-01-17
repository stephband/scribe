
import slugify from 'fn/slugify.js';
import { toDrumName, toNoteNumber } from 'midi/note.js';
import { spellRoot, spellPitch }    from '../spelling.js';
import * as glyphs from "../glyphs.js";
import Stave       from './stave.js';


const global = globalThis || window;

const ghostGain = 0.026607250794768333;


function toDrumSlug(number) {
    return slugify(toDrumName(number));
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
            `<span class="head" data-glyph="${ glyphs[name] }">${ head }</span>` :
             super.getNoteHTML(pitch, dynamic, duration) ;
console.log(number, ghostable, name, dynamic);
        // Ghost note gets brackets
        return ghostable && dynamic < ghostGain ?
            glyphs.headBracketLeft + html + glyphs.headBracketRight :
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
        return [35, 36, 37, 38, 40, 41, 43, 44, 45, 47, 50].includes(toNoteNumber(number)) ?
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
        if (global.DEBUG && i === -1) throw new Error('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        if (i === -1) console.warn('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        return i > -1 ? i : undefined ;
    }

    getSpelling(key, event) {
        if (event[1] === 'note') {
            // Use pitch slug as row identifier. We don't want any spelling
            // happening on drum parts.
            return toDrumSlug(event[2]);
        }

        return super.getSpelling(key, event[2]);
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
}
