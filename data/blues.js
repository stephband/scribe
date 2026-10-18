import { createMelody, createSequence } from './create-data.js';

/**
 * 12-Bar Jazz Blues & Bird Blues in C
 *
 * Authentic 12-bar blues choruses and comping voicings in C:
 * 1. Sonny Rollins — "Tenor Madness" / "Blue 7" 12-Bar Bop-Blues Chorus (65% swing: 0.65 / 0.35)
 * 2. Wynton Marsalis — New Orleans / Hard-Bop 12-Bar Blues Chorus (60% swing: 0.6 / 0.4)
 * 3. John Scofield — Funk-Jazz / Mixo-Blues 12-Bar Chorus (60% swing: 0.6 / 0.4)
 * 4. Charlie Parker / Chet Baker — "Blues for Alice" (Bird Blues in C, 65% swing: 0.65 / 0.35)
 * 5. 12-Bar Jazz Blues Comping Voicings (with F♯°7, A7♭9, Dm9 – G13)
 */

// 1. Sonny Rollins — "Tenor Madness" / "Blue 7" 12-Bar Bop-Blues in C (65% swing: 0.65 / 0.35)
export const rollinsBluesInC = createMelody('Sonny Rollins — 12-Bar Jazz Blues in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C7 — Classic Rollins blues pickup & riff (G4 - B♭4 - B♮4 - C5 - E4 - G4)
    null,  0.65, null,  'G4', 0.35, 'F',  'B♭4', 0.65, 'F',   'B4', 0.35, 'C',
     'C5', 1.0,  'C',   'E4', 0.65, 'C',   'G4', 0.35, 'F',
    // Bar 2: F7 — Answering on F7 (A4 - C5 - E♭5 - D5 - C5 - A4)
     'A4', 0.65, 'F',   'C5', 0.35,'B♭',  'E♭5', 1.0, 'B♭',   'D5', 0.65,'B♭',
     'C5', 0.35, 'F',   'A4', 1.0,  'F',
    // Bar 3: C7 — Bluesy D♯4 -> E4 -> G4 -> C5 -> A4 -> G4
    'D♯4', 0.65, 'E',   'E4', 0.35, 'C',   'G4', 0.65, 'C',   'C5', 0.35, 'C',
     'A4', 1.0,  'C',   'G4', 1.0,  'C',
    // Bar 4: Gm7 – C7♭9 — Setting up IV chord (B♭4 - D5 - F5 - E5 - D♭5 - C5 - B♭4)
    'B♭4', 0.65,'B♭',   'D5', 0.35,'B♭',   'F5', 0.65, 'F',   'E5', 0.35, 'F',
    'D♭5', 0.65,'A♭',   'C5', 0.35, 'F',  'B♭4', 1.0,  'F',
    // Bar 5: F7 — Landing on 3rd of F7 (A4), ascending F4 - A4 - C5 - E♭5 - F5
     'A4', 1.0,  'F',   'F4', 0.65, 'F',   'A4', 0.35, 'F',   'C5', 0.65,'B♭',
    'E♭5', 0.35,'B♭',   'F5', 1.0, 'B♭',
    // Bar 6: F♯°7 — Outlining F♯4 - A4 - C5 - E♭5 diminished arpeggio into G4
    'F♯4', 0.65, 'G',   'A4', 0.35, 'G',   'C5', 0.65,'E♭',  'E♭5', 0.35,'E♭',
    'F♯5', 0.65, 'G',  'E♭5', 0.35,'E♭',   'C5', 0.65, 'G',   'A4', 0.35, 'G',
    // Bar 7: C7/G — Resolving to G4 - E4 - C5 - B4 - B♭4 - A4
     'G4', 1.0,  'C',   'E4', 0.65, 'C',   'G4', 0.35, 'C',   'C5', 0.65, 'C',
     'B4', 0.35, 'C',  'B♭4', 0.65, 'F',   'A4', 0.35, 'F',
    // Bar 8: A7♭9 — C♯5 - E5 - G5 - B♭5 - A5 - G5 - E5 - C♯5 tonicizing Dm7
    'C♯5', 0.65, 'D',   'E5', 0.35, 'D',   'G5', 0.65, 'F',  'B♭5', 0.35, 'F',
     'A5', 0.65, 'D',   'G5', 0.35, 'D',   'E5', 0.65, 'D',  'C♯5', 0.35, 'D',
    // Bar 9: Dm7 — Landing on D5 -> F5 -> A5 -> G5 -> F5 -> D5 -> C5 -> A4
     'D5', 0.65, 'C',   'F5', 0.35, 'C',   'A5', 0.65, 'C',   'G5', 0.35, 'C',
     'F5', 0.65, 'C',   'D5', 0.35, 'C',   'C5', 0.65, 'C',   'A4', 0.35, 'C',
    // Bar 10: G7♭9 — B4 - D5 - F5 - A♭5 - G5 - F5 - D♯5 - D5
     'B4', 0.65, 'C',   'D5', 0.35, 'C',   'F5', 0.65, 'C',  'A♭5', 0.35,'E♭',
     'G5', 0.65, 'C',   'F5', 0.35, 'C',  'D♯5', 0.65, 'E',   'D5', 0.35, 'C',
    // Bar 11: C7 – A7 — C5 - G4 - E4 - G4 - C♯5 - E5 - G4 - B♭4
     'C5', 0.65, 'C',   'G4', 0.35, 'C',   'E4', 0.65, 'C',   'G4', 0.35, 'C',
    'C♯5', 0.65, 'D',   'E5', 0.35, 'D',   'G4', 0.65, 'F',  'B♭4', 0.35, 'F',
    // Bar 12: Dm7 – G7 -> C — A4 - F4 - D4 - B4 - C5
     'A4', 0.65, 'C',   'F4', 0.35, 'C',   'D4', 0.65, 'C',   'B4', 0.35, 'C',
     'C5', 2.0,  'C'
);

