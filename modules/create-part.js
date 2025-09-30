
//import by       from 'fn/by.js';
import get      from 'fn/get.js';
import nothing  from 'fn/nothing.js';
import overload from 'fn/overload.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import toKeys from './sequence/to-keys.js';
import eventsAtBeat from './sequence/events-at-beat.js';
import { keysAtBeats, keyFromBeatKeys } from './sequence/key-at-beat.js';
import { transposeChord } from './event/chord.js';
import { transposeScale } from './scale.js';
import { toKeyScale, toKeyNumber, cScale } from './keys.js';
import { mod12, byGreater } from './maths.js';
import quantise from './quantise.js';
import { rflat, rsharp, rdoubleflat, rdoublesharp } from './regexp.js';
import { getBarDivisions, getDivision, getLastDivision } from './bar.js';
import detectTuplets from './tuplet.js';
import { round, eq, gte, lte, lt, gt } from './number/float.js';
import { averagePowerOf2, roundPowerOf2, floorPowerOf2, ceilPowerOf2 } from './number/power-of-2.js';
import push       from './object/push.js';
import every      from './object/every.js';
import last       from './object/last.js';
import lengthOf   from './object/length-of.js';
import map        from './object/map.js';
import toDuration from './event/to-duration.js';
import { rpitch } from './pitch.js';
import config     from './config.js';

const assign = Object.assign;
const { abs, ceil, floor, min, max } = Math;


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


function getMinPitch(pitches) {
    let n = -1;
    let l, o, pitch;
    while (pitches[++n]) {
        const [name, letter, acc, octave] = rpitch.exec(pitches[n]);
        if (!(o < octave)
         || !(l < toRootNumber(letter))) {
            l = toRootNumber(letter);
            o = octave;
            pitch = pitches[n];
        }
    }
    return pitch;
}

function getMaxPitch(pitches) {
    let n = -1;
    let l, o, pitch;
    while (pitches[++n]) {
        const [name, letter, acc, octave] = rpitch.exec(pitches[n]);
        if (!(o > octave)
         || !(l > toRootNumber(letter))) {
            o = octave;
            l = toRootNumber(letter);
            pitch = pitches[n];
        }
    }
    return pitch;
}


/* Beams */

function calcAvgMidOffset(stave, pitch, beam) {
    let avgDiff = 0;
    let g = -1;
    let count = 0;
    let notes;
    while (notes = beam[++g]) {
        if (!notes.length) continue;
        const pitches  = map(get('pitch'), notes);
        const minPitch = getMinPitch(pitches);
        const maxPitch = getMaxPitch(pitches);
        const minDiff  = stave.getRowDiff(pitch, minPitch);
        const maxDiff  = stave.getRowDiff(pitch, maxPitch);
        avgDiff += 0.5 * minDiff + 0.5 * maxDiff;
        count += 1;
    }
    return avgDiff / count;
}

function closeBeam(symbols, stave, part, beam) {
    // Not enough notes groups for a beam
    if (!beam[1]) return symbols;

    const startBeat  = beam[0][0].beat;
    const stopBeat   = last(beam)[0].beat;
    const beamLength = lengthOf(beam);
    const duration   = stopBeat - startBeat;
    const stemup     = part.stemup === undefined ?
        // Calculate average diff from mid line
        calcAvgMidOffset(stave, stave.midLinePitch, beam) > 0 :
        // Get stem direction from part
        part.stemup ;

    let avgBeginLine = 0;
    let avgEndLine = 0;
    let n = -1, notes;
    while (notes = beam[++n]) {
        // Beams may contain rests
        if (!notes.length) continue;

        const pitches = notes.map(get('pitch'));
        const pitch   = stemup ?
            getMaxPitch(pitches) :
            getMinPitch(pitches) ;
        // TODO
        const line = 60; //stave.getRowDiff(pitch, minPitch);

        // Middle of beam index
        const b = 0.5 * (beamLength - 1);

        if (n < b) {
            avgBeginLine += line / Math.floor(beamLength / 2);
        }
        else if (n > b) {
            avgEndLine += line / Math.floor(beamLength / 2);
        }

//        push(symbol, notes);
    }

    // Calculate where to put beam exactly
/*    let begin    = heads[0];
    let end      = heads[heads.length - 1];
    let endRange = stave.getRowDiff(begin.pitch, end.pitch);
    let avgRange = avgEndLine - avgBeginLine;
    let range = abs(avgRange) > abs(0.75 * endRange) ?
        0.75 * endRange :
        avgRange;

    heads.forEach((head, i) => {
        head.stemHeight = stemDirection === 'down' ?
            1 + 0.125 * (-range * i / (heads.length - 1) + stave.getRowDiff(begin.pitch, head.pitch)) :
            1 + 0.125 * (range * i  / (heads.length - 1) - stave.getRowDiff(begin.pitch, head.pitch)) ;
    });*/

    // TEMP
    return symbols;

    assign(beam, { duration, stemup });
    symbols.push(beam);
    return symbols;
}


