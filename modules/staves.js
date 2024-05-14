
import toSpelling from './event/to-spelling.js';
import { toNoteName, toNoteNumber } from '../../midi/modules/note.js';

const floor = Math.floor;

export const chords = {
    clef:        'chords',
    getSpelling: toSpelling
};

export const treble = {
    clef:        'treble',
    topPitch:    'G5',
    centerPitch: 'B4',
    bottomPitch: 'D4',
    getSpelling: toSpelling,
    pitches: ['A6','G6','F6','E6','D6','C6','B5','A5','G5','F5','E5','D5','C5','B4','A4','G4','F4','E4','D4','C4','B3','A3','G3','F3','E3','D3','C3'],

    yRatioToPitch: function(y) {
        const n = floor(y * this.pitches.length);
        return n < 0 ? this.pitches[0] :
            n > this.pitches.length - 1 ? this.pitches[this.pitches.length - 1] :
            this.pitches[n] ;
    },

    movePitch: function(pitch, n) {
        // Chromatic transpose
        const min = toNoteNumber(this.minPitch);
        const max = toNoteNumber(this.maxPitch);
        const number = toNoteNumber(pitch) + n;

        // Don't transpose outside the limits of the stave
        return number >= min && number <= max ?
            number :
            undefined ;
    },

    get minPitch() {
        return this.pitches[this.pitches.length - 1];
    },

    get maxPitch() {
        return this.pitches[0];
    }
};

export const bass = {
    clef:        'bass',
    topPitch:    'B3',
    centerPitch: 'D3',
    bottomPitch: 'F2',
    getSpelling: toSpelling
};

