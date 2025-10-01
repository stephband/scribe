
/* An imperfect tuplet detector based on rating note start and stops against
   a cosine of various beatlengths. */

import { floorPowerOf2 } from './number/power-of-2.js';


const assign   = Object.assign;
const tupletDivisors = [2, 3, 4, 5, 6, 7, 9];
const minTupletDuration = 1/12;

// The importance of stop beats as compared to start beats
const stopFactor = 0.4;

let score = 0;


function getScore(wavelength, beat) {
    return 0.5 * (1 + Math.cos(2 * Math.PI * beat / wavelength));
}

function scoreTupletAtBeat(duration, divisor, beat, events, n) {
    const tupletDuration = duration / divisor;

    let score = 0;
    let count = 0;
    let a, b = 0;

    // Events before a quarter tuplet are considered the first of a tuplet group
    --n;
    while (events[++n] !== undefined && events[n][0] - beat < tupletDuration / 4) {
        // Score event start only, as we do not want to be influenced by duration
// NO, DONT SCORE BEAT 0
//        score += getScore(tupletDuration, events[n][0] - beat);
//        count += 1;
        // One less hole than divisor because there's definitely a note in position 0
        b = 1;
    }

    // Scan through events up to duration beat less a quarter tuplet
    --n;
    while (events[++n] !== undefined && events[n][0] - beat < duration - tupletDuration / 4) {
        // Detect and reject large tuplet groups with holes. Admittedly a
        // little arbitrary.
        if (divisor > 4) {
            a = Math.round((events[n][0] - beat) / tupletDuration);
            // Has a more than incremented by 1 over b? We have a hole
            if (a > b + 1) return -1;
            b = a;
        }

        // Score event start
        score += getScore(tupletDuration, events[n][0] - beat);
        count += 1;

        // Ignore event stops beyond duration, events may be longer than tuplet
        if (events[n][0] + events[n][4] - beat > duration) continue;

        // Score event stop
        score += stopFactor * getScore(tupletDuration, events[n][0] + events[n][4] - beat);
        count += stopFactor;
    }

    // Detect holes
    if (divisor > 4 && a !== divisor - 1) return -1;

    return count ? score / count : 0 ;
}

function detectTupletOverDuration(tuplet, duration, events, n, startbeat, divisors, stopBeat) {
    // n is the index of the first event we are interested in. Set beat from
    // the floored multiple of duration up to this event's beat
    const beat = duration * Math.floor((events[n][0] - startbeat) / duration) + startbeat;

    // Find greatest divisor producing tuplets longer than minTupletDuration
    let d = divisors.length;
    while (duration / divisors[--d] < minTupletDuration);
    ++d;

    // Loop through lower divisors, keep that with the highest score
    let divisor, s;
    while (divisor = divisors[--d]) {
        // Score tuplet by duration and divisor
        s = scoreTupletAtBeat(duration, divisor, beat, events, n);
//console.log(duration, divisor, beat, s);
        if (s >= score) {
//console.log('YEAH');
            score = s;
            tuplet.beat     = beat;
            tuplet.duration = duration;
            tuplet.divisor  = divisor;
        }

        // If first head occurs at or after half a duration of beat
        if (events[n][0] >= beat + 0.5 * duration && beat + 1.5 * duration < stopBeat) {
            // Score tuplet offset by half a duration
            s = scoreTupletAtBeat(duration, divisor, beat + 0.5 * duration, events, n);

            if (s >= score) {
                score = s;
                tuplet.beat     = beat + 0.5 * duration;
                tuplet.duration = duration;
                tuplet.divisor  = divisor;
            }
        }
    }

    return tuplet;
}

export default function detectTuplet(events, beat, duration) {
    let n = -1;

    // Ignore events up to start `beat`. Beat must be a power of 2 or multiple
    // of here, so this should not be subject to floating point rounding errors
    while (events[++n] !== undefined && events[n][0] < beat);

    // If we have found no event, quick out
    if (!events[n]) return;

    const tuplet = {};

    // Reset score. Use a module-scoped variable, process is synchronous
    score = 0;

    // Loop upward through power of 2 durations, short to long
    let d = 1/8;
    while ((d *= 2) && d <= duration) {
        detectTupletOverDuration(tuplet, d, events, n, beat, tupletDivisors, beat + duration);
    }

    return score > 0 && tuplet;
}
