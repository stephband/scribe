
import toSpelling from './event/to-spelling.js';
import { toNoteName, toNoteNumber } from '../../midi/modules/note.js';


export const chords = {
    clef: 'chords',
    getSpelling: toSpelling
};

export const treble = {
    clef: 'treble',
    centerPitch: 'B4',
    getSpelling: toSpelling
};

export const bass = {
    clef: 'bass',
    centerPitch: 'D3',
    getSpelling: toSpelling
};

export const piano = {
    clef: 'piano',
    getSpelling: toSpelling,

    // TEMP
    centerPitch: 'B4',

    // TODO: there should be four parts available, soprano alto, tenor bass
    getPart: function(pitch) {
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

    getSpelling: (key, name, type, transpose) => {
        if (type === 'chord') {
            return getSpelling(key, name, 'chord', transpose);
        }
        else if (type === 'note') {
            // Use standard MIDI note names. We don't want any spelling happening
            // on drum parts.
            return toNoteName(toNoteNumber(name));
        }
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
    centerPitch: 'B4',

    getSpelling: (key, name, type, transpose) => {
        if (type === 'chord') {
            return getSpelling(key, name, 'chord', transpose);
        }
        else if (type === 'note') {
            // Use standard MIDI note names. We don't want any spelling happening
            // on drum parts.
            return toNoteName(toNoteNumber(name));
        }
    }
};
