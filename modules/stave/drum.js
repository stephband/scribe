
import { toNoteName, toNoteNumber } from 'midi/note.js';
import { spellRoot, spellPitch }    from '../spelling.js';
import * as glyphs from "../glyphs.js";
import Stave       from './stave.js';

export default class DrumStave extends Stave {
    type = 'drum';
    clef = glyphs.clefDrum;

    pitched = false;

    rows = ['','','','','','','',
        'pedal-hi-hat',
        'bass-drum-2',
        'bass-drum-1',
        'low-tom-2',
        'low-tom-1',
        'mid-tom-2',
        'snare-drum-1',
        'mid-tom-1',
        'high-tom-1',
        'closed-hi-hat',
        'ride-cymbal-1',
        'crash-cymbal-1',
        'crash-cymbal-2',
        'splash-cymbal',
    '','','',''];

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

    #rows = {
        27: 0,  // High Q
        28: 0,  // Slap
        29: 0,  // Scratch Push
        30: 0,  // Scratch Pull
        31: 13, // Sticks
        32: 0,  // Square Click
        33: 0,  // Metronome Click
        34: 0,  // Metronome Bell
        35: 10, // Bass Drum 2
        36: 9,  // Bass Drum 1
        37: 14, // Side Stick
        38: 14, // Snare Drum 1
        39: 13, // Hand Clap
        40: 14, // Snare Drum 2
        41: 11, // Low Tom 2
        42: 17, // Closed Hi-hat
        43: 12, // Low Tom 1
        44: 8,  // Pedal Hi-hat
        45: 13, // Mid Tom 2
        46: 17, // Open Hi-hat
        47: 13, // Mid Tom 1
        48: 15, // High Tom 2
        49: 19, // Crash Cymbal 1
        50: 16, // High Tom 1
        51: 18, // Ride Cymbal 1
        52: 21, // Chinese Cymbal
        53: 18, // Ride Bell
        54: 13, // Tambourine
        55: 21, // Splash Cymbal
        56: 16, // Cowbell
        57: 20, // Crash Cymbal 2
        58: 0,  // Vibra Slap
        59: 19, // Ride Cymbal 2
        60: 0,  // High Bongo
        61: 0,  // Low Bongo
        62: 0,  // Mute High Conga
        63: 0,  // Open High Conga
        64: 0,  // Low Conga
        65: 0,  // High Timbale
        66: 0,  // Low Timbale
        67: 0,  // High Agogo
        68: 0,  // Low Agogo
        69: 0,  // Cabasa
        70: 0,  // Maracas
        71: 0,  // Short Whistle
        72: 0,  // Long Whistle
        73: 0,  // Short Guiro
        74: 0,  // Long Guiro
        75: 0,  // Claves
        76: 0,  // High Wood Block
        77: 0,  // Low Wood Block
        78: 0,  // Mute Cuica
        79: 0,  // Open Cuica
        80: 0,  // Mute Triangle
        81: 0,  // Open Triangle
        82: 0,  // Shaker
        83: 0,  // Jingle Bell
        84: 0,  // Belltree
        85: 0,  // Castanets
        86: 0,  // Mute Surdo
        87: 0   // Open Surdo
    };

    get maxPitch() {
        return this.rows[25];
    }

    get bottomPitch() {
        return this.rows[8];
    }

    get centerPitch() {
        return this.rows[12];
    }

    get topPitch() {
        return this.rows[16];
    }

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

    /*getPart(pitch) {
        // Split drums stave into drums and cymbals parts
        return [35, 36, 37, 38, 40, 41, 43, 44, 45, 47, 50].includes(toNoteNumber(pitch)) ? {
            part:          'drums',
            stemDirection: 'down',
            tieDirection:  'down',
            centerRow:     'stave-lower',
        } : {
            // part: 'cymbals' Leave part undefined to group with main render
            stemDirection: 'up',
            tieDirection:  'up',
            centerRow:     'stave-upper'
        } ;
    }*/

    parts = {
        drums: {
            name:   'drums',
            stemup: false
        },

        cymbals: {
            name:   'cymbals',
            stemup: true
        }
    };

    getPart(pitch) {
        // Split drums stave into drums and cymbals parts
        return [35, 36, 37, 38, 40, 41, 43, 44, 45, 47, 50].includes(toNoteNumber(pitch)) ?
            this.parts.drums :
            this.parts.cymbals ;
    }

    getRowDiff(pitch1, pitch2) {
        const number1 = toNoteNumber(pitch1);
        const number2 = toNoteNumber(pitch2);
        const row1    = this.#rows[number1];
        const row2    = this.#rows[number2];

        if (row1 === undefined) { throw new Error('Pitch "' + pitch1 + '" is not supported by stave ' + this.constructor.name); }
        if (row2 === undefined) { throw new Error('Pitch "' + pitch2 + '" is not supported by stave ' + this.constructor.name); }

        return row2 - row1;
    }

    getSpelling(key, event) {
        if (event[1] === 'note') {
            // Use standard MIDI note names. We don't want any spelling happening
            // on drum parts.
            return toNoteName(toNoteNumber(event[2]));
        }

        return spellPitch(key, event[2]);
    }

    yRatioToPitch(y) {
        const i = floor(y * this.rows.length);
        const j = i < 4 ? 4 : i > 17 ? 17 : i ;
        return this.pitches[j];
    }
}
