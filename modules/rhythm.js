
/**
rhythm.js
Elastic Phase-Locked Metrical Quantizer (EPL-MQ)

Rhythm detection using complex harmonic oscillators combined with a
critically-damped Phase-Locked Loop (PLL) to track expressive performer drift
while maintaining an elastic restoring force back to the absolute beat pulse.

All timing offsets, drift parameters, and spring constants are measured in *beats*.
**/

import { floorPow2 } from './number/power-of-2.js';


const DEBUG = globalThis.DEBUG;
const { cos, sin, round, abs, pow, atan2 } = Math;
const TAU = 2 * Math.PI;
// Default elastic band parameters (all in units of beats)
const MIN_DIVISION = 1 / 12;
const PRIMES       = [2, 3, 5, 7, 9];
const alpha        = 0.25;  // PLL tracking elasticity (pull toward performer's local phase)
const lambda       = 0.15;  // Spring restoring force back toward the absolute beat (0)


function count1s(n) {
    let count = 0;
    while (n) { n &= n - 1; ++count; }
    return count;
}

/**
test(beat, duration, divisor, events, index, rhythmIndex, rhythmCount, drift)
Evaluates a candidate tuplet divisor over [beat, beat + duration) relative to the
elastic reference frame shifted by `drift` (in beats).
**/
function test(beat, duration, divisor, events, index, rhythmIndex, rhythmCount, drift = 0) {
    let rSum = 0;
    let iSum = 0;
    let beatError = 0;
    let rhythm = rhythmCount > 0 ? 1 : 0;

    if (DEBUG && rhythmIndex > index) throw new Error('rhythmIndex should never be > index');

    // Run the analysis against the elastic reference frame (t - drift)
    let n = index - 1;
    while (events[++n] !== undefined && events[n][0] < beat + duration) {
        const time = events[n][0];
        const b = time - beat - drift;
        const x = b * divisor / duration;

        // Build rhythm bitmap
        const slot = round(x);
        const gridBeat = slot * duration / divisor;
        beatError += abs(b - gridBeat);

        // Accumulate complex phasor components
        rSum += cos(x * TAU);
        iSum += sin(x * TAU);

        if (slot < divisor) {
            rhythm |= (1 << slot);
            rhythmCount += 1;
        }
    }

    const count = n - index;

    // If no events in this window, relax the elastic band toward 0
    if (count === 0) {
        return {
            beat,
            duration,
            divisor,
            index,
            count: 0,
            rhythm,
            rhythmIndex,
            rhythmCount,
            score: 0,
            beatError: 0,
            drift,
            driftOut: (1 - lambda) * drift
        };
    }

    // Complex Phasor Analysis:
    // Amplitude |Z| measures rhythm coherence independently of phase offset.
    // Phase angle phi measures the performer's local drift.
//    const amplitude = sqrt(rSum * rSum + iSum * iSum);
    const phaseAngle = atan2(iSum, rSum);
    const division = duration / divisor;
    const phaseDriftBeats = (division * phaseAngle) / TAU;
//    const driftWeight = gaussian(sigma, phaseDriftBeats);

    // Score combines phase alignment (rSum) with coherence (amplitude) weighted by drift
    let score = rSum;

    // Critically damped spring update for the elastic reference frame:
    // drift_next = (1 - lambda) * drift + alpha * phaseDriftBeats
    const driftOut = (1 - lambda) * drift + alpha * phaseDriftBeats;

    // Downgrade 1_1_0 and 0_1_0 triplets to prefer 101 and 001 triplets
    if (duration > 1/4 && divisor === 3 && (rhythm === 2 || rhythm === 3)) score = 0;

    // Downgrade anything with more than 2 holes
    if (count1s(rhythm) < divisor - 2) score = 0;

    return {
        beat,
        duration,
        divisor,
        index,
        count,
        rhythm,
        rhythmIndex,
        rhythmCount,
        score,
        beatError,
        drift,
        driftOut
    };
}

/**
detectRhythmPrime(beat, duration, events, index, rhythmIndex, drift)
Tests candidate prime divisors descending from 9 down to 2, selecting the best fit.
**/
function detectRhythmPrime(primes, minDivision, beat, duration, events, index, rhythmIndex, drift = 0) {
    if (DEBUG && rhythmIndex > index) throw new Error('rhythmIndex should never be > index');

    const rhythmCount = index - rhythmIndex;
    let result = rhythmCount ? {
        beat,
        duration,
        divisor: 1,
        index,
        count: 0,
        rhythm: rhythmCount === 0 ? 0 : 1,
        rhythmIndex,
        rhythmCount,
        score: 0,
        beatError: Infinity,
        drift,
        driftOut: (1 - lambda) * drift
    } : undefined;

    let score = 0;
    let minError = Infinity;

    // Find highest prime that allows division greater than minDivision
    let p = primes.length;
    while (duration / primes[--p] < minDivision);
    ++p;

    // Descend through remaining primes, keep highest scoring rhythm
    while (primes[--p]) {
        const data = test(beat, duration, primes[p], events, index, rhythmIndex, rhythmCount, drift);
        const fit = data.count ? data.score / data.count : 0;
        const err = data.count ? data.beatError / data.count : Infinity;

        // Choose higher score, break ties with smaller beat error,
        // and on equal error prefer simpler prime (descending prime order)
        if (fit > score + 1e-9 || (abs(fit - score) <= 1e-9 && err <= minError + 1e-9)) {
            score = fit;
            minError = err;
            result = data;
        }
    }

    return result;
}

