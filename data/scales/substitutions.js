import { createMelody, createSequence } from '../create-data.js';

/**
 * Tritone & Minor 3rd Substitution Phrases in C Major
 *
 * Authentic jazz vocabulary over:
 * - Tritone substitution: Dm7 – D♭7♯11 – C∆ (and A♭m7 – D♭7 – C∆)
 * - Backdoor / m3rd dominant sub: Fm7 – B♭7♯11 – C∆ (B♭7 = m3rd sub of G7)
 * - Tadd Dameron / "Lady Bird" turnaround: C∆ – E♭7 – A♭∆ – D♭7 – C∆
 * - Diminished / m3rd axis dominants: C∆ – E7 – B♭7 – D♭7 – C∆
 *
 * - Classic bop / cool examples (Rollins, Baker):   65% swing (0.65 / 0.35)
 * - Modern / neo-bop examples (Scofield, Marsalis): 60% swing (0.6 / 0.4)
 */

// 1. Sonny Rollins — Tritone Substitution II–subV–I (Dm7 – D♭7♯11 – C∆9) (65% swing: 0.65 / 0.35)
export const rollinsTritoneSubInC = createMelody('Sonny Rollins — Tritone Sub (Dm7 – D♭7♯11 – C∆)', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm7 — Swung 8th-note line up the Dm9 arpeggio
     'D4', 0.65, 'C',   'F4', 0.35, 'C',   'A4', 0.65, 'C',   'C5', 0.35, 'C',
     'E5', 0.65, 'C',   'D5', 0.35, 'C',   'C5', 0.65, 'C',   'A4', 0.35, 'C',
    // Bar 2: D♭7♯11 — Entering on A♭4 -> F4 -> D♭4 -> F4 -> G♮4 (♯11) -> A♭4 -> B♭4 -> D♭5
    'A♭4', 0.65,'D♭',   'F4', 0.35,'D♭',  'D♭4', 0.65,'D♭',   'F4', 0.35,'A♭',
     'G4', 0.65,'A♭',  'A♭4', 0.35,'A♭',  'B♭4', 0.65,'A♭',  'D♭5', 0.35,'D♭',
    // Bar 3: C∆9 — Half-step resolution D♭5 -> C5, descending through B4 - G4 - E4 - D4
     'C5', 1.0,  'C',   'B4', 0.65, 'C',   'G4', 0.35, 'C',   'E4', 0.65, 'C',
     'G4', 0.35, 'C',   'D4', 0.65, 'C',  'D♯4', 0.35, 'E',
    // Bar 4: C∆9 — Resolving on E4
     'E4', 4.0,  'C'
);

// 2. Chet Baker — Backdoor Progression / Minor 3rd Sub (Fm9 – B♭13♯11 – C∆9) (65% swing: 0.65 / 0.35)
export const chetBakerBackdoorInC = createMelody('Chet Baker — Backdoor Cadence (Fm7 – B♭7♯11 – C∆)', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Fm9 — Lyrical swung 8th line from the 9th (G4 -> A♭4 -> C5 -> E♭5 -> C5 -> A♭4)
    null,  0.65, null,  'G4', 0.35,'E♭',  'A♭4', 0.65,'E♭',   'C5', 0.35,'E♭',
    'E♭5', 1.0, 'E♭',   'C5', 0.65,'E♭',  'A♭4', 0.35,'E♭',
    // Bar 2: B♭13(♯11) — Outlining B♭4 - D5 - F5 - A♭5 - G5 - E♮5 (♯11) - D5 - C5
    'B♭4', 0.65,'E♭',   'D5', 0.35,'B♭',   'F5', 0.65,'B♭',  'A♭5', 0.35,'E♭',
     'G5', 0.65, 'C',   'E5', 0.35, 'C',   'D5', 0.65, 'C',   'C5', 0.35, 'C',
    // Bar 3: C∆9 — Resolving to B4 -> G4 -> E4 -> G4 -> D5
     'B4', 1.0,  'C',   'G4', 0.65, 'C',   'E4', 0.35, 'C',   'G4', 1.0,  'C',
     'D5', 1.0,  'C',
    // Bar 4: C∆9 — Settling on B4 -> G4
     'B4', 1.0,  'C',   'G4', 3.0,  'C'
);

