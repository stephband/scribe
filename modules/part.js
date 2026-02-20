
import by          from 'fn/by.js';
import get         from 'fn/get.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import { keyToRootNumber } from 'sequence/modules/event/keys.js';
import { keyWeightsForEvent, chooseKeyFromWeights } from './keys.js';
import { rflat, rsharp, rdoubleflat, rdoublesharp } from './pitch.js';
import { getDivision } from './bar.js';
import { detectTuplet, rhythmHasHoles } from './tuplet.js';
import { round as roundTo, eq, gte, lte, lt, gt } from './number/float.js';
import { floorPow2, ceilPow2, isPowerOf2 } from './number/power-of-2.js';
import grainPow2   from './number/grain-pow-2.js';
import push        from './object/push.js';
import last        from './object/last.js';
import lengthOf    from './object/length-of.js';
import map         from './object/map.js';
import getDuration from './event/to-duration.js';
import getStopBeat from './event/to-stop-beat.js';
import config      from './config.js';


const assign = Object.assign;
const { abs, ceil, floor, min, max, pow, sqrt, round } = Math;

/* When dealing with rounding errors we only really need beat grid-level
   precision, our display grid has 24 slots but we only need to compare the
   smallest possible note values, 32nd notes, or ±1/16 precision */
const p16 = 1/16;
const p24 = 1/24;


/* Fns */

const byRow = by(get('row'));

function average(a, n, i, array) {
    return a + n / array.length;
}


/* Notes */

function toMaxStopBeat(n, event) {
    return max(n, getStopBeat(event));
}

function byPitch(a, b) {
    return toNoteNumber(a[2]) < toNoteNumber(b[2]) ? 1 : -1;
}