// 2. Wynton Marsalis — New Orleans / Hard-Bop 12-Bar Blues in C (60% swing: 0.6 / 0.4)
export const wyntonBluesInC = createMelody('Wynton Marsalis — Hard-Bop 12-Bar Blues in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C7 — Trumpet call with D♯5 -> E5 slip and B♭4 blue 7th
     'G4', 0.6,  'C',   'C5', 0.4,  'C',  'D♯5', 0.25, 'E',   'E5', 0.75, 'C',
     'C5', 0.6,  'F',  'B♭4', 0.4,  'F',   'G4', 1.0,  'C',
    // Bar 2: F7 — Answering phrase with E♭5 -> C5 -> A4
     'F4', 0.6,  'F',   'A4', 0.4,  'F',   'C5', 0.6, 'B♭',  'E♭5', 1.0, 'B♭',
     'C5', 0.4,  'F',   'A4', 1.0,  'F',
    // Bar 3: C7 — Blues turn F♯4 -> G4 -> E♭4 -> E♮4 -> C4
     'G4', 0.6,  'C',  'F♯4', 0.25, 'G',   'G4', 0.75, 'C',  'E♭4', 0.6, 'B♭',
     'E4', 0.4,  'C',   'C4', 1.4,  'C',
    // Bar 4: Gm7 – C7alt — Rising through Gm7 (G4-B♭4-D5-F5) and C7♯9♭13 (D♯5-E5-A♭5-G5)
     'G4', 0.6, 'B♭',  'B♭4', 0.4, 'B♭',   'D5', 0.6, 'B♭',   'F5', 0.4, 'B♭',
    'D♯5', 0.6,  'E',   'E5', 0.4,  'C',  'A♭5', 0.6, 'E♭',   'G5', 0.4, 'E♭',
    // Bar 5: F9 — Landing on G5 (9th of F9) -> E♭5 -> C5 -> A4 -> F4
     'G5', 1.0, 'B♭',  'E♭5', 0.6, 'B♭',   'C5', 0.4,  'F',   'A4', 0.6,  'F',
     'F4', 1.4,  'F',
    // Bar 6: F♯°7 — Diminished 7th climb (F♯4 -> A4 -> C5 -> E♭5 -> D5 -> C5)
    'F♯4', 0.6,  'G',   'A4', 0.4,  'G',   'C5', 0.6, 'E♭',  'E♭5', 1.0, 'E♭',
     'D5', 0.4,  'G',   'C5', 1.0,  'C',
    // Bar 7: C7/G — Syncopated E5 -> C5 -> B4 -> B♭4 -> A4 -> G4 -> E4
     'E5', 0.6,  'C',   'C5', 0.4,  'C',   'B4', 0.6,  'C',  'B♭4', 0.4,  'F',
     'A4', 0.6,  'C',   'G4', 0.4,  'C',   'E4', 1.0,  'C',
    // Bar 8: Em7♭5 – A7alt — B♭4 -> A4 -> G4 -> F5 -> E5 -> C♯5 -> A4
    'B♭4', 0.6,  'F',   'A4', 0.4,  'F',   'G4', 0.6,  'F',   'F5', 0.4,  'F',
     'E5', 0.6,  'D',  'C♯5', 0.4,  'D',   'A4', 1.0,  'D',
    // Bar 9: Dm9 — E5 -> F5 -> D5 -> A4 -> F4 -> D4
     'E5', 1.0,  'C',   'F5', 0.6,  'C',   'D5', 0.4,  'C',   'A4', 0.6,  'C',
     'F4', 0.4,  'C',   'D4', 1.0,  'C',
    // Bar 10: G7alt — B4 -> D♭5 -> E♭5 -> F5 -> A♭5 -> G5 -> F5 -> D♯5
     'B4', 0.6,  'C',  'D♭5', 0.4, 'A♭',  'E♭5', 0.6, 'A♭',   'F5', 0.4, 'A♭',
    'A♭5', 0.6, 'E♭',   'G5', 0.4,  'C',   'F5', 0.6,  'C',  'D♯5', 0.4,  'E',
    // Bar 11: C6 – A7♭9 — E5 -> C5 -> A4 -> G4 -> B♭4 -> C♯5 -> E5 -> G5
     'E5', 0.6,  'C',   'C5', 0.4,  'C',   'A4', 0.6,  'C',   'G4', 0.4,  'F',
    'B♭4', 0.6,  'F',  'C♯5', 0.4,  'D',   'E5', 0.6,  'D',   'G5', 0.4,  'C',
    // Bar 12: Dm7 – G7 -> C — F5 -> D5 -> B4 -> G4 -> C5
     'F5', 0.6,  'C',   'D5', 0.4,  'C',   'B4', 0.6,  'C',   'G4', 0.4,  'C',
     'C5', 2.0,  'C'
);

