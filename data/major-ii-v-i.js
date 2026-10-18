import { createMelody, createSequence } from './create-data.js';

/**
 * Major II–V–I & Turnaround Phrases in C Major
 *
 * Authentic jazz vocabulary over Dm7 – G7 – C∆ (and C∆ – A7 – Dm7 – G7)
 * drawn from Sonny Rollins, Chet Baker, Wynton Marsalis, John Scofield,
 * Charlie Parker, and Bill Evans.
 * - Classic bop / cool examples (Rollins, Baker, Parker): 65% swing (0.65 / 0.35)
 * - Modern / neo-bop examples (Marsalis, Scofield):      60% swing (0.6 / 0.4)
 */

// 1. Sonny Rollins — "St. Thomas" / "Tenor Madness" style syncopated II–V–I in C (65% swing: 0.65 / 0.35)
export const rollinsIiVIInC = createMelody('Sonny Rollins — Major II–V–I in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm7 — 8th pickup from C♯4 into D4, arpeggiating Dm9 (D-F-A-C-E)
    null,  0.65, null, 'C♯4', 0.35, 'D',   'D4', 0.65, 'C',   'F4', 0.35, 'C',
     'A4', 0.65, 'C',   'C5', 0.35, 'C',   'E5', 0.65, 'C',   'D5', 0.35, 'C',
    // Bar 2: G7 — Chromatic enclosure around B4 (C5 - A♯4 - B4), bebop passing G♯4 -> A4 -> F4 -> D4
     'C5', 0.25, 'C',  'A♯4', 0.25, 'B',   'B4', 1.15, 'C',   'G4', 0.35, 'C',
    'G♯4', 0.65, 'A',   'A4', 0.35, 'C',   'F4', 0.65, 'C',   'D4', 0.35, 'C',
    // Bar 3: C∆ — Enclosure around E4 (F4 - D♯4 - E4) leaping to C5 - A4 - G4 motif
     'F4', 0.65, 'C',  'D♯4', 0.35, 'E',   'E4', 0.65, 'C',   'G4', 0.35, 'C',
     'C5', 1.0,  'C',   'A4', 0.65, 'C',   'G4', 0.35, 'C',
    // Bar 4: C6/9 — Rollins rhythmic tag (F♯4 -> G4 -> E4 -> C4)
    'F♯4', 0.65, 'G',   'G4', 0.35, 'C',   'E4', 1.0,  'C',   'C4', 2.0,  'C'
);

// 2. Chet Baker — "There Will Never Be Another You" lyrical West Coast II–V–I (65% swing: 0.65 / 0.35)
export const chetBakerIiVIInC = createMelody('Chet Baker — Lyrical II–V–I in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm9 — Entering on the 9th (E5), descending smoothly through Dm9
    null,  1.0,  null,  'E5', 1.0,  'C',   'D5', 0.65, 'C',   'C5', 0.35, 'C',
     'A4', 0.65, 'C',   'F4', 0.35, 'C',
    // Bar 2: G7♭9 — Rising through G7 (G4 - B4 - D5 - F5) to A♭5 (♭9), resolving down
     'G4', 0.65, 'C',   'B4', 0.35, 'C',   'D5', 0.65, 'C',   'F5', 0.35, 'C',
    'A♭5', 0.65,'E♭',   'G5', 0.35, 'C',   'F5', 0.65, 'C',  'D♯5', 0.35, 'E',
    // Bar 3: C∆9 — Landing on the 3rd (E5), cascading down C∆9 arpeggio (E5 - B4 - G4 - F4 - D♯4 - E4)
     'E5', 1.65, 'C',   'B4', 0.35, 'C',   'G4', 0.65, 'C',   'F4', 0.35, 'C',
    'D♯4', 0.65, 'E',   'E4', 0.35, 'C',
    // Bar 4: C∆9 — Resting on the 9th (D4 -> E4)
     'D4', 1.0,  'C',   'E4', 3.0,  'C'
);

// 3. Wynton Marsalis — Hard-Bop / "Cherokee" crisp neo-bop trumpet II–V–I (60% swing: 0.6 / 0.4)
export const wyntonIiVIInC = createMelody('Wynton Marsalis — Neo-Bop II–V–I in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm11 — Crisp swung 8ths & 16th turn starting from the 11th (G4) and 9th (E5)
     'G4', 0.6,  'C',   'A4', 0.4,  'C',   'C5', 0.6,  'C',   'E5', 0.4,  'C',
     'F5', 0.25, 'C',   'G5', 0.25, 'C',   'F5', 0.25, 'C',   'E5', 0.25, 'C',
     'D5', 0.6,  'C',   'A4', 0.4,  'C',
    // Bar 2: G7♭9 — Diminished 7th arpeggio (B4 - D5 - F5 - A♭5) + chromatic enclosure to E5
     'B4', 0.6,  'C',   'D5', 0.4,  'C',   'F5', 0.6,  'C',  'A♭5', 0.4, 'E♭',
     'G5', 0.6,  'C',   'F5', 0.4,  'C',  'D♯5', 0.6,  'E',   'F5', 0.4,  'C',
    // Bar 3: C∆9(♯11) — Resolving to E5, touching Lydian F♯5 before outlining G major upper triad
     'E5', 1.0,  'C',   'B4', 0.6,  'C',   'D5', 0.4,  'C',  'F♯5', 0.6,  'G',
     'G5', 0.4,  'C',   'D5', 0.6,  'C',   'B4', 0.4,  'C',
    // Bar 4: C∆ — Resolving on C5
     'C5', 4.0,  'C'
);

