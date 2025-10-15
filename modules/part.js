
import by       from 'fn/by.js';
import get      from 'fn/get.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import { keyWeightsForEvent, chooseKeyFromWeights } from './keys.js';
import { rflat, rsharp, rdoubleflat, rdoublesharp } from './pitch.js';
import { getDivision } from './bar.js';
import detectTuplets from './tuplet.js';
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
const { abs, ceil, floor, min, max, sqrt, round } = Math;

/* When dealing with rounding errors we only really need beat grid-level
   precision, our display grid has 24 slots but we only need to compare the
   smallest possible note values, 32nd notes, or ±1/16 precision */
const p16 = 1/16;
const p24 = 1/24;

const byRow = by(get('row'));


function average(a, n, i, array) {
    return a + n / array.length;
}


/* Events */

function toMaxStopBeat(n, event) {
    return max(n, getStopBeat(event));
}

function byPitch(a, b) {
    return toNoteNumber(a[2]) < toNoteNumber(b[2]) ? 1 : -1;
}

function getPitches(stave, key, notes) {
    const pitches = {};
    let n = -1;
    let note;
    while (note = notes[++n]) {
        const events     = note.scribeEvents;
        const index      = note.scribeIndex;
        const keyWeights = keyWeightsForEvent(events, index, key);
        const keyNumber  = chooseKeyFromWeights(keyWeights);
        pitches[n] = stave.getSpelling(keyNumber, note);
    }

    return pitches;
}

function getRows(stave, part, pitches) {
    const rows = {};
    let n = -1;
    while (pitches[++n]) rows[n] = stave.getRow(part, pitches[n]);
    return rows;
}

function getClusters(rows) {
    const clusters = {};
    let n = -1, c = 0;
    while (rows[++n] !== undefined) {
        clusters[n] = {};
        if (rows[n] - rows[n - 1] === 1) clusters[n].clusterdown = ++c;
        else c = 0;
    }
    c = 0;
    while (rows[--n] !== undefined) {
        if (rows[n + 1] - rows[n] === 1) clusters[n].clusterup = ++c;
        else c = 0;
    }
    return clusters;
}



/*
This is an attempt to merge the note creation functions...

function createNoteSymbols(stave, key, part, notes) {
    const symbols = [];
    let n = -1;
    while (notes[++n] !== undefined) {
        const events     = note.scribeEvents;
        const index      = note.scribeIndex;
        const keyWeights = keyWeightsForEvent(events, index, key);
        const keyNumber  = chooseKeyFromWeights(keyWeights);
        const pitch      = stave.getSpelling(keyNumber, note);
        const row        = stave.getRow(part, pitch);

        symbols.push({ pitch, row });
    }

    symbols.sort(byRow);

    // Loop forward through rows, detect clusters
    let c = 0;
    n = -1;
    while (notes[++n] !== undefined) {
        if (rows[n] - rows[n - 1] === 1) symbols[n].clusterdown = ++c;
        else c = 0;
    }

    // Loop backward through rows, detect clusters
    c = 0;
    while (notes[--n] !== undefined) {
        if (rows[n + 1] - rows[n] === 1) symbols[n].clusterup = ++c;
        else c = 0;
    }

    return symbols;
}
*/


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