// 3. John Scofield — Funk-Jazz / Mixo-Blues 12-Bar Chorus in C (60% swing: 0.6 / 0.4)
export const scofieldFunkBluesInC = createMelody('John Scofield — Funk-Jazz 12-Bar Blues in C', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C7 — Syncopated Mixo-blues riff (D♯4 -> E4 -> G4 -> A4 -> B♭4 -> G4 -> E4 -> C4)
    null,  0.6,  null, 'D♯4', 0.2,  'E',   'E4', 0.2,  'C',   'G4', 0.6,  'C',
     'A4', 0.4,  'F',  'B♭4', 0.6,  'F',   'G4', 0.4,  'C',   'E4', 0.6,  'C',
     'C4', 0.4,  'C',
    // Bar 2: F7 — Sliding into F7 with F♯4 -> G4 -> F4 -> E♭4 -> C4 -> A3 -> B♭3
     'F4', 0.6,  'F',  'F♯4', 0.2,  'G',   'G4', 0.2,  'C',   'F4', 0.6, 'B♭',
    'E♭4', 0.4, 'B♭',   'C4', 0.6,  'F',   'A3', 0.4,  'F',  'B♭3', 0.6,  'F',
     'B3', 0.4,  'C',
    // Bar 3: C7 — Chromatic climb B3 -> C4 -> E4 -> G4 -> B♭4 -> B♮4 -> C5 -> E5
     'C4', 0.6,  'C',   'E4', 0.4,  'C',   'G4', 0.6,  'F',  'B♭4', 0.4,  'F',
     'B4', 0.6,  'C',   'C5', 0.4,  'C',   'E5', 1.0,  'C',
    // Bar 4: C7♯11 — Lydian dominant F♯5 -> G5 -> E5 -> B♭4 -> A4 -> G4
    'F♯5', 0.6,  'G',   'G5', 0.4,  'C',   'E5', 0.6,  'F',  'B♭4', 0.4,  'F',
     'A4', 0.6,  'C',   'G4', 1.4,  'C',
    // Bar 5: F7 — Quartal/bluesy IV-chord line (C5 - F5 - E♭5 - C5 - B4 - B♭4 - A4 - F4)
     'C5', 0.6,  'F',   'F5', 0.4, 'B♭',  'E♭5', 0.6, 'B♭',   'C5', 0.4,  'F',
     'B4', 0.6,  'C',  'B♭4', 0.4,  'F',   'A4', 0.6,  'F',   'F4', 0.4,  'F',
    // Bar 6: F7♯11 / F♯°7 — Angular diminished/tritone climb (F♯4 - C5 - E♭5 - A4 - D5 - C5)
    'F♯4', 0.6,  'G',   'C5', 0.4, 'E♭',  'E♭5', 0.6, 'E♭',   'A4', 0.4,  'G',
     'D5', 1.0,  'G',   'C5', 1.0,  'C',
    // Bar 7: C7 — Returning to tonic with D♯4 -> E4 slip and fourths (G4 - C5 - F5 - E5)
    'D♯4', 0.25, 'E',   'E4', 0.75, 'C',   'G4', 0.6,  'C',   'C5', 0.4,  'C',
     'F5', 0.6,  'C',   'E5', 0.4,  'C',   'C5', 1.0,  'C',
    // Bar 8: A7alt — Outside altered line (F5 - D♯5 - C♯5 - B♭4 - G4 - E4)
     'F5', 0.6,  'F',  'D♯5', 0.4,  'E',  'C♯5', 0.6,  'D',  'B♭4', 0.4,  'F',
     'G4', 1.0,  'F',   'E4', 1.0,  'D',
    // Bar 9: Dm7 — Dorian fourths (D4 - G4 - C5 - F5 - E5 - D5 - A4)
     'D4', 0.6,  'C',   'G4', 0.4,  'C',   'C5', 0.6,  'C',   'F5', 0.4,  'C',
     'E5', 0.6,  'C',   'D5', 0.4,  'C',   'A4', 1.0,  'C',
    // Bar 10: A♭7 -> G7alt — Tritone sub approach into altered V7 (E♭5 - D♭5 - C5 - B♭4 - A♭4 - G4 - F4 - B3)
    'E♭5', 0.6, 'A♭',  'D♭5', 0.4, 'A♭',   'C5', 0.6, 'A♭',  'B♭4', 0.4, 'E♭',
    'A♭4', 0.6, 'E♭',   'G4', 0.4,  'C',   'F4', 0.6,  'C',   'B3', 0.4,  'C',
    // Bar 11: C7 — Bluesy turnaround (C4 - E♭4 - E4 - G4 - B♭4 - C♯5 - D5 - E5)
     'C4', 0.6,  'C',  'E♭4', 0.4, 'B♭',   'E4', 0.6,  'C',   'G4', 0.4,  'F',
    'B♭4', 0.6,  'F',  'C♯5', 0.4,  'D',   'D5', 0.6,  'C',   'E5', 0.4,  'C',
    // Bar 12: Dm7 – G7♯9 -> C7 — F5 - D♯5 - E5 - C5
     'F5', 0.6,  'C',  'D♯5', 0.4,  'E',   'E5', 1.0,  'C',   'C5', 2.0,  'C'
);

