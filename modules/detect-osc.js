
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

const { sqrt, atan2, cos, sin, PI } = Math;

export function detectOsc(events, startBeat, duration) {
    if (!events || events.length === 0) {
        return undefined;
    }

    // Find events within the analysis window
    const relevantEvents = events.filter(e =>
        e[0] >= startBeat && e[0] < startBeat + duration
    );

    if (relevantEvents.length === 0) {
        return undefined;
    }

    let maxWeightedAmplitude = 0;
    let winningDivisor = 1;
    let winningPhase = 0;
    let winningAmplitude = 0;
    let winningRhythm = 0;

    // Test oscillators at frequencies 1-9 cycles per duration
    for (let divisor = 1; divisor <= 9; divisor++) {
        let real = 0;
        let imag = 0;
        let rhythm = 0;
        const divisionSize = duration / divisor;

        // Each event gives this oscillator a kick
        for (const event of relevantEvents) {
            const beat = event[0] - startBeat;  // Relative to analysis window
            const phi = 2 * PI * divisor * beat / duration;

            // Accumulate complex components
            // Constructive interference when events align with resonant frequency
            // Destructive interference when events are out of phase
            real += cos(phi);
            imag += sin(phi);

            // Build rhythm bitmap
            // Each bit represents a division: bit 0 = first division, bit 1 = second, etc.
            const divisionIndex = Math.round(beat / divisionSize);
            rhythm |= (1 << divisionIndex);
        }

        const amplitude = sqrt(real * real + imag * imag);
        const phase = atan2(imag, real);

        // Weight amplitude by phase alignment to prefer near-zero phase
        // Phase 0 → weight 1.0 (events perfectly aligned with grid)
        // Phase π/2 → weight 0.5 (events quarter-cycle off)
        // Phase ±π → weight 0 (events half-cycle out, completely reject)
        // This helps single notes pick the finest grid they align with
        const phaseWeight = (cos(phase) + 1) / 2;
        const weightedAmplitude = amplitude * phaseWeight;

        if (weightedAmplitude > maxWeightedAmplitude) {
            maxWeightedAmplitude = weightedAmplitude;
            winningDivisor = divisor;
            winningPhase = phase;
            winningAmplitude = amplitude;
            winningRhythm = rhythm;
        }
    }

    // Convert phase to absolute time shift in beats
    // One cycle = duration/divisor beats, phase shift = phase/(2π) of a cycle
    const phaseShift = winningPhase * duration / (2 * PI * winningDivisor);

    return {
        divisor: winningDivisor,
        amplitude: winningAmplitude,
        phase: winningPhase,
        phaseShift,
        beat: startBeat,
        duration,
        rhythm: winningRhythm
    };
}
