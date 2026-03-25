
import by              from 'fn/by.js';
import get             from 'fn/get.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import { keyToRootNumber } from 'sequence/modules/event/keys.js';
import { keyWeightsForEvent, chooseKeyFromWeights } from '../keys.js';
import { rflat, rsharp, rdoubleflat, rdoublesharp } from '../pitch.js';
import { detectTuplet, rhythmHasHoles } from '../tuplet.js';
import { round as roundTo, eq, gte, lte, lt, gt } from '../number/float.js';
import { floorPow2, ceilPow2, isPowerOf2 } from '../number/power-of-2.js';
import grainPow2       from '../number/grain-pow-2.js';
import push            from '../object/push.js';
import last            from '../object/last.js';
import lengthOf        from '../object/length-of.js';
import map             from '../object/map.js';
import getDuration     from '../event/to-duration.js';
import getStopBeat     from '../event/to-stop-beat.js';
import config          from '../config.js';
import { createAccents }         from '../symbol/accent.js';
import { createAccidentals }     from '../symbol/accidental.js';
import { createBeam, closeBeam } from '../symbol/beam.js';
import { createLedges }          from '../symbol/ledge.js';
import { createNotes }           from '../symbol/note.js';
import { stemupFromRows, stemupFromPitches, stemupFromSymbols } from '../symbol/stem.js';
import { closeTuplet }           from '../symbol/tuplet.js';


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


/**
getDivision(divisions, b1, b2)
Gets first bar division from `divisions` where `b1` is before and `b2` after or
on it.
**/

