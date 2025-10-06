
//import by       from 'fn/by.js';
import get      from 'fn/get.js';
import nothing  from 'fn/nothing.js';
import overload from 'fn/overload.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import { keyWeightsForEvent, chooseKeyFromWeights } from './keys.js';
import { rflat, rsharp, rdoubleflat, rdoublesharp } from './pitch.js';
import { getDivision } from './bar.js';
import detectTuplets from './tuplet.js';
import { round, eq, gte, lte, lt, gt } from './number/float.js';
import { averagePowerOf2, roundPowerOf2, floorPowerOf2, ceilPowerOf2, isPowerOf2 } from './number/power-of-2.js';
import floorTo     from './number/floor-to.js';
import ceilTo      from './number/ceil-to.js';
import push        from './object/push.js';
import every       from './object/every.js';
import last        from './object/last.js';
import lengthOf    from './object/length-of.js';
import map         from './object/map.js';
import getDuration from './event/to-duration.js';
import { rpitch }  from './pitch.js';
import config      from './config.js';

const assign = Object.assign;
const { abs, ceil, floor, min, max, sqrt } = Math;


/* When dealing with rounding errors we only really need beat grid-level
   precision, our display grid has 24 slots but we only need to compare the
   smallest possible note values, 32nd notes, or ±1/16 precision */
const p24 = 1/24;

/* There are 24 slots in our display grid which allows for even spacing of
   symbols down to 32nd-note triplet level, or twelve things per beat, as well
   as 32nd-note level, or 8 things per beat. So some slots, like 1/24, go unused
   (although they are used by accidentals, which are placed in slots preceding
   note heads). */
const quantiseBeats = [0, 2/24, 3/24, 4/24, 6/24, 8/24, 9/24, 10/24, 12/24, 14/24, 15/24, 16/24, 18/24, 20/24, 21/24, 22/24, 1];

const headDurations = [
    1/8, 6/32, 7/32,
    1/4, 6/16, 7/16,
    1/2, 6/8,  7/8,
    1,   6/4,  7/4,
    2,   6/2,  7/2,
    4,   6,    7,
    8
];

const minDuration = headDurations[0];

/* Allowable rest durations. Do we really want to allow double-dotted rests? */
const restDurations = [
         /*1/12,*/
    1/8, /*1/6, */ 6/32, // 7/32,
    1/4, /*1/3, */ 6/16, // 7/16,
    1/2, /*2/3, */ 6/8,  // 7/8,
    1,   /*4/3, */ 6/4,  // 7/4,
    2,   /*8/3, */ 3,    // 7/2
    4,             6,
    8
];


/* Events */

function getStopBeat(event) {
    return event[0] + getDuration(event);
}

function toMaxStopBeat(n, event) {
    return max(n, getStopBeat(event));
}

function getPitches(stave, key, notes, events, i) {
    if (notes[0] !== events[i + 1]) {
        console.log(i, notes, events);
        throw new Error('HELP ' + i);
    }

    const pitches = {};
    let n = -1;
    let note;
    while (note = notes[++n]) {
        const keyWeights = keyWeightsForEvent(events, ++i, key);
        const keyNumber  = chooseKeyFromWeights(keyWeights);

        pitches[n] = stave.getSpelling(keyNumber, note);
        //console.log(toRootName(keyNumber), pitches[n]);
    }
    return pitches;
}


/* Pitches */

function getMinPitch(pitches) {
    const [x, l, a, o] = rpitch.exec(pitches[0]);
    let octave = o;
    let letter = toRootNumber(l);
    let pitch  = pitches[0];
    let n = 0;
    while (pitches[++n]) {
        const [x, l, a, o] = rpitch.exec(pitches[n]);
        if (o < octave || o === octave && toRootNumber(l) < letter) {
            octave = o;
            letter = toRootNumber(l);
            pitch  = pitches[n];
        }
    }
    return pitch;
}

function getMaxPitch(pitches) {
    const [x, l, a, o] = rpitch.exec(pitches[0]);
    let octave = o;
    let letter = toRootNumber(l);
    let pitch  = pitches[0];
    let n = 0;
    while (pitches[++n]) {
        const [x, l, a, o] = rpitch.exec(pitches[n]);
        if (o > octave || o === octave && toRootNumber(l) > letter) {
            octave = o;
            letter = toRootNumber(l);
            pitch  = pitches[n];
        }
    }
    return pitch;
}


/* Stems */