// 4. John Scofield — Angular Post-Bop / Quartal II–V–I in C (60% swing: 0.6 / 0.4)
export const scofieldIiVIInC = createMelody('John Scofield — Angular II–V–I in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: Dm11 — Quartal stacks (D4 - G4 - C5 - F5 - E5 - A4) with chromatic slip C♯4 -> D4
    null,  0.6,  null, 'C♯4', 0.2,  'D',   'D4', 0.2,  'C',   'G4', 0.6,  'C',
     'C5', 0.4,  'C',   'F5', 0.6,  'C',   'E5', 0.4,  'C',   'A4', 0.6,  'C',
     'D4', 0.4,  'C',
    // Bar 2: G13 — Slip-note A♯4 -> B4, 13th (E5), ♭9 (A♭4), and bluesy D♯4 -> E4 approach
    'A♯4', 0.25, 'B',   'B4', 0.75, 'C',   'E5', 0.6,  'C',   'F5', 0.4,  'C',
     'B4', 0.6,  'C',  'A♭4', 0.4, 'E♭',   'G4', 0.6,  'C',  'D♯4', 0.4,  'E',
    // Bar 3: C∆7(♯11) — Angular Lydian fifths/fourths (E4 - B4 - F♯5 - G5 - D5 - A4 - B4)
     'E4', 0.6,  'C',   'B4', 0.4,  'C',  'F♯5', 0.6,  'G',   'G5', 1.0,  'C',
     'D5', 0.4,  'C',   'A4', 0.6,  'C',   'B4', 0.4,  'C',
    // Bar 4: C∆ — Final slip D♯4 -> E4
    'D♯4', 0.25, 'E',   'E4', 3.75, 'C'
);

// 5. Charlie Parker — "Confirmation" / "Donna Lee" Bebop Turnaround (65% swing: 0.65 / 0.35)
export const parkerTurnaroundInC = createMelody('Charlie Parker — Bebop I–VI–II–V–I in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C∆ (beats 1–2) -> A7♭9 (beats 3–4: C♯5 - E5 - G5 - B♭5)
     'E5', 0.65, 'C',   'G5', 0.35, 'C',   'B4', 0.65, 'C',   'D5', 0.35, 'C',
    'C♯5', 0.65, 'D',   'E5', 0.35, 'D',   'G5', 0.65, 'F',  'B♭5', 0.35, 'F',
    // Bar 2: Dm7 (beats 1–2: A5 -> F5 -> D5 -> C5) -> G7♭9 (beats 3–4: B4 -> D5 -> F5 -> A♭5)
     'A5', 0.65, 'C',   'F5', 0.35, 'C',   'D5', 0.65, 'C',   'C5', 0.35, 'C',
     'B4', 0.65, 'C',   'D5', 0.35, 'C',   'F5', 0.65, 'C',  'A♭5', 0.35,'E♭',
    // Bar 3: C∆ — Chromatic enclosure around E5 (G5 - F5 - D♯5 - E5) down to C♯4
     'G5', 0.5,  'C',   'F5', 0.25, 'C',  'D♯5', 0.25, 'E',   'E5', 0.65, 'C',
     'C5', 0.35, 'C',   'G4', 0.65, 'C',   'E4', 0.35, 'C',   'D4', 0.65, 'C',
    'C♯4', 0.35, 'D',
    // Bar 4: Dm7 -> G7 -> C6 tag
     'D4', 0.65, 'C',   'F4', 0.35, 'C',   'B4', 0.65, 'C',   'D5', 0.35, 'C',
     'C5', 2.0,  'C'
);

// 6. Bill Evans — Rootless & Voice-Led I–VI–II–V–I Chords in C
export const billEvansIiVIChordsInC = createSequence('Bill Evans — Rootless II–V–I–VI Chords in C', 'C', 4, {},
    // Bar 1: Dm9 (2 beats) -> G13 (2 beats)
    0.0,  'F4', 2.0, 'C',  0.0,  'A4', 2.0, 'C',  0.0,  'C5', 2.0, 'C',  0.0,  'E5', 2.0, 'C',
    2.0,  'F4', 2.0, 'C',  2.0,  'A4', 2.0, 'C',  2.0,  'B4', 2.0, 'C',  2.0,  'E5', 2.0, 'C',
    // Bar 2: C∆9 (2 beats) -> A7♭13♭9 / Gø7 (2 beats)
    4.0,  'E4', 2.0, 'C',  4.0,  'G4', 2.0, 'C',  4.0,  'B4', 2.0, 'C',  4.0,  'D5', 2.0, 'C',
    6.0,  'G4', 2.0,'A♭',  6.0, 'B♭4', 2.0,'A♭',  6.0, 'D♭5', 2.0,'A♭',  6.0,  'F5', 2.0,'A♭',
    // Bar 3: Dm9 (2 beats) -> G13♭9 (2 beats)
    8.0,  'F4', 2.0, 'C',  8.0,  'A4', 2.0, 'C',  8.0,  'C5', 2.0, 'C',  8.0,  'E5', 2.0, 'C',
   10.0,  'F4', 2.0, 'C', 10.0, 'G♯4', 2.0, 'A', 10.0,  'B4', 2.0, 'A', 10.0,  'E5', 2.0, 'A',
    // Bar 4: C6/9 (4 beats)
   12.0,  'E4', 4.0, 'C', 12.0,  'G4', 4.0, 'C', 12.0,  'A4', 4.0, 'C', 12.0,  'D5', 4.0, 'C'
);
