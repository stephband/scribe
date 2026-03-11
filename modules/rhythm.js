
/**
detectRhythm(beat, duration, events, index = 0, options)
Rhythm detection via harmonic oscillators. Takes an options object of the form:

```
{
    minDivision: 1/12,   // Shortest division duration
    maxDivision: 4,      // Longest division duration
    stopBeatInfluence: 0 // Influence of event stop beats on detection algorithm
}
```

Returns an object of the form:

```
{
    beat       // Start beat of rhythmic analysis window
    duration   // Duration of rhythmic analysis window
    divisor    // Number of divisions over duration, one of 1, 2, 3, 5, 6, 7, 9, 11
    rhythm     // Rhythm bitmap identifier
    drift      // Phase offset in beats, whether the performance is pushing or dragging
    index      // Index of first event in rhythm
    count      // Number of events counted in rhythm
}
```
**/

import { floorPow2, ceilPow2 } from './number/power-of-2.js';

const DEBUG = true;//globalThis.DEBUG;

// Populated during detectRhythm() when DEBUG is true. Each entry is a
// snapshot of result at the moment a new best score was found.
export const analytics = [];

const { abs, atan2, ceil, cos, exp, floor, max, min, pow, sin, sqrt, PI } = Math;

const defaults = {
    minDivision: 1 / 12,
    maxDivision: 4,
    stopBeatInfluence: 0 //0.01
};

// Divisors to test
const divisors = [2, 3, 5, /*6,*/ 7, 9, 11];

// Favour slightly inexact triplets over exact duplets by an arbitrary factor
const TOLERANCE = 0.07;


function count1s(n) {
    let count = 0;
    while (n) { n &= n - 1; ++count; }
    return count;
}

export function hasHoles(divisor, rhythm) {
    return rhythm < pow(2, divisor) - 1;
}

export function hasConsecutiveHoles(divisor, rhythm) {
    const fullRhythm = (1 << divisor) - 1;
    const holes = fullRhythm ^ rhythm;
    return holes & (holes << 1);
}

export function rhythmicDensity(slots, rhythm) {
    return count1s(rhythm) / slots;
}

function gaussian(sigma, n) {
    return exp(-(n * n) / (2 * sigma * sigma));
}

function compare(beat, duration, divisor, rhythm, length, count, r, i, score, result) {
    // If no events return score
    if (!length) return score;

    switch (divisor) {
        case 1:
        case 2:
            break;
        case 3:
            // Don't permit the triplet rhythms 010 or 110, let them fall
            // through to the shorter duration 001 and 101
            if (rhythm === 2 || rhythm === 3) return score;
            break;
        default:
            // Reject higher order rhythms with consecutive holes
            if (hasConsecutiveHoles(divisor, rhythm)) return score;
    }

    const amplitude = sqrt(r * r + i * i); // Same as length, because we kick amplitude one for every event

    // Phase
    // Weight amplitude by phase alignment to prefer nearer-zero phases and
    // reject out-of-phase rhythms.
    const phase = atan2(i, r);
    const phaseWeight = (0.5 * r + 0.5 * amplitude) / length;

    // Division
    const division = duration / divisor;

    // Drift
    // Duration-normalised phase alignment in beats. Weight drift by gaussian
    // distribution around 0. A sigma of 1 means driftWeight will be ~0.6 when
    // drift is 1 beat out.
    const drift = division * phase / (2 * PI);
    const driftWeight = gaussian(0.125, drift);

    // Density
    // Problematic. A [0, 0.25] rhythm has a density of 1 while a [0.25, 0.5]
    // rhythm has a density of 0.5 due to the way the analysis window shifts (it
    // doesn't include the [0.5]). We're running with it anyway. Weight density
    // by inverse division power so that smaller divisions require higher
    // densities while large divisions remain largely unaffected.
    // THE CHOSEN POWER IS A BIT ARBITRARY, NEEDS SOME FURTHER INVESTIGATION
    const density = rhythmicDensity(divisor, rhythm);
    const densityWeight = pow(density, 0.122  / division); // Can't be higher than 0.125 or [0.375, 0.75] is misidentified as triplets
    //const densityWeight = pow((count1s(rhythm) + 1) / (divisor + 1), 0.125 / (duration / (divisor + 1)));
    //const densityWeight = pow(density, 0.24 / duration);    // Can't be higher than 0.24 or [0.375, 0.75] is misidentified as triplets

    // Score
    // r is ±, amplitude is +ve
    const s = driftWeight * densityWeight * phaseWeight;

    if (DEBUG) analytics.push({
        beat,
        duration,
        divisor,
        rhythm,
        density,
        densityWeight,
        length,
        count,
        phase,
        phaseWeight,
        amp: phaseWeight,
        drift,
        driftWeight,
        score: s,
        isNewBest: s > score
    });

    if (s <= score) return score;

    result.beat     = beat;
    result.duration = duration;
    result.divisor  = divisor;
    result.rhythm   = rhythm;
    result.drift    = drift;
    result.count    = count;

    return s;
}

