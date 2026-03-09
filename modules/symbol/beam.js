import last from '../object/last.js';
import { stemupFromPitches } from './stem.js';


const assign = Object.assign;
let beamId = 0;


function average(a, n, i, array) {
    return a + n / array.length;
}

export function createBeam(part, beat) {
    return {
        type: 'beam',
        beat,
        part
    };
}

export function closeBeam(symbols, stave, part, beam) {
    // Scan through beam symbols to find note not on beat of beam
    let n = -1;
    while (beam[++n] && beam[n].beat === beam.beat);
    // If there is only notes on start beat of beam, no beam needed
    if (!beam[n]) return symbols;

    const startBeat = beam[0].beat;
    const stopBeat  = last(beam).beat;
    const duration  = stopBeat - startBeat;
    const stemup = part.stemup === undefined ?
        // Calculate stem up or down
        stemupFromPitches(stave, part, map(get('pitch'), beam)) :
        // Get stem direction from part
        part.stemup ;

    // If part has beam (drum stave) beams are in a fixed position
    if (part.beam) {
        let note, row;

        // Apply beamed properties to note symbols
        n = -1;
        while (note = beam[++n]) {
            note.stemup = stemup;
            note.beam   = beam;
            // Set stem height on all notes. TODO: This is hard-coded to drum
            // stave, we need to get row of part.beam, which is a named row at
            // the moment
            row = stave.getRow(part, note.pitch);
            note.stemHeight = stemup ?
                0.125 + row / 8 :
                2.8125 - row / 8 ;
        }

        //console.log('TODO: Beam has fixed position according to part', part.beam);
        // Push the beam into symbols
        symbols.push(assign(beam, {
            duration,
            stemup,
            range: 0,
            id: ++beamId
        }));

        return symbols;
    }

    // Calculate beam positions
    const rows = [];

    let note;
    n = -1;
    while (note = beam[++n]) {
        let row = stave.getRow(part, note.pitch);
        // row may be out of range of this stave
        if (row === undefined) continue;

        let r;

        // Find highest or lowest pitch at beat of note
        while (beam[++n] && eq(beam[n].beat, note.beat, p24)) {
            r = stave.getRow(part, beam[n].pitch);
            // row may be out of range of this stave
            if (r === undefined) continue;
            if (stemup) { if (r < row) row = r; }
            else        { if (r > row) row = r; }
        }
        --n;

        // Push it into pitches
        rows.push(row);
    }

    const beamLength = rows.length - 1;
    const beginRow   = rows.slice(0, floor(0.5 * rows.length)).reduce(average, 0);
    const endRow     = rows.slice(ceil(0.5 * rows.length)).reduce(average, 0);
    // This (0.2 + 0.1 * beamLength) determines the angle of the beam
    const positions  = Array.from(rows, (r, i) => (0.2 + 0.1 * beamLength) * i * (endRow - beginRow) / beamLength);
    const range      = positions[positions.length - 1] - positions[0];

    let diff = stemup ? -50 : 50, d;
    n = rows.length;
    while (n--) {
        d = positions[n] - rows[n];
        diff = stemup ?
            d > diff ? d : diff :
            d < diff ? d : diff ;
    }

    n = rows.length;
    while (n--) positions[n] -= diff + rows[0];

    // Apply beamed properties to note symbols and stem heights
    let r = -1, top, bottom;
    n = -1;
    while (note = beam[++n]) {
        ++r;
        const beamHeight = (positions[r] - rows[r] + rows[0]) / 8;
        note.stemup = stemup;
        note.beam   = beam;

        // Keep top start note
        if (r === 0) top = note;

        // Find all other notes at beat
        while (beam[++n] && eq(beam[n].beat, note.beat, p16)) {
            beam[n].stemup = stemup;
            beam[n].beam   = beam;
        }

        --n;

        // Keep bottom start note
        if (r === 0) bottom = beam[n];

        // if stemup set stemHeight on lowest note...
        if (stemup) {
            beam[n].stemHeight = 1 + (beam[n].row - note.row) / 8 - beamHeight ;
        }
        // ...otherwise set stemHeight on highest note
        else {
            note.stemHeight = 1 + (beam[n].row - note.row) / 8 + beamHeight ;
        }
    }

    // Push the beam into symbols
    symbols.push(assign(beam, {
        duration,
        y: positions[0],
        pitch: stemup ?
            top.pitch :
            bottom.pitch ,
        stemup,
        range,
        id: ++beamId
    }));

    return symbols;
}
