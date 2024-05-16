
const assign = Object.assign;


/* Stave */

export class Stave {
    static from() {}
    static of() {}
    static register() {}

    constructor(pitches) {
        this.pitches = pitches;
    }

    getSpelling() {
        return toSpelling.apply(this, arguments);
    }

    movePitch(pitch, n) {
        // Chromatic transpose
        const min = toNoteNumber(this.minPitch);
        const max = toNoteNumber(this.maxPitch);
        const number = toNoteNumber(pitch) + n;

        // Don't transpose outside the limits of the stave
        return number >= min && number <= max ?
            number :
            undefined ;
    }

    get maxPitch() {
        return this.pitches[0];
    }

    get minPitch() {
        return this.pitches[this.pitches.length - 1];
    }
}

Stave.bass = class BassStave extends Stave {

}

Stave.treble = class TrebleStave extends Stave {

}
