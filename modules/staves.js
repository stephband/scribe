export const treble = {

};

export const bass = {

};

export const piano = {
    upper: {
        centerRow: 'stave-upper'
    },

    lower: {
        // Anything below C4
        pitches: /[0123]$/,
        centerRow: 'stave-lower'
    },

    getSplit: function(symbol) {
        if (this.lower.pitches.test(symbol.pitch)) {
            return this.lower;
        }

        return this.upper;
    }
};

export const chords = {

};

export const drums = {
    heads: {
        /*"C♯2":  "head[1]", /* Side Stick */
        "E♭2":  "head[x]", /* Hand Clap */
        "F♯2":  "head[x]", /* Closed Hi-Hat */
        "A♭2":  "head[x]", /* Pedal Hi-Hat */
        "B♭2":  "head[x]", /* Open Hi-Hat */
        "C♯3":  "head[x]", /* Crash Cymbal 1 */
        "E♭3":  "head[x]", /* Ride Cymbal 1 */
        "E3":   "head[x]", /* Chinese Cymbal */
        "F3":   "head[x]", /* Ride Bell */
        "F♯3":  "head[x]", /* Tambourine */
        "G3":   "head[x]", /* Splash Cymbal */
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

    hands: {
        name: 'hands',
        pitches: "",
        stemDirection: 'up',
        row: 'stave-upper'
    },

    feet: {
        name: 'feet',
        // kick and hihatpedal
        pitches: "B1 C1 A♭2 G♯2",
        stemDirection: 'down',
        row: 'stave-lower'
    },

    getSplit: function(pitch) {
        return this.feet.pitches.includes(pitch) ?
            this.feet :
            this.hands ;
    },

    getHead: function(pitch) {
        console.log(pitch);
        return this.heads[pitch] ?
            this.heads[pitch] :
            undefined ;
    }
};

export const percussion = {

};
