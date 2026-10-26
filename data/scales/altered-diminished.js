import { createMelody, createSequence } from '../create-data.js';

/**
 * Altered Dominant & Symmetrical Diminished Phrases in C
 *
 * Authentic jazz vocabulary over:
 * - Dm7 – G7alt (A♭ melodic minor: ♭9, ♯9, 3, ♯11/♭5, ♭13, 7) – C∆
 * - Dm7 – G7(♭9,♯9,♯11,13) (Half-Whole Diminished) – C∆
 * - Chromatic Passing & Auxiliary Diminished (C∆ – C♯°7 – Dm7 – D♯°7 – C/E)
 *
 * - Modern / neo-bop examples (Scofield, Marsalis): 60% swing (0.6 / 0.4)
 * - Classic bop / cool examples (Rollins, Baker):   65% swing (0.65 / 0.35)
 */

// 1. John Scofield — Symmetrical Half-Whole Diminished Line (60% swing: 0.6 / 0.4)
export const scofieldHalfWholeDimInC = createMelody('John Scofield — G7 Half-Whole Diminished to C∆', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm7 — Syncopated swung 8th Dorian setup
    null,  0.6,  null,  'A4', 0.4,  'C',   'C5', 0.6,  'C',   'D5', 0.4,  'C',
     'F5', 0.6,  'C',   'E5', 0.4,  'C',   'D5', 0.6,  'C',   'A4', 0.4,  'C',
    // Bar 2: G7 (HW Diminished) — Outlining E triad and D♭/C♯ diminished steps
     'G4', 0.6,  'C',  'A♭4', 0.4, 'E♭',  'B♭4', 0.6, 'E♭',   'B4', 0.4,  'C',
    'C♯5', 0.6,  'D',   'D5', 0.4,  'D',   'E5', 0.6,  'C',   'F5', 0.4,  'C',
    // Bar 3: G7♭9 -> C∆ — Descending HW diminished triad pair (E5 - C♯5 - B♭4 - A♭4 - G4 - F4) into C∆
     'E5', 0.6,  'D',  'C♯5', 0.4,  'D',  'B♭4', 0.6, 'E♭',  'A♭4', 0.4, 'E♭',
     'G4', 0.6,  'C',   'F4', 0.4,  'C',   'E4', 1.0,  'C',
    // Bar 4: C∆9 — Resting on B4 -> D5 -> G4
     'B4', 0.6,  'C',   'D5', 0.4,  'C',   'G4', 3.0,  'C'
);

// 2. Wynton Marsalis — Altered Dominant Trumpet Run (Dm7 – G7alt – C∆9) (60% swing: 0.6 / 0.4)
export const wyntonAlteredDominantInC = createMelody('Wynton Marsalis — G7alt Melodic Minor Run in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm9 — Crisp arpeggio up to the 9th (E5) and 11th (G5)
     'D4', 0.6,  'C',   'F4', 0.4,  'C',   'A4', 0.6,  'C',   'C5', 0.4,  'C',
     'E5', 0.6,  'C',   'G5', 0.4,  'C',   'F5', 0.6,  'C',   'D5', 0.4,  'C',
    // Bar 2: G7alt (A♭ melodic minor) — B♮4 -> D♭5 -> E♭5 -> F5 -> E♭5 -> D♭5 -> B♭4 -> A♭4
     'B4', 0.6,  'C',  'D♭5', 0.4, 'A♭',  'E♭5', 0.6, 'A♭',   'F5', 0.4, 'A♭',
    'E♭5', 0.6, 'A♭',  'D♭5', 0.4, 'A♭',  'B♭4', 0.6, 'E♭',  'A♭4', 0.4, 'E♭',
    // Bar 3: C∆9 — Resolving A♭4 -> G4 -> E4 -> B4 -> D5 -> C5
     'G4', 0.6,  'C',   'E4', 0.4,  'C',   'G4', 0.6,  'C',   'B4', 0.4,  'C',
     'D5', 1.0,  'C',   'C5', 1.0,  'C',
    // Bar 4: C∆9 — Final cadence
     'E5', 4.0,  'C'
);

