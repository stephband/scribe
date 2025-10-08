
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
            glyphs.clefTreble
        }</span><span class="bass-clef clef">${
            glyphs.clefBass
        }</span>`;
    }

    getTimeSigHTML(numerator, denominator, eventId) {
        return `<span class="timesig" data-event="${ eventId }" data-part="rh">
            <sup>${ glyphs['timeSig' + numerator] }</sup>
            <sub>${ glyphs['timeSig' + denominator] }</sub>
        </span>
        <span class="timesig" data-event="${ eventId }" data-part="lh">
            <sup>${ glyphs['timeSig' + numerator] }</sup>
            <sub>${ glyphs['timeSig' + denominator] }</sub>
        </span>`;
    }

    parts = [{
        name:        'lh',
        topPitch:    'A3',
        centerPitch: 'D3',
        bottomPitch: 'G2',
        DEFAULT: true
    }, {
        name:        'rh',
        topPitch:    'F5',
        centerPitch: 'B4',
        bottomPitch: 'E4',
        DEFAULT: true
    }, {
        name:        'soprano',
        topPitch:    'F5',
        centerPitch: 'B4',
        bottomPitch: 'E4',
        stemup: true
    }, {
        name:        'alto',
        topPitch:    'F5',
        centerPitch: 'B4',
        bottomPitch: 'E4',
        stemup: false
    }, {
        name:        'tenor',
        topPitch:    'A3',
        centerPitch: 'D3',
        bottomPitch: 'G2',
        stemup: true
    }, {
        name:        'bass',
        topPitch:    'A3',
        centerPitch: 'D3',
        bottomPitch: 'G2',
        stemup: false
    }];

    getPart(pitch) {
        return /[012]$|[AC-G][b#♭♯𝄫𝄪]*3$/.test(pitch) ?
            this.parts[0] :
            this.parts[1] ;
    }
}
