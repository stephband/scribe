import { createMelody, createSequence } from './create-data.js';

/**
 * Major 3rd Modulations (Coltrane / "Giant Steps" / "Countdown" Changes in C)
 *
 * Built around the augmented-triad tonic axis C – A♭ – E (three tonal centers
 * a major 3rd apart), using 60% modern swing (0.6 / 0.4):
 * - C major  (Dm7 – G7 – C∆)
 * - A♭ major (B♭m7 – E♭7 – A♭∆)
 * - E major  (F♯m7 – B7 – E∆)
 */

// 1. John Coltrane — "Countdown" (Major-3rd Reharmonization of Dm7 – G7 – C∆, 60% swing: 0.6 / 0.4)
// Progression: | Dm7  E♭7 | A♭∆  B7 | E∆  G7 | C∆ |
export const coltraneCountdownInC = createMelody('John Coltrane — "Countdown" II–V–I in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm7 (beats 1–2: D4 - F4 - A4 - C5) -> E♭7 (beats 3–4: B♭4 - G4 - F4 - E♭4)
     'D4', 0.6,  'C',   'F4', 0.4,  'C',   'A4', 0.6,  'C',   'C5', 0.4,  'C',
    'B♭4', 0.6, 'A♭',   'G4', 0.4, 'A♭',   'F4', 0.6, 'A♭',  'E♭4', 0.4, 'A♭',
    // Bar 2: A♭∆ (beats 1–2: A♭4 - B♭4 - C5 - E♭5) -> B7 (beats 3–4: D♯5 - B4 - A4 - F♯4)
    'A♭4', 0.6, 'A♭',  'B♭4', 0.4, 'A♭',   'C5', 0.6, 'A♭',  'E♭5', 0.4, 'A♭',
    'D♯5', 0.6,  'E',   'B4', 0.4,  'E',   'A4', 0.6,  'E',  'F♯4', 0.4,  'E',
    // Bar 3: E∆ (beats 1–2: G♯4 - B4 - C♯5 - E5) -> G7 (beats 3–4: F5 - D5 - B4 - G4)
    'G♯4', 0.6,  'E',   'B4', 0.4,  'E',  'C♯5', 0.6,  'E',   'E5', 0.4,  'E',
     'F5', 0.6,  'C',   'D5', 0.4,  'C',   'B4', 0.6,  'C',   'G4', 0.4,  'C',
    // Bar 4: C∆ — Resolving G4 -> E5 -> D5 -> C5 -> B4 -> G4 -> E4
     'E5', 0.6,  'C',   'D5', 0.4,  'C',   'C5', 0.6,  'C',   'B4', 0.4,  'C',
     'G4', 1.0,  'C',   'E4', 1.0,  'C'
);

// 2. John Coltrane — "Giant Steps" Theme & Solo Line in C (60% swing: 0.6 / 0.4)
export const coltraneGiantStepsInC = createMelody('John Coltrane — "Giant Steps" Cycle in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C∆ (G5 - E5) -> E♭7 (C5 - G4)
     'G5', 1.0,  'C',   'E5', 1.0,  'C',   'C5', 1.0, 'A♭',   'G4', 1.0, 'A♭',
    // Bar 2: A♭∆ (B♭4) -> B7 (G4 - F♯4)
    'B♭4', 2.0, 'A♭',   'G4', 1.0, 'A♭',  'F♯4', 1.0,  'E',
    // Bar 3: E∆ (B4 - G♯4 - B4) -> G7 (D5 - B4)
     'B4', 1.6,  'E',  'G♯4', 0.4,  'E',   'B4', 1.0,  'E',   'D5', 1.0,  'C',
    // Bar 4: C∆ (C5 - E5) -> F♯m7 – B7 pickup (A4 - F♯4)
     'C5', 2.0,  'C',   'A4', 1.0,  'E',  'F♯4', 1.0,  'E',
    // Bar 5: E∆ (G♯4 - B4 - C♯5 - E5) -> E♭7 (D♭5 - B♭4 - G4 - F4)
    'G♯4', 0.6,  'E',   'B4', 0.4,  'E',  'C♯5', 0.6,  'E',   'E5', 0.4,  'E',
    'D♭5', 0.6, 'A♭',  'B♭4', 0.4, 'A♭',   'G4', 0.6, 'A♭',   'F4', 0.4, 'A♭',
    // Bar 6: A♭∆ (E♭4 - A♭4 - C5 - E♭5) -> B7 (D♯5 - F♯5 - B4 - A4)
    'E♭4', 0.6, 'A♭',  'A♭4', 0.4, 'A♭',   'C5', 0.6, 'A♭',  'E♭5', 0.4, 'A♭',
    'D♯5', 0.6,  'E',  'F♯5', 0.4,  'E',   'B4', 0.6,  'E',   'A4', 0.4,  'E',
    // Bar 7: E∆ (G♯4 - E4 - F♯4 - G♯4) -> Dm7 – G7 (A4 - F4 - B4 - G4)
    'G♯4', 0.6,  'E',   'E4', 0.4,  'E',  'F♯4', 0.6,  'E',  'G♯4', 0.4,  'E',
     'A4', 0.6,  'C',   'F4', 0.4,  'C',   'B4', 0.6,  'C',   'G4', 0.4,  'C',
    // Bar 8: C∆ — Final resolution (E5 - C5 - G4 - C5)
     'E5', 0.6,  'C',   'C5', 0.4,  'C',   'G4', 1.0,  'C',   'C5', 2.0,  'C'
);