// 3. Sonny Rollins — Chromatic Passing Diminished (65% swing: 0.65 / 0.35)
export const rollinsPassingDiminishedInC = createMelody('Sonny Rollins — Chromatic Passing Diminished in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C∆ (beats 1–2) -> C♯°7 (beats 3–4: C♯4 - E4 - G4 - B♭4)
     'C4', 0.65, 'C',   'E4', 0.35, 'C',   'G4', 0.65, 'C',   'E4', 0.35, 'C',
    'C♯4', 0.65, 'D',   'E4', 0.35, 'D',   'G4', 0.65, 'F',  'B♭4', 0.35, 'F',
    // Bar 2: Dm7 (beats 1–2: A4 - F4 - D4 - F4) -> D♯°7 (beats 3–4: D♯4 - F♯4 - A4 - C5)
     'A4', 0.65, 'C',   'F4', 0.35, 'C',   'D4', 0.65, 'C',   'F4', 0.35, 'C',
    'D♯4', 0.65, 'E',  'F♯4', 0.35, 'G',   'A4', 0.65, 'G',   'C5', 0.35, 'G',
    // Bar 3: Em7 (beats 1–2: B4 - G4 - E4) -> A7♭9 (beats 3–4: C♯5 - B♭4 - G4 - E4)
     'B4', 0.65, 'C',   'G4', 0.35, 'C',   'E4', 1.0,  'C',
    'C♯5', 0.65, 'D',  'B♭4', 0.35, 'F',   'G4', 0.65, 'F',   'E4', 0.35, 'D',
    // Bar 4: Dm7 (beats 1–2) -> G7♭9 (beats 3–4) -> C6
     'F4', 0.65, 'C',   'A4', 0.35, 'C',   'B4', 0.65, 'C',  'A♭4', 0.35,'E♭',
     'G4', 0.65, 'C',   'E4', 0.35, 'C',   'C4', 1.0,  'C'
);

// 4. Chet Baker — Lyrical Altered Enclosure (Dm9 – G7♯9♭9 – C∆9) (65% swing: 0.65 / 0.35)
export const chetBakerAlteredEnclosureInC = createMelody('Chet Baker — Lyrical G7♯9♭9 to C∆9', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm9 — Dotted-quarter + swung 8th lyrical opening
     'E5', 1.65, 'C',   'C5', 0.35, 'C',   'A4', 1.0,  'C',   'F4', 1.0,  'C',
    // Bar 2: G7♯9♭9 — Rising B4 -> D5 -> F5 -> B♭5 (♯9) -> A♭5 (♭9) -> G5 -> F5 -> D♭5 (♭5)
     'B4', 0.65, 'C',   'D5', 0.35, 'C',   'F5', 0.65, 'C',  'B♭5', 0.35,'E♭',
    'A♭5', 0.65,'E♭',   'G5', 0.35,'E♭',   'F5', 0.65,'A♭',  'D♭5', 0.35,'A♭',
    // Bar 3: C∆9 — Resolving D♭5 -> C5 -> B4 -> G4 -> E4 -> D4
     'C5', 1.0,  'C',   'B4', 0.65, 'C',   'G4', 0.35, 'C',   'E4', 1.0,  'C',
     'D4', 1.0,  'C',
    // Bar 4: C∆9 — Resting on E4
     'E4', 4.0,  'C'
);

// 5. Altered & Passing Diminished Chord Voicings in C
export const alteredDiminishedChordsInC = createSequence('Altered & Passing Diminished Chords in C', 'C', 4, {},
    // Bar 1: C∆9 (2 beats) -> C♯°7 (2 beats)
    0.0,  'E4', 2.0, 'C',  0.0,  'G4', 2.0, 'C',  0.0,  'B4', 2.0, 'C',  0.0,  'D5', 2.0, 'C',
    2.0,  'E4', 2.0, 'D',  2.0,  'G4', 2.0, 'F',  2.0, 'B♭4', 2.0, 'F',  2.0, 'C♯5', 2.0, 'D',
    // Bar 2: Dm9 (2 beats) -> D♯°7 (2 beats)
    4.0,  'F4', 2.0, 'C',  4.0,  'A4', 2.0, 'C',  4.0,  'C5', 2.0, 'C',  4.0,  'E5', 2.0, 'C',
    6.0, 'F♯4', 2.0, 'G',  6.0,  'A4', 2.0, 'G',  6.0,  'C5', 2.0, 'G',  6.0, 'D♯5', 2.0, 'E',
    // Bar 3: Em9 (2 beats) -> A7♭9 (2 beats)
    8.0,  'G4', 2.0, 'G',  8.0,  'B4', 2.0, 'G',  8.0,  'D5', 2.0, 'G',  8.0, 'F♯5', 2.0, 'G',
   10.0,  'G4', 2.0, 'F', 10.0, 'B♭4', 2.0, 'F', 10.0, 'C♯5', 2.0, 'D', 10.0,  'E5', 2.0, 'D',
    // Bar 4: Dm9 (1 beat) -> G7alt (1 beat) -> C6/9 (2 beats)
   12.0,  'F4', 1.0, 'C', 12.0,  'A4', 1.0, 'C', 12.0,  'C5', 1.0, 'C', 12.0,  'E5', 1.0, 'C',
   13.0,  'F4', 1.0,'A♭', 13.0,  'B4', 1.0, 'C', 13.0, 'E♭5', 1.0,'A♭', 13.0, 'A♭5', 1.0,'A♭',
   14.0,  'E4', 2.0, 'C', 14.0,  'G4', 2.0, 'C', 14.0,  'A4', 2.0, 'C', 14.0,  'D5', 2.0, 'C'
);
