
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

    get minLinePitch() {
        return this.rows[8];
    }

    get midLinePitch() {
        return this.rows[8];
    }

    get maxLinePitch() {
        return this.rows[8];
    }

    getPart(pitch) {
        // Stem direction by drum or cymbal ??
        return [35, 36, 37, 38, 40, 41, 43, 44, 45, 47, 50].includes(toNoteNumber(pitch)) ? {
            stemDirection: 'down',
            tieDirection:  'down'
        } : {
            stemDirection: 'up',
            tieDirection:  'up'
        } ;
    }

    getRowDiff(pitch1, pitch2) {
        // All notes display on one line
        return 0;
    }
}
