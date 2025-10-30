
import * as glyphs     from "./glyphs.js";
import Stave           from './stave/stave.js';
import DrumStave       from './stave/drum.js';
import PercussionStave from './stave/percussion.js';
import PianoStave      from './stave/piano.js';


const assign = Object.assign;


class TrebleUpStave extends Stave {
    type = 'treble-up';
    clef = glyphs.clefTrebleUp;
    rows = ["A7", "G7", "F7", "E7", "D7", "C7", "B6", "A6", "G6", "F6", "E6", "D6", "C6", "B5", "A5", "G5", "F5", "E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];
}

class TrebleStave extends Stave {
    type = 'treble';
    clef = glyphs.clefTreble;
    rows = ["A6", "G6", "F6", "E6", "D6", "C6", "B5", "A5", "G5", "F5", "E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3"];
}

class TrebleDownStave extends Stave {
    type = 'treble-down';
    clef = glyphs.clefTrebleDown;
    rows = ["A5", "G5", "F5", "E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3", "B2", "A2", "G2", "F2", "E2", "D2", "C2"];
}

class AltoStave extends Stave {
    type = 'alto';
    clef = glyphs.clefAlto;
    rows = ["B5", "A5", "G5", "F5", "E5", "D5", "C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3", "B2", "A2", "G2", "F2", "E2", "D2"];
}

class BassStave extends Stave {
    type = 'bass';
    clef = glyphs.clefBass;
    rows = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3", "B2", "A2", "G2", "F2", "E2", "D2", "C2", "B1", "A1", "G1", "F1", "E1"];
}


// Register staves by type. Types are the same string used by the clef attribute,
// as in <scribe-music clef="treble">. Create a stave by type with:
// Stave.create(type);

Stave['treble']      = new TrebleStave();
Stave['treble-up']   = new TrebleUpStave();
Stave['treble-down'] = new TrebleDownStave();
Stave['alto']        = new AltoStave();
Stave['bass']        = new BassStave();
Stave['piano']       = new PianoStave();
Stave['drum']        = new DrumStave();
Stave['percussion']  = new PercussionStave();


/**
Stave.create(type)
Create a stave object by type.
**/
Stave.create = (type) => {
    console.trace('Deprecated: Stave.create()');
    return Stave[type];
}

export default Stave;
