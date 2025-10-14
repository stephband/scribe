
import slugify from 'fn/slugify.js';
import { toNoteName, toDrumName, toNoteNumber } from 'midi/note.js';
import { spellRoot, spellPitch }    from '../spelling.js';
import * as glyphs from "../glyphs.js";
import Stave       from './stave.js';


const global = globalThis || window;


function toDrumPitch(number) {
    return toDrumName(number)
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/-drum|-cymbal/, '');
}

export default class DrumStave extends Stave {
    type = 'drum';
    clef = glyphs.clefDrum;

    pitched = false;

    rows = [
        "",
        "",
        "",
        "",
        "splash chinese",
        "crash-2",
        "crash-1",
        "ride-1 ride-2 ride-bell",
        "closed-hi-hat open-hi-hat",
        "high-tom cowbell",
        "low-mid-tom high-mid-tom",
        "snare-1 snare2 side-stick",
        "low-tom sticks hand-clap tambourine",
        "high-floor-tom",
        "low-floor-tom",
        "low-bass high-bass",
        "",
        "pedal-hi-hat",
        "",
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



    getNoteHTML(pitch, dynamic, duration) {
        const number = toNoteNumber(pitch);
        const name   = this.#headnames[number];
        const head   = glyphs[name];
        const html   = name ?
            `<span class="head" data-glyph="${ name }">${ head }</span>` :
             super.getNoteHTML(pitch, dynamic, duration) ;

        // Ghost note gets brackets
        return dynamic < 0.02 ?
            glyphs.headBracketLeft + html + glyphs.headBracketRight :
            html ;
    }

    parts = {
        drums: {
            name:   'drums',
            // Does not need name, existence is enough actually
            beam:   'drums-beam',
            stemup: false
        },

        cymbals: {
            name:   'cymbals',
            // Does not need name, existence is enough actually
            beam:   'cymbals-beam',
            stemup: true
        }
    };

    getPart(pitch) {
        // Split drums stave into drums and cymbals parts
        return [35, 36, 37, 38, 40, 41, 43, 44, 45, 47, 50].includes(toNoteNumber(pitch)) ?
            this.parts.drums :
            this.parts.cymbals ;
    }

    /**
    .getRow(pitch)
    Returns the row index of a given pitch name or number.
    **/
    getRow(part, n) {
        const pitch = typeof n === 'string' ? n : toDrumPitch(n) ;
        if (!pitch) throw new Error('Drum name not found for pitch ' + n);
        const i = this.rows.findIndex((row) => row.includes(pitch));
        if (global.DEBUG && i === -1) throw new Error('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        if (i === -1) console.warn('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        return i > -1 ? i : undefined ;
    }

    getSpelling(key, event) {
        if (event[1] === 'note') {
            // Use standard MIDI note names. We don't want any spelling happening
            // on drum parts.
            return toDrumPitch(toNoteNumber(event[2]));
        }

        return super.getSpelliing(key, event[2]);
    }

    yRatioToPitch(y) {
        const i = floor(y * this.rows.length);
        const j = i < 4 ? 4 : i > 17 ? 17 : i ;
        return this.pitches[j];
    }
}
