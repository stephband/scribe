
import nothing        from '../lib/fn/modules/nothing.js';
import { toNoteName, toNoteOctave } from '../lib/midi/modules/note.js';
import toSpelling     from './event/to-spelling.js';
import { rflatsharp } from './regexp.js';
import * as glyphs    from "./glyphs.js";

const assign = Object.assign;


/* Stave */

export default class Stave {
    /**
    Stave.create(type)
    Create a stave object by type.
    **/
    static create(type) {
        return new Stave[type]();
    }

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
    .getHead(pitch, dynamic, duration)
    Get the head used for a given `pitch`, `dynamic` and `duration`. For normal
    chromatic staves only `duration` really matters, but percussion staves may
    replace heads based on pitch and dynamics. Returns a string that (in most
    cases) contains a single unicode character.
    **/
    getHead(pitch, dynamic, duration) {
            // Semibreve
        return duration >= 4 ? glyphs.head4 :
            // Triplet semibreve
            Math.fround(duration) === Math.fround(2.666666667) ? glyphs.head4 :
            // Minim
            duration >= 2 ? glyphs.head2 :
            // Triplet minim
            Math.fround(duration) === Math.fround(1.333333333) ? glyphs.head2 :
            // Everything else
            glyphs.head1 ;
    }

    /**
    .minPitch, .maxPitch, .minLinePitch, .midLinePitch, .maxLinePitch
    Minimum and maximum pitch names supported by the stave corresponding to the
    first and last row names in `.rows`, and lower, middle and upper stave pitches
    corresponding to the lower, middle and upper lines of the stave.
    **/

    get minPitch() {
        return this.rows[0];
    }

    get maxPitch() {
        return this.rows[27];
    }

    get minLinePitch() {
        return this.rows[9];
    }

    get midLinePitch() {
        return this.rows[13];
    }