// 4. Charlie Parker / Chet Baker — "Blues for Alice" (Bird Blues in C, 65% swing: 0.65 / 0.35)
export const birdBluesInC = createMelody('Charlie Parker — "Blues for Alice" (Bird Blues in C, 65% Swing)', 'C', 4, { swingAsStraight8ths: true },
    // Bar 1: C∆ — Descending major 7th line (G5 - E5 - C5 - B4 - A4 - G4 - E4)
     'G5', 1.0,  'C',   'E5', 0.65, 'C',   'C5', 0.35, 'C',   'B4', 0.65, 'C',
     'A4', 0.35, 'C',   'G4', 0.65, 'C',   'E4', 0.35, 'C',
    // Bar 2: Bm7♭5 (beats 1–2: F4 - A4 - B4 - D5) -> E7♭9 (beats 3–4: G♯4 - B4 - D5 - F5)
     'F4', 0.65, 'C',   'A4', 0.35, 'C',   'B4', 0.65, 'C',   'D5', 0.35, 'C',
    'G♯4', 0.65, 'A',   'B4', 0.35, 'A',   'D5', 0.65, 'C',   'F5', 0.35, 'C',
    // Bar 3: Am7 (beats 1–2: E5 - C5 - A4 - G4) -> D7 (beats 3–4: F♯4 - A4 - C5 - E♭5)
     'E5', 0.65, 'C',   'C5', 0.35, 'C',   'A4', 0.65, 'C',   'G4', 0.35, 'G',
    'F♯4', 0.65, 'G',   'A4', 0.35, 'G',   'C5', 0.65,'E♭',  'E♭5', 0.35,'E♭',
    // Bar 4: Gm7 (beats 1–2: D5 - B♭4 - G4 - F4) -> C7♭9 (beats 3–4: E4 - G4 - B♭4 - D♭5)
     'D5', 0.65,'B♭',  'B♭4', 0.35,'B♭',   'G4', 0.65, 'F',   'F4', 0.35, 'F',
     'E4', 0.65, 'F',   'G4', 0.35, 'F',  'B♭4', 0.65,'A♭',  'D♭5', 0.35,'A♭',
    // Bar 5: F7 — C5 - A4 - F4 - E♭4 - D4 - C4 - F4 - A4
     'C5', 0.65, 'F',   'A4', 0.35, 'F',   'F4', 0.65,'B♭',  'E♭4', 0.35,'B♭',
     'D4', 0.65,'B♭',   'C4', 0.35, 'F',   'F4', 0.65, 'F',   'A4', 0.35, 'F',
    // Bar 6: Fm7 (beats 1–2: A♭4 - C5 - E♭5 - D5) -> B♭7 (beats 3–4: F5 - A♭5 - G5 - F5)
    'A♭4', 0.65,'E♭',   'C5', 0.35,'E♭',  'E♭5', 0.65,'E♭',   'D5', 0.35,'E♭',
     'F5', 0.65,'E♭',  'A♭5', 0.35,'E♭',   'G5', 0.65,'E♭',   'F5', 0.35,'E♭',
    // Bar 7: Em7 (beats 1–2: E5 - B4 - G4 - B4) -> A7♭9 (beats 3–4: C♯5 - E5 - G5 - B♭5)
     'E5', 0.65, 'C',   'B4', 0.35, 'C',   'G4', 0.65, 'C',   'B4', 0.35, 'D',
    'C♯5', 0.65, 'D',   'E5', 0.35, 'D',   'G5', 0.65, 'F',  'B♭5', 0.35, 'F',
    // Bar 8: A♭m7 (beats 1–2: A♭5 - G♭5 - E♭5 - C♭5) -> D♭7 (beats 3–4: B♭4 - A♭4 - F4 - E♭4)
    'A♭5', 0.65,'G♭',  'G♭5', 0.35,'G♭',  'E♭5', 0.65,'G♭',  'C♭5', 0.35,'G♭',
    'B♭4', 0.65,'D♭',  'A♭4', 0.35,'D♭',   'F4', 0.65,'D♭',  'E♭4', 0.35,'D♭',
    // Bar 9: Dm7 — D4 - F4 - A4 - C5 - E5 - D5 - C5 - A4
     'D4', 0.65, 'C',   'F4', 0.35, 'C',   'A4', 0.65, 'C',   'C5', 0.35, 'C',
     'E5', 0.65, 'C',   'D5', 0.35, 'C',   'C5', 0.65, 'C',   'A4', 0.35, 'C',
    // Bar 10: G7♭9 — B4 - D5 - F5 - A♭5 - G5 - F5 - D♯5 - D5
     'B4', 0.65, 'C',   'D5', 0.35, 'C',   'F5', 0.65, 'C',  'A♭5', 0.35,'E♭',
     'G5', 0.65, 'C',   'F5', 0.35, 'C',  'D♯5', 0.65, 'E',   'D5', 0.35, 'C',
    // Bar 11: C∆ – A7♭9 — E5 - C5 - G4 - E4 - C♯4 - E4 - G4 - B♭4
     'E5', 0.65, 'C',   'C5', 0.35, 'C',   'G4', 0.65, 'C',   'E4', 0.35, 'D',
    'C♯4', 0.65, 'D',   'E4', 0.35, 'D',   'G4', 0.65, 'F',  'B♭4', 0.35, 'F',
    // Bar 12: Dm7 – G7 -> C∆ — A4 - F4 - D4 - B3 - C4
     'A4', 0.65, 'C',   'F4', 0.35, 'C',   'D4', 0.65, 'C',   'B3', 0.35, 'C',
     'C4', 2.0,  'C'
);