function test(events, index, beat, duration, divisor, rhythm, count, score, result, stopBeatInfluence) {
    const division = duration / divisor;

    let r = 0;
    let i = 0;
    let n = index - 1;
    while (events[++n] !== undefined && events[n][0] < beat + duration) {
        // Each start beat gives this oscillator a kick. Accumulate complex
        // components, they constructively interfere when events align with
        // resonant frequency, destructively interfere when events are out of phase.
        const b1 = events[n][0] - beat;
        const p1 = 2 * PI * divisor * b1 / duration;
        r += cos(p1);
        i += sin(p1);

        // If event durations - stop beats - are to influence the scoring
        if (stopBeatInfluence) {
            const b2 = b1 + events[n][4];
            const p2 = 2 * PI * divisor * b2 / duration;
            r += stopBeatInfluence * cos(p2);
            i += stopBeatInfluence * sin(p2);
        }

        // Build rhythm bitmap, where each bit represents a division
        // bit 0 = first division
        // bit 1 = second division
        // and so on
        const slot = Math.round(b1 / division);
        if (slot < divisor) {
            rhythm |= (1 << slot);
            ++count;
        }
    }

    return compare(beat, duration, divisor, rhythm, n - index, count, r, i, score, result);
}

function run(minDivision, maxDivision, startBeat, maxDuration, rhythm, count, events, index, result, stopBeatInfluence = 0) {
    const startEvent = events[index];

    // Ensure initial duration is power-of-2
    let duration = floorPow2(maxDuration);
    let score = 0;
    while (duration > minDivision) {
        // Find minimum divisor
        let m = -1;
        while (divisors[++m] < duration / maxDivision);
        let o = m - 1;
        while (divisors[++o] < duration / minDivision);
        const maxDivisor = divisors[o - 1];

        // Set beat to first duration to span startEvent
        let beat = startBeat;
        while (!rhythm
            && beat + duration <= startEvent[0]
            && beat + duration < startBeat + maxDuration) beat += duration;

        // Test oscillators at frequencies  duration
        let g = m - 1;
        let divisor;
        while ((divisor = divisors[++g]) && divisor <= maxDivisor) {
            //if (DEBUG) console.group('duration', duration, 'beat', beat, 'divisor', divisors[g]);
            score = test(events, index, beat, duration, divisor, rhythm, count, score, result, stopBeatInfluence);
            //if (DEBUG) console.groupEnd();
        }

        // Advance by half duration
        beat += duration / 2;
        if (!rhythm
            && beat <= startEvent[0]
            && beat + duration <= startBeat + maxDuration) {
            // Test odd divisors only
            g = max(1, m - 1);
            while ((divisor = divisors[++g]) && divisor <= maxDivisor) {
                //if (DEBUG) console.group('duration', duration, 'beat', beat, 'divisor', divisors[g]);
                score = test(events, index, beat, duration, divisor, rhythm, count, score, result, stopBeatInfluence);
                //if (DEBUG) console.groupEnd();
            }
        }

        // Test durations in descending power-of-2 steps
        duration /= 2;
    }

    return result;
}

export default function detectRhythm(beat, duration, events, index = 0, options) {
    const minDivision       = options?.minDivision   || defaults.minDivision;
    const maxDivision       = options?.maxDivision   || defaults.maxDivision;
    const stopBeatInfluence = options?.stopBeatInfluence || defaults.stopBeatInfluence;

    // Duration must be at least minDivision
    if (duration < minDivision) {
        throw new Error(`detectRhythm() - duration (${ duration }) must be at least ${ minDivision }`);
    }

    // Find first event after index in analysis window
    let n = index - 1;
    while (events[++n] !== undefined && events[n][0] < beat);

    // If no event in window, quick out
    if (!events[n]) return;
    if (events[n][0] >= beat + duration) return;

    // If events were found before beat they are assumed to be hangovers from
    // the end of a previous analysis window that were not counted as rhythm,
    // they are now counted as rhythm in slot 0
    const count  = n - index;
    const rhythm = count ? 1 : 0 ;

    // The return object
    const result = {
        // Start beat of rhythmic analysis window
        beat,
        // Duration of rhythmic analysis window
        duration,
        // Number of divisions over duration
        divisor: 1,
        // Rhythm bitmap identifier
        rhythm,
        // Phase offset in beats, whether the performance is pushing or dragging
        drift: 0,
        // Index of first event in rhythm
        index,
        // Number of events counted in rhythm
        count
    };

    // Run the analysis
    if (DEBUG) analytics.length = 0;

    return run(minDivision, maxDivision, beat, duration, rhythm, count, events, n, result, stopBeatInfluence);
}


/**
straighten(data)
Straightens out swing rhythms - any `4` or `5` rhythms with divisor `3`.
**/
export function straighten(data) {
    if (data.divisor === 3) {
        switch (data.rhythm) {
            case 4:
                data.divisor = 2;
                data.rhythm  = 2;
                break;
            case 5:
                data.divisor = 2;
                data.rhythm  = 3;
                break;
        }
    }

    return data;
}