function createNoteSymbols(stave, key, part, notes) {
    if (!notes.length) return [];

    const symbols = [];
    let n = -1, event;
    while (event = notes[++n]) {
        const events     = event.scribeEvents;
        const index      = event.scribeIndex;
        const keyWeights = keyWeightsForEvent(events, index, key);
        const keyNumber  = chooseKeyFromWeights(keyWeights);
        const pitch      = stave.getSpelling(keyNumber, event[2], true);
        const row        = stave.getRow(part, pitch);

        // Is note not on the stave?
        if (!row) continue;

        // Create symbols with pitch, row
        symbols.push({
            type: 'note',
            pitch,
            dynamic: event[3],
            part,
            row,
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
    const stemup = part.stemup === undefined ?
        stemupFromRows(stave, part, minRow, maxRow) :
        part.stemup ;

    // Assign stemHeight to top and bottom symbols
    const stemHeight = 1 + (maxRow - minRow) / 8;
    top.stemHeight    = stemHeight;
    bottom.stemHeight = stemHeight;

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


/* Pitches */

function getMinPitchRow(stave, part, pitches) {
    let n = -1, row = 0;
    let pitch, r;
    while (pitches[++n]) {
        r = stave.getRow(part, pitches[n]);
        // r may be out of range oof this stave
        if (r === undefined) continue;
        // The bigger r, the lower the pitch
        if (r > row) {
            row   = r;
            pitch = pitches[n];
        }
    }
    return { row, pitch };
}

function getMaxPitchRow(stave, part, pitches) {
    let n = -1, row = 128;
    let pitch, r;
    while (pitches[++n]) {
        r = stave.getRow(part, pitches[n]);
        // r may be out of range oof this stave
        if (r === undefined) continue;
        // The smaller r, the higher the pitch
        if (r < row) {
            row   = r;
            pitch = pitches[n];
        }
    }
    return { row, pitch };
}


/* Stems */

function stemupFromRows(stave, part, minRow, maxRow) {
    const centerRow = part.centerRow || stave.centerRow;
    const minDiff   = minRow - centerRow;
    const maxDiff   = maxRow - centerRow;
    return maxDiff + minDiff > 0;
}

function stemupFromPitches(stave, part, pitches) {
    const { row: minRow } = getMinPitchRow(stave, part, pitches);
    const { row: maxRow } = getMaxPitchRow(stave, part, pitches);
    return stemupFromRows(stave, part, minRow, maxRow);
}

function stemupFromSymbols(stave, part, symbols) {
    const pitches = [];
    let n = -1, symbol;
    while (symbol = symbols[++n]) {
        if (symbol.type === 'note') pitches.push(symbol.pitch);
    }
    return stemupFromPitches(stave, part, pitches);
}


/* Beams */

let beamId = 0;

function closeBeam(symbols, stave, part, beam) {
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
        // TEMP: DO it better
        let note;

        // Apply beamed properties to note symbols
        n = -1;
        while (note = beam[++n]) {
            note.stemup = stemup;
            note.beam   = beam;
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


/* Rests */

function fitDottedDuration(min, duration) {
    let grain = 2 * ceilPow2(duration);
    while ((grain /= 2) > min / 2) {
        if (1.75 * grain === duration) return 1.75 * grain;
        if (1.5  * grain === duration) return 1.5  * grain;
        if (grain <= duration) return grain;
    }
    return min;
}

function fitRoundedUpDuration(min, duration, maxDuration) {
    maxDuration = maxDuration || Infinity;
    let grain = 4 * ceilPow2(duration);
    while ((grain /= 2) > min / 2) {
        if (grain <= duration * 2 && grain <= maxDuration) return grain;
    }
    return min;
}

function fitDuration(durations, bar, startBeat, stopBeat, beat, eventBeat) {
    // Some analysis of beats...
    const minGrain = 0.125;
    const maxGrain = floorPow2(bar.divisor);
    const div1     = floor(beat / bar.divisor) * bar.divisor;
    const grain    = grainPow2(minGrain, maxGrain, beat - div1);

    // Duration decision tree

    // If note is truncated by next event render up to next event
    if (eventBeat < stopBeat) {
        // Beat to event beat is a valid head duration
        if (durations.indexOf(eventBeat - beat) !== -1) return eventBeat - beat;

        // Last divisor crossed
        const div2 = floor(eventBeat / bar.divisor) * bar.divisor;

        // Beat is on a divisor
        if (beat === div1) {
            // If beat to last division is a valid duration
            if (durations.indexOf(div2 - beat) !== -1) return div2 - beat;
            // Beat to next divisor
            const division = div1 + bar.divisor < eventBeat && div1 + bar.divisor;
            if (division) return division - beat;
            // Get the power of 2 duration before eventBeat
            return fitDottedDuration(0.125, eventBeat - beat);
        }

        // Event beat is on a divisor
        if (eq(eventBeat, div2, p16)) {
            // Otherwise up to the nearest division
            const division = div1 + bar.divisor < eventBeat && div1 + bar.divisor;
            if (division && durations.indexOf(division - beat) !== -1) return division - beat;
            // Otherwise fill the grain
            // Is this good ??????
            return grain;
        }
    }

    // If beat to last division is a valid duration
    const div2 = floor(stopBeat / bar.divisor) * bar.divisor;

    // Beat is on a divisor
    if (beat === div1) {
        // Beat to stop beat is a valid head duration
        if (durations.indexOf(stopBeat - beat) !== -1) return stopBeat - beat;
        // If beat to last division is a valid duration
        if (durations.indexOf(div2 - beat) !== -1) return div2 - beat;
        // Beat to divisor
        const division = div1 + bar.divisor < stopBeat && div1 + bar.divisor;
        if (division) return division - beat;
        // Get the next power of 2 duration after stopBeat but before eventBeat
        return fitRoundedUpDuration(0.125, stopBeat - beat, eventBeat - beat);
    }
    // Stop beat is on a divisor
    else if (eq(stopBeat, div2, p16)) {
        // If beat to stop beat is a valid duration use it
        if (durations.indexOf(stopBeat - beat) !== -1) return stopBeat - beat;
        // Otherwise up to the nearest division
        const division = div1 + bar.divisor < stopBeat && div1 + bar.divisor;
        if (division && durations.indexOf(division - beat) !== -1) return division - beat;
        // Otherwise fill the grain
        return grain;
    }
    else {
        const quadDuration = 4 * grain;
        const quadIndex    = ((beat - div1) % quadDuration) / grain;

        if (quadIndex === 1) {
            // If this note takes us up to note at 0001 render the duration 0--0
            if (beat + 2 * grain === eventBeat) return 2 * grain;

            // Is event inside the quadruplet?
            if (beat + 3 * grain >= eventBeat) {
                console.log('Next event beat is inside quaduplet');
            }

            // Grain is less than 1
            return grain < 1 ?
                // If stop beat is greater than half of three grains render duration 0---
                stopBeat >= beat + grain * 3/2 ? 3 * grain :
                // Otherwise render duration 0-00
                stopBeat >= beat + grain ? grain :
                // Stop beat is smaller than grain, fit an appropriate duration
                fitDottedDuration(0.125, stopBeat - beat) :
            // Grain is 1 or greater and
                // stop beat is after 3 grains render 0---
                stopBeat >=  beat + grain * 3 ? grain * 3 :
                // Stop beat is after 2 grains render 0--0
                stopBeat >=  beat + grain * 2 ? grain * 2 :
                // Stop beat is after 1 grain render  0-00
                stopBeat > beat + grain ? grain :
                // Stop beat is shorter than a grain
                fitDottedDuration(0.125, stopBeat - beat) ;
        }

            // stop beat is after 4th grain render 000-
        return stopBeat > beat + grain ? grain :
            // Stop beat is shorter than grain
            fitDottedDuration(0.125, stopBeat - beat) ;
    }
}

function createRest(durations, bar, stave, part, stopBeat, beat) {
    // Create rest symbol
    return {
        type: 'rest',
        beat,
        duration: fitDuration(durations, bar, beat, stopBeat, beat, stopBeat),
        stave,
        part
    };
}

function createRests(symbols, durations, bar, stave, part, beat, tobeat) {
    // Insert rests frombeat - tobeat
    while (gt(beat, tobeat, p16)) {
        const rest = createRest(durations, bar, stave, part, tobeat, beat);
        symbols.push(rest);
        beat += rest.duration;
    }

    return tobeat;
}


/* Accidentals */

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

function createAccidentals(symbols, bar, part, accidentals, beat, notes) {
    let n = -1, clump = 0, note, accidental, above;

    // This only looks for clusters within the current part – but its a start
    const cluster = !!notes.find((note) => note.stemup ?
        // Stem up, bottom not should not be clustered
        note.clusterup % 2 === 1 :
        // Stem down, top note cannot be clustered
        note.clusterdown % 2 === 1
    );

    while (note = notes[++n]) {
        // If event started before this bar we don't require an accidental
        if (lt(bar.beat, note.event[0], p16)) continue;

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


/* Accents */

function createAccents(symbols, stave, part, beat, notes, settings) {
    // Find max dynamic among all notes
    let maxDynamic = -Infinity;
    let n = -1, note, event;
    while (note = notes[++n]) if (note.dynamic > maxDynamic) {
        maxDynamic = note.dynamic;
        event      = note.event;
    }

    // If max dynamic exceeds accent threshold, create an accent
    if (notes.length && maxDynamic >= settings.accentThreshold) {
        const minMaxNote = notes[0].stemup ? notes[notes.length - 1] : notes[0];
        symbols.push({
            type:    'accent',
            beat,
            pitch:   minMaxNote.pitch,
            dynamic: maxDynamic,
            stemup:  minMaxNote.stemup,
            stave,
            part,
            event
        });
    }
}


/* Ledger lines */

function createLedges(symbols, stave, part, beat, notes) {
    // Up ledger lines
    //const { row: maxRow, pitch: maxPitch } = getMaxPitchRow(stave, part, pitches);
    const maxRow   = notes[0].row;
    const maxPitch = notes[0].pitch;
    // Ledges begin two rows away from topPitch, which is the top line
    let rows = maxRow - (part.topRow || stave.topRow) + 1;
    if (rows < 0) symbols.push({
        type: 'ledge',
        beat,
        pitch: maxPitch,
        part,
        rows
    });

    // Down ledger lines
    //const { row: minRow, pitch: minPitch } = getMinPitchRow(stave, part, pitches);
    const minRow   = notes[notes.length - 1].row;
    const minPitch = notes[notes.length - 1].pitch;
    // Ledges begin two rows away from bottomPitch, which is the bottom line
    rows = minRow - (part.bottomRow || stave.bottomRow);
    if (rows > 0)  symbols.push({
        type: 'ledge',
        beat,
        pitch: minPitch,
        part,
        rows
    });
}


/* Symbols */

function closeTuplet(stave, part, tuplet) {
    const { beat, duration, divisor } = tuplet;

    // Stem direction
    const stemup = part.stemup === undefined ?
        stemupFromSymbols(stave, part, tuplet) :
        part.stemup ;

    // Apply stem direction to notes
    let n = -1, symbol;
    while (symbol = tuplet[++n]) {
        if (symbol.type === 'note' && !symbol.beam) symbol.stemup = stemup;
    }

    // Decide on tuplet pitch, effectively vertical row position
    const centreBeat = beat + 0.5 * duration;

    // Encourage lowest pitch to be 1 octave below top line, ensuring
    // triplet (with appropriate styling) always sits above the top line
    const lowestPitchNumber = toNoteNumber(stave.topPitch) - 12;

    let centreNumber;
    let h = lengthOf(tuplet);
    // Scan backwards through tuplet until last symbol before centre beat
    while ((symbol = tuplet[--h]) && symbol.beat > centreBeat);
    ++h;

    // Scan backwards through tuplet that cross centre beat, get highest pitch
    while ((symbol = tuplet[--h]) && symbol.beat + symbol.duration > centreBeat) {
        const number = toNoteNumber(symbol.pitch);
        if (!centreNumber || number > centreNumber) centreNumber = number;
    }

    // Scan forwards from first symbol finding highest pitch beginning head
    let firstNumber = lowestPitchNumber;
    h = -1;
    while ((symbol = tuplet[++h]) && symbol.beat < beat + p16) {
        const number = toNoteNumber(symbol.pitch);
        if (!firstNumber || number > firstNumber) firstNumber = number;
    }

    // Scan backwards from last symbol finding highest pitch ending symbol
    let lastNumber = lowestPitchNumber;
    h = lengthOf(tuplet);
    while ((symbol = tuplet[--h]) && symbol.beat > beat + duration - (duration / divisor) - p16) {
        const number = toNoteNumber(symbol.pitch);
        if (!lastNumber || number > lastNumber) lastNumber = number;
    }

    const avgNumber = Math.ceil((firstNumber + lastNumber) / 2);
    const avgPitch  = toNoteName(avgNumber);
    if (avgNumber > centreNumber) centreNumber = avgNumber;

    tuplet.pitch  = toNoteName(centreNumber);
    tuplet.stemup = stemup;

    const diff = lastNumber - firstNumber;
    tuplet.angle = diff < 0 ?
        4 * sqrt(-diff) :
        -4 * sqrt(diff) ;
}

function createTuplet(symbols, bar, stave, key, accidentals, part, beam, settings, beat, duration, divisor, rhythm, notes, events, n) {
    // Check if we are to interpret swung 8ths or 16ths as straight 8ths or 16ths.
    // Rhythm is a binary representation of filled divisions where 1 (1) means
    // an event in the first division, 10 (2) an event in the second division,
    // 100 (4) an event in the third, and 101 (5) events in first and third, etc.
    if ((settings.swingAsStraight8ths && duration === 1 || settings.swingAsStraight16ths && duration === 0.5)
        && divisor === 3
        && (rhythm === 4 || rhythm === 5)
    ) {
        divisor = 2;
    }

    const division = duration / divisor;
    const stopBeat = beat + duration;
    const tuplet   = {
        type: 'tuplet',
        beat,
        duration,
        divisor,
        rhythm,
        part,
        stave
    };

    let event;

    // If divisor is not power of two push tuplet symbol
    if (!isPowerOf2(divisor)) symbols.push(tuplet);

    // While beat is before end of tuplet
    while (lt(stopBeat, beat, p24)) {
        // Fill notes with events playing during beat, and leave event as the
        // next event after beat
        while ((event = events[++n]) && lte(beat + 0.5 * division, event[0] - bar.beat, p24)) {
            notes.push(event);
        }
        --n;

        // Insert rest
        if (!notes.length) {
            symbols.push({ type: 'rest', beat, duration: division, stave, part });
            beat += division;
            continue;
        }

        // Insert heads
        const noteSymbols = createNoteSymbols(stave, key, part, notes);

        // Create ledgers and accidentals
        if (noteSymbols.length) {
            createLedges(symbols, stave, part, beat, noteSymbols);
            createAccidentals(symbols, bar, part, accidentals, beat, noteSymbols);
            createAccents(symbols, stave, part, beat, noteSymbols, settings);
        }

        const stopBeat = min(
            // Max stop beat of notes
            notes.reduce(toMaxStopBeat, 0) - bar.beat,
            // Start beat of next event, if it exists, or end of bar
            event ? event[0] - bar.beat : bar.duration,
            // Beat at end of tuplet
            tuplet.beat + tuplet.duration
        );

        const duration = max(
            // Min duration is 1 tuplet division
            division,
            // Distance to stop beat rounded to nearest division
            roundTo(division, stopBeat - beat)
        );

        // Assign beat, duration to note symbols and push into symbols
        let p = -1;
        while (noteSymbols[++p]) symbols.push(assign(noteSymbols[p], {
            beat,
            duration
        }));

        // Push note symbols on to tuplet
        push(tuplet, ...noteSymbols);

        // Manage beam
        if (gt(0.5, duration, p24)) {
            // If there is a beam, close it
            if (beam) {
                closeBeam(symbols, stave, part, beam);
                beam = undefined;
            }
        }
        else if (!beam) beam = {
            type: 'beam',
            beat,
            part
        };

        // Push note symbols on to beam
        if (beam) push(beam, ...noteSymbols);

        // Remove notes or insert ties
        p = notes.length;
        while (p--) {
            let stopBeat = getStopBeat(notes[p]) - bar.beat;
            // Remove notes that end before or near next division, we're done with them
            if (lte(beat + duration + 0.5 * division, stopBeat, p24)) notes.splice(p, 1);
            // Add tie to remaining notes
            else symbols.push({
                type:   'tie',
                beat,
                pitch: noteSymbols[p].pitch,
                duration,
                stemup: noteSymbols[p].stemup,
                part,
                event: notes[p]
            });
        }

        // Update beat
        beat += duration;
    }

    if (beam) closeBeam(symbols, stave, part, beam);

    closeTuplet(stave, part, tuplet);

    return n;
}

export function createPart(symbols, bar, stave, key = 0, accidentals = {}, part, events, settings = config) {
    const notes = [];
    const { headDurations, restDurations } = settings;

    let beat = 0;
    let n = -1;
    let event, duration, beam;

    // Ignore events that stop before beat 0. An extra cautious measure because
    // events array should already start with events at beat 0
    while ((event = events[++n]) && lte(beat, event[0] + event[4] - bar.beat, p16));
    --n;

    while (lt(bar.duration, beat, p16)) {
        // If there's a beam and beat is on a division close it
        if (beam && bar.divisions.find((division) => eq(beat, division, p16))
            // or head started after a new division
            // || getDivision(bar.divisions, , beat)
        ) {
            closeBeam(symbols, stave, part, beam);
            beam = undefined;
        }

        // If we are not currently in tuplet mode detect the next tuplet
        const data = detectTuplet(events, bar.beat + beat, bar.duration - beat);

//if (data) console.log(bar.beat, beat, n, event, 'TUPLETS', data.beat, data.duration, 'divisor', data.divisor, data.rhythm, n, events);
//else console.log(bar.beat, beat, 'DUPLETS', n, events);
//if (data) console.log(bar.count, beat, 'Rhythm', data.duration, data.divisor, data.rhythm.toString(2).split('').reverse().join(''));

        if (data && !isPowerOf2(data.divisor)) {
            // Create rests up to tuplet
            if (gt(beat, data.beat - bar.beat, p16)) createRests(symbols, settings.restDurations, bar, stave, part, beat, data.beat - bar.beat);
            // Close beam if there any holes in rhythm
            if (beam && rhythmHasHoles(data.divisor, data.rhythm)) {
                closeBeam(symbols, stave, part, beam);
                beam = undefined;
            }
            // Render tuplet
            n = createTuplet(symbols, bar, stave, key, accidentals, part, beam, settings, data.beat - bar.beat, data.duration, data.divisor, data.rhythm, notes, events, n);
            // Update beat
            beat = data.beat - bar.beat + data.duration;
            //
            continue;
        }

        // Fill notes with events playing during beat, and leave event as the
        // next event after beat
        while ((event = events[++n]) && lte(beat, event[0] - bar.beat, p16)) {
            notes.push(event);
        }
        --n;

        // Sort notes by pitch order, descending (ascending row order)
        if (stave.pitched) notes.sort(byPitch);

        // Insert rests
        if (!notes.length) {
            if (!event) {
                // If beam close it
                if (beam) {
                    // Close the current beam
                    closeBeam(symbols, stave, part, beam);
                    beam = undefined;
                }

                // Fill rest of bar with rests
                createRests(symbols, settings.restDurations, bar, stave, part, beat, bar.duration);
                break;
            }

            // Create rests up to next event
            const stopBeat = roundTo(0.125, event[0] - bar.beat);

if (stopBeat <= beat) {
    console.log(`Problem at bar ${ bar.count }, moving to next bar ${ beat } ${ stopBeat }`);
    bar.error = 'Stop beat has ended up less than beat';
    break;
}

            if (beam && (
                // If beam would cross a division
                getDivision(bar.divisions, beat, stopBeat)
                // If beam would have a rest longer than an eighth note
                || stopBeat - beat >= 0.5
            )) {
                // Close the current beam
                closeBeam(symbols, stave, part, beam);
                beam = undefined;
            }

            createRests(symbols, restDurations, bar, stave, part, beat, stopBeat);
            beat = stopBeat;
            continue;
        }

        const noteSymbols = createNoteSymbols(stave, key, part, notes);

        // Create ledgers and accidentals
        if (noteSymbols.length) {
            createLedges(symbols, stave, part, beat, noteSymbols);
            createAccidentals(symbols, bar, part, accidentals, beat, noteSymbols);
            createAccents(symbols, stave, part, beat, noteSymbols, settings);
        }

        // Original start beat of notes, may be well before beat
        const startBeat = notes[0][0] - bar.beat;
        // Max stop beat of notes
        const stopBeat  = min(bar.duration, notes.reduce(toMaxStopBeat, 0) - bar.beat);
        // Start beat of next event, if it exists
        const eventBeat = event && roundTo(0.125, event[0]) - bar.beat;
        // Duration of next head
        const duration  = fitDuration(headDurations, bar, startBeat, stopBeat, beat, eventBeat);

        // Assign beat, duration to note symbols and push into symbols
        let p = -1;
        while (noteSymbols[++p]) symbols.push(assign(noteSymbols[p], {
            beat,
            duration
        }));

        // If duration is a quarter note or longer close beam
        if (duration >= 1) {
            if (beam) {
                closeBeam(symbols, stave, part, beam);
                beam = undefined;
            }
        }
        // Otherwise if there is no beam open one
        else if (!beam) beam = {
            type: 'beam',
            beat,
            part
        };

        // Push note symbols on to beam
        if (beam) push(beam, ...noteSymbols);

        // Remove notes or insert ties
        p = notes.length;
        while (p--) {
            let stopBeat = getStopBeat(notes[p]) - bar.beat;
            // Remove notes that end before or near next beat
            if (// Note stops before next beat
                lte(beat + duration, stopBeat, p16)
                // Note stops within 0.125 + 1/16 of its own true duration of next beat
                || stopBeat - (beat + duration) < 0.125 + (1/16) * (getStopBeat(notes[p]) - notes[p][0])) {
                notes.splice(p, 1);
            }
            // Add tie to remaining notes
            else symbols.push({
                type:   'tie',
                beat,
                pitch: noteSymbols[p].pitch,
                duration,
                stemup: noteSymbols[p].stemup,
                part,
                event: notes[p]
            });
        }

        // Update beat
        beat += duration;
    }

    // If there's still a beam close it
    if (beam) closeBeam(symbols, stave, part, beam);

    return symbols;
}
