
/**
rhythm-eplmq.js
Elastic Phase-Locked Metrical Quantizer (EPL-MQ)

Rhythm detection using complex harmonic oscillators combined with a
critically-damped Phase-Locked Loop (PLL) to track expressive performer drift
while maintaining an elastic restoring force back to the absolute beat pulse.

All timing offsets, drift parameters, and spring constants are measured in *beats*.
**/

import { floorPow2 } from './number/power-of-2.js';

const DEBUG = globalThis.DEBUG;
const { cos, sin, round, PI, abs, pow, sqrt, atan2, exp } = Math;
const primes = [2, 3, 5, 7, 9];

function count1s(n) {
    let count = 0;
    while (n) { n &= n - 1; ++count; }
    return count;
}

function gaussian(sigma, d) {
    return exp(-(d * d) / (2 * sigma * sigma));
}

const minDuration = 1 / 8;
const minDivision = 1 / 12;

// Default elastic band parameters (all in units of beats)
export const DEFAULT_CONFIG = {
    sigma: 0.125, // Elastic drift tolerance in beats
    alpha: 0.25,  // PLL tracking elasticity (pull toward performer's local phase)
    lambda: 0.15  // Spring restoring force back toward the absolute beat (0)
};

/**
test(beat, duration, divisor, events, index, rhythmIndex, rhythmCount, delta, config)
Evaluates a candidate tuplet divisor over [beat, beat + duration) relative to the
elastic reference frame shifted by `delta` (in beats).
**/
function test(beat, duration, divisor, events, index, rhythmIndex, rhythmCount, delta = 0, config = DEFAULT_CONFIG) {
    let rSum = 0;
    let iSum = 0;
    let beatError = 0;
    let rhythm = rhythmCount > 0 ? 1 : 0;

    if (DEBUG && rhythmIndex > index) throw new Error('rhythmIndex should never be > index');

    // Run the analysis against the elastic reference frame (t - delta)
    let n = index - 1;
    while (events[++n] !== undefined && events[n][0] < beat + duration) {
        const time = events[n][0];
        const b = time - beat - delta;
        const x = b * divisor / duration;

        // Build rhythm bitmap
        const slot = round(x);
        const gridBeat = slot * duration / divisor;
        beatError += abs(b - gridBeat);

        // Accumulate complex phasor components
        rSum += cos(x * 2 * PI);
        iSum += sin(x * 2 * PI);

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
            phase: 0,
            drift: 0,
            beatError: 0,
            delta,
            deltaOut: (1 - config.lambda) * delta
        };
    }

    // Complex Phasor Analysis:
    // Amplitude |Z| measures rhythm coherence independently of phase offset.
    // Phase angle phi measures the performer's local drift.
    const amplitude = sqrt(rSum * rSum + iSum * iSum);
    const phaseAngle = atan2(iSum, rSum);
    const division = duration / divisor;
    const phaseDriftBeats = (division * phaseAngle) / (2 * PI);
    const driftWeight = gaussian(config.sigma, phaseDriftBeats);

    // Score combines phase alignment (rSum) with coherence (amplitude) weighted by drift
    let score = rSum;

    // Critically damped spring update for the elastic reference frame:
    // delta_next = (1 - lambda) * delta + alpha * phaseDriftBeats
    const deltaOut = (1 - config.lambda) * delta + config.alpha * phaseDriftBeats;

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
        phase: phaseAngle,
        drift: phaseDriftBeats,
        beatError,
        delta,
        deltaOut
    };
}