function getDivision(divisions, b1, b2) {
    let n = -1;
    while (divisions[++n] && divisions[n] <= b1);
    // If divisions[n] is undefined, comparison evaluates to false, which is
    // what we want
    return b2 > divisions[n] ?
        divisions[n] :
        undefined ;
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


/* Symbols */

function isAtNextBeatDivisionDuplet(division, beat, stopBeat, duration, notes, n) {
        // Note stops before next beat
    return lte(beat + duration, stopBeat, p16)
        // Note stops within 0.125 + 1/16 of its own true duration of next beat
        || stopBeat - (beat + duration) < 0.125 + (1/16) * (getStopBeat(notes[n]) - notes[n][0]);
}

function isAtNextBeatDivisionTuplet(division, beat, stopBeat, duration, notes, n) {
    return lte(beat + duration + 0.5 * division, stopBeat, p24)
}

function createSymbols(symbols, bar, stave, key, accidentals, part, notes, beam, tuplet, beat, stopBeat, duration, division, settings, fn) {
    // Manage beam
    if (gt(0.5, duration, p24)) {
        // If there is a beam, close it
        if (beam) {
            closeBeam(symbols, stave, part, beam);
            beam = undefined;
        }
    }
    else if (!beam) {
        beam = createBeam(part, beat);
    }

    // Insert heads
    const noteSymbols = createNotes(stave, key, part, notes);

    if (noteSymbols.length) {
        // Create ledgers, accidentals and accents
        createLedges(symbols, stave, part, beat, noteSymbols);
        createAccidentals(symbols, bar, part, accidentals, beat, noteSymbols);
        createAccents(symbols, stave, part, beat, noteSymbols, settings);

        // Push note symbols on to tuplet
        if (tuplet) push(tuplet, ...noteSymbols);

        // Assign beat, duration to note symbols and push into symbols
        let n = -1;
        while (noteSymbols[++n]) symbols.push(assign(noteSymbols[n], {
            beat,
            duration
        }));

        // Push note symbols on to beam
        if (beam) push(beam, ...noteSymbols);
    }

    // Keep only the last tied notes in bar.ties
    bar.ties.length = 0;

    // Remove notes or insert ties
    let n = notes.length;
    while (n--) {
        let stopBeat = getStopBeat(notes[n]) - bar.beat;
        // Remove notes that end before or near next division, we're done with them
        if (fn(division, beat, stopBeat, duration, notes, n)) notes.splice(n, 1);
        // Add tie to remaining notes
        else {
            symbols.push({
                type:   'tie',
                beat,
                pitch: noteSymbols[n].pitch,
                duration,
                stemup: noteSymbols[n].stemup,
                part,
                event: notes[n]
            });

            // Keep tied events in ties
            bar.ties.push(noteSymbols[n].event);
        }
    }

    // Update beat
    return { beat: beat + duration, beam };
}

function createTuplet(symbols, bar, stave, key, accidentals, part, beam, settings, beat, duration, divisor, rhythm, notes, events, n) {
    const BEAT = beat;

    // Close beam if there any holes in rhythm
    if (beam && rhythmHasHoles(divisor, rhythm)) {
        closeBeam(symbols, stave, part, beam);
        beam = undefined;
    }

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
    /*if (!isPowerOf2(divisor))*/ symbols.push(tuplet);

    // While beat is before end of tuplet
    while (lt(stopBeat, beat, p24)) {
        // Fill notes with events playing during beat, and leave event as the
        // next event after beat
        while ((event = events[++n]) && lte(beat + 0.5 * division, event[0] - bar.beat, p24)) {
            notes.push(event);
        }
        --n;

        // Sort notes by pitch order, descending (ascending row order)
        if (stave.pitched) notes.sort(byPitch);

        // Insert rest
        if (!notes.length) {
            symbols.push({ type: 'rest', beat, duration: division, stave, part });
            beat += division;
            continue;
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

        const beatbeam = createSymbols(symbols, bar, stave, key, accidentals, part, notes, beam, tuplet, beat, stopBeat, duration, division, settings, isAtNextBeatDivisionTuplet);
        beat = beatbeam.beat;
        beam = beatbeam.beam;
    }

    if (beam) closeBeam(symbols, stave, part, beam);

    closeTuplet(stave, part, tuplet);

    return {
        beat: BEAT + duration,
        n
    };
}

function createDuplet(symbols, bar, stave, key, accidentals, part, beam, settings, beat, notes, events, n) {
    const { headDurations, restDurations } = settings;

    let event;

    // Fill notes with events playing during beat, and leave event as the
    // next event after beat
    while ((event = events[++n]) && lte(beat, event[0] - bar.beat, p16)) notes.push(event);
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
            createRests(symbols, restDurations, bar, stave, part, beat, bar.duration);
            return { beat: bar.duration, n };
        }

        // Create rests up to next event
        const stopBeat = roundTo(0.125, event[0] - bar.beat);

if (stopBeat <= beat) {
    console.log(`Problem at bar ${ bar.count }, moving to next bar ${ beat } ${ stopBeat }`);
    bar.error = 'Stop beat has ended up less than beat';
    return { beat: bar.duration, n };
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
        return { beat: stopBeat, beam, n }
    }

    // Original start beat of notes, may be well before beat
    const startBeat = notes[0][0] - bar.beat;
    // Max stop beat of notes
    const stopBeat  = min(bar.duration, notes.reduce(toMaxStopBeat, 0) - bar.beat);
    // Start beat of next event, if it exists
    const eventBeat = event && roundTo(0.125, event[0]) - bar.beat;
    // Duration of next head
    const duration  = fitDuration(headDurations, bar, startBeat, stopBeat, beat, eventBeat);

    const beatbeam = createSymbols(symbols, bar, stave, key, accidentals, part, notes, beam, undefined, beat, stopBeat, duration, undefined, settings, isAtNextBeatDivisionDuplet);
    beat = beatbeam.beat;
    beam = beatbeam.beam;
    beatbeam.n = n;
    return beatbeam;
}

export default function createPart(bar, accidentals, part, events, settings = config) {
    const key     = bar.key;
    const symbols = bar.symbols;
    const notes   = [];
    const stave   = this;
    const { restDurations } = settings;

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
            if (gt(beat, data.beat - bar.beat, p16)) createRests(symbols, restDurations, bar, stave, part, beat, data.beat - bar.beat);
            // Render tuplet
            const beatbeam = createTuplet(symbols, bar, stave, key, accidentals, part, beam, settings, data.beat - bar.beat, data.duration, data.divisor, data.rhythm, notes, events, n);
            // Update beat
            beat = beatbeam.beat;
            beam = beatbeam.beam;
            n    = beatbeam.n;
        }
        else {
            // Render duplets
            const beatbeam = createDuplet(symbols, bar, stave, key, accidentals, part, beam, settings, beat, notes, events, n);
            // Update beat
            beat = beatbeam.beat;
            beam = beatbeam.beam;
            n    = beatbeam.n;
        }
    }

    // If there's still a beam close it
    if (beam) closeBeam(symbols, stave, part, beam);
    return symbols;
}