// 5. 12-Bar Jazz Blues Comping Voicings in C
export const bluesChordsInC = createSequence('12-Bar Jazz Blues Voicings in C', 'C', 4, {},
    // Bar 1: C13 (E4-A4-B♭4-D5)
    0.0,  'E4', 4.0, 'F',  0.0,  'A4', 4.0, 'F',  0.0, 'B♭4', 4.0, 'F',  0.0,  'D5', 4.0, 'F',
    // Bar 2: F9 (E♭4-G4-A4-C5)
    4.0, 'E♭4', 4.0,'B♭',  4.0,  'G4', 4.0,'B♭',  4.0,  'A4', 4.0, 'F',  4.0,  'C5', 4.0, 'F',
    // Bar 3: C13 (E4-A4-B♭4-D5)
    8.0,  'E4', 4.0, 'F',  8.0,  'A4', 4.0, 'F',  8.0, 'B♭4', 4.0, 'F',  8.0,  'D5', 4.0, 'F',
    // Bar 4: Gm9 (F4-A4-B♭4-D5) -> C7♭9 (E4-A4-B♭4-D♭5)
   12.0,  'F4', 2.0, 'F', 12.0,  'A4', 2.0, 'F', 12.0, 'B♭4', 2.0, 'F', 12.0,  'D5', 2.0, 'F',
   14.0,  'E4', 2.0, 'F', 14.0,  'A4', 2.0, 'F', 14.0, 'B♭4', 2.0,'A♭', 14.0, 'D♭5', 2.0,'A♭',
    // Bar 5: F9 (E♭4-G4-A4-C5)
   16.0, 'E♭4', 4.0,'B♭', 16.0,  'G4', 4.0,'B♭', 16.0,  'A4', 4.0, 'F', 16.0,  'C5', 4.0, 'F',
    // Bar 6: F♯°7 (F♯4-A4-C5-E♭5)
   20.0, 'F♯4', 4.0, 'G', 20.0,  'A4', 4.0, 'G', 20.0,  'C5', 4.0,'E♭', 20.0, 'E♭5', 4.0,'E♭',
    // Bar 7: C6/9 (E4-G4-A4-D5)
   24.0,  'E4', 4.0, 'C', 24.0,  'G4', 4.0, 'C', 24.0,  'A4', 4.0, 'C', 24.0,  'D5', 4.0, 'C',
    // Bar 8: Em7 (D4-G4-B4-E5) -> A7♭13♭9 / Gø7 (G4-B♭4-D♭5-F5)
   28.0,  'D4', 2.0, 'C', 28.0,  'G4', 2.0, 'C', 28.0,  'B4', 2.0, 'C', 28.0,  'E5', 2.0, 'C',
   30.0,  'G4', 2.0,'A♭', 30.0, 'B♭4', 2.0,'A♭', 30.0, 'D♭5', 2.0,'A♭', 30.0,  'F5', 2.0,'A♭',
    // Bar 9: Dm9 (F4-A4-C5-E5)
   32.0,  'F4', 4.0, 'C', 32.0,  'A4', 4.0, 'C', 32.0,  'C5', 4.0, 'C', 32.0,  'E5', 4.0, 'C',
    // Bar 10: G13♭9 (F4-G♯4-B4-E5)
   36.0,  'F4', 4.0, 'C', 36.0, 'G♯4', 4.0, 'A', 36.0,  'B4', 4.0, 'A', 36.0,  'E5', 4.0, 'A',
    // Bar 11: C6/9 (E4-G4-A4-D5) -> A7♭9 (G4-B♭4-C♯5-E5)
   40.0,  'E4', 2.0, 'C', 40.0,  'G4', 2.0, 'C', 40.0,  'A4', 2.0, 'C', 40.0,  'D5', 2.0, 'C',
   42.0,  'G4', 2.0, 'F', 42.0, 'B♭4', 2.0, 'F', 42.0, 'C♯5', 2.0, 'D', 42.0,  'E5', 2.0, 'D',
    // Bar 12: Dm9 (F4-A4-C5-E5) -> G13 (F4-A4-B4-E5)
   44.0,  'F4', 2.0, 'C', 44.0,  'A4', 2.0, 'C', 44.0,  'C5', 2.0, 'C', 44.0,  'E5', 2.0, 'C',
   46.0,  'F4', 2.0, 'C', 46.0,  'A4', 2.0, 'C', 46.0,  'B4', 2.0, 'C', 46.0,  'E5', 2.0, 'C'
);