/**
detectRhythmPrime(beat, duration, events, index, rhythmIndex, delta, config)
Tests candidate prime divisors descending from 9 down to 2, selecting the best fit.
**/
function detectRhythmPrime(beat, duration, events, index, rhythmIndex, delta = 0, config = DEFAULT_CONFIG) {
    if (DEBUG && rhythmIndex > index) throw new Error('rhythmIndex should never be > index');

    let rhythmCount = index - rhythmIndex;
    let rhythm = rhythmCount === 0 ? 0 : 1;
    let result = rhythm ? {
        beat,
        duration,
        divisor: 1,
        rhythm,
        index,
        count: 0,
        rhythmIndex,
        rhythmCount,
        score: 0,
        phase: 0,
        drift: 0,
        beatError: Infinity,
        delta,
        deltaOut: (1 - config.lambda) * delta
    } : undefined;

    let score = 0;
    let minError = Infinity;

    // Find highest prime that allows division greater than minDivision
    let p = primes.length;
    while (duration / primes[--p] < minDivision);
    ++p;

    // Descend through remaining primes, keep highest scoring rhythm
    while (primes[--p]) {
        const data = test(beat, duration, primes[p], events, index, rhythmIndex, rhythmCount, delta, config);
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
detectBestFit(beat, duration, events, index, rhythmIndex, rhythms, indent, delta, config)
Recursive metrical tree search comparing single tuplet candidate `a` against
bifurcated sub-windows with continuous duration-scaled span penalty and
elastic phase propagation.
**/
function detectBestFit(beat, duration, events, index, rhythmIndex = index, rhythms = [], indent = '', delta = 0, config = DEFAULT_CONFIG) {
    let i = index;
    let r = rhythmIndex;
    let dState = delta;

    const d = floorPow2(duration);
    const a = detectRhythmPrime(beat, d, events, i, r, dState, config);
    // Event count coverage bonus: pow(count, 0.1)
    const afit = a && a.count ? (a.score / a.count) * pow(a.count, 0.1) : 0;

    // Count is 0 if no new events have been read
    if (a && a.count === 0) {
        if (a.rhythm) {
            rhythms.push(a);
            if (index !== a.rhythmIndex + a.rhythmCount) throw new Error('rhythmIndex should have caught up with index');
            r = a.rhythmIndex + a.rhythmCount;
            dState = a.deltaOut;
        }
    }
    // Smallest testable duration reached
    else if (duration <= minDuration * 2) {
        if (a) {
            rhythms.push(a);
            i = a.index + a.count;
            r = a.rhythmIndex + a.rhythmCount;
            dState = a.deltaOut;
        }
    }
    // A perfect fit cannot be beaten: fast accept
    else if (a && a.count && a.score === a.count && (a.count > 1 || d <= 1)) {
        rhythms.push(a);
        i = a.index + a.count;
        r = a.rhythmIndex + a.rhythmCount;
        dState = a.deltaOut;
    }
    // Bifurcation: compare candidate `a` against two half-duration windows
    else {
        const array = [];
        let last;

        // Window 1: [beat, beat + d/2)
        dState = detectBestFit(beat, d / 2, events, i, r, array, indent + '| ', dState, config);
        last = array[array.length - 1];
        if (last) {
            i = last.index + last.count;
            r = last.rhythmIndex + last.rhythmCount;
        }

        // Window 2: [beat + d/2, beat + d) receives evolved phase state dState
        dState = detectBestFit(beat + d / 2, d / 2, events, i, r, array, indent + '| ', dState, config);
        last = array[array.length - 1];
        if (last) {
            i = last.index + last.count;
            r = last.rhythmIndex + last.rhythmCount;
        }

        // Fit by overall average score of all events, weighted by count coverage
        const count = i - index;
        let bfit = count && array.reduce((sum, item) => sum + item.score * pow(item.count, 0.1), 0) / count;

        // Progressive span penalty:
        // Exponent decays smoothly as 1 / d^2 so small-scale swing (d <= 1) is protected,
        // while multi-beat measures (d >= 2) naturally allow trailing rests without penalty.
        if (a && a.count && bfit && count > 1) {
            const eventSpan = events[i - 1][0] - events[index][0];
            if (eventSpan > d / 2) {
                const span = array.reduce((sum, item) => sum + item.duration, 0);
                if (span < d) {
                    bfit *= pow(span / d, 1 / (d * d));
                }
            }
        }

        // Require meaningful improvement over afit to justify splitting
        if (bfit > afit + 1e-4) {
            rhythms.push.apply(rhythms, array);
        }
        else if (a) {
            rhythms.push(a);
            i = a.index + a.count;
            r = a.rhythmIndex + a.rhythmCount;
            dState = a.deltaOut;
        }
    }

    // Continue consuming duration across the remaining window
    if (beat + d < duration) {
        return detectBestFit(beat + d, duration - d, events, i, r, rhythms, indent, dState, config);
    }

    return dState;
}


/**
detect(beat, duration, events, index = 0, options = {})
Top-level entry point for EPL-MQ rhythm detection.
**/
export default function detect(beat, duration, events, index = 0, options = {}) {
    const config = Object.assign({}, DEFAULT_CONFIG, options);

    // Find first event in analysis window
    let n = index - 1;
    while (events[++n] !== undefined && events[n][0] < beat);

    if (!events[n] || events[n][0] >= beat + duration) return undefined;

    const tuplets = [];
    detectBestFit(beat, duration, events, n, index, tuplets, '', 0, config);
    return tuplets;
}
