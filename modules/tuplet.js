
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

const data = {};

function scoreTupletAtBeat(duration, divisor, beat, events, n) {
    const tupletDuration = duration / divisor;

    let score = 0;
    let count = 0;
    // Rhythm is a binary representation of the rhythm where 1 means there are
    // events in the first division, 10 means there events in the second
    // division, 100 events in the third and 111 events in all three, etc.
    let rhythm = 0;
    let s, r;

    // Events before a quarter tuplet are considered the first of a tuplet group
    --n;
    while (events[++n] !== undefined && events[n][0] - beat < tupletDuration / 4) {
        // Score event start only, as we do not want to be influenced by duration
// NO, DONT SCORE BEAT 0
//        score += getScore(tupletDuration, events[n][0] - beat);
//        count += 1;
        // Plug hole because there's definitely a note in position 0
        rhythm = 1;
    }

    // Scan through events up to duration beat less a quarter tuplet
    --n;
    while (events[++n] !== undefined && events[n][0] - beat < duration - tupletDuration / 4) {
        // Rhythmic division number in binary is 2^division
        s = Math.round((events[n][0] - beat) / tupletDuration);
        r = 1 << s;
        // If we have not already filled this division
        if (r > rhythm) {
            // Reject large tuplet groups with holes
            if (divisor > 4 && r > rhythm << 1) return;
            // Add division to rhythm
            rhythm += r;
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
    if (divisor > 4 && s !== divisor - 1) return;
    if (!count) return;

    data.score  = score / count;
    data.rhythm = rhythm;

    return data;
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
    let divisor, data;
    while (divisor = divisors[--d]) {
        // Score tuplet by duration and divisor
        data = scoreTupletAtBeat(duration, divisor, beat, events, n);

        if (data && data.score >= score) {
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

    // Reset score. Use a module-scoped variable, safe because whole process
    // is synchronous
    score = 0;

    // Loop upward through power of 2 durations, short to long
    let d = 1/8;
    while ((d *= 2) && d <= duration) {
        detectTupletOverDuration(tuplet, d, events, n, beat, tupletDivisors, beat + duration);
    }

    return score > 0 && tuplet;
}
