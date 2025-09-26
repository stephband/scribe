
//import by       from 'fn/by.js';
import get      from 'fn/get.js';
import nothing  from 'fn/nothing.js';
import overload from 'fn/overload.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import Sequence from 'sequence/sequence.js';
import toKeys from './sequence/to-keys.js';
import eventsAtBeat from './sequence/events-at-beat.js';
import { keysAtBeats, keyFromBeatKeys } from './sequence/key-at-beat.js';
import { transposeChord } from './event/chord.js';
import { transposeScale } from './scale.js';
import Stave from './stave.js';
import { toKeyScale, toKeyNumber, cScale } from './keys.js';
import { mod12, byGreater } from './maths.js';
import quantise from './quantise.js';
import { rflat, rsharp, rdoubleflat, rdoublesharp } from './regexp.js';
import { getBarDivisions, getDivision, getLastDivision } from './bar.js';
import detectTuplets from './tuplet.js';
import { round, equal, gte, lte, lt, gt } from './number/float.js';
import push from './object/push.js';
import every from './object/every.js';
import config from './config.js';

const assign = Object.assign;
const { abs, ceil, floor, min, max } = Math;

const fathercharles = [
    // Father Charles Goes Down And Ends Battle,
    'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯',
    // Battle Ends And Down Goes Charles' Father
    'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'
];

/* When dealing with rounding errors we only really need beat grid-level
   precision, our display grid has 24 slots so slot beat ± 1/48 is plenty */
const precision = 1/48;

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


function byFatherCharlesPitch(a, b) {
    const ai = fathercharles.indexOf(a.pitch);
    const bi = fathercharles.indexOf(b.pitch);
    return ai > bi ? 1 : ai < bi ? -1 : 0;
}

function toDuration(event) {
    return event[1] === 'lyric' ?
        event[3] :
        event[4];
}


/* Beams */

function openBeam() {

}

function closeBeam(symbols, stave, beam, n) {
    const part = symbols[0].part;

    // Not enough stems for a beam, give it a tail
    if (beam.length === 1) {
        const i = beam[0];

        if (i >= n) throw new Error('Last beam index (' + beam[0] + ') cant be greater than n (' + n + ')');

        const head = symbols[i];

        // If head starts a tie insert the tie now, in front of the head
        if (head.tie === 'begin' || head.tie === 'middle') {
            symbols.splice(i, 0, assign({}, head, {
                type:   'tie',
                beat:   head.beat,
                updown: head.stemDirection === 'up' ? 'down' : 'up',
                event:  head.event
            }));

            // We inserted a symbol, advance n by 1
            return 1;
        }

        // We didn't do anything
        return 0;
    }

    // Render stems and beam
    const stemDirection = symbols[beam[0]] && symbols[beam[0]].stemDirection ?
        symbols[beam[0]].stemDirection :
        (beam
            .map((i) => stave.getRowDiff(stave.midLinePitch, symbols[i].pitch))
            .reduce((t, u) => t + u, 0) / beam.length) < 0 ?
            'up' :
            'down';

    const heads  = [];
    const buffer = [];

    // Loop backwards through beam splicing in stem symbols before
    // the heads, all with the winning stem direction
    let b = -1;
    let avgBeginLine = 0;
    let avgEndLine = 0;
    let i, head, line;
    while (beam[++b] !== undefined) {
        i = beam[b];
        head = symbols[i];
        line = stave.getRowDiff(stave.midLinePitch, head.pitch);

        head.stemDirection = stemDirection;
        head.tieDirection  = stemDirection === 'up' ? 'down' : 'up';

        heads.push(head);

        if (b < (beam.length - 1) / 2) {
            avgBeginLine += line / Math.floor(beam.length / 2);
        }

        else if (b > (beam.length - 1) / 2) {
            avgEndLine += line / Math.floor(beam.length / 2);
        }

        // TODO: group stems from notes of same part on same beat

        if (head.tie === 'begin') {
            buffer.push(assign({}, head, {
                type:   'tie',
                beat:   head.beat,
                updown: head.tieDirection,
                //updown: stemDirection === 'up' ? 'down' : 'up',
                event:  head.event
            }));
        }
    }

    // Calculate where to put beam exactly
    let begin    = heads[0];
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
    });

    // Update heads with info about the beam
    const headEvents = heads.map(get('event'));
    heads.forEach((head) => head.beam = headEvents);

    // Put the beam in front of the first head (??)
    symbols.splice(i, 0, {
        type:      'beam',
        beat:      begin.beat,
        pitch:     begin.pitch,
        part:      begin.part,
        duration:  end.beat - begin.beat,
        range:     range,
        direction: stemDirection,
        notes:     heads,
        events:    begin.beam
    });

    symbols.splice(i, 0, ...buffer);

    // We just spliced a bunch of symbols in before index n
    return 1 + buffer.length;
}


