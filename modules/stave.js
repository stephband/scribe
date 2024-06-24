
import * as glyphs     from "./glyphs.js";
import Stave           from './stave/stave.js';
import DrumStave       from './stave/drum.js';
import PercussionStave from './stave/percussion.js';
import PianoStave      from './stave/piano.js';

const assign = Object.assign;

class TrebleUpStave extends Stave {
    type = 'treble-up';
    clef = glyphs.trebleUpClef;
    rows = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6','D6','E6','F6','G6','A6','B6','C7','D7','E7','F7','G7','A7'];
}

class TrebleStave extends Stave {
    type = 'treble';
    clef = glyphs.trebleClef;
    rows = ['C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5','C6','D6','E6','F6','G6','A6'];
}

class TrebleDownStave extends Stave {
    type = 'treble-down';
    clef = glyphs.trebleDownClef;
    rows = ['C2','D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5'];
}

class AltoStave extends Stave {
    type = 'alto';
    clef = glyphs.altoClef;
    rows = ['D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5'];
}

class BassStave extends Stave {
    type = 'bass';
    clef = glyphs.bassClef;
    rows = ['E1','F1','G1','A1','B1','C2','D2','E2','F2','G2','A2','B2','C3','D3','E3','F3','G3','A3','B3','C4','D4','E4','F4','G4','A4','B4','C5'];
}


// Register staves by type. These are the same string used by the clef attribute,
// as in <scribe-music clef="type">, and accepted by Stave.create(type).

Stave['treble']      = TrebleStave;
Stave['treble-up']   = TrebleUpStave;
Stave['treble-down'] = TrebleDownStave;
Stave['alto']        = AltoStave;
Stave['bass']        = BassStave;
Stave['piano']       = PianoStave;
Stave['drum']        = DrumStave;
Stave['percussion']  = PercussionStave;

export default Stave;
