
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
import push        from './object/push.js';
import every       from './object/every.js';
import last        from './object/last.js';
import lengthOf    from './object/length-of.js';
import map         from './object/map.js';
import getDuration from './event/to-duration.js';
import { rpitch }  from './pitch.js';
import config      from './config.js';

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


/* Events */

function getStopBeat(event) {
    return event[0] + getDuration(event);
}

function toMaxStopBeat(n, event) {
    return max(n, getStopBeat(event));
}


/* Pitches */

function getMinPitch(pitches) {
    const [name, letter, acc, octave] = rpitch.exec(pitches[0]);
    let o = octave;
    let l = toRootNumber(letter);
    let pitch = pitches[0];
    let n = 0;
    while (pitches[++n]) {
        const [name, letter, acc, octave] = rpitch.exec(pitches[n]);
        if (octave < o || toRootNumber(letter) < l) {
            l = toRootNumber(letter);
            o = octave;
            pitch = pitches[n];
        }
    }
    return pitch;
}

function getMaxPitch(pitches) {
    const [name, letter, acc, octave] = rpitch.exec(pitches[0]);
    let o = octave;
    let l = toRootNumber(letter);
    let pitch = pitches[0];
    let n = 0;
    while (pitches[++n]) {
        const [name, letter, acc, octave] = rpitch.exec(pitches[n]);
        if (octave > o || toRootNumber(letter) > l) {
            o = octave;
            l = toRootNumber(letter);
            pitch = pitches[n];
        }
    }
    return pitch;
}


/* Stems */

function stemFromPitches(stave, pitches) {
    const minPitch = getMinPitch(pitches);
    const maxPitch = getMaxPitch(pitches);
    const minDiff  = stave.getRowDiff(stave.midLinePitch, minPitch);
    const maxDiff  = stave.getRowDiff(stave.midLinePitch, maxPitch);
    return maxDiff + minDiff < -1;
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
        duration,
        stemup,
        range
    }));

    return symbols;
}


/* Tuplets */

function openTuplet() {

}

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

function createDupletHeads(bar, stave, part, durations, startBeat, stopBeat, events, pitches) {
    const symbols = [];
    const stemup  = stemFromPitches(stave, pitches);

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

function createTupletHeads(bar, stave, part, beat, duration, events, pitches) {
    const symbols = [];
    const stemup  = part.stemup === undefined ?
        stemFromPitches(stave, pitches) :
        part.stemup ;

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

function createTupletSymbols(symbols, bar, stave, key, accidentals, part, settings, beat, duration, divisor, notes, events, n) {
    const tuplet   = { type: 'tuplet', beat, duration, divisor, part, stave };
    const division = duration / divisor;
    const stopBeat = beat + duration;

    let event, beam;

    symbols.push(tuplet);

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
        const pitches = getPitches(stave, key, notes);

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
        else if (!beam) {
            beam = { type: 'beam', beat, part };
        }

        // Create ledgers and accidentals
        //createLedgers(symbols, bar, stave, beat, pitches);
        createAccidentals(symbols, stave, part, accidentals, beat, notes, pitches);
        const heads = createTupletHeads(bar, stave, part, beat, duration, notes, pitches);

        // Push head symbols into symbols, tuplet and beam
        symbols.push.apply(symbols, heads);
        push(tuplet, ...heads);
        if (beam) push(beam, ...heads);

        // Remove notes or insert ties
        let i = notes.length;
        while (i--) {
            let stopBeat = getStopBeat(notes[i]) - bar.beat;
            // Remove notes that end before or near next division, we're done with them
            if (lte(stopBeat, beat + duration + 0.5 * division, p24)) notes.splice(i, 1);
            // Add tie to remaining notes
            else createTie(symbols, stave, part, beat, beat + duration, notes[i], pitches[i]);
        }

        // Update beat
        beat += duration;
    }

    if (beam) closeBeam(symbols, stave, part, beam);

    closeTuplet(stave, part, tuplet);

    return n;
}

export function createPartSymbols(symbols, bar, stave, key = 0, accidentals = {}, part, events, settings = config) {
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
        const tuplet = detectTuplets(events, beat, bar.duration - beat);
        if (tuplet && tuplet.divisor !== 2) {
            // Create rests up to tuplet
            if (gt(tuplet.beat, beat, p24)) createRests(symbols, restDurations, bar, stave, part, beat, tuplet.beat);
            // Close beam TODO dont close beam
            if (beam) {
                closeBeam(symbols, stave, part, beam);
                beam = undefined;
            }
            // Render tuplet
            n = createTupletSymbols(symbols, bar, stave, key, accidentals, part, settings, tuplet.beat - bar.beat, tuplet.duration, tuplet.divisor, notes, events, n);
            // Update beat
            beat = tuplet.beat + tuplet.duration;
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
            createRests(symbols, restDurations, bar, stave, part, beat, stopBeat);
            beat = stopBeat;
            continue;
        }

        const pitches = getPitches(stave, key, notes);
        let nextBeat, heads;

        // Create ledgers and accidentals
        //createLedgers(symbols, bar, stave, beat, pitches);
        createAccidentals(symbols, stave, part, accidentals, beat, notes, pitches);

        // Set next beat to rounded next event ... ????
        nextBeat = event ?
            round(0.125, event[0] - bar.beat) :
            bar.duration ;

        duration = nextBeat - beat;
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
            if (beam) push(beam, ...heads);
            else beam = assign({ type: 'beam', beat, part }, heads);
        }

        // Insert ties

        i = notes.length;
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
    }

    // If there's still a beam close it
    if (beam) {
        closeBeam(symbols, stave, part, beam);
        beam = undefined;
    }

    return symbols;
}