export const piano = {
    clef:        'piano',
    getSpelling: toSpelling,

    // TEMP
    topPitch:    'G5',
    centerPitch: 'B4',
    bottomPitch: 'D4',

    // TODO: there should be four parts available, soprano alto, tenor bass
    getPart: (pitch) => {
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
};

export const drums = {
    clef: 'drums',

    getSpelling: (key, event, transpose) => {
        if (event[1] === 'note') {
            // Use standard MIDI note names. We don't want any spelling happening
            // on drum parts.
            return toNoteName(toNoteNumber(event[2]));
        }

        return toSpelling(key, event, transpose);
    },

    pitches: [
        null, /*  */
        null, /*  */
        null, /*  */
        null, /*  */
        55,   /* splash */
        57,   /* crash2 */
        49,   /* crash */
        42,   /* hihat */
        51,   /* ride */
        50,   /* hightom */
        48,   /* midtom */
        38,   /* snare */
        45,   /* lowtom */
        43,   /* floortom */
        41,   /* lowfloortom */
        36,   /* kick */
        35,   /* kick2 */
        44,   /* hihatpedal */
        null, /* foot */
        null, /*  */
        null, /*  */
        null, /*  */
        null, /*  */
        null, /*  */
        null, /*  */
    ],

    yRatioToPitch: function(y) {
        const i = floor(y * this.pitches.length);
        const j = i < 4 ? 4 : i > 17 ? 17 : i ;
        return this.pitches[j];
    },

    // I know, I know
    pitches2: [
        /* Drum pitches laid out in positional order of where they appear on the
           stave, low to high */
        44, /* G#1 Pedal Hi-Hat */
        35, /* B0  Acoustic Bass Drum */
        36, /* C1  Bass Drum */
        41, /* F1    Low Floor Tom */
        43, /* G1    High Floor Tom */
        45, /* A1    Low Tom */
        47, /* B1    Low-Mid Tom */
        48, /* C2    Hi-Mid Tom */
        56, /* G#2    Cowbell */
        38, /* D1    Acoustic Snare */
        37, /* C#1    Side Stick */
        /*40, /* E1    Electric Snare */
        /*39, /* D#1    Hand Clap */
        50, /* D2    High Tom */
        54, /* F#2    Tambourine */
        51, /* D#2    Ride Cymbal 1 */
        /*59, /* B2    Ride Cymbal 2 */
        53, /* F2    Ride Bell */
        42, /* F#1 Closed Hi Hat */
        46, /* A#1    Open Hi-Hat */
        49, /* C#2    Crash Cymbal 1 */
        57, /* A2    Crash Cymbal 2 */
        55, /* G2    Splash Cymbal */
        52, /* E2    Chinese Cymbal */
        /*58, /* A#2    Vibraslap */
        /*60, /* C3    Hi Bongo */
        /*61, /* C#3    Low Bongo */
        /*62, /* D3    Mute Hi Conga */
        /*63, /* D#3    Open Hi Conga */
        /*64, /* E3    Low Conga */
        /*65, /* F3    Hi Timbale */
        /*66, /* F#3    Low Timbale */
        /*67, /* G3    Hi Agogo */
        /*68, /* G#3    Low Agogo */
        /*69, /* A3    Cabasa */
        /*70, /* A#3    Maracas */
        /*71, /* B3    Short Whistle */
        /*72, /* C4    Long Whistle */
        /*73, /* C#4    Short Guiro */
        /*74, /* D4    Long Guiro */
        /*75, /* D#4    Claves */
        /*76, /* E4    Hi Wood Block */
        /*77, /* F4    Low Wood Block */
        /*78, /* F#4    Mute Cuica */
        /*79, /* G4    Open Cuica */
        /*80, /* G#4    Mute Triangle */
        /*81, /* A4    Open Triangle */
    ],

    movePitch: function(pitch, t) {
        const n = toNoteNumber(pitch);
        const i = this.pitches2.indexOf(n);
        if (i < 0) return;
        const j = i + t;
        if (j < 0 || j >= this.pitches2.length) return;
        return this.pitches2[j];
    },

    heads: {
        /*"C♯2":  "head[1]", /* Side Stick */
        "E♭2":  "head[x]", /* Hand Clap */
        "F♯2":  "head[x]", /* Closed Hi-Hat */
        "G♯2":  "head[x]",
        "A♭2":  "head[x]", /* Pedal Hi-Hat */
        "B♭2":  "head[x]", /* Open Hi-Hat */
        "C♯3":  "head[x]", /* Crash Cymbal 1 */
        "E♭3":  "head[x]", /* Ride Cymbal 1 */
        "E3":   "head[x]", /* Chinese Cymbal */
        "F3":   "head[x]", /* Ride Bell */
        "F♯3":  "head[x]", /* Tambourine */
        "G3":   "head[x]", /* Splash Cymbal */
        "G♯3":  "head[v]",
        "A♭3":  "head[v]", /* Cowbell*/
        "A3":   "head[x]", /* Crash Symbol 2 */
        "B♭3":  "head[v]", /* Vibraslap */
        "B3":   "head[x]", /* Ride Cymbal 2 */

        /*"C4":   "", /* Hi Bongo */
        /*"C♯4":  "", /* Low Bongo */
        /*"D4":   "", /* Mute Hi Conga */
        /*"E♭4":  "", /* Open Hi Conga */
        /*"E4":   "", /* Low Conga */
        /*"F4":   "", /* High Timbale */
        /*"F♯4":  "", /* Low Timbale */
        /*"G4":   "", /* High Agogo */
        /*"A♭4":  "", /* Low Agogo */
        /*"A4":   "", /* Cabasa */
        /*"B♭4":  "", /* Maracas */
        /*"B4":   "", /* Short Whistle */
        /*"C5":   "", /* Long Whistle */
        /*"C♯5":  "", /* Short Guiro */
        /*"D5":   "", /* Long Guiro */
        /*"E♭5":  "", /* Claves */
        /*"E5":   "", /* Hi Wood Block */
        /*"F5":   "", /* Low Wood Block */
        /*"F♯5":  "", /* Mute Cuica */
        /*"G5":   "", /* Open Cuica */
        /*"A♭5":  "", /* Mute Triangle */
        /*"A5":   "", /* Open Triangle */
        /*"B♭5":  "", /* Shaker */
    },

    /** getHead(pitch, duration)
    A stave may override symbols used as note heads. Returns an id of a symbol.
    **/

    getHead: function(pitch, duration) {
        return this.heads[pitch];
    },

    /** getPart(pitch)
    Returns an object of properties assigned to symbols that belong to a part.
    **/

    // TEMP
    centerPitch: 'B4',
    getPart: function(pitch) {
        // A part is an object of properties assigned to a symbol.
        // Render kick and hihatpedal as part 'feet'.
        return ("B1 C1 A♭2 G♯2").includes(pitch) ? {
            part:          'feet',
            stemDirection: 'down',
            tieDirection:  'down',
            centerRow:     'stave-lower',
        } : {
            // part: Leave part undefined to group with main render
            stemDirection: 'up',
            tieDirection:  'up',
            centerRow:     'stave-upper'
        } ;
    },

    /** getRowDiff(p1, p2)
    Given two pitches `p1` and `p2`, returns the difference in rows between
    `p2 - p1`.
    **/

    getRowDiff: function(p1, p2) {
        // TODO: Not sure why this works. Be more robust.
        return 0.1;
    }
};

export const percussion = {
    clef: 'percussion',

    // TEMP
    topPitch:    'C4',
    centerPitch: 'B4',
    bottomPitch: 'A4',

    getSpelling: (key, event, transpose) => {
        if (event[1] === 'note') {
            // Use standard MIDI note names. We don't want any spelling happening
            // on drum parts.
            return toNoteName(toNoteNumber(event[2]));
        }

        return toSpelling(key, event, transpose);
    }
};