function stemFromMinMaxPitches(stave, minPitch, maxPitch) {
    const minDiff  = stave.getRowDiff(stave.midLinePitch, minPitch);
    const maxDiff  = stave.getRowDiff(stave.midLinePitch, maxPitch);
    return maxDiff + minDiff < -1;
}

function stemFromPitches(stave, pitches) {
    const minPitch = getMinPitch(pitches);
    const maxPitch = getMaxPitch(pitches);
    return stemFromMinMaxPitches(stave, minPitch, maxPitch);
}

function stemFromSymbols(stave, symbols) {
    const pitches = [];
    let n = -1, symbol;
    while (symbol = symbols[++n]) {
        if (symbol.type === 'note') pitches.push(symbol.pitch);
    }
    return stemFromPitches(stave, pitches);
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
        stemFromPitches(stave, map(get('pitch'), beam)) :
        // Get stem direction from part
        part.stemup ;

    // Get max and min pitches at each beat of beam
    const pitches = [];

    let note;
    n = -1;
    while (note = beam[++n]) {
        let pitch = note.pitch;

        // Find highest or lowest pitch at beat of note
        while (beam[++n] && eq(beam[n].beat, note.beat, p24)) {
            if (stemup) {
                if (toNoteNumber(beam[n].pitch) > toNoteNumber(pitch)) {
                    pitch = beam[n].pitch;
                }
            }
            else {
                if (toNoteNumber(beam[n].pitch) < toNoteNumber(pitch)) {
                    pitch = beam[n].pitch;
                }
            }
        }
        --n;

        // Push it into pitches
        pitches.push(pitch);
    }

    const beamLength = lengthOf(beam);
    let avgBeginLine = 0;
    let avgEndLine   = 0;
    let line;

    n = -1;
    while (pitches[++n]) {
        line = stave.getRowDiff(stave.midLinePitch, pitches[n]);

        if (n < (pitches.length - 1) / 2) {
            avgBeginLine += line / Math.floor(pitches.length / 2);
        }

        else if (n > (pitches.length - 1) / 2) {
            avgEndLine += line / Math.floor(pitches.length / 2);
        }
    }

    // Calculate where to put beam exactly
    let begin    = beam[0];
    let end      = last(beam);
    let endRange = stave.getRowDiff(begin.pitch, end.pitch);
    let avgRange = avgEndLine - avgBeginLine;
    let range = abs(avgRange) > abs(0.75 * endRange) ?
        0.5 * endRange :
        0.5 * avgRange;

    // Apply beamed properties to note symbols
    n = -1;
    while (note = beam[++n]) {
        note.stemup = stemup;
        note.beam   = beam;
        note.stemHeight = stemup ?
            1 + 0.125 * (range * n  / (pitches.length - 1) - stave.getRowDiff(begin.pitch, note.pitch)) :
            1 + 0.125 * (-range * n / (pitches.length - 1) + stave.getRowDiff(begin.pitch, note.pitch)) ;
    }

    // Push the beam into symbols
    symbols.push(assign(beam, {
        pitch: begin.pitch,
        // Duration of beam is the difference between the first note start and
        // the last note start, not the full duration
        duration,
        stemup,
        range
    }));

    return symbols;
}


/* Rests */

function createRest(durations, divisions, endbeat, stave, part, tobeat, beat) {
    // [beat, 'rest', pitch (currently unused), duration]
    let duration = tobeat - beat;

    // If the beat and tobeat don't both fall on start, end or a division...
    if (!(beat === 0 || divisions.includes(beat)) || !(tobeat === endbeat || divisions.includes(tobeat))) {
        // Find bar division that rest crosses
        let division = getDivision(divisions, beat, beat + duration);
        // Truncate rest up to division
        if (division) duration = division - beat;
    }

    // Clamp rest duration to permissable rest symbol durations
    let r = durations.length;
    // Employ p24 to work around rounding errors
    while (durations[--r] + p24 > duration);
    duration = durations[r + 1] || durations[durations.length - 1];

    // Where beat does not fall on a 2^n division clamp it to next
    // smallest. This is what stops [0, note, 0.5], [1.5, note, 0.5]
    // from rendering with a single quarter rest between them, but
    // rather two eighth rests.
    let p = 8;
    while ((p *= 0.5) && beat % p);
    // TODO: Something not quite right about this logic
    if (p < duration) duration = p;

    // Create rest symbol
    return {
        type: 'rest',
        beat,
        duration,
        stave,
        part
    };
}

