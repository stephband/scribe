
/**
detectOsc(events, startBeat, duration)
Harmonic oscillator model for rhythm detection. Models 9 harmonic oscillators
(frequencies 1-9 cycles per duration) that accumulate "kicks" from each event.
Returns the most excited oscillator and its phase.

Returns: `{ divisor, amplitude, phase, beat, duration }` where:
- `divisor`: The winning oscillator frequency (1-9 cycles per duration)
- `amplitude`: Strength of oscillation, unnormalised
- `phase`: Phase angle in radians (-π to π), indicates drift from expected grid
- `beat`: Start beat of analysis window
- `duration`: Duration of analysis window
**/

import { floorPow2, ceilPow2 } from './number/power-of-2.js';

const DEBUG = globalThis.DEBUG;

const { atan2, ceil, cos, floor, max, min, pow, sin, sqrt, PI } = Math;

const defaults = {
    minNoteDuration:   1 / 12,
    maxNoteDuration:   4,
    stopBeatInfluence: 0.01
};

const divisors = [1, 2, 3, 5, 7, 9];

// Favour slightly inexact triplets over exact duplets by an arbitrary factor
const TOLERANCE = 0.07;


function hasConsecutiveHoles(divisor, rhythm) {
    const fullRhythm = (1 << divisor) - 1;
    const holes = fullRhythm ^ rhythm;
    return holes & (holes << 1);
}

function compare(beat, duration, divisor, rhythm, length, count, r, i, score, result) {
    // Reject higher order rhythms with consecutive holes
    if (divisor > 3 && hasConsecutiveHoles(divisor, rhythm)) return score;

    const amplitude = sqrt(r * r + i * i);
    const phase     = atan2(i, r);

    // Weight amplitude by phase alignment to prefer nearer-zero
    // phases and reject out-of-phase rhythms.
    // Phase 0   → weight 1.0 (events perfectly aligned with grid)
    // Phase π/2 → weight 0.5 (events quarter-cycle off)
    // Phase ±π  → weight 0   (events half-cycle out, completely reject)
    const weightPhase =  0.5 * (cos(phase) + 1);

    // Weight amplitude by events analysed to make various durations
    // comparable, weight by an arbitrary tolerance
    const weightCount = TOLERANCE + 1 / length;

    // Score
    const s = amplitude * weightPhase * weightCount;

    if (DEBUG) console.log('divisor', divisor, 'length', length, 'score', s);
    if (s <= score) return score;

    result.beat     = beat;
    result.duration = duration;
    result.divisor  = divisor;
    result.rhythm   = rhythm;
    result.drift    = phase * duration / (2 * PI * divisor);
    result.count    = count;

    return s;
}

function test(events, index, beat, duration, divisor, rhythm, count, score, result, stopBeatInfluence) {
    const d = duration / divisor;

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
        const slot = Math.round(b1 / d);
        if (slot < divisor) {
            rhythm |= (1 << slot);
            ++count;
        }
    }

    return compare(beat, duration, divisor, rhythm, n - index, count, r, i, score, result);
}

export default function detectRhythm(beat, maxDuration, events, index = 0, options) {
    const minNoteDuration   = options?.minNoteDuration   || defaults.minNoteDuration;
    const maxNoteDuration   = options?.maxNoteDuration   || defaults.maxNoteDuration;
    const stopBeatInfluence = options?.stopBeatInfluence || defaults.stopBeatInfluence;

    // Min duration is divided by at least duplets, so must be at least
    // twice minNoteDuration
    const minDuration = ceilPow2(minNoteDuration);

    // Duration must be at least minDuration
    if (maxDuration < minDuration) throw new Error(`detectRhythm() - duration (${ maxDuration }) must be at least ${ minDuration }`);

    // Ensure initial duration is power-of-2
    let duration = floorPow2(maxDuration);

    // Find first event after index in analysis window
    let n = index - 1;
    while (events[++n] !== undefined && events[n][0] < beat);

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

    // If no event in window, quick out
    if (!events[n]) return result;

    const startBeat  = beat;
    const startIndex = n;
    const startEvent = events[startIndex];

    let score = 0;
    while (duration >= minDuration) {
        const maxDivisor = min(9, floor(duration / minNoteDuration));

        // Find minimum divisor
        let m = -1;
        while (divisors[++m] < duration / maxNoteDuration);

        // Set beat to first half duration after startEvent
        beat = startBeat;
        while (!rhythm
            && beat + 0.5 * duration <= startEvent[0]
            && beat + 1.5 * duration <= startBeat + maxDuration) {
            beat += duration / 2;
        }

        // For as long as beat is after startBeat and duration encompasses startEvent
        while (beat >= startBeat && beat + duration > startEvent[0]) {
            if (DEBUG) console.group('duration', duration, 'beat', beat);

            // Test oscillators at frequencies  duration
            --m;
            while (divisors[++m] <= maxDivisor) {
                score = test(events, startIndex, beat, duration, divisors[m], rhythm, count, score, result, stopBeatInfluence);
            }

            if (DEBUG) console.groupEnd();

            // Scan window backward by half durations
            beat -= duration / 2;
        }

        // Test durations in descending power-of-2 steps
        duration /= 2;
    }

    return result;
}
