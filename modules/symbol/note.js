import by  from 'fn/by.js';
import get from 'fn/get.js';
//import { keyWeightsForEvent, chooseKeyFromWeights } from '../keys.js';
import { stemupFromRows } from './stem.js';


const byRow = by(get('row'));
const symbols = [];


export function createNotes(stave, key, voice, notes, beat, duration) {
    symbols.length = 0;

    if (!notes.length) return symbols;

    let n = -1, event;

    while (event = notes[++n]) {
        const pitch = event.pitchSpelling || (stave.getSpelling && stave.getSpelling(event[2]));

        // Create symbols with pitch, row
        symbols.push({
            type: 'note',
            beat,
            duration,
            pitch,
            dynamic: event[3],
            voice,
            row: stave.getRow(voice, pitch),
            stave,
            event
        });
    }

    if (symbols.length === 0) return symbols;

    // Sort by row order
    symbols.sort(byRow);

    // Assign top and bottom to highest and lowest note symbols
    const top    = symbols[0];
    const bottom = symbols[symbols.length - 1];
    top.top       = true;
    bottom.bottom = true;

    // Figure out stemup, note that this may be overidden by beam
    const minRow = top.row;
    const maxRow = bottom.row;
    const stemup = voice.stemup === undefined ?
        stemupFromRows(stave, voice, minRow, maxRow) :
        voice.stemup ;

    // Assign stemHeight to top or bottom symbols
    const stemHeight = 1 + (maxRow - minRow) / 8;
    if (stemup) bottom.stemHeight = stemHeight;
    else top.stemHeight = stemHeight;

    // Loop forward through rows
    let c = 0;
    n = -1;
    while (symbols[++n]) {
        // Assign stemup to all symbols
        symbols[n].stemup = stemup;

        // Detect cluster in downward order
        if (n > 0 && symbols[n].row - symbols[n - 1].row === 1) symbols[n].clusterdown = ++c;
        else c = 0;
    }

    // Loop backward through rows
    c = 0;
    n = symbols.length - 1;
    while (n--) {
        // Detect cluster in upward order
        if (symbols[n + 1].row - symbols[n].row === 1) symbols[n].clusterup = ++c;
        else c = 0;
    }

    return symbols;
}
