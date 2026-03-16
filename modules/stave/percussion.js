
import { toNoteNumber } from 'midi/note.js';
import * as glyphs from "../glyphs.js";
import DrumStave from './drum.js';


export default class PercussionStave extends DrumStave {
    type  = 'percussion';
    rows  = ['','','','','','','','rhythm','','','','','','',''];
    parts = [{
        name:   'rhythm',
        beam:   'rhythm',
        notes:  '*',
        stemup: true
    }];

    constructor(parts) {
        super();

        // Generate percussion stave of varying number of parts
        if (parts) {
            if (parts.length > 5) throw new Error(`PercussionStave() ${ parts.length } parts exceeds maximum number of 5 parts`);

            this.parts = parts;

            this.rows  = Array.from({ length: parts.length * 2 + 13 }, (v, i) => {
                const n = (i - 7 / 2);
                return parts[n] ? parts[n].name : '';
            });

            this.style = {
                'grid-template-rows':
                    this.rows
                    .map((name, i) => (i ? '' : '[max] ') + (name ? '[' + name + '] ' : '') + '0.125em')
                    .join(' ') + ' [min]'
            };
        }
    }

    getPart(number) {
        // Find part for this note number
        return this.parts.find((part) => part.notes === '*' || part.notes.includes(number));
    }

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

    getRow(part, pitch) {
        return this.centerRow ;
    }
}
