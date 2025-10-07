
import { toNoteNumber } from 'midi/note.js';
import * as glyphs from "../glyphs.js";
import DrumStave from './drum.js';


export default class PercussionStave extends DrumStave {
    type = 'percussion';
    clef = glyphs.clefPercussion;

    rows = ['','','','','','','','','note','','','','','','','',''];

    get maxPitch() {
        return this.rows[17];
    }

    get bottomPitch() {
        return this.rows[8];
    }

    get centerPitch() {
        return this.rows[8];
    }

    get topPitch() {
        return this.rows[8];
    }

    parts = {
        drums: {
            name: 'drums',
            stemup: false
        },

        cymbals: {
            name: 'cymbals',
            stemup: true
        }
    };

    getRowDiff(pitch1, pitch2) {
        // All notes display on one line
        return 0;
    }
}
