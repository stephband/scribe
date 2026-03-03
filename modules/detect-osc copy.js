
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

import { floorPow2 } from './number/power-of-2.js';


// Minimum duration to test
const MIN_DURATION = 0.25;
// Minimum period for any oscillator (prevents testing absurdly fast divisions)
const MIN_PERIOD = MIN_DURATION / 3;

const { sqrt, atan2, cos, sin, PI } = Math;

export function detectOsc(beat, duration, events, index = 0) {
    // Duration must be at least MIN_DURATION
    if (duration < MIN_DURATION) return undefined;

    // Ensure duration is power-of-2
    duration = floorPow2(duration);

    // Find first event after index in analysis window
    let n = index - 1;
    while (events[++n] !== undefined && events[n][0] < beat);

    // If events were found before beat they are assumed to be hangovers from
    // the end of a previous analysis window that were not counted as rhythm,
    // they are now counted as rhythm in slot 0
    const initialCount  = n - index;
    const initialRhythm = initialCount ? 1 : 0 ;
    const result = {
        // Start beat of rhythmic analysis window
        beat,
        // Duration of rhythmic analysis window
        duration,
        // Number of divisions over duration
        divisor: 1,
        // Rhythm bitmap identifier
        rhythm: initialRhythm,
        // Phase offset in beats, whether the performance is pushing or dragging
        drift: 0,
        // Index of first event in rhythm
        index,
        // Number of events counted in rhythm
        count: initialCount
    };

    // If no event in window, quick out
    if (!events[n]) return result;

    const startIndex = n;
    let bestScore  = 0;

    // Test durations in descending power-of-2 steps
    while (duration >= MIN_DURATION) {
        const stopBeat = beat + duration;

        // Test oscillators at frequencies 1-9 cycles per duration
        // Skip oscillators whose period would be too short
        for (let divisor = 1; divisor <= 9; divisor++) {
            const d = duration / divisor;

            // Ignore divisions shorter than a triplet 32nd note
            if (d < MIN_PERIOD) continue;

            let r = 0;
            let i = 0;
            let rhythm = initialRhythm;
            let count  = initialCount;

            n = startIndex - 1;
            while (events[++n] !== undefined && events[n][0] < stopBeat) {
                // Each event gives this oscillator a kick. Accumulate complex
                // components, they constructively interfere when events align
                // with resonant frequency, destructively interfere when events
                // are out of phase.
                const b = events[n][0] - beat;
                const p = 2 * PI * divisor * b / duration;
                r += cos(p);
                i += sin(p);

                // Build rhythm bitmap, where each bit represents a division
                // bit 0 = first division, bit 1 = second, and so on
                const slot = Math.round(b / d);
                if (slot < divisor) {
                    rhythm |= (1 << slot);
                    ++count;
                }
            }

            // If there were no events to process we can exit
            if (n === startIndex) return result;

            const amplitude = sqrt(r * r + i * i);
            const phase     = atan2(i, r);

            // Weight amplitude by phase alignment to prefer nearer-zero phases
            // and reject out-of-phase rhythms.
            // Phase 0   → weight 1.0 (events perfectly aligned with grid)
            // Phase π/2 → weight 0.5 (events quarter-cycle off)
            // Phase ±π  → weight 0   (events half-cycle out, completely reject)
            // Weight amplitude by events analysed to make various durations
            // comparable.
            const weight = 0.5 * (cos(phase) + 1) / (n - startIndex);
            const score  = amplitude * weight;

            if (score > bestScore) {
                bestScore = score;
                result.duration = duration;
                result.divisor  = divisor;
                result.rhythm   = rhythm;
                result.drift    = phase * duration / (2 * PI * divisor);
                result.count    = count;
            }
        }

        // Try next shorter duration
        duration /= 2;
    }

    return result;
}