function createRests(symbols, durations, bar, stave, part, beat, tobeat) {
    // Insert rests frombeat - tobeat
    while (gt(tobeat, beat, p24)) {
        const rest = createRest(durations, bar.divisions, bar.duration || 100, stave, part, tobeat, beat);
        symbols.push(rest);
        beat += rest.duration;
    }

    return tobeat;
}


/* Accidentals */

function createAccidental(symbols, bar, stave, part, accidentals, beat, event, pitch) {
    const acci =
        rsharp.test(pitch) ? 1 :
        rflat.test(pitch) ? -1 :
        undefined ;

    // Line name is note name + octave (no # or b)
    const line = pitch[0] + pitch.slice(-1);

    if (
        // If event started before this bar we don't require an accidental
        gte(event[0], bar.beat, p24)
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
            stave,
            event,
            value: acci || 0
        }));
    }
}

function createAccidentals(symbols, bar, stave, part, accidentals, beat, notes, pitches) {
    let n = -1;
    while (pitches[++n]) createAccidental(symbols, bar, stave, part, accidentals, beat, notes[n], pitches[n]);
    return beat;
}


/* Ledger lines */

function createLedges(symbols, stave, beat, pitches) {
    // Up ledger lines
    let pitch = getMaxPitch(pitches);
    let rows  = stave.getRowDiff(pitch, stave.maxLinePitch) + 1;
    if (rows < 0) symbols.push({
        type: 'ledge',
        beat,
        pitch,
        rows
    });

    // Down ledger lines
    pitch = getMinPitch(pitches);
    rows  = stave.getRowDiff(pitch, stave.minLinePitch) - 1;
    if (rows > 0)  symbols.push({
        type: 'ledge',
        beat,
        pitch,
        rows
    });
}


/* Symbols */

