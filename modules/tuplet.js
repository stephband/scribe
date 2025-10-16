
import getStopBeat from './event/to-stop-beat.js';
import { gt, lte } from './number/float.js';


const assign = Object.assign;

// Rounding precision
const p24 = 1/24;

// Tuplet divisors detected by the algorithm.
const tupletDivisors = [2, 3, 4, 5, 6, 7, 9];

// Tuplets producing notes shorter than this duration are ignored.
const minTupletDuration = 1/12;

// Tolerance is the minimum score a rhythm must make before being counted as a
// tuplet. Where all events fall exactly on tuplet divisions a rhythm scores 1.
// Where all events fall exactly between tuplet divisions a rhythm scores -1.
// Between these two limits is a range. Rhythms below tolerance are rejected.
const tolerance = 0.25;

// The importance of stop beats as compared to start beats.
const stopInfluence = 0.2;


const data = {};
let score = 0;


function getScore(wavelength, beat) {
    return Math.cos(2 * Math.PI * beat / wavelength);
}

function scoreTupletAtBeat(duration, divisor, beat, events, n) {
    const tupletDuration = duration / divisor;

    let score = 0;
    let count = 0;
    // Rhythm is a binary representation of the rhythm where 1 means there are
    // events in the first division, 10 means there events in the second
    // division, 100 events in the third and 111 events in all three, etc.
    let rhythm = 0;
    let s, r;

    // Did previous event cross into - tie into - tuplet? Mark rhythm as
    // occupying division 0. This check MUST match the stop beat test in part.js
    // that rejects notes from being rendered on the following render iteration
    if (events[n - 1] && gt(getStopBeat(events[n - 1]), beat + 0.5 * tupletDuration, p24)) {
        rhythm = 1;
    }

    // Events before a quarter tuplet are considered the first of a tuplet group
    --n;
    while (events[++n] !== undefined && events[n][0] - beat < tupletDuration / 4) {
        // There's definitely a note in position 0. We're not going to score it,
        // as division 0 does not in itself make a tuplet. But we do want to
        // mark it as a populated division.
        rhythm = 1;
    }

    // Scan through events up to duration beat less a quarter tuplet
    --n;
    while (events[++n] !== undefined && events[n][0] - beat < duration - tupletDuration / 4) {
        // Rhythmic division number in binary is 2^division
        s = Math.round((events[n][0] - beat) / tupletDuration);
        r = 1 << s;
        // If we have not already filled this division
        if (s < divisor && r > rhythm) {
            // Reject large tuplet groups with holes
            if (divisor > 4 && r > rhythm << 1) return;
            // Add division to rhythm
//console.log(beat, duration, divisor, events[n][0] - beat, 'Add r', s, r);
            rhythm += r;
        }

        // Score event start
        score += getScore(tupletDuration, events[n][0] - beat);
        count += 1;

        // Ignore event stops beyond duration, events may be longer than tuplet
        if (events[n][0] + events[n][4] - beat > duration) continue;

        // Score event stop
        score += stopInfluence * getScore(tupletDuration, events[n][0] + events[n][4] - beat);
        count += stopInfluence;
    }

    // Detect holes
    if (divisor > 4 && s !== divisor - 1) return;
    if (!count) return;
//console.log(beat, duration, divisor, score, score / (count + 1));
    // Favour higher counts by adding 1 to count
    // TODO: Keep this weird number under review!
    data.score  = score / (count + 1);
    data.rhythm = rhythm;

    return data;
}

function detectTupletOverDuration(tuplet, duration, events, n, startbeat, divisors, stopBeat) {
    // n is the index of the first event we are interested in, but there may be an
    // event that started before startbeat and is still playing, in which case...
    const beat = events[n - 1] && getStopBeat(events[n - 1]) > startbeat + 0.125 ?
        // Analyse from startbeat on
        startbeat :
        // Analyse from the floored multiple of duration up to this event's beat
        duration * Math.floor((events[n][0] - startbeat) / duration) + startbeat ;

    // Find greatest divisor producing tuplets longer than minTupletDuration
    let d = divisors.length;
    while (duration / divisors[--d] < minTupletDuration);
    ++d;

    // Loop through lower divisors, keep that with the highest score
    let divisor, data;
    while (divisor = divisors[--d]) {
        // Score tuplet by duration and divisor
        data = scoreTupletAtBeat(duration, divisor, beat, events, n);

        if (data && data.score >= score && data.score) {
            score = data.score;
            tuplet.beat     = beat;
            tuplet.duration = duration;
            tuplet.divisor  = divisor;
            tuplet.rhythm   = data.rhythm;
        }

        // If first head occurs at or after half a duration of beat
        if (events[n][0] >= beat + 0.5 * duration && beat + 1.5 * duration < stopBeat) {
            // Score tuplet offset by half a duration
            data = scoreTupletAtBeat(duration, divisor, beat + 0.5 * duration, events, n);

            if (data && data.score >= score) {
                score = data.score;
                tuplet.beat     = beat + 0.5 * duration;
                tuplet.duration = duration;
                tuplet.divisor  = divisor;
                tuplet.rhythm   = data.rhythm;
            }
        }
    }

    return tuplet;
}


/**
detectTuplet(events, beat, duration)
Detects tuplet and duplet rhythms. Returns a data object with the properties:

```js
{
    beat:     // Start beat of tuplet
    duration: // Duration of tuplet
    divisor:  // Number of divisions in tuplet
    rhythm:   // A binary number describing rhythmic divisions
}
```
**/

export default function detectTuplet(events, beat, duration) {
    let n = -1;

    // Ignore events up to start `beat`. Beat must be a power of 2 or multiple
    // of here, so this should not be subject to floating point rounding errors
    while (events[++n] !== undefined && events[n][0] < beat);

    // If we have found no event, quick out
    if (!events[n]) return;

    const tuplet = {};

    // Reset score. Use a module-scoped variable, safe only because whole
    // process is synchronous
    score = tolerance;

    // Loop upward through power of 2 durations, short to long
    let d = 1/8;
    while ((d *= 2) && d <= duration) {
        detectTupletOverDuration(tuplet, d, events, n, beat, tupletDivisors, beat + duration);
    }

    return score > tolerance && tuplet;
}