/* Tuplets */

function openTuplet() {

}

function closeTuplet(stave, tuplet) {
    const { beat, duration, divisor } = tuplet;

    // Decide on tuplet pitch, effectively vertical row position
    const centreBeat = beat + 0.5 * duration;

    // Encourage lowest pitch to be 1 octave below top line, ensuring
    // triplet (with appropriate styling) always sits above the top line
    const lowestPitchNumber = toNoteNumber(stave.maxLinePitch) - 12;

    let h = lengthOf(tuplet);
    let symbol, centreNumber;

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
    while ((symbol = tuplet[++h]) && symbol.beat < p24) {
        const number = toNoteNumber(symbol.pitch);
        if (!firstNumber || number > firstNumber) firstNumber = number;
    }

    // Scan backwards from last symbol finding highest pitch ending symbol
    let lastNumber = lowestPitchNumber;
    h = tuplet.length;
    while ((symbol = tuplet[--h]) && symbol.beat > beat + duration - (duration / divisor) - p24) {
        const pitch = toNoteNumber(symbol.pitch);
        if (!lastNumber || pitch > lastNumber) lastNumber = pitch;
    }

    const avgNumber = Math.ceil((firstNumber + lastNumber) / 2);
    const avgPitch  = toNoteName(avgNumber);
    if (avgNumber > centreNumber) centreNumber = avgNumber;

    tuplet.pitch = toNoteName(centreNumber);
    tuplet.angle = -3 * Math.sqrt(lastNumber - firstNumber);
    tuplet.down  = every(tuplet, isStemDown);
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


/* Stems */

function getStemDirection(centerPitch, head) {
    return head && head.stemDirection || (
        toNoteNumber(centerPitch) < toNoteNumber(event[2]) ?
            'down' :
            'up');
}

function isStemDown(symbol) {
    return symbol.stemDirection === 'down';
}


/* Accidentals */

function createAccidental(symbols, stave, part, accidentals, beat, event, pitch) {
    const acci =
        rsharp.test(pitch) ? 1 :
        rflat.test(pitch) ? -1 :
        undefined ;

    // Line name is note name + octave (no # or b)
    const line = pitch[0] + pitch.slice(-1);

    if (
        // If head is not a tied head from a previous bar - they
        // don't require accidentals,
// TODO        !lt(event[0], 0, p24)
        // and if it has changed from the bars current accidentals
        acci !== accidentals[line]
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

function createAccidentals(symbols, stave, part, accidentals, beat, notes, pitches) {
    let n = -1;
    while (pitches[++n]) createAccidental(symbols, stave, part, accidentals, beat, notes[n], pitches[n]);
    return beat;
}


/* Ledger lines */

function getPitches(stave, key, events) {
    const pitches = {};
    let n = -1;
    let event;
    while (event = events[++n]) pitches[n] = stave.getSpelling(key, event);
    return pitches;
}

function createLedgers(symbols, bar, stave, beat, pitches) {
    // Down ledger lines
    const minPitch = getMinPitch(pitches);
    let rows = stave.getRowDiff(minPitch, stave.minLinePitch) - 1;
    if (rows < 0) symbols.push(assign({}, {
        type: 'downledger',
        beat,
        rows: -rows,
        stave
    }));

    // Up ledger lines
    const maxPitch = getMaxPitch(pitches);
    rows = stave.getRowDiff(stave.maxLinePitch, maxPitch) - 1;
    if (rows > 0) symbols.push(assign({}, {
        type: 'upledger',
        beat,
        rows,
        stave
    }));
}


/* Heads */

function getAverageStart(bar, events) {
    let event;
    let n = -1;
    let t = 0;
    while (event = events[++n]) t += event[0];
    return max(0, (t / events.length) - bar.beat);
}

function getAverageStop(bar, events) {
    let event;
    let n = -1;
    let t = 0;
    while (event = events[++n]) t += event[0] + event[4];
    return min(bar.duration, (t / events.length) - bar.beat);
}

function toStemup(stave, pitches) {
    const minPitch = getMinPitch(pitches);
    const maxPitch = getMaxPitch(pitches);
    const minDiff  = stave.getRowDiff(stave.midLinePitch, minPitch);
    const maxDiff  = stave.getRowDiff(stave.midLinePitch, maxPitch);
    return maxDiff + minDiff < 0;
}

function createDupletHeads(bar, stave, part, durations, startBeat, stopBeat, events, pitches) {
    const symbols = [];
    const stemup  = toStemup(stave, pitches);

    let beat = startBeat;
    let n, event;
    let division, tie;

    // If note does not start on a meter multiple and crosses a
    // bar division...
    if (startBeat !== 0
        && !eq(0, startBeat % bar.divisor)
        && (division = getDivision(bar.divisions, beat, stopBeat))
    ) {
        const duration = division - beat;

        n = -1;
        while (event = events[++n]) symbols.push({
            type: 'note',
            beat,
            pitch: pitches[n],
            duration,
            part,
            stemup,
            stave,
            //tie: tie ? 'middle' : 'begin',
            event
        });

        // Update state of note
        beat += duration;
        tie = true;
    }

    // If rest of note does not stop on a meter multiple and crosses a
    // bar division...
    if (stopBeat < bar.duration
        && !eq(0, stopBeat % bar.divisor)
        && (division = getLastDivision(bar.divisions, beat, stopBeat))
    ) {
        const duration = division - beat;

        n = -1;
        while (event = events[++n]) symbols.push(assign({
            type: 'note',
            beat,
            pitch: pitches[n],
            duration,
            part,
            stemup,
            stave,
            event,
            //tie: tie ? 'middle' : 'begin'
        }));

        // Update state of note
        beat += duration;
        tie = true;
    }

    // Does note cross into next bar?
    const duration = stopBeat > bar.duration ?
        bar.duration - beat :
        stopBeat - beat ;

    n = -1;
    while (event = events[++n]) symbols.push(assign({
        type: 'note',
        beat,
        pitch: pitches[n],
        duration,
        part,
        stemup,
        stave,
        event
    }));

    return symbols;
}

function createTupletHeads(bar, stave, part, tuplet, beat, events, pitches) {
    const symbols  = [];
    const duration = tuplet.duration / tuplet.divisor;
    const stemup   = toStemup(stave, pitches);

    let n = -1;
    let event, symbol;
    while (event = events[++n]) {
        symbol = {
            type: 'note',
            beat,
            pitch: pitches[n],
            duration,
            part,
            stemup,
            stave,
            event
        };

        push(tuplet, symbol);
        symbols.push(symbol);
    }

    return symbols;
}


/* Ties */

function createTie(symbols, stave, part, beat, stopBeat, event, pitch) {
    const duration = stopBeat - beat;

    symbols.push({
        type:   'tie',
        beat,
        pitch,
        duration,
        part,
        stave
        //updown: head.stemDirection === 'up' ? 'down' : 'up',
        //event
    });

    return symbols;
}


/* Symbols */

function toStopBeat(beat, event) {
    return event[0] + event[4] - beat;
}

export function createPartSymbols(symbols, bar, stave, key = 0, accidentals = {}, part, events, settings = config) {
    const notes = [];

    let beat = 0;
    let n = -1;
    let event, duration, tuplet, beam;

    // Ignore events that stop before beat 0, an extra cautious measure because
    // events should already start with events at beat 0
    while ((event = events[++n]) && lte(event[0] + event[4] - bar.beat, beat, p24));
    --n;

    while (lt(beat, bar.duration)) {
        // Fill notes with events playing during beat, and leave event as the
        // next event after beat
        while ((event = events[++n]) && lte(event[0] - bar.beat, beat, p24)) {
            notes.push(event);
        }
        --n;

        // If we are not currently in tuplet mode detect the next tuplet
        if (!tuplet) {
            const duration = bar.duration - beat;
            const data = detectTuplets(events, beat, duration);

            if (data && data.divisor !== 2) {
                // Create tuplet symbol
                tuplet = assign({ type: 'tuplet', part, stave }, data, { beat: data.beat - bar.beat });
                // Push rests up to tuplet start
                createRests(symbols, restDurations, bar, stave, part, beat, tuplet.beat);
                beat = tuplet.beat;
                continue;
                // Push tuplet
                //symbols.push(tuplet);
            }
        }

        // If we are at tuplet beat, push tuplet symbol in
        if (tuplet && eq(beat, tuplet.beat, p24)) symbols.push(tuplet);

        // If there's a beam and beat is on a division close it
        if (beam && bar.divisions.find((division) => eq(beat, division, p24))
            // or head started after a new division
            // || getDivision(bar.divisions, , beat)
        ) {
            closeBeam(symbols, stave, part, beam);
            beam = undefined;
        }

        // Insert heads
        if (notes.length) {
            const pitches = getPitches(stave, key, notes);
            let nextBeat, heads;

            // Create ledgers and accidentals
            //createLedgers(symbols, bar, stave, beat, pitches);
            createAccidentals(symbols, stave, part, accidentals, beat, notes, pitches);

            if (tuplet) {
                nextBeat = beat + tuplet.duration / tuplet.divisor;
                heads = createTupletHeads(bar, stave, part, tuplet, beat, notes, pitches);

                // If beat has arrived at end of tuplet close tuplet
                if (gte(nextBeat, tuplet.beat + tuplet.duration, p24)) {
                    closeTuplet(stave, tuplet);
                    // Update next beat to the probably less error-prone
                    nextBeat = tuplet.beat + tuplet.duration;
                    tuplet = undefined;
                }
            }
            else {
                // Set next beat to rounded next event ... ????
                nextBeat = event ?
                    round(0.125, event[0] - bar.beat) :
                    bar.duration ;

                let duration = nextBeat - beat;
                let i = notes.length;
                while (i--) {
                    let stopBeat     = toStopBeat(bar.beat, notes[i]);
                    let stopDuration = max(ceilPowerOf2(stopBeat - beat), minDuration);

                    // TODO: This heuristic is WAAAAY random
                    // If stop duration is significantly shorter than next
                    // duration render a shorter duration
                    if (stopDuration - minDuration < 0.75 * (duration - minDuration)) {
                        nextBeat     = beat + stopDuration;
                        duration = stopDuration;
                    }
                }

                heads = createDupletHeads(bar, stave, part, headDurations, beat, nextBeat, notes, pitches);
            }

            // Push head symbols into symbols
            symbols.push.apply(symbols, heads);

            // Insert beams

            // If head is a quarter note or longer or a triplet quarter note
            if (gte(duration, 1, p24) || eq(duration, 0.6667, p24)) {
                // If there is a beam, close it
                if (beam) {
                    closeBeam(symbols, stave, part, beam);
                    beam = undefined;
                }
            }
            // Collect notes in beams array
            else {
                if (beam) push(beam, heads);
                else beam = { type: 'beam', beat, part, 0: heads };
            }

            // Insert ties

            let i = notes.length;
            while (i--) {
                let stopBeat = toStopBeat(bar.beat, notes[i]);
                // Remove notes that end before or near next beat
                // TODO! This has to match the rounding heuristic in the duration
                // shortening thing somehow
                if (lte(stopBeat, nextBeat, p24)) notes.splice(i, 1);
                // Add tie to remaining notes
                else createTie(symbols, stave, part, beat, nextBeat, notes[i], pitches[i]);
            }

            // Update beat
            beat = nextBeat;
            continue;
        }

        // Insert rests

        // If beam close it
        if (beam && beam[0]) {
            // Close the current beam
            closeBeam(symbols, bar.stave, beam, n);
            beam = undefined;
        }

        if (tuplet && gt(tuplet.beat, beat, p24)) {
            // Create rests up to tuplet
            createRests(symbols, restDurations, bar, stave, part, beat, tuplet.beat);
            beat = tuplet.beat;
            continue;
        }

        if (tuplet) {
            // Create tuplet rest
            const stopBeat = beat + tuplet.duration / tuplet.divisor;
            duration = tuplet.duration / tuplet.divisor;
            symbols.push({ type: 'rest', beat, duration, stave, part });
            beat += duration;
            // If beat has arrived at end of tuplet close tuplet
            if (gte(beat, tuplet.beat + tuplet.duration, p24)) {
                closeTuplet(stave, tuplet);
                tuplet = undefined;
                // Keep beat sane
                beat = round(0.125, beat);
            }
            continue;
        }

        if (event) {
            // Create rests up to next event
            const stopBeat = round(0.125, event[0] - bar.beat);
            createRests(symbols, restDurations, bar, stave, part, beat, stopBeat);
            beat = stopBeat;
            continue;
        }

        // Fill rest of bar with rests
        createRests(symbols, restDurations, bar, stave, part, beat, bar.duration);
        beat = bar.duration;
    }

    // If there's still a beam close it
    if (beam) {
        closeBeam(symbols, stave, part, beam);
        beam = undefined;
    }

    return symbols;
}
