
import toSpelling  from '../event/to-spelling.js';
import * as glyphs from "../glyphs.js";
import Stave       from './stave.js';

/**
A simple piano grand stave which brute splits treble from bass at Bb3.
**/

export default class PianoStave extends Stave {
    type = 'piano';
    rows = [      'E1','F1','G1','A1','B1',
        'C2','D2','E2','F2','G2','A2','B2',
        'C3','D3','E3','F3','G3','A3','B3',
        'C4','D4','E4','F4','G4','A4','B4',
        'C5','D5','E5','F5','G5','A5','B5',
        'C6','D6','E6','F6','G6','A6'];

    getClefHTML() {
        return `<span class="treble-clef clef">${
            glyphs.trebleClef
        }</span><span class="bass-clef clef">${
            glyphs.bassClef
        }</span>`;
    }

    // TODO: there should be four parts available, soprano alto, tenor bass?
    getPart(pitch) {
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
}
