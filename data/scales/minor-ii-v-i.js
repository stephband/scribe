import { createMelody, createSequence } from '../create-data.js';

/**
 * Minor II–V–I Phrases & Chord Progressions (in Key Signature 'C')
 *
 * Covers both:
 * - Tonic/parallel minor in C: Dm7♭5 – G7♭9/alt – Cm(∆7/6)
 * - Relative minor in C:       Bm7♭5 – E7♭9/alt – Am(∆7/6)
 *
 * - Classic bop / cool examples (Baker, Rollins):  65% swing (0.65 / 0.35)
 * - Modern / neo-bop examples (Marsalis, Scofield): 60% swing (0.6 / 0.4)
 */

// 1. Chet Baker — "My Funny Valentine" / "Alone Together" Minor II–V–I in Cm (65% swing: 0.65 / 0.35)
export const chetBakerMinorIiVIInCm = createMelody('Chet Baker — Minor II–V–I in Cm', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm7♭5 — Lyrical pickup and descending half-diminished arpeggio (C5 - A♭4 - G4 - F4 - D4)
    null,  1.0,  null,  'C5', 1.0, 'E♭', 'A♭4', 0.65,'E♭',   'G4', 0.35,'E♭',
     'F4', 0.65,'E♭',   'D4', 0.35,'E♭',
    // Bar 2: G7♭9 — Rising B♮3 -> D4 -> F4 -> A♭4 -> G4 with F♯4 chromatic neighbor
     'B3', 0.65, 'C',   'D4', 0.35, 'C',   'F4', 0.65,'E♭',  'A♭4', 0.35,'E♭',
     'G4', 0.65, 'C',  'F♯4', 0.35, 'G',   'G4', 0.65,'E♭',   'D5', 0.35,'E♭',
    // Bar 3: Cm -> Cm(∆7) — C5 (1.65) -> E♭4 (0.35) -> G4 (0.65) -> B♮4 (1.35)
     'C5', 1.65,'E♭',  'E♭4', 0.35,'E♭',   'G4', 0.65, 'G',   'B4', 1.35, 'G',
    // Bar 4: Cm7 -> Cm6 — B♭4 (1.65) -> E♭4 (0.35) -> G4 (0.65) -> A♮4 (1.35)
    'B♭4', 1.65,'E♭',  'E♭4', 0.35,'E♭',   'G4', 0.65,'B♭',   'A4', 1.35,'B♭'
);

// 2. Sonny Rollins — "Softly, as in a Morning Sunrise" / "Airegin" Minor II–V–I in Cm (65% swing: 0.65 / 0.35)
export const rollinsMinorIiVIInCm = createMelody('Sonny Rollins — Bebop Minor II–V–I in Cm', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm7♭5 — Arpeggiating D4 - F4 - A♭4 - C5 - D5 - C5 - A♭4 - F4
     'D4', 0.65,'E♭',   'F4', 0.35,'E♭',  'A♭4', 0.65,'E♭',   'C5', 0.35,'E♭',
     'D5', 0.65,'E♭',   'C5', 0.35,'E♭',  'A♭4', 0.65,'E♭',   'F4', 0.35,'E♭',
    // Bar 2: G7♭9 — Enclosure around B4 (A♭4 - F♯4 - G4 - B4) up to A♭5 -> G5 -> F5 -> D5
    'A♭4', 0.65,'E♭',  'F♯4', 0.35, 'G',   'G4', 0.65, 'C',   'B4', 0.35, 'C',
     'D5', 0.65, 'C',  'A♭5', 0.35,'E♭',   'G5', 0.65,'E♭',   'F5', 0.35,'E♭',
    // Bar 3: Cm∆9 — Landing on E♭5, descending to B♮4 leading tone and rising through C melodic minor
    'E♭5', 1.0, 'E♭',   'D5', 0.65,'E♭',   'C5', 0.35,'E♭',   'B4', 0.65, 'G',
     'C5', 0.35,'B♭',   'A4', 0.65,'B♭',   'G4', 0.35,'B♭',
    // Bar 4: Cm6 — Resolving on E♭4 -> C4
    'E♭4', 1.0, 'E♭',   'C4', 3.0, 'E♭'
);

