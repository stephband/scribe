
import get             from 'fn/get.js';
import { eq } from '../number/float.js';
import last from '../object/last.js';
import map  from '../object/map.js';
import { stemupFromPitches } from './stem.js';
import { P24 } from '../constants.js';


const { abs, ceil, floor, min, max, pow, sqrt, round } = Math;
const assign = Object.assign;
let beamId = 0;


const beamSpacing = 1.5;

function average(a, n, i, array) {
    return a + n / array.length;
}

function pushSubBeam(symbols, main, beats, sub, levelDuration, level) {
    const startBeat = main.beat;
    const totalDur  = main.duration;
    const i0        = sub[0];

    const b0 = sub.length === 1 ?
        // If at start of beam or beat is divisible by levelDuration, stub projects forward
        (i0 === 0 || eq(beats[i0] % levelDuration, 0, P24)) ?
            beats[i0] :
            // Backward stub starts before i0
            beats[i0] - 0.4 * (beats[i0] - beats[i0 - 1]) :
        beats[i0];

    const b1 = sub.length === 1 ?
        (i0 === 0 || eq(beats[i0] % levelDuration, 0, P24)) ?
            // Forward stub stops after i0
            beats[i0] + 0.5 * (beats[i0 + 1] - beats[i0]) :
            // Backward stub stops at i0
            beats[i0] :
        beats[sub[sub.length - 1]];

    const x0 = (b0 - startBeat) / totalDur;
    const x1 = (b1 - startBeat) / totalDur;
    const yOffset = (main.stemup ? 1 : -1) * level * beamSpacing;

    symbols.push({
        type:     'beam',
        part:     main.part,
        pitch:    main.pitch,
        stemup:   main.stemup,
        beat:     b0,
        duration: b1 - b0,
        y:        (main.y || 0) + x0 * main.range + yOffset,
        range:    (x1 - x0) * main.range,
        divisor:  8 / levelDuration,
        id:       main.id
    });
}

function createSubBeams(symbols, main, beats, durations, i = 0, levelDuration = 0.5, level = 1) {
    // Don't render anything shorter than triplet 32nd note beams
    if (levelDuration < 1 / 6) return;

    let n = i - 1;
    let sub;

    while (durations[++n]) {
        // If beam division is a half duration or less
        if (durations[n] <= 0.5 * levelDuration
            // ...or a dotted half duration
            || eq(durations[n], 0.75 * levelDuration, P24)
            // ...or double dotted half duration
            || eq(durations[n], 0.875 * levelDuration, P24)
        ) {
            if (sub) sub.push(n);
            else sub = [n];
        }
        else if (sub) {
            pushSubBeam(symbols, main, beats, sub, levelDuration, level);
            createSubBeams(symbols, main, beats, durations, sub[0], levelDuration / 2, level + 1);
            sub = undefined;
        }
    }

    if (sub) {
        pushSubBeam(symbols, main, beats, sub, levelDuration, level);
        createSubBeams(symbols, main, beats, durations, sub[0], levelDuration / 2, level + 1);
    }
}

export function createBeam(part, beat) {
    return {
        type: 'beam',
        beat,
        part
    };
}

export function closeBeam(symbols, stave, part, beam) {
    if (!beam) return;

    // Scan through beam symbols to find note not on beat of beam
    let n = -1;
    while (beam[++n] && beam[n].beat === beam.beat);
    // If there is only notes on start beat of beam, no beam needed
    if (!beam[n]) return;

    const startBeat = beam[0].beat;
    const stopBeat  = last(beam).beat;
    const duration  = stopBeat - startBeat;
    const stemup = part.stemup === undefined ?
        // Calculate stem up or down
        stemupFromPitches(stave, part, map(get('pitch'), beam)) :
        // Get stem direction from part
        part.stemup ;

    const beats     = [];
    const durations = [];

    // If part has beam (drum stave) beams are in a fixed position
    if (part.beam) {
        let note, row;

        // Apply beamed properties to note symbols
        n = -1;
        while (note = beam[++n]) {
            note.stemup = stemup;
            note.beam   = beam;
            row = stave.getRow(part, note.pitch);
            note.stemHeight = stemup ?
                0.125 + row / 8 :
                2.8125 - row / 8 ;

            if (!beats.length || !eq(beats[beats.length - 1], note.beat, P24)) {
                beats.push(note.beat);
                durations.push(note.duration);
            }
        }

        // Push the beam into symbols
        symbols.push(assign(beam, {
            duration,
            y: 0,
            stemup,
            range: 0,
            id: ++beamId
        }));

        createSubBeams(symbols, beam, beats, durations);
        return;
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
        while (beam[++n] && eq(beam[n].beat, note.beat, P24)) {
            r = stave.getRow(part, beam[n].pitch);
            // row may be out of range of this stave
            if (r === undefined) continue;
            if (stemup) { if (r < row) row = r; }
            else        { if (r > row) row = r; }
        }
        --n;

        // Push it into pitches
        rows.push(row);
        beats.push(note.beat);
        durations.push(note.duration);
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
        while (beam[++n] && eq(beam[n].beat, note.beat, P24)) {
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
            bottom.pitch,
        stemup,
        range,
        id: ++beamId
    }));

    createSubBeams(symbols, beam, beats, durations);
}