/**
detectBestFit(primes, minDivision, minDuration, beat, duration, events, index, rhythmIndex, rhythms, drift)
Recursive metrical tree search comparing single tuplet candidate `a` against
bifurcated sub-windows with continuous duration-scaled span penalty and
elastic phase propagation.
**/
function detectBestFit(primes, minDivision, minDuration, beat, duration, events, index, rhythmIndex = index, rhythms = [], drift = 0) {
    let i = index;
    let r = rhythmIndex;
    let dState = drift;

    const d = floorPow2(duration);
    const a = detectRhythmPrime(primes, minDivision, beat, d, events, i, r, dState);
    // Event count coverage bonus: pow(count, 0.1)
    const afit = a && a.count ? (a.score / a.count) * pow(a.count, 0.1) : 0;

    // Count is 0 if no new events have been read
    if (a && a.count === 0) {
        if (a.rhythm) {
            rhythms.push(a);
            if (index !== a.rhythmIndex + a.rhythmCount) throw new Error('rhythmIndex should have caught up with index');
            r = a.rhythmIndex + a.rhythmCount;
            dState = a.driftOut;
        }
    }
    // Smallest testable duration reached
    else if (duration <= minDuration * 2) {
        if (a) {
            rhythms.push(a);
            i = a.index + a.count;
            r = a.rhythmIndex + a.rhythmCount;
            dState = a.driftOut;
        }
    }
    // A perfect fit cannot be beaten: fast accept
    else if (a && a.count && a.score === a.count && (a.count > 1 || d <= 1)) {
        rhythms.push(a);
        i = a.index + a.count;
        r = a.rhythmIndex + a.rhythmCount;
        dState = a.driftOut;
    }
    // Bifurcation: compare candidate `a` against two half-duration windows
    else {
        const array = [];
        let last;

        // Window 1: [beat, beat + d/2)
        dState = detectBestFit(primes, minDivision, minDuration, beat, d / 2, events, i, r, array, dState);
        last = array[array.length - 1];
        if (last) {
            i = last.index + last.count;
            r = last.rhythmIndex + last.rhythmCount;
        }

        // Window 2: [beat + d/2, beat + d) receives evolved phase state dState
        dState = detectBestFit(primes, minDivision, minDuration, beat + d / 2, d / 2, events, i, r, array, dState);
        last = array[array.length - 1];
        if (last) {
            i = last.index + last.count;
            r = last.rhythmIndex + last.rhythmCount;
        }

        // Fit by overall average score of all events, weighted by count coverage
        const count = i - index;
        let bfit = 0;
        if (count) {
            let sum = 0;
            for (let k = 0; k < array.length; ++k) {
                sum += array[k].score * pow(array[k].count, 0.1);
            }
            bfit = sum / count;
        }

        // Progressive span penalty:
        // Exponent decays smoothly as 1 / d^2 so small-scale swing (d <= 1) is protected,
        // while multi-beat measures (d >= 2) naturally allow trailing rests without penalty.
        if (a && a.count && bfit && count > 1) {
            const eventSpan = events[i - 1][0] - events[index][0];
            if (eventSpan > d / 2) {
                let span = 0;
                for (let k = 0; k < array.length; ++k) {
                    span += array[k].duration;
                }
                if (span < d) {
                    bfit *= pow(span / d, 1 / (d * d));
                }
            }
        }

        // Require meaningful improvement over afit to justify splitting
        if (bfit > afit + 1e-4) {
            for (let k = 0; k < array.length; ++k) {
                rhythms.push(array[k]);
            }
        }
        else if (a) {
            rhythms.push(a);
            i = a.index + a.count;
            r = a.rhythmIndex + a.rhythmCount;
            dState = a.driftOut;
        }
    }

    // Continue consuming duration across the remaining window
    if (beat + d < duration) {
        return detectBestFit(primes, minDivision, minDuration, beat + d, duration - d, events, i, r, rhythms, dState);
    }

    return dState;
}

/**
detect(beat, duration, events, minDivision = defaults.minDivision, primes = defaults.primes)
Top-level entry point for EPL-MQ rhythm detection.
**/
export default function detect(beat, duration, events, minDivision = MIN_DIVISION, primes = PRIMES, drift = 0) {
    const minDuration = minDivision * primes[0];

    // Find first event in analysis window
    let n = -1;
    while (events[++n] !== undefined && events[n][0] < beat);

    if (!events[n] || events[n][0] >= beat + duration) return undefined;

    const tuplets = [];
    detectBestFit(primes, minDivision, minDuration, beat, duration, events, n, 0, tuplets, drift);
    return tuplets;
}