// 3. Wynton Marsalis — Relative Minor II–V–I in Am (Bm7♭5 – E7alt – Am∆9) (60% swing: 0.6 / 0.4)
export const wyntonMinorIiVIInAm = createMelody('Wynton Marsalis — Relative Minor II–V–I in Am', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Bm7♭5 — Starting on F5 -> D5 -> B4 -> A4, rising through C♯5 (Locrian ♮2 = D melodic minor)
     'F5', 0.6,  'C',   'D5', 0.4,  'C',   'B4', 0.6,  'C',   'A4', 0.4,  'C',
     'B4', 0.6,  'D',  'C♯5', 0.4,  'D',   'D5', 0.6,  'C',   'F5', 0.4,  'C',
    // Bar 2: E7alt (♯9 ♭9 ♭13) — G5 (♯9) -> F5 (♭9) -> E5 -> D5 -> C5 (♭13) -> B4 -> G♯4 -> B4
     'G5', 0.6,  'C',   'F5', 0.4,  'C',   'E5', 0.6,  'C',   'D5', 0.4,  'C',
     'C5', 0.6,  'C',   'B4', 0.4,  'A',  'G♯4', 0.6,  'A',   'B4', 0.4,  'A',
    // Bar 3: Am(∆9) — Resolving to C5 and outlining A melodic minor (A4 - B4 - C5 - E5 - F♯5 - G♯5 - A5)
     'C5', 1.0,  'C',   'A4', 0.6,  'C',   'B4', 0.4,  'C',   'E5', 0.6,  'A',
    'F♯5', 0.4,  'A',  'G♯5', 0.6,  'A',   'A5', 0.4,  'A',
    // Bar 4: Am(∆9) — Sustained 9th (B5 -> E5)
     'B5', 1.6,  'A',   'E5', 2.4,  'C'
);

// 4. John Scofield — Modern Melodic Minor II–V–I in Cm (Dm7♭5 – G7alt – Cm∆9) (60% swing: 0.6 / 0.4)
export const scofieldMelodicMinorIiVIInCm = createMelody('John Scofield — Modern Minor II–V–I in Cm', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm7♭5 (♮9) — F melodic minor (D4 - E4 - F4 - A♭4 - C5 - E5 - D5 - A♭4)
     'D4', 0.6,  'C',   'E4', 0.4,  'C',   'F4', 0.6, 'E♭',  'A♭4', 0.4, 'E♭',
     'C5', 0.6, 'E♭',   'E5', 0.4,  'C',   'D5', 0.6, 'E♭',  'A♭4', 0.4, 'E♭',
    // Bar 2: G7alt — A♭ melodic minor (B♭4 - A♭4 - G4 - F4 - E♭4 - D♭4 - B♮3 - D♭4)
    'B♭4', 0.6, 'E♭',  'A♭4', 0.4, 'E♭',   'G4', 0.6, 'E♭',   'F4', 0.4, 'A♭',
    'E♭4', 0.6, 'A♭',  'D♭4', 0.4, 'A♭',   'B3', 0.6,  'C',  'D♭4', 0.4, 'A♭',
    // Bar 3: Cm∆9 — Resolving D♭4 -> C4, ascending C melodic minor fourths/thirds (E♭4 - A4 - D5 - G5 - B4)
     'C4', 0.6, 'E♭',  'E♭4', 0.4, 'B♭',   'A4', 0.6, 'B♭',   'D5', 0.4,  'G',
     'G5', 1.0,  'G',   'B4', 0.6,  'G',   'D5', 0.4, 'B♭',
    // Bar 4: Cm∆9 — Ending on E♭5
    'E♭5', 4.0, 'E♭'
);

// 5. Minor II–V–I Chord Voicings (Cm and Am in Key 'C')
export const minorIiVIChordsInC = createSequence('Minor II–V–I Voicings in Cm & Am', 'C', 4, {},
    // Bar 1: Dm7♭5 (2 beats) -> G7♭13♭9 (2 beats)
    0.0,  'F4', 2.0,'E♭',  0.0, 'A♭4', 2.0,'E♭',  0.0,  'C5', 2.0,'E♭',  0.0,  'D5', 2.0,'E♭',
    2.0,  'F4', 2.0, 'C',  2.0, 'A♭4', 2.0,'E♭',  2.0,  'B4', 2.0, 'C',  2.0, 'E♭5', 2.0,'E♭',
    // Bar 2: Cm6/9 (4 beats)
    4.0, 'E♭4', 4.0,'B♭',  4.0,  'G4', 4.0,'B♭',  4.0,  'A4', 4.0,'B♭',  4.0,  'D5', 4.0,'B♭',
    // Bar 3: Bm7♭5 (2 beats) -> E7♯9♭13 (2 beats)
    8.0,  'D4', 2.0, 'C',  8.0,  'F4', 2.0, 'C',  8.0,  'A4', 2.0, 'C',  8.0,  'B4', 2.0, 'C',
   10.0,  'D4', 2.0, 'A', 10.0, 'G♯4', 2.0, 'A', 10.0,  'C5', 2.0, 'C', 10.0,  'G5', 2.0, 'C',
    // Bar 4: Am∆9 (4 beats)
   12.0,  'C4', 4.0, 'C', 12.0,  'E4', 4.0, 'A', 12.0, 'G♯4', 4.0, 'A', 12.0,  'B4', 4.0, 'A'
);
