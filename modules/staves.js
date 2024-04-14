export const treble = {

};

export const bass = {

};

export const piano = {

};

export const chords = {

};

export const drums = {
    hands: {
        pitches: "",
        stemDirection: 'up'
    },

    feet: {
        // kick and hihatpedal
        pitches: "B1 C1 A♭2",
        stemDirection: 'down'
    },

    split: function(event) {
        if (this.feet.pitches.includes(symbol.pitch)) {
            return this.feet;
        }

        return this.hands;
    }
};

export const percussion = {

};
