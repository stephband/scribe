
import * as glyphs from "../glyphs.js";
import Stave       from './stave.js';

/**
A simple piano grand stave which brute splits treble from bass at Bb3.
**/

export default class PianoStave extends Stave {
    type = 'piano';
    rows = [
        "A6",
        "G6",
        "F6",
        "E6",
        "D6",
        "C6",
        "B5",
        "A5",
        "G5",
        "F5",
        "E5",
        "D5",
        "C5",
        "B4",
        "A4",
        "G4",
        "F4",
        "E4",
        "D4",
        "C4",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "B3",
        "A3",
        "G3",
        "F3",
        "E3",
        "D3",
        "C3",
        "B2",
        "A2",
        "G2",
        "F2",
        "E2",
        "D2",
        "C2",
        "B1",
        "A1",
        "G1",
        "F1",
        "E1"
    ];

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
        topRow:      29,
        centerRow:   33,
        bottomRow:   38,
        topPitch:    'A3',
        centerPitch: 'D3',
        bottomPitch: 'G2',
        DEFAULT: true
    }, {
        name:        'rh',
        topRow:      9,
        centerRow:   13,
        bottomRow:   18,
        topPitch:    'F5',
        centerPitch: 'B4',
        bottomPitch: 'E4',
        DEFAULT: true
    }, {
        name:        'soprano',
        topRow:      9,
        centerRow:   13,
        bottomRow:   18,
        topPitch:    'F5',
        centerPitch: 'B4',
        bottomPitch: 'E4',
        stemup: true
    }, {
        name:        'alto',
        topRow:      9,
        centerRow:   13,
        bottomRow:   18,
        topPitch:    'F5',
        centerPitch: 'B4',
        bottomPitch: 'E4',
        stemup: false
    }, {
        name:        'tenor',
        topRow:      29,
        centerRow:   33,
        bottomRow:   38,
        topPitch:    'A3',
        centerPitch: 'D3',
        bottomPitch: 'G2',
        stemup: true
    }, {
        name:        'bass',
        topRow:      29,
        centerRow:   33,
        bottomRow:   38,
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