// 3. John Scofield — Tadd Dameron / "Lady Bird" Turnaround (60% swing: 0.6 / 0.4)
export const scofieldLadyBirdTurnaroundInC = createMelody('John Scofield — Lady Bird Turnaround', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C∆ (beats 1–2: E4 - G4 - B4 - D5) -> E♭7 (beats 3–4: D♭5 - B♭4 - G4 - E♭4)
     'E4', 0.6,  'C',   'G4', 0.4,  'C',   'B4', 0.6,  'C',   'D5', 0.4,  'C',
    'D♭5', 0.6, 'A♭',  'B♭4', 0.4, 'A♭',   'G4', 0.6, 'A♭',  'E♭4', 0.4, 'A♭',
    // Bar 2: A♭∆ (beats 1–2: C5 - E♭5 - G5 - E♭5) -> D♭7♯11 (beats 3–4: F5 - D♭5 - B♭4 - G♮4)
     'C5', 0.6, 'A♭',  'E♭5', 0.4, 'A♭',   'G5', 0.6, 'A♭',  'E♭5', 0.4, 'A♭',
     'F5', 0.6, 'D♭',  'D♭5', 0.4, 'D♭',  'B♭4', 0.6, 'A♭',   'G4', 0.4, 'A♭',
    // Bar 3: C∆9 — Resolving G4 -> E4 -> B4 -> D5 -> F♯5 -> G5 -> E5
     'E4', 0.6,  'C',   'G4', 0.4,  'C',   'B4', 0.6,  'C',   'D5', 0.4,  'C',
    'F♯5', 0.6,  'G',   'G5', 1.0,  'C',   'E5', 0.4,  'C',
    // Bar 4: C∆ — Final cadence
     'C5', 4.0,  'C'
);

// 4. Wynton Marsalis — Minor-3rd Dominant Axis (C∆ – E7 – B♭7 – D♭7 – C∆) (60% swing: 0.6 / 0.4)
export const wyntonMinorThirdAxisInC = createMelody('Wynton Marsalis — Minor-3rd Dominant Axis in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C∆ (beats 1–2) -> E7 (beats 3–4: G♯4 - B4 - D5 - F♮5)
     'G4', 0.6,  'C',   'C5', 0.4,  'C',   'E5', 0.6,  'C',   'B4', 0.4,  'C',
    'G♯4', 0.6,  'A',   'B4', 0.4,  'A',   'D5', 0.6,  'C',   'F5', 0.4,  'C',
    // Bar 2: B♭7 (beats 1–2: D5 - F5 - A♭5 - B♭5) -> D♭7 (beats 3–4: F5 - D♭5 - B♭4 - A♭4)
     'D5', 0.6, 'B♭',   'F5', 0.4, 'B♭',  'A♭5', 0.6, 'E♭',  'B♭5', 0.4, 'E♭',
     'F5', 0.6, 'D♭',  'D♭5', 0.4, 'D♭',  'B♭4', 0.6, 'D♭',  'A♭4', 0.4, 'D♭',
    // Bar 3: C∆9 — Chromatic resolution A♭4 -> G4 -> E4 -> B4 -> D5 -> E5
     'G4', 0.6,  'C',   'E4', 0.4,  'C',   'B4', 0.6,  'C',   'D5', 0.4,  'C',
     'E5', 2.0,  'C',
    // Bar 4: C∆9 — Held C5
     'C5', 4.0,  'C'
);

// 5. Chromatic & Tritone Substitution Chord Voicings in C
export const substitutionChordsInC = createSequence('Tritone & Minor-3rd Substitution Chords in C', 'C', 4, {},
    // Bar 1: C∆9 (2 beats) -> E♭9 (2 beats)
    0.0,  'E4', 2.0, 'C',  0.0,  'G4', 2.0, 'C',  0.0,  'B4', 2.0, 'C',  0.0,  'D5', 2.0, 'C',
    2.0,  'G4', 2.0,'A♭',  2.0, 'B♭4', 2.0,'A♭',  2.0, 'D♭5', 2.0,'A♭',  2.0,  'F5', 2.0,'A♭',
    // Bar 2: A♭∆9 (2 beats) -> D♭9 (2 beats)
    4.0,  'G4', 2.0,'A♭',  4.0, 'B♭4', 2.0,'A♭',  4.0,  'C5', 2.0,'A♭',  4.0, 'E♭5', 2.0,'A♭',
    6.0,  'F4', 2.0,'D♭',  6.0, 'A♭4', 2.0,'D♭',  6.0, 'C♭5', 2.0,'G♭',  6.0, 'E♭5', 2.0,'D♭',
    // Bar 3: Dm9 (2 beats) -> D♭9♯11 (2 beats)
    8.0,  'F4', 2.0, 'C',  8.0,  'A4', 2.0, 'C',  8.0,  'C5', 2.0, 'C',  8.0,  'E5', 2.0, 'C',
   10.0,  'F4', 2.0,'A♭', 10.0,  'G4', 2.0,'A♭', 10.0, 'C♭5', 2.0,'G♭', 10.0, 'E♭5', 2.0,'A♭',
    // Bar 4: C∆9 (4 beats)
   12.0,  'E4', 4.0, 'C', 12.0,  'G4', 4.0, 'C', 12.0,  'B4', 4.0, 'C', 12.0,  'D5', 4.0, 'C'
);