function closeBeam(symbols, stave, part, beam) {
    // Scan through beam symbols to find note not on beat of beam
    let n = -1;
    while (beam[++n] && beam[n].beat === beam.beat);
    // If there is only notes on start beat of beam, no beam needed
    if (!beam[n]) return symbols;

    const startBeat  = beam[0].beat;
    const stopBeat   = last(beam).beat;
    const duration   = stopBeat - startBeat;
    const stemup = part.stemup === undefined ?
        // Calculate stem up or down
        stemupFromPitches(stave, part, map(get('pitch'), beam)) :
        // Get stem direction from part
        part.stemup ;


    // If part has beam beams are in a fixed position
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
            range: 0
        }));

        return symbols;
    }

    // Calculate beam positions
    const rows = [];

    let note;
    n = -1;
    while (note = beam[++n]) {
        let row = stave.getRow(part, note.pitch);
        // row may be out of range oof this stave
        if (row === undefined) continue;

        let r;

        // Find highest or lowest pitch at beat of note
        while (beam[++n] && eq(beam[n].beat, note.beat, p24)) {
            r = stave.getRow(part, beam[n].pitch);
            // row may be out of range oof this stave
            if (r === undefined) continue;
            if (stemup) { if (r < row) row = r; }
            else { if (r > row) row = r; }
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
    let r = -1;
    n = -1;
    while (note = beam[++n]) {
        ++r;
        note.stemup = stemup;
        note.beam   = beam;
        note.stemHeight = stemup ?
            1 - 0.125 * (positions[n] - rows[n] + rows[0]) :
            1 + 0.125 * (positions[n] - rows[n] + rows[0]) ;

        // Find highest or lowest pitch at beat of note
        while (beam[++n] && eq(beam[n].beat, note.beat, p16)) {
            beam[n].stemup     = stemup;
            beam[n].beam       = beam;
            beam[n].stemHeight = note.stemHeight;
        }
        --n;
    }

    // Push the beam into symbols
    symbols.push(assign(beam, {
        pitch: beam[0].pitch,
        y:     positions[0],
        duration,
        stemup,
        range
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
    const div2     = floor(stopBeat / bar.divisor) * bar.divisor;
    const division = div1 + bar.divisor < stopBeat && div1 + bar.divisor;

    // Decision tree
    // Beat is on a divisor
    if (beat === div1) {
        // TODO: Something
        if (eventBeat) {}
        // Beat to stop beat is a valid head duration
        if (durations.indexOf(stopBeat - beat) !== -1) return stopBeat - beat;
        // If beat to last division is a valid duration
        if (durations.indexOf(div2 - beat) !== -1) return div2 - beat;
        // Beat to divisor
        if (division) return division - beat;
        //
        return fitRoundedUpDuration(0.125, stopBeat - beat, eventBeat - beat);
    }
    // Stop beat is on a divisor
    else if (eq(stopBeat, div2, p16)) {
        // If beat to stop beat is a valid duration use it
        if (durations.indexOf(stopBeat - beat) !== -1) return stopBeat - beat;
        // Otherwise up to the nearest division
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
    while (gt(tobeat, beat, p16)) {
        const rest = createRest(durations, bar, stave, part, tobeat, beat);
        symbols.push(rest);
        beat += rest.duration;
    }

    return tobeat;
}


/* Accidentals */

function createAccidental(symbols, bar, stave, part, accidentals, beat, event, pitch, distance) {
    const acci =
        rsharp.test(pitch) ? 1 :
        rflat.test(pitch) ? -1 :
        undefined ;

    // Line name is note name + octave (no # or b)
    const line = pitch[0] + pitch.slice(-1);

    if (
        // If event started before this bar we don't require an accidental
        gte(event[0], bar.beat, p16)
        // and if it has changed from the bars current accidentals
        && acci !== accidentals[line]
    ) {
        // Alter current state of bar accidentals
        accidentals[line] = acci;
        symbols.push(assign({}/*, head*/, {
            type: 'acci',
            beat,
            pitch,
            part,
            distance,
            stave,
            event,
            value: acci || 0
        }));
    }
}

function createAccidentals(symbols, bar, stave, part, accidentals, beat, notes, pitches, rows) {
    let n = -1;
    while (pitches[++n]) createAccidental(symbols, bar, stave, part, accidentals, beat, notes[n], pitches[n], rows[n] - rows[n - 1]);
    return beat;
}


/* Ledger lines */

function createLedges(symbols, stave, part, beat, pitches) {
    // Up ledger lines
    const { row: maxRow, pitch: maxPitch } = getMaxPitchRow(stave, part, pitches);
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
    const { row: minRow, pitch: minPitch } = getMinPitchRow(stave, part, pitches);
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

function createTuplet(symbols, bar, stave, key, accidentals, part, settings, beat, duration, divisor, rhythm, notes, events, n) {
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

    let event, beam;

    // If divisor is not power of two push tuplet symbol
    if (!isPowerOf2(divisor)) symbols.push(tuplet);

    // While beat is before end of tuplet
    while (lt(beat, stopBeat, p24)) {
        // Fill notes with events playing during beat, and leave event as the
        // next event after beat
        while ((event = events[++n]) && lte(event[0] - bar.beat, beat + 0.5 * division, p24)) {
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
        const pitches  = getPitches(stave, key, notes);
        //const minPitch = getMinPitch(pitches);
        //const maxPitch = getMaxPitch(pitches);
        const { row: minRow, pitch: minPitch } = getMinPitchRow(stave, part, pitches);
        const { row: maxRow, pitch: maxPitch } = getMaxPitchRow(stave, part, pitches);
        const stemup = part.stemup === undefined ?
            stemupFromRows(stave, part, minRow, maxRow) :
            part.stemup ;

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

        // Manage beam
        if (gt(duration, 0.5, p24)) {
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

        // Create ledgers and accidentals
        createLedges(symbols, stave, part, beat, pitches);
        createAccidentals(symbols, bar, stave, part, accidentals, beat, notes, pitches, rows);

        let p = -1;
        while (notes[++p]) symbols.push({
            type: 'note',
            beat,
            pitch: pitches[p],
            duration,
            part,
            stemup,
            top:    pitches[p] === maxPitch,
            bottom: pitches[p] === minPitch,
            stave,
            event: notes[p]
        });

        // Push note symbols on to tuplet
        push(tuplet, ...symbols.slice(-1 * notes.length));
        // Push note symbols on to beam
        if (beam) push(beam, ...symbols.slice(-1 * notes.length));

        // Remove notes or insert ties
        p = notes.length;
        while (p--) {
            let stopBeat = getStopBeat(notes[p]) - bar.beat;
            // Remove notes that end before or near next division, we're done with them
            if (lte(stopBeat, beat + duration + 0.5 * division, p24)) notes.splice(p, 1);
            // Add tie to remaining notes
            else symbols.push({
                type:   'tie',
                beat,
                pitch: pitches[p],
                duration,
                stemup,
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
    while ((event = events[++n]) && lte(event[0] + event[4] - bar.beat, beat, p16));
    --n;

    while (lt(beat, bar.duration, p16)) {
        // If there's a beam and beat is on a division close it
        if (beam && bar.divisions.find((division) => eq(beat, division, p16))
            // or head started after a new division
            // || getDivision(bar.divisions, , beat)
        ) {
            closeBeam(symbols, stave, part, beam);
            beam = undefined;
        }

        // If we are not currently in tuplet mode detect the next tuplet
        const data = detectTuplets(events, bar.beat + beat, bar.duration - beat);

//if (data) console.log(bar.beat, beat, n, event, 'TUPLETS', data.beat, data.duration, 'divisor', data.divisor, data.rhythm, n, events);
//else console.log(bar.beat, beat, 'DUPLETS', n, events);
//if (data) console.log(bar.count, beat, 'Rhythm', data.duration, data.divisor, data.rhythm.toString(2).split('').reverse().join(''));

        if (data && data.divisor !== 2 && data.divisor !== 4) {
            // Create rests up to tuplet
            if (gt(data.beat - bar.beat, beat, p16)) createRests(symbols, settings.restDurations, bar, stave, part, beat, data.beat - bar.beat);
            // Close beam TODO dont close beam
            if (beam) {
                closeBeam(symbols, stave, part, beam);
                beam = undefined;
            }
            // Render tuplet
            n = createTuplet(symbols, bar, stave, key, accidentals, part, settings, data.beat - bar.beat, data.duration, data.divisor, data.rhythm, notes, events, n);
            // Update beat
            beat = data.beat - bar.beat + data.duration;
            //
            continue;
        }

        // Fill notes with events playing during beat, and leave event as the
        // next event after beat
        while ((event = events[++n]) && lte(event[0] - bar.beat, beat, p16)) {
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

        //const noteSymbols = createNoteSymbols(stave, key, part, notes);
        const pitches  = getPitches(stave, key, notes);
        const rows     = getRows(stave, part, pitches);
        const clusters = getClusters(rows);
        const { row: minRow } = getMinPitchRow(stave, part, pitches);
        const { row: maxRow } = getMaxPitchRow(stave, part, pitches);
        const stemup  = part.stemup === undefined ?
            stemupFromRows(stave, part, minRow, maxRow) :
            part.stemup ;

        // Create ledgers and accidentals
        createLedges(symbols, stave, part, beat, pitches);
        createAccidentals(symbols, bar, stave, part, accidentals, beat, notes, pitches, rows);

        // Original start beat of notes, may be well before beat
        const startBeat = notes[0][0] - bar.beat;
        // Max stop beat of notes
        const stopBeat  = min(bar.duration, notes.reduce(toMaxStopBeat, 0) - bar.beat);
        // Start beat of next event, if it exists
        const eventBeat = event && roundTo(0.125, event[0]) - bar.beat;
        // Duration of next head
        const duration  = fitDuration(headDurations, bar, startBeat, stopBeat, beat, eventBeat);

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

        let p = -1;
        while (notes[++p]) symbols.push({
            type:    'note',
            beat,
            pitch:   pitches[p],
            duration,
            part,
            stemup,
            top:     p === 0,
            bottom:  p === notes.length - 1,
            clusterup:   (console.log(p, clusters[p]), clusters[p].clusterup),
            clusterdown: clusters[p].clusterdown,
            stave,
            event:   notes[p]
        });

        // Push note symbols on to beam
        if (beam) push(beam, ...symbols.slice(-1 * notes.length));

        // Remove notes or insert ties
        p = notes.length;
        while (p--) {
            let stopBeat = getStopBeat(notes[p]) - bar.beat;
            // Remove notes that end before or near next beat
            if (// Note stops before next beat
                lte(stopBeat, beat + duration, p16)
                // Note stops within 0.125 + 1/16 of its own true duration of next beat
                || stopBeat - (beat + duration) < 0.125 + (1/16) * (getStopBeat(notes[p]) - notes[p][0])) {
                notes.splice(p, 1);
            }
            // Add tie to remaining notes
            else symbols.push({
                type:   'tie',
                beat,
                pitch: pitches[p],
                duration,
                stemup,
                part,
                event: notes[p]
            });
        }

        // Update beat
        beat += duration;
    }

    // If there's still a beam close it
    if (beam) {
        closeBeam(symbols, stave, part, beam);
        beam = undefined;
    }

    return symbols;
}
