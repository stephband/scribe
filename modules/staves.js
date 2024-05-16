
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
        return this.pitches[floor(y * this.pitches.length)];
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
    slashedBlack:"\uE0CF", 
    xBlack:"\uE0A9",
    xOrnate: "\uE0AA",
    triangleUpBlack: "\uE0BE",
    diamondBlack: "\uE0DB",
    circledBlack: "\uE0E4",

    pitches: [
    '',
    '',
    '',
    '',
    'splash',
    'crash2',
    'crash',
    'hihat',
    'ride',
    'hightom',
    'midtom',
    'snare',
    'lowtom',
    'floortom',
    'lowfloortom',
    'kick',
    'kick2',
    'hihatpedal',
    'foot',
    '',
    '',
    '',
    '',
    '',
    ''],


    yRatioToPitch: function(y) {
        return this.pitches[floor(y * this.pitches.length)];
    },

    heads: {
        /*"C♯2":  "head[1]", /* Side Stick */
        "B1": 1,
        "D2": 1,
        "E♭2":  "head[x]", /* Hand Clap */
        "F♯2":  "xBlack", /* Closed Hi-Hat */
        "G♯2":  "xBlack",
        "A♭2":  "xBlack", /* Pedal Hi-Hat */
        "B♭2":  "xCircle", /* Open Hi-Hat */
        "C♯3":  "xCircle", /* Crash Cymbal 1 */
        "E♭3":  "xBlack", /* Ride Cymbal 1 */
        "E3":   "xCircle", /* Chinese Cymbal */
        "F3":   "head[x]", /* Ride Bell */
        "F♯3":  "head[x]", /* Tambourine */
        "G3":   "xCircle", /* Splash Cymbal */
        "G♯3":  "head[v]",
        "A♭3":  "triangleUpBlack", /* Cowbell*/
        "A3":   "xCircle", /* Crash Symbol 2 */
        "B♭3":  "head[v]", /* Vibraslap */
        "B3":   "xBlack", /* Ride Cymbal 2 */

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

    getHead: function(pitch, dynamic, duration) {
        return dynamic < 0.02 ? this.heads[pitch]+"Ghost" : this.heads[pitch];
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