/* Tuplets */

function openTuplet() {

}

function closeTuplet(stave, tuplet) {
    const { beat, duration, divisor, symbols } = tuplet;

    // Decide on tuplet pitch, effectively vertical row position
    const centreBeat = beat + 0.5 * duration;

    // Encourage lowest pitch to be 1 octave below top line, ensuring
    // triplet (with appropriate styling) always sits above the top line
    const lowestPitchNumber = toNoteNumber(stave.maxLinePitch) - 12;

    let h = symbols.length;
    let symbol, centreNumber;

    // Scan backwards through symbols until last symbol before centre beat
    while ((symbol = symbols[--h]) && symbol.beat > centreBeat);
    ++h;

    // Scan backwards through symbols that cross centre beat, get highest pitch
    while ((symbol = symbols[--h]) && symbol.beat + symbol.duration > centreBeat) {
        const number = toNoteNumber(symbol.pitch);
        if (!centreNumber || number > centreNumber) centreNumber = number;
    }

    // Scan forwards from first symbol finding highest pitch beginning head
    let firstNumber = lowestPitchNumber;
    h = -1;
    while ((symbol = symbols[++h]) && symbol.beat < precision) {
        const number = toNoteNumber(symbol.pitch);
        if (!firstNumber || number > firstNumber) firstNumber = number;
    }

    // Scan backwards from last symbol finding highest pitch ending symbol
    let lastNumber = lowestPitchNumber;
    h = symbols.length;
    while ((symbol = symbols[--h]) && symbol.beat > beat + duration - (duration / divisor) - precision) {
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

function createRest(durations, divisions, endbeat, part, tobeat, beat) {
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
    let r = restDurations.length;
    // Employ precision to work around rounding errors
    while (restDurations[--r] + precision > duration);
    duration = restDurations[r + 1];

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
        part,
        duration
    };
}

function createRests(symbols, restDurations, bar, part, beat, tobeat) {
    // Insert rests frombeat - tobeat
    while (gt(tobeat, beat, precision)) {
        const rest = createRest(restDurations, bar.divisions, bar.duration, part, tobeat, beat);
        symbols.push(rest);
        beat += rest.duration;
    }

    return tobeat;
}


/* Stems */

function getStemDirection(centerPitch, head) {
    return head && head.stemDirection || (
        toNoteNumber(centerPitch) < toNoteNumber(head.pitch) ?
            'down' :
            'up');
}

function isStemDown(symbol) {
    return symbol.stemDirection === 'down';
}


/* Accidentals */

function createAccidental(symbols, part, accidentals, event, beat) {
    const name = typeof event[2] === 'string' ? event[2] : toNoteName(event.pitch);
    const acci =
        rsharp.test(name) ? 1 :
        rflat.test(name) ? -1 :
        undefined ;

    // Line name is note name + octave (no # or b)
    const line = name[0] + name.slice(-1);

    if (
        // If head is not a tied head from a previous bar - they
        // don't require accidentals,
        !lt(event[0], 0, precision)
        // and if it has changed from the bars current accidentals
        && acci !== accidentals[line]
    ) {
        // Alter current state of bar accidentals
        accidentals[line] = acci;
        symbols.push(assign({}/*, head*/, {
            type: 'acci',
            beat,
            value: acci || 0,
            part
        }));
    }
}

function createAccidentals(symbols, part, accidentals, cluster, beat) {
    let n = -1;
    while (cluster[++n]) createAccidental(symbols, part, accidentals, cluster[n], beat);
    return beat;
}


/* Ledger lines */

function toMinPitch(n, event) {
    const number = toNoteNumber(event[2]);
    return number < n ? number : n ;
}

function toMaxPitch(n, event) {
    const number = toNoteNumber(event[2]);
    return number > n ? number : n ;
}

function createLedgers(symbols, bar, stave, cluster, beat) {
    // TODO: Quantize this!!!!
    const midNumber = toNoteNumber(stave.midLinePitch);

    // Down ledger lines
    const minPitch = cluster.reduce(toMinPitch, midNumber);
    let rows = stave.getRowDiff(stave.maxLinePitch, toNoteName(minPitch)) - 1;
    if (rows < 0) symbols.push(assign({}, {
        type: 'downledger',
        beat,
        rows
    }));

    // Up ledger lines
    const maxPitch = cluster.reduce(toMaxPitch, midNumber);
    rows = stave.getRowDiff(stave.maxLinePitch, toNoteName(maxPitch)) - 1;
    if (rows > 0) symbols.push(assign({}, {
        type: 'upledger',
        beat,
        rows
    }));
}


/* Heads */

function createHeads(symbols, bar, part, durations, cluster) {
    symbols.push.apply(symbols, cluster.map((event) => ({
        type: 'head',
        beat: max(0, event[0] - bar.beat),
        part
    })));

    // TEMP
    const tobeat = cluster[0][0] + cluster[0][4] - bar.beat;
    return tobeat;



    // Create note head(s) for cluster
    const pitch = stave.getSpelling(key, event, 0);
    const props = stave.parts[part];



    //let beat  = startBeat;
    let division, tie;

    // If note does not start on a meter multiple and crosses a
    // bar division...
    if (startBeat !== 0
        && !equal(0, startBeat % bar.divisor)
        && (division = getDivision(bar.divisions, beat, stopBeat))
    ) {
        const duration = division - beat;

        // Stick it in symbols
        symbols.push(assign({
            type: 'note',
            beat,
            duration,
            dynamic: event[3],
            pitch,
            transpose,
            event,
            stave,
            tie: tie ? 'middle' : 'begin'
        }, part));

        // Update state of note
        beat += duration;
        tie = true;
    }

    // If rest of note does not stop on a meter multiple and crosses a
    // bar division...
    if (stopBeat < bar.duration
        && !equal(0, stopBeat % bar.divisor)
        && (division = getLastDivision(bar.divisions, beat, stopBeat))
    ) {
        const duration = division - beat;

        // Stick it in symbols
        symbols.push(assign({
            type: 'note',
            beat,
            duration,
            dynamic: event[3],
            pitch,
            transpose,
            event,
            stave,
            tie: tie ? 'middle' : 'begin'
        }, part));

        // Update state of note
        beat += duration;
        tie = true;
    }

    // Does note cross into next bar?
    const duration = stopBeat > bar.duration ?
        bar.duration - beat :
        stopBeat - beat ;

    const head = assign({
        type: 'note',
        beat,
        duration,
        dynamic: event[3],
        pitch,
        transpose,
        event,
        stave
    }, part);

    // Stick it in symbols
    symbols.push(head);
}




export function createBarSymbols() {
    // Add key signature, TODO! Must go in front of any time signature
    bar.symbols.push.apply(bar.symbols, keyscale
        .map((n, i) => (n - cScale[i] && {
            // No beat for key signature accidentals
            type: 'acci',
            pitch: toRootName(cScale[i]) + accidentals[n - cScale[i]],
            value: n - cScale[i]
        }))
        .filter((o) => !!o)
        .sort(byFatherCharlesPitch)
    )
}

export function createPartSymbols(bar, stave, key, accidentals, part, events) {
    const divisions = bar.divisions;
    const symbols   = [];
    const cluster   = [];

    let beat = 0;
    let n = -1;
    let tuplet;
    let beam;
    let event;

    while (event = events[++n]) {
        // Collect concurrent notes into cluster
        cluster.push(event);
        while (events[++n] && lte(events[n][0], max(event[0], bar.beat), precision)) cluster.push(events[n]);
        --n;

        // If beat has moved beyond tuplet close tuplet
        if (tuplet && gte(beat, tuplet.beat + tuplet.duration, precision)) {
            // TODO: decide on stem direction for all tuplet notes
            closeTuplet(stave, tuplet);
            // End tuplet state
            tuplet = undefined;
        }

        // If we are not currently in tuplet mode detect the next tuplet
        if (!tuplet) {
            const duration = bar.duration - beat;
            const data = detectTuplets(events, beat, duration);

            if (data && data.divisor !== 2) {
                // Create tuplet symbol
                tuplet = assign({ type: 'tuplet', part }, data, { beat: data.beat - bar.beat });
                // Push rests up to tuplet start
                beat = createRests(symbols, restDurations, bar, part, beat, data.beat - bar.beat);
                // Push tuplet
                symbols.push(tuplet);
            }
        }

        if (tuplet) {
            beat = createRests(symbols, [tuplet.duration / tuplet.divisor], bar, part, beat, max(0, event[0] - bar.beat));
            // push(tuplet, rest);
            createAccidentals(symbols, part, accidentals, cluster, beat);
            createLedgers(symbols, bar, stave, cluster, beat);
            beat = createHeads(symbols, bar, part, [tuplet.duration / tuplet.divisor], cluster);

            // OLD
            // Quantise head duration to multiple of tuplet duration
            //head.duration = round(tuplet.duration / tuplet.divisor, head.duration);
        }
        else {
            beat = createRests(symbols, restDurations, bar, part, beat, max(0, event[0] - bar.beat));
            createAccidentals(symbols, part, accidentals, cluster, beat);
            createLedgers(symbols, bar, stave, cluster, beat);
            beat = createHeads(symbols, bar, part, headDurations, cluster);

            // OLD
            //head.beat = round(1/24, head.beat);
            // Quantize head duration, round to remove rounding errors, ironically
            //head.duration = round(1/8, quantise(headDurations, 1, head.duration));
        }

        cluster.length = 0;


        // Beam
        if (beam && beam.length) {
            // If head is a quarter note or longer
            if (head.duration >= 1
                // or head is a triplet quarter note
                || head.duration.toFixed(2) === '0.67'
                // or head starts at a division
                || bar.divisions.includes(head.beat)
                // or head starts after a new division
                || getDivision(bar.divisions, symbols[beam[beam.length - 1]].beat, head.beat)
            ) {
                // Close the current beam
                n += closeBeam(symbols, bar.stave, beam, n);
                beam = undefined;
            }
        }


        continue;


        // Stem and tieheads. We must wait for stems to be decided before rendering
        // tieheads as their up/down direction is dependent.
        if (head.duration < 4) {
            // Is this head less than 1 beat, and not 1 triplet beat, long?
            // Wait for it to be beamed.
            if (head.duration < 1 && head.duration.toFixed(2) !== '0.67') {
                if (beam) {
                    // Keep index of head
                    beam.push(n);
                }
                else {
                    // Create new beam
                    beam = [n];
                }
            }
            else {
                if (head.tie === 'begin' || head.tie === 'middle') {
                    let stemDirection = getStemDirection(stave.centerPitch, head);
                    symbols.splice(n++, 0, assign({}, head, {
                        type:   'tie',
                        beat:   head.beat,
                        updown: stemDirection === 'up' ? 'down' : 'up',
                        event:  head.event
                    }));
                }
            }
        }
        else {
            if (head.tie === 'begin' || head.tie === 'middle') {
                let stemDirection = getStemDirection(stave.centerPitch, head);
                symbols.splice(n++, 0, assign({}, head, {
                    type:   'tie',
                    beat:   head.beat,
                    updown: stemDirection === 'up' ? 'down' : 'up',
                    event:  head.event
                }));
            }
        }
    }











    // Close the current beam
    if (beam && beam.length) {
        n += closeBeam(symbols, bar.stave, beam, n);
        beam = undefined;
    }

    // Beat is not yet at the end of the bar, insert rests
    while (lt(beat, bar.duration, precision)) {
        // If beat has moved beyond tuplet close tuplet
        if (tuplet && gte(beat, tuplet.beat + tuplet.duration, precision)) {
            // TODO: decide on stem direction for all tuplet notes
            closeTuplet(stave, tuplet);
            // End tuplet state
            tuplet = undefined;
        }

        if (tuplet) {
            beat = createRests(symbols, [tuplet.duration / tuplet.divisor], bar, part, beat, tuplet.beat + tuplet.duration);
            // push(tuplet, rest);
        }
        else {
            beat = createRests(symbols, restDurations, bar, part, beat, bar.duration);
        }
    }

    return symbols;
}
