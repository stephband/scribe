
import { rflat, rsharp, rdoubleflat, rdoublesharp } from '../pitch.js';
import { lt } from '../number/float.js';
import { P24 } from '../constants.js';


function createAccidental(part, accidentals, beat, note, clump, cluster) {
    const { pitch, event, row } = note;
    const acci =
        rsharp.test(pitch) ? 1 :
        rflat.test(pitch) ? -1 :
        undefined ;

    // Line name is note name + octave (no # or b)
    const line = pitch[0] + pitch.slice(-1);

    // If accidental is already in bar's current accidentals do nothing
    if (acci === accidentals[line]) return;

    // Alter current state of bar accidentals
    accidentals[line] = acci;

    // Return accidental symbol
    return {
        type: 'acci',
        beat,
        pitch,
        row,
        // An index of overlapping accidentals
        clump,
        // Whether the corresponding note head is on the wrong side of its stem
        cluster,
        part,
        event,
        value: acci || 0
    };
}

function getAccidentalAboveRowAtBeat(symbols, beat, maxRow) {
    let n = -1, symbol, row = 0, o;
    while (symbol = symbols[++n]) if (
        symbol.type === 'acci'
        && symbol.beat === beat
        && symbol.row < maxRow
        && symbol.row > row
    ) {
        row = symbol.row;
        o = n;
    }

    return symbols[o];
}

export function createAccidentals(symbols, part, accidentals, beat, notes) {
    let clump = 0;
    let n     = -1;
    let note, accidental, above;

    // This only looks for clusters within the current part – but its a start
    const cluster = !!notes.find((note) => note.stemup ?
        // Stem up, bottom not should not be clustered
        note.clusterup % 2 === 1 :
        // Stem down, top note cannot be clustered
        note.clusterdown % 2 === 1
    );

    while (note = notes[++n]) {
        // If event started before this bar we don't require an accidental
// TODO
//        if (lt(bar.beat, note.event[0], P24)) continue;

        // Find existing accidental above this one
        above = getAccidentalAboveRowAtBeat(symbols, beat, note.row);

        // Is any new accidental part of a clump
        clump = above && above.row - note.row < 6 ?
            above.cluster === cluster ?
                above.clump + 1 :
                0 :
            0 ;

        // Create accidental symbol
        accidental = createAccidental(part, accidentals, beat, note, clump, cluster);

        // Push it into symbols
        if (accidental) symbols.push(accidental);
    }
}