function closeTuplet(stave, part, tuplet) {
    const { beat, duration, divisor } = tuplet;

    // Stem direction
    const stemup = part.stemup === undefined ?
        stemFromSymbols(stave, tuplet) :
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
    const lowestPitchNumber = toNoteNumber(stave.maxLinePitch) - 12;

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
    while ((symbol = tuplet[++h]) && symbol.beat < beat + p24) {
        const number = toNoteNumber(symbol.pitch);
        if (!firstNumber || number > firstNumber) firstNumber = number;
    }

    // Scan backwards from last symbol finding highest pitch ending symbol
    let lastNumber = lowestPitchNumber;
    h = lengthOf(tuplet);
    while ((symbol = tuplet[--h]) && symbol.beat > beat + duration - (duration / divisor) - p24) {
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
        const pitches  = getPitches(stave, key, notes, events, n - notes.length);
        const minPitch = getMinPitch(pitches);
        const maxPitch = getMaxPitch(pitches);
        const stemup   = part.stemup === undefined ?
            stemFromMinMaxPitches(stave, minPitch, maxPitch) :
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
            round(division, stopBeat - beat)
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
        createLedges(symbols, stave, beat, pitches);
        createAccidentals(symbols, bar, stave, part, accidentals, beat, notes, pitches);

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

function durationToDivisor(durations, bar, beat, duration) {
    // Truncate event until it does end on a bar division or bar end
    let h = durations.length;
    let d;

    // Scan backwards and find next shortest duration
    while ((d = durations[--h]) && d > duration);
    ++h;

    // Scan backwards and return when a duration takes us to bar divisor or stop
    while (d = durations[--h]) {
        if (eq(beat + d, bar.duration, p24) || eq(0, (beat + d) % bar.divisor, p24)) {
            return d;
        }
    }
}

export function createPart(symbols, bar, stave, key = 0, accidentals = {}, part, events, settings = config) {
    const notes = [];

    let beat = 0;
    let n = -1;
    let event, duration, beam;

    // Ignore events that stop before beat 0, an extra cautious measure because
    // events array should already start with events at beat 0
    while ((event = events[++n]) && lte(event[0] + event[4] - bar.beat, beat, p24));
    --n;

    while (lt(beat, bar.duration, p24)) {
        // If there's a beam and beat is on a division close it
        if (beam && bar.divisions.find((division) => eq(beat, division, p24))
            // or head started after a new division
            // || getDivision(bar.divisions, , beat)
        ) {
            closeBeam(symbols, stave, part, beam);
            beam = undefined;
        }

        // If we are not currently in tuplet mode detect the next tuplet
        const data = detectTuplets(events, bar.beat + beat, bar.duration - beat);

//if (data) console.log(bar.beat, beat, data.beat, data.duration, data.divisor, data.rhythm, n, events);
//else console.log(bar.beat, beat, 'DUPLETS', n, events);

        if (data && data.divisor !== 2 && data.divisor !== 4) {
//console.log(bar.beat, beat, 'TUPLET DETECTED', data.beat, data.duration, data.divisor, data.rhythm);
            // Create rests up to tuplet
            if (gt(data.beat - bar.beat, beat, p24)) createRests(symbols, restDurations, bar, stave, part, beat, data.beat - bar.beat);
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
        while ((event = events[++n]) && lte(event[0] - bar.beat, beat, p24)) {
            notes.push(event);
        }
        --n;

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
                createRests(symbols, restDurations, bar, stave, part, beat, bar.duration);
                break;
            }

            // Create rests up to next event
            const stopBeat = round(0.125, event[0] - bar.beat);

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

        const pitches  = getPitches(stave, key, notes, events, n - notes.length);
        const minPitch = getMinPitch(pitches);
        const maxPitch = getMaxPitch(pitches);
        const stemup   = part.stemup === undefined ?
            stemFromMinMaxPitches(stave, minPitch, maxPitch) :
            part.stemup ;

        // Create ledgers and accidentals
        createLedges(symbols, stave, beat, pitches);
        createAccidentals(symbols, bar, stave, part, accidentals, beat, notes, pitches);


// Note duration heuristics ------------------ what a polava -------------------

        // Max stop beat of notes
        let stopBeat = notes.reduce(toMaxStopBeat, 0) - bar.beat;

        // Start beat of next event, if it exists
        let eventBeat = event && round(0.125, event[0]) - bar.beat;
//console.log(bar.beat, beat, 'NOTES', stopBeat, eventBeat);

        // If notes are truncated by next event
        if (lte(eventBeat, stopBeat, p24)) {
            stopBeat = eventBeat;
        }
        // If event beat is less then some multiplier of the duration of notes
        else if (eventBeat - beat < 1.5 * (stopBeat - beat)) {
            stopBeat = eventBeat;
        }
        // If stop beat is near divisor round it up ??????
        else if (stopBeat % bar.divisor > 0.6) {
            stopBeat = Math.ceil(stopBeat / bar.divisor) * bar.divisor;
        }
        // If duration is less than a beat and near a power of 2 duration
        else if (stopBeat - beat < 1 && stopBeat - beat > 0.5 * ceilPowerOf2(stopBeat - beat)) {
            stopBeat = ceilPowerOf2(stopBeat - beat) + beat;
        }
        // Round it
        else {
            stopBeat = round(0.125, stopBeat);
        }

        // If stop beat has ended up after bar end truncate it
        if (stopBeat > bar.duration) stopBeat = bar.duration;

        const division = getDivision(bar.divisions, beat, stopBeat);

            // Truncate stopBeat to divisor or bar end based on permissable durations
        let duration = division ? durationToDivisor(headDurations, bar, beat, stopBeat - beat) :
            // Or truncate duration to next lowest duration
            floorTo(headDurations, stopBeat - beat)
            // Or set it to the minimum duration
            || headDurations[0] ;

        // Update stopBeat accordingly
        stopBeat = beat + duration;

if (!duration || !stopBeat) {
    console.log('We have a problem. Stopping bar render.');
    console.log('DURATION ', duration, stopBeat);
    bar.error = 'Bad duration';
    break;
}

        // Limit duration by division
        if (division
            && (!(beat === 0 || eq(0, beat % bar.divisor, p24))
            || !(stopBeat === bar.duration || eq(0, stopBeat % bar.divisor, p24))
        )) {
            duration = floorTo(headDurations, division - beat);
        }

// -----------------------------------------------------------------------------


        // If duration is a quarter note or longer close beam
        if (duration >= 1) {
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
            event:  notes[p]
        });

        // Push note symbols on to beam
        if (beam) push(beam, ...symbols.slice(-1 * notes.length));

        // Remove notes or insert ties
        p = notes.length;
        while (p--) {
            let stopBeat = getStopBeat(notes[p]) - bar.beat;
            // Remove notes that end before or near next beat
            // TODO! This has to match the rounding heuristic in the duration
            // shortening thing somehow
            if (lte(stopBeat, beat + duration, p24)) notes.splice(p, 1);
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