    get maxLinePitch() {
        return this.rows[17];
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
    getPart(pitch) {
        return this.getRowDiff(this.midLinePitch, pitch) < 0 ? {
            stemDirection: 'up',
            tieDirection:  'up'
        } : {
            stemDirection: 'down',
            tieDirection:  'down'
        };
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
    getSpelling() {
        return toSpelling.apply(this, arguments);
    }

    yRatioToPitch(y) {
        const n = floor(y * this.pitches.length);
        return n < 0 ? this.pitches[0] :
            n > this.pitches.length - 1 ? this.pitches[this.pitches.length - 1] :
            this.pitches[n] ;
    }
}

class TrebleUpStave extends Stave {
    type = 'treble-up';
    clef = glyphs.trebleUpClef;
    rows = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6','D6','E6','F6','G6','A6','B6','C7','D7','E7','F7','G7','A7'];
}

class TrebleStave extends Stave {
    type = 'treble';
    clef = glyphs.trebleClef;
    rows = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6','D6','E6','F6','G6','A6'];
}

class TrebleDownStave extends Stave {
    type = 'treble-down';
    clef = glyphs.trebleDownClef;
    rows = ['C2','D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5'];
}

class AltoStave extends Stave {
    type = 'alto';
    clef = glyphs.altoClef;
    rows = ['D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5'];
}

class BassStave extends Stave {
    type = 'bass';
    clef = glyphs.bassClef;
    rows = ['E1','F1','G1','A1','B1','C2','D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5'];
}

class PianoStave extends Stave {
    type = 'piano';
    clef = glyphs.trebleClef;
    rows = ['E1','F1','G1','A1','B1','C2','D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5'];

    // TODO: there should be four parts available, soprano alto, tenor bass?
    getPart(pitch) {
        // A part is an object of properties assigned to a symbol.
        // Render anything below Bb3 on the lower part.
        return /[012]$|[AC-G][b#♭♯𝄫𝄪]*3$/.test(pitch) ? {
            part:        'lower',
            centerPitch: 'D3',
            centerRow:   'stave-lower'
        } : {
            centerPitch: 'B4',
            centerRow:   'stave-upper'
        } ;
    }
}

class DrumStave extends Stave {
    type = 'drum';
    clef = glyphs.drumClef;

    pitched = false;

    rows = ['','','','','','','','pedal','bass2','bass1','floor2','floor1','lowtom','snare','midtom','hightom','ride','hihat','crash1','crash2','splash','','','',''];

    #heads = {
        37: glyphs.headCircle,     /* Side Stick */
        39: glyphs.headX,          /* Hand Clap */
        42: glyphs.headX,          /* Closed Hi-Hat */
        44: glyphs.headX,          /* Pedal Hi-Hat */
        46: glyphs.headCircleX,    /* Open Hi-Hat */
        49: glyphs.headCircleX,    /* Crash Cymbal 1 */
        51: glyphs.headX,          /* Ride Cymbal 1 */
        52: glyphs.headCircleX,    /* Chinese Cymbal */
        53: glyphs.headX,          /* Ride Bell */
        54: glyphs.headX,          /* Tambourine */
        55: glyphs.headCircleX,    /* Splash Cymbal */
        56: glyphs.headTriangleUp, /* Cowbell */
        57: glyphs.headCircleX,    /* Crash Symbol 2 */
        58: glyphs.headTriangleUp, /* Vibraslap */
        59: glyphs.headX,          /* Ride Cymbal 2 */
    };

    get maxPitch() {
        return this.rows[25];
    }

    get minLinePitch() {
        return this.rows[8];
    }

    get midLinePitch() {
        return this.rows[12];
    }

    get maxLinePitch() {
        return this.rows[16];
    }

    getHead(pitch, dynamic, duration) {
        const number = toNoteNumber(pitch);
        const head   = this.#heads[number] || super.getHead(pitch, dynamic, duration);
        return dynamic < 0.02 ?
            // Ghost note gets brackets
            glyphs.headBracketLeft + head + glyphs.headBracketRight :
            // Full note
            head;
    }

    getPart(pitch) {
        const number = toNoteNumber(pitch);
        // Split drums stave into drums and cymbals parts
        return [35, 36, 37, 38, 40, 41, 43, 44, 45, 47, 50].includes(pitch) ? {
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
    }

    getSpelling(key, event, transpose) {
        if (event[1] === 'note') {
            // Use standard MIDI note names. We don't want any spelling happening
            // on drum parts.
            return toNoteName(toNoteNumber(event[2]));
        }

        return toSpelling(key, event, transpose);
    }

    yRatioToPitch(y) {
        const i = floor(y * this.rows.length);
        const j = i < 4 ? 4 : i > 17 ? 17 : i ;
        return this.pitches[j];
    }
}

class PercussionStave extends Stave {
    type = 'percussion';
    clef = glyphs.percussionClef;

    #heads = {
        37: glyphs.headCircle,     /* Side Stick */
        39: glyphs.headX,          /* Hand Clap */
        42: glyphs.headX,          /* Closed Hi-Hat */
        44: glyphs.headX,          /* Pedal Hi-Hat */
        46: glyphs.headCircleX,    /* Open Hi-Hat */
        49: glyphs.headCircleX,    /* Crash Cymbal 1 */
        51: glyphs.headX,          /* Ride Cymbal 1 */
        52: glyphs.headCircleX,    /* Chinese Cymbal */
        53: glyphs.headX,          /* Ride Bell */
        54: glyphs.headX,          /* Tambourine */
        55: glyphs.headCircleX,    /* Splash Cymbal */
        56: glyphs.headTriangleUp, /* Cowbell */
        57: glyphs.headCircleX,    /* Crash Symbol 2 */
        58: glyphs.headTriangleUp, /* Vibraslap */
        59: glyphs.headX,          /* Ride Cymbal 2 */
    };

    pitched = false;

    rows = ['','','','','','','','','note','','','','','','','',''];

    get maxPitch() {
        return this.rows[17];
    }

    get minLinePitch() {
        return this.rows[8];
    }

    get midLinePitch() {
        return this.rows[8];
    }

    get maxLinePitch() {
        return this.rows[8];
    }

    getHead(pitch, dynamic, duration) {
        const number = toNoteNumber(pitch);
        const head   = this.#heads[number] || super.getHead(pitch, dynamic, duration);
        return dynamic < 0.02 ?
            // Ghost note gets brackets
            glyphs.headBracketLeft + head + glyphs.headBracketRight :
            // Full note
            head;
    }

    getSpelling(key, event, transpose) {
        if (event[1] === 'note') {
            // Use standard MIDI note names. We don't want any spelling happening
            // on drum parts.
            return toNoteName(toNoteNumber(event[2]));
        }

        return toSpelling(key, event, transpose);
    }
}


// Register staves by type. These are the same string used by the clef attribute,
// as in <scribe-music clef="type">, and accepted by Stave.create(type).

Stave['treble']      = TrebleStave;
Stave['treble-up']   = TrebleUpStave;
Stave['treble-down'] = TrebleDownStave;
Stave['alto']        = AltoStave;
Stave['bass']        = BassStave;
Stave['drum']        = DrumStave;
Stave['percussion']  = PercussionStave;