// 3. Wynton Marsalis / Sonny Rollins — Smooth Guide-Tone Line Through C – A♭ – E (60% swing: 0.6 / 0.4)
export const wyntonMajorThirdsInC = createMelody('Wynton Marsalis — Smooth Voice-Leading Over C – A♭ – E', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C∆ (B4 - C5 - E5 - G5) -> E♭7 (F5 - E♭5 - D♭5 - B♭4)
     'B4', 0.6,  'C',   'C5', 0.4,  'C',   'E5', 0.6,  'C',   'G5', 0.4,  'C',
     'F5', 0.6, 'A♭',  'E♭5', 0.4, 'A♭',  'D♭5', 0.6, 'A♭',  'B♭4', 0.4, 'A♭',
    // Bar 2: A♭∆ (C5 - A♭4 - E♭4 - C5) -> B7 (B4 - A4 - F♯4 - D♯4)
     'C5', 0.6, 'A♭',  'A♭4', 0.4, 'A♭',  'E♭4', 0.6, 'A♭',   'C5', 0.4, 'A♭',
     'B4', 0.6,  'E',   'A4', 0.4,  'E',  'F♯4', 0.6,  'E',  'D♯4', 0.4,  'E',
    // Bar 3: E∆ (E4 - G♯4 - B4 - D♯5) -> G7♭9 (D5 - B4 - A♭4 - F4)
     'E4', 0.6,  'E',  'G♯4', 0.4,  'E',   'B4', 0.6,  'E',  'D♯5', 0.4,  'E',
     'D5', 0.6,  'C',   'B4', 0.4,  'C',  'A♭4', 0.6, 'E♭',   'F4', 0.4,  'C',
    // Bar 4: C∆9 — Resolving F4 -> E4 -> G4 -> B4 -> D5
     'E4', 1.0,  'C',   'G4', 0.6,  'C',   'B4', 0.4,  'C',   'D5', 2.0,  'C'
);

// 4. John Scofield — Ascending Major-3rd Cycle (C∆ – B7 – E∆ – E♭7 – A♭∆ – G7 – C∆, 60% swing: 0.6 / 0.4)
export const scofieldAscendingMajorThirdsInC = createMelody('John Scofield — Ascending Major-3rd Cycle', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C∆ (E4 - B4 - D5 - G5) -> B7 (F♯5 - D♯5 - B4 - A4)
     'E4', 0.6,  'C',   'B4', 0.4,  'C',   'D5', 0.6,  'C',   'G5', 0.4,  'C',
    'F♯5', 0.6,  'E',  'D♯5', 0.4,  'E',   'B4', 0.6,  'E',   'A4', 0.4,  'E',
    // Bar 2: E∆ (G♯4 - C♯5 - F♯5 - B4) -> E♭7 (B♭4 - D♭5 - G4 - F4)
    'G♯4', 0.6,  'E',  'C♯5', 0.4,  'E',  'F♯5', 0.6,  'E',   'B4', 0.4,  'E',
    'B♭4', 0.6, 'A♭',  'D♭5', 0.4, 'A♭',   'G4', 0.6, 'A♭',   'F4', 0.4, 'A♭',
    // Bar 3: A♭∆ (E♭4 - G4 - C5 - G5) -> G7alt (F5 - E♭5 - D♭5 - B4)
    'E♭4', 0.6, 'A♭',   'G4', 0.4, 'A♭',   'C5', 0.6, 'A♭',   'G5', 0.4, 'A♭',
     'F5', 0.6, 'A♭',  'E♭5', 0.4, 'A♭',  'D♭5', 0.6, 'A♭',   'B4', 0.4,  'C',
    // Bar 4: C∆9 — Resolving B4 -> C5 -> E5 -> G4
     'C5', 1.0,  'C',   'E5', 1.0,  'C',   'G4', 2.0,  'C'
);

// 5. Coltrane Changes ("Countdown" / "Giant Steps" in C) Voice-Led Chords
export const giantStepsChordsInC = createSequence('Coltrane Changes ("Countdown" in C) Chords', 'C', 4, {},
    // Bar 1: Dm9 (2 beats) -> E♭9 (2 beats)
    0.0,  'F4', 2.0, 'C',  0.0,  'A4', 2.0, 'C',  0.0,  'C5', 2.0, 'C',  0.0,  'E5', 2.0, 'C',
    2.0,  'G4', 2.0,'A♭',  2.0, 'B♭4', 2.0,'A♭',  2.0, 'D♭5', 2.0,'A♭',  2.0,  'F5', 2.0,'A♭',
    // Bar 2: A♭∆9 (2 beats) -> B9 (2 beats)
    4.0,  'G4', 2.0,'A♭',  4.0, 'B♭4', 2.0,'A♭',  4.0,  'C5', 2.0,'A♭',  4.0, 'E♭5', 2.0,'A♭',
    6.0, 'F♯4', 2.0, 'E',  6.0,  'A4', 2.0, 'E',  6.0, 'C♯5', 2.0, 'E',  6.0, 'D♯5', 2.0, 'E',
    // Bar 3: E∆9 (2 beats) -> G13 (2 beats)
    8.0, 'F♯4', 2.0, 'E',  8.0, 'G♯4', 2.0, 'E',  8.0,  'B4', 2.0, 'E',  8.0, 'D♯5', 2.0, 'E',
   10.0,  'F4', 2.0, 'C', 10.0,  'A4', 2.0, 'C', 10.0,  'B4', 2.0, 'C', 10.0,  'E5', 2.0, 'C',
    // Bar 4: C∆9 (4 beats)
   12.0,  'E4', 4.0, 'C', 12.0,  'G4', 4.0, 'C', 12.0,  'B4', 4.0, 'C', 12.0,  'D5', 4.0, 'C'
);
