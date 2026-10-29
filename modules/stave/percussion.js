
import { toNoteNumber } from 'midi/note.js';
import * as glyphs from "../glyphs.js";
import DrumStave from './drum.js';


export default class PercussionStave extends DrumStave {
    type  = 'percussion';
    rows  = ['','','','','','','','rhythm','','','','','','',''];
    voices = [{
        name:   'rhythm',
        staff:  'main',
        beam:   'rhythm',
        notes:  '*',
        stemup: true
    }];

    constructor(voices) {
        super();

        // Generate percussion stave of varying number of voices
        if (voices) {
            if (voices.length > 5) throw new Error(`PercussionStave() ${ voices.length } voices exceeds maximum number of 5 voices`);

            this.voices = voices;

            this.rows  = Array.from({ length: voices.length * 2 + 13 }, (v, i) => {
                const n = (i - 7 / 2);
                return voices[n] ? voices[n].name : '';
            });

            this.style = {
                'grid-template-rows':
                    this.rows
                    .map((name, i) => (i ? '' : '[max] ') + (name ? '[' + name + '] ' : '') + '0.125em')
                    .join(' ') + ' [min]'
            };
        }
    }

    getVoice(number) {
        // Find voice for this note number
        return this.voices.find((voice) => voice.notes === '*' || voice.notes.includes(number));
    }

    getPart(number) {
        return this.getVoice(number);
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

    getRow(voice, pitch) {
        return this.centerRow ;
    }
}
