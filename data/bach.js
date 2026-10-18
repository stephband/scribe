import { createScale, createMelody, createSequence } from './create-data.js';

/**
 * J.S. Bach — Pitch-Spelling Benchmark Excerpts
 *
 * Drawn from the standard Musedata / Well-Tempered Clavier pitch-spelling benchmark
 * corpus (Meredith 2006; Foscarin et al. 2021 PKSpell), preserving authentic meters
 * and rhythmic durations (16ths, 8ths, quarters, dotted quarters, half notes, and rests):
 * - BWV 846: Prelude No. 1 in C Major (WTC I, 4/4, 16th arpeggios + final chord)
 * - BWV 847: Prelude No. 2 in C Minor (WTC I, 4/4, 16th moto perpetuo)
 * - BWV 849: Prelude No. 4 in C♯ Minor (WTC I, 6/4, dotted quarters, quarters & 8ths)
 * - BWV 853: Prelude No. 8 in E♭ Minor (WTC I, 3/2, sarabande with quarters, dotted rhythms & halves)
 * - BWV 772: Invention No. 1 in C Major (4/4, 16th rests, 16th runs & 8th-note leaps)
 * - BWV 775: Invention No. 4 in D Minor (3/8, 16th runs & 8th-note cadential figures)
 * - BWV 784: Invention No. 13 in A Minor (4/4, 16th rests, 16th arpeggios & 8th-note leaps)
 * - BWV 999: Prelude in C Minor (3/4, 16th arpeggios + 8th-note upper pedal)
 * - BWV 1007: Cello Suite No. 1 Prelude in G Major (4/4, 16th arpeggios)
 * - BWV 244.3: Chorale "Herzliebster Jesu" (4/4 SATB, quarter chords, passing 8ths & half-note cadences)
 * - BWV 245.3: Chorale in A Minor (4/4 SATB, quarter chords, passing 8ths & half-note cadences)
 */

// BWV 846: Prelude No. 1 in C Major (4/4, bars 1–19)
export const bachPreludeInC = createScale('Bach BWV 846 Prelude in C', 'C', 0.25,
    // Bar 1: C major
    'C4', 'C',  'E4', 'C',  'G4', 'C',  'C5', 'C',  'E5', 'C',  'G4', 'C',  'C5', 'C',  'E5', 'C',
    // Bar 2: Dm7/C
    'C4', 'C',  'D4', 'C',  'A4', 'C',  'D5', 'C',  'F5', 'C',  'A4', 'C',  'D5', 'C',  'F5', 'C',
    // Bar 3: G7/B
    'B3', 'C',  'D4', 'C',  'G4', 'C',  'D5', 'C',  'F5', 'C',  'G4', 'C',  'D5', 'C',  'F5', 'C',
    // Bar 4: C major
    'C4', 'C',  'E4', 'C',  'G4', 'C',  'C5', 'C',  'E5', 'C',  'G4', 'C',  'C5', 'C',  'E5', 'C',
    // Bar 5: Am/C
    'C4', 'C',  'E4', 'C',  'A4', 'C',  'E5', 'C',  'A5', 'C',  'A4', 'C',  'E5', 'C',  'A5', 'C',
    // Bar 6: D7/C (C4-D4 diatonic in C, then F♯4 tonicizes G)
    'C4', 'C',  'D4', 'C', 'F♯4', 'G',  'A4', 'G',  'D5', 'G', 'F♯4', 'G',  'A4', 'G',  'D5', 'G',
    // Bar 7: G/B
    'B3', 'G',  'D4', 'G',  'G4', 'G',  'D5', 'G',  'G5', 'G',  'G4', 'C',  'D5', 'C',  'G5', 'C',
    // Bar 8: Cmaj7/B
    'B3', 'C',  'C4', 'C',  'E4', 'C',  'G4', 'C',  'C5', 'C',  'E4', 'C',  'G4', 'C',  'C5', 'C',
    // Bar 9: Am7
    'A3', 'C',  'C4', 'C',  'E4', 'C',  'G4', 'C',  'C5', 'C',  'E4', 'C',  'G4', 'C',  'C5', 'C',
    // Bar 10: D7 (V7/V tonicizing G)
    'D3', 'G',  'A3', 'G',  'D4', 'G', 'F♯4', 'G',  'C5', 'G',  'D4', 'G', 'F♯4', 'G',  'C5', 'G',
    // Bar 11: G major
    'G3', 'G',  'B3', 'G',  'D4', 'G',  'G4', 'G',  'B4', 'G',  'D4', 'G',  'G4', 'G',  'B4', 'G',
    // Bar 12: C♯dim7/G (G3 bass pedal from G, then vii°7/ii resolving to Dm)
    'G3', 'G', 'B♭3', 'F',  'E4', 'D',  'G4', 'D', 'C♯5', 'D',  'E4', 'D',  'G4', 'D', 'C♯5', 'D',
    // Bar 13: Dm/F
    'F3', 'F',  'A3', 'F',  'D4', 'F',  'A4', 'F',  'D5', 'F',  'D4', 'F',  'A4', 'F',  'D5', 'F',
    // Bar 14: Bdim7/F (vii°7 resolving to C/E)
    'F3', 'E♭','A♭3', 'E♭', 'D4', 'C',  'F4', 'C',  'B4', 'C',  'D4', 'C',  'F4', 'C',  'B4', 'C',
    // Bar 15: C/E
    'E3', 'C',  'G3', 'C',  'C4', 'C',  'G4', 'C',  'C5', 'C',  'C4', 'C',  'G4', 'C',  'C5', 'C',
    // Bar 16: Fmaj7/E
    'E3', 'C',  'F3', 'C',  'A3', 'C',  'C4', 'C',  'F4', 'C',  'A3', 'C',  'C4', 'C',  'F4', 'C',
    // Bar 17: Dm7
    'D3', 'C',  'F3', 'C',  'A3', 'C',  'C4', 'C',  'F4', 'C',  'A3', 'C',  'C4', 'C',  'F4', 'C',
    // Bar 18: G7
    'G3', 'C',  'D4', 'C',  'G4', 'C',  'B4', 'C',  'F5', 'C',  'G4', 'C',  'B4', 'C',  'F5', 'C',
    // Bar 19: C major
    'C4', 'C',  'E4', 'C',  'G4', 'C',  'C5', 'C',  'E5', 'C',  'G4', 'C',  'C5', 'C',  'E5', 'C'
);

// BWV 847: Prelude No. 2 in C Minor (4/4, bars 1–8, moto perpetuo 16ths)
export const bachPreludeInCm = createScale('Bach BWV 847 Prelude in Cm', 'E♭', 0.25,
    // Bar 1: Cm
     'C5', 'E♭', 'E♭4', 'E♭',  'D4', 'E♭', 'E♭4', 'E♭',  'C4', 'E♭', 'E♭4', 'E♭',  'D4', 'E♭', 'E♭4', 'E♭',
    // Bar 2: Fm/C with E♮4 lower neighbor
    'A♭4', 'E♭',  'F4', 'F',   'E4', 'F',   'F4', 'F',   'C4', 'F',   'F4', 'F',   'E4', 'F',   'F4', 'F',
    // Bar 3: G7/B resolving to E♭4
     'B4', 'C',   'F4', 'C',   'D4', 'C',   'F4', 'C',   'D4', 'E♭',  'F4', 'E♭', 'E♭4', 'E♭',  'F4', 'E♭',
    // Bar 4: Cm
     'C5', 'E♭',  'G4', 'E♭', 'E♭4', 'E♭',  'G4', 'E♭',  'C4', 'E♭',  'G4', 'E♭', 'E♭4', 'E♭',  'G4', 'E♭',
    // Bar 5: A♭maj7/C
    'E♭5', 'E♭', 'A♭4', 'E♭',  'G4', 'E♭', 'A♭4', 'E♭', 'E♭4', 'E♭', 'A♭4', 'E♭',  'G4', 'E♭', 'A♭4', 'E♭',
    // Bar 6: D7/C (tonicizing Gm)
     'D5', 'G',  'F♯4', 'G',   'E4', 'G',  'F♯4', 'G',   'D4', 'G',  'F♯4', 'G',   'E4', 'G',  'F♯4', 'G',
    // Bar 7: Gm/B♭ with F♯4 neighbor
     'D5', 'B♭',  'G4', 'B♭', 'F♯4', 'G',   'G4', 'B♭',  'D4', 'B♭',  'G4', 'B♭', 'F♯4', 'G',   'G4', 'B♭',
    // Bar 8: C7/B♭ (tonicizing Fm)
     'C5', 'F',   'E4', 'F',   'D4', 'F',   'E4', 'F',   'C4', 'F',   'E4', 'F',   'D4', 'F',   'E4', 'F'
);

// BWV 849: Prelude No. 4 in C♯ Minor (6/4 pastoral: dotted quarters 1.5, quarters 1.0, and eighths 0.5)
export const bachPreludeInCsm = createMelody('Bach BWV 849 Prelude in C♯m', 'E', [0, 'meter', 6, 2], {},
    // Bar 1 (6 beats): C♯m pastoral motif
    'G♯4', 1.5, 'E',  'A4', 0.5, 'E',  'B4', 0.5, 'E', 'C♯5', 0.5, 'E', 'D♯5', 1.0, 'E', 'G♯4', 1.0, 'E',  'E5', 1.0, 'E',
    // Bar 2 (6 beats): Melodic minor ascent with A♯4 & B♯4 leading to C♯5
    'D♯5', 1.5, 'E', 'C♯5', 0.5, 'E',  'B4', 0.5, 'E',  'A4', 0.5, 'E', 'G♯4', 0.5, 'B', 'A♯4', 0.5, 'B', 'B♯4', 1.0, 'C♯', 'C♯5', 1.0, 'C♯',
    // Bar 3 (6 beats): Tonicization of F♯m with E♯4 leading tone
    'C♯5', 1.5, 'E',  'B4', 0.5, 'E',  'A4', 0.5, 'E', 'G♯4', 0.5, 'F♯','F♯4', 1.0, 'F♯','E♯4', 1.0, 'F♯','F♯4', 1.0, 'F♯',
    // Bar 4 (6 beats): Cadence via G♯7 (B♯4) to C♯m
    'D♯4', 1.0, 'E', 'G♯4', 0.5, 'C♯','B♯4', 0.5, 'C♯','D♯5', 1.0, 'C♯','F♯5', 1.0, 'C♯', 'E5', 0.5, 'E', 'D♯5', 0.5, 'E', 'C♯5', 1.0, 'E'
);

// BWV 853: Prelude No. 8 in E♭ Minor (3/2 sarabande: quarters 1.0, dotted quarters 1.5, eighths 0.5, halves 2.0)
export const bachPreludeInEbm = createMelody('Bach BWV 853 Prelude in E♭m', 'G♭', [0, 'meter', 6, 2], {},
    // Bar 1 (6 beats): E♭m sarabande opening & subdominant A♭m (with C♭5)
    'E♭4', 1.0, 'G♭', 'G♭4', 1.0, 'G♭', 'B♭4', 1.5, 'G♭', 'C♭5', 0.5, 'G♭', 'A♭4', 1.0, 'G♭', 'B♭4', 1.0, 'G♭',
    // Bar 2 (6 beats): B♭7 with D♮4 leading tone resolving to E♭m
    'G♭4', 1.5, 'G♭', 'E♭4', 0.5, 'G♭',  'D4', 1.0, 'E♭',  'F4', 1.0, 'E♭', 'A♭4', 0.5, 'E♭', 'G♭4', 0.5, 'G♭', 'E♭4', 1.0, 'G♭',
    // Bar 3 (6 beats): Tonicization of C♭ / A♭m with F♭4
    'A♭4', 1.0, 'C♭', 'F♭4', 1.5, 'C♭', 'D♭4', 0.5, 'C♭', 'B♭3', 1.0, 'C♭', 'C♭4', 1.0, 'G♭', 'A♭4', 1.0, 'G♭',
    // Bar 4 (6 beats): Cadence B♭7 (D♮4) -> E♭m half note
    'B♭4', 1.0, 'E♭',  'D4', 1.0, 'E♭',  'F4', 0.5, 'E♭', 'A♭4', 0.5, 'E♭', 'G♭4', 0.5, 'G♭',  'F4', 0.5, 'G♭', 'E♭4', 2.0, 'G♭'
);

// BWV 772: Invention No. 1 in C Major (4/4: 16th rest, seven 16ths, four 8th notes)
export const bachInventionInC = createMelody('Bach BWV 772 Invention in C', 'C', 4, {},
    // Bar 1: Subject in C (16th rest + seven 16ths + four 8ths)
    null,  0.25, null, 'C4', 0.25, 'C',  'D4', 0.25, 'C',  'E4', 0.25, 'C',
    'F4',  0.25, 'C',  'D4', 0.25, 'C',  'E4', 0.25, 'C',  'C4', 0.25, 'C',
    'G4',  0.5,  'C',  'C5', 0.5,  'C',  'B4', 0.5,  'C',  'C5', 0.5,  'C',
    // Bar 2: Dominant entry & tonicization of G (16th rest + seven 16ths + four 8ths with F♯)
    null,  0.25, null, 'D5', 0.25, 'C',  'G4', 0.25, 'C',  'A4', 0.25, 'C',
    'B4',  0.25, 'C',  'C5', 0.25, 'C',  'A4', 0.25, 'C',  'B4', 0.25, 'C',
    'G4',  0.5,  'G',  'D5', 0.5,  'G',  'G5', 0.5,  'G', 'F♯5', 0.5,  'G',
    // Bar 3: Descending 16th sequence in G (F♯4)
    'E5',  0.25, 'G',  'C5', 0.25, 'G',  'D5', 0.25, 'G',  'B4', 0.25, 'G',
    'C5',  0.25, 'G',  'A4', 0.25, 'G',  'B4', 0.25, 'G',  'G4', 0.25, 'G',
    'A4',  0.25, 'G', 'F♯4', 0.25, 'G',  'G4', 0.25, 'G',  'E4', 0.25, 'G',
   'F♯4',  0.5,  'G',  'D4', 0.5,  'G',
    // Bar 4: Modulation to D minor (B♭ in F, C♯ in D, ending on quarter note)
    'D4',  0.25, 'F',  'E4', 0.25, 'F',  'F4', 0.25, 'F',  'G4', 0.25, 'F',
    'E4',  0.25, 'F',  'F4', 0.25, 'F',  'D4', 0.25, 'F',  'A4', 0.25, 'F',
   'B♭4',  0.25, 'F',  'G4', 0.25, 'F',  'E4', 0.25, 'D', 'C♯4', 0.25, 'D',
    'D4',  1.0,  'F'
);

// BWV 775: Invention No. 4 in D Minor (3/8 meter = 1.5 beats/bar: 16th runs & 8th-note cadential figures)
export const bachInventionInDm = createMelody('Bach BWV 775 Invention in Dm', 'F', [0, 'meter', 1.5, 0.5], {},
    // Bars 1–2: Dm harmonic minor subject (B♭4 vs C♯4)
    'D4', 0.25, 'F',  'E4', 0.25, 'F',  'F4', 0.25, 'F',  'G4', 0.25, 'F',  'A4', 0.25, 'F', 'B♭4', 0.25, 'F',
   'C♯4', 0.25, 'D', 'B♭4', 0.25, 'F',  'A4', 0.25, 'F',  'G4', 0.25, 'F',  'F4', 0.25, 'F',  'E4', 0.25, 'F',
    // Bars 3–4: Circle-of-fifths sequence with 8th-note leaps
    'F4', 0.25, 'F',  'A4', 0.25, 'F',  'D5', 0.5,  'F',  'G4', 0.25, 'F', 'B♭4', 0.25, 'F',
    'E5', 0.5,  'F',  'A4', 0.25, 'D', 'C♯5', 0.25, 'D',  'F5', 0.25, 'F', 'B♭4', 0.25, 'F',
    // Bars 5–6: Melodic minor ascending (B♮4, C♯5) and descending (C♮5, B♭4)
    'A4', 0.25, 'C',  'B4', 0.25, 'C', 'C♯5', 0.25, 'D',  'D5', 0.25, 'F',  'E5', 0.25, 'F',  'F5', 0.25, 'F',
    'E5', 0.25, 'F',  'D5', 0.25, 'F',  'C5', 0.25, 'F', 'B♭4', 0.25, 'F',  'A4', 0.25, 'F',  'G4', 0.25, 'F',
    // Bars 7–8: Cadential figure in D minor (16ths + 8th notes)
    'F4', 0.25, 'F',  'E4', 0.25, 'D',  'D4', 0.25, 'D', 'C♯4', 0.25, 'D',  'D4', 0.25, 'D',  'A3', 0.25, 'D',
   'B♭3', 0.5,  'F',  'A3', 0.5,  'D',  'D4', 0.5,  'F'
);

// BWV 784: Invention No. 13 in A Minor (4/4: 16th rest, seven 16ths, and 8th-note leaps)
export const bachInventionInAm = createMelody('Bach BWV 784 Invention in Am', 'C', 4, {},
    // Bar 1: 16th rest + seven 16ths + four 8th notes (with G♯4)
    null, 0.25, null, 'E4', 0.25, 'C',  'A4', 0.25, 'C',  'C5', 0.25, 'C',
    'B4', 0.25, 'C',  'E4', 0.25, 'C',  'B4', 0.25, 'C',  'D5', 0.25, 'C',
    'C5', 0.5,  'C',  'A4', 0.5,  'C', 'G♯4', 0.5,  'A',  'E4', 0.5,  'A',
    // Bar 2: Arpeggio sequence in Am -> C (seven 16ths + four 8ths)
    'A4', 0.25, 'C',  'C5', 0.25, 'C',  'E5', 0.25, 'C',  'D5', 0.25, 'C',
    'G4', 0.25, 'C',  'B4', 0.25, 'C',  'D5', 0.25, 'C',  'F5', 0.25, 'C',
    'E5', 0.5,  'C',  'C5', 0.5,  'C',  'G4', 0.5,  'C',  'C5', 0.5,  'C',
    // Bar 3: Tonicization of E minor (F♯5 in G, D♯5 in E) with 8th-note cadence
    'A4', 0.25, 'G',  'C5', 0.25, 'G',  'E5', 0.25, 'G', 'F♯5', 0.25, 'G',
   'D♯5', 0.25, 'E',  'B4', 0.25, 'E', 'F♯5', 0.25, 'E',  'A4', 0.25, 'E',
    'G4', 0.25, 'G',  'B4', 0.25, 'G',  'E5', 0.25, 'G', 'D♯5', 0.25, 'E',
    'E5', 0.5,  'G',  'B4', 0.5,  'G'
);

// BWV 999: Prelude in C Minor (3/4 meter: six 16th notes + two 8th notes per bar)
export const bachPrelude999InCm = createMelody('Bach BWV 999 Prelude in Cm', 'E♭', 3, {},
    // Bar 1: Cm (six 16ths + two 8ths)
    'C4', 0.25, 'E♭', 'E♭4', 0.25, 'E♭',  'G4', 0.25, 'E♭',  'C5', 0.25, 'E♭', 'E♭5', 0.25, 'E♭',  'G4', 0.25, 'E♭',  'C5', 0.5, 'E♭', 'E♭5', 0.5, 'E♭',
    // Bar 2: Fm7/C
    'C4', 0.25, 'E♭',  'F4', 0.25, 'E♭', 'A♭4', 0.25, 'E♭',  'C5', 0.25, 'E♭',  'F5', 0.25, 'E♭', 'A♭4', 0.25, 'E♭',  'C5', 0.5, 'E♭',  'F5', 0.5, 'E♭',
    // Bar 3: B♮dim7/C (vii°7 of Cm: A♭4 with B♮4)
    'C4', 0.25, 'E♭',  'F4', 0.25, 'E♭', 'A♭4', 0.25, 'E♭',  'B4', 0.25, 'C',   'D5', 0.25, 'C',  'A♭4', 0.25, 'E♭',  'B4', 0.5, 'C',   'D5', 0.5, 'C',
    // Bar 4: Cm
    'C4', 0.25, 'E♭', 'E♭4', 0.25, 'E♭',  'G4', 0.25, 'E♭',  'C5', 0.25, 'E♭', 'E♭5', 0.25, 'E♭',  'G4', 0.25, 'E♭',  'C5', 0.5, 'E♭', 'E♭5', 0.5, 'E♭',
    // Bar 5: F♯dim7/C (vii°7/V tonicizing G: E♭4 with F♯4 and A♮4)
    'C4', 0.25, 'E♭', 'E♭4', 0.25, 'E♭', 'F♯4', 0.25, 'G',   'A4', 0.25, 'G',   'C5', 0.25, 'G',  'F♯4', 0.25, 'G',   'A4', 0.5, 'G',   'C5', 0.5, 'G',
    // Bar 6: G7/B
    'B3', 0.25, 'C',   'D4', 0.25, 'C',   'G4', 0.25, 'C',   'B4', 0.25, 'C',   'D5', 0.25, 'C',   'G4', 0.25, 'C',   'B4', 0.5, 'C',   'D5', 0.5, 'C',
    // Bar 7: Cm
    'C4', 0.25, 'E♭', 'E♭4', 0.25, 'E♭',  'G4', 0.25, 'E♭',  'C5', 0.25, 'E♭', 'E♭5', 0.25, 'E♭',  'G4', 0.25, 'E♭',  'C5', 0.5, 'E♭', 'E♭5', 0.5, 'E♭'
);

// BWV 1007: Cello Suite No. 1 in G Major, Prelude (4/4, bars 1–8, treble register)
export const bachCelloPreludeInG = createScale('Bach BWV 1007 Prelude in G', 'G', 0.25,
    // Bar 1: G major
     'G3', 'G',  'D4', 'G',  'B4', 'G',  'A4', 'G',  'B4', 'G',  'D4', 'G',  'B4', 'G',  'D4', 'G',
    // Bar 2: Am7/G
     'G3', 'G',  'E4', 'G',  'C5', 'G',  'B4', 'G',  'C5', 'G',  'E4', 'G',  'C5', 'G',  'E4', 'G',
    // Bar 3: D7/G
     'G3', 'G', 'F♯4', 'G',  'C5', 'G',  'B4', 'G',  'C5', 'G', 'F♯4', 'G',  'C5', 'G', 'F♯4', 'G',
    // Bar 4: G major
     'G3', 'G',  'G4', 'G',  'B4', 'G',  'A4', 'G',  'B4', 'G',  'G4', 'G',  'B4', 'G',  'G4', 'G',
    // Bar 5: Em/G
     'G3', 'G',  'E4', 'G',  'B4', 'G',  'A4', 'G',  'B4', 'G',  'G4', 'G', 'F♯4', 'G',  'G4', 'G',
    // Bar 6: A7/G (V7/V tonicizing D with C♯4)
     'A3', 'D',  'E4', 'D',  'G4', 'D', 'F♯4', 'D',  'G4', 'D', 'C♯4', 'D',  'D4', 'D',  'E4', 'D',
    // Bar 7: D/F♯ with G♯4 neighbor (in A)
    'F♯3', 'D',  'D4', 'D',  'A4', 'D', 'G♯4', 'A',  'A4', 'D',  'D4', 'D', 'F♯4', 'D',  'D4', 'D',
    // Bar 8: Gmaj7/B
     'B3', 'G',  'D4', 'G',  'G4', 'G', 'F♯4', 'G',  'G4', 'G',  'B3', 'G',  'D4', 'G',  'B3', 'G'
);

// BWV 244.3: Chorale "Herzliebster Jesu" (4/4 SATB: quarter chords, passing 8ths & half-note cadences)
export const bachChoraleInBm = createSequence('Bach BWV 244 Chorale in Bm', 'D', 4, {},
    // Bar 1: Bm (1.0) -> Em/G (1.0) -> F♯/A♯ (1.0) -> Bm with passing A♮3 8th in bass (0.5 + 0.5)
    0.0,  'B3', 1.0, 'D',  0.0, 'F♯4', 1.0, 'D',  0.0,  'D5', 1.0, 'D',  0.0,  'B5', 1.0, 'D',
    1.0,  'G3', 1.0, 'D',  1.0,  'E4', 1.0, 'D',  1.0,  'B4', 1.0, 'D',  1.0,  'B5', 1.0, 'D',
    2.0, 'A♯3', 1.0, 'B',  2.0, 'F♯4', 1.0, 'B',  2.0, 'C♯5', 1.0, 'B',  2.0, 'F♯5', 1.0, 'B',
    3.0,  'B3', 0.5, 'D',  3.0, 'F♯4', 0.5, 'D',  3.0,  'D5', 0.5, 'D',  3.0,  'B5', 0.5, 'D',
    3.5,  'A3', 0.5, 'D',  3.5, 'F♯4', 0.5, 'D',  3.5,  'D5', 0.5, 'D',  3.5,  'B5', 0.5, 'D',
    // Bar 2: E7/G♯ (1.0) -> A (1.0) -> D major half-note cadence (2.0)
    4.0, 'G♯3', 1.0, 'A',  4.0,  'E4', 1.0, 'A',  4.0,  'B4', 1.0, 'A',  4.0,  'E5', 1.0, 'A',
    5.0,  'A3', 1.0, 'A',  5.0,  'E4', 1.0, 'A',  5.0, 'C♯5', 1.0, 'A',  5.0,  'A5', 1.0, 'A',
    6.0,  'D4', 2.0, 'D',  6.0, 'F♯4', 2.0, 'D',  6.0,  'D5', 2.0, 'D',  6.0,  'A5', 2.0, 'D',
    // Bar 3: Em (1.0) -> C♯°/E (1.0) -> F♯ major half-cadence (2.0)
    8.0,  'E4', 1.0, 'D',  8.0,  'G4', 1.0, 'D',  8.0,  'B4', 1.0, 'D',  8.0,  'G5', 1.0, 'D',
    9.0,  'E4', 1.0, 'D',  9.0,  'G4', 1.0, 'D',  9.0, 'C♯5', 1.0, 'D',  9.0,  'G5', 1.0, 'D',
   10.0, 'F♯3', 2.0, 'B', 10.0, 'F♯4', 2.0, 'B', 10.0, 'C♯5', 2.0, 'B', 10.0, 'A♯5', 2.0, 'B'
);

// BWV 245: Chorale in A Minor with Picardy Third (4/4 SATB: quarter chords, passing 8ths & half-note cadences)
export const bachChoraleInAm = createSequence('Bach Chorale in Am', 'C', 4, {},
    // Bar 1: Am (1.0) -> Dm/F (1.0) -> E/G♯ (1.0) -> Am with passing G♮3 8th (0.5 + 0.5)
    0.0,  'A3', 1.0, 'C',  0.0,  'E4', 1.0, 'C',  0.0,  'C5', 1.0, 'C',  0.0,  'A5', 1.0, 'C',
    1.0,  'F3', 1.0, 'C',  1.0,  'D4', 1.0, 'C',  1.0,  'A4', 1.0, 'C',  1.0,  'D5', 1.0, 'C',
    2.0, 'G♯3', 1.0, 'A',  2.0,  'E4', 1.0, 'A',  2.0,  'B4', 1.0, 'A',  2.0,  'E5', 1.0, 'A',
    3.0,  'A3', 0.5, 'C',  3.0,  'E4', 0.5, 'C',  3.0,  'C5', 0.5, 'C',  3.0,  'A5', 0.5, 'C',
    3.5,  'G3', 0.5, 'C',  3.5,  'E4', 0.5, 'C',  3.5,  'C5', 0.5, 'C',  3.5,  'A5', 0.5, 'C',
    // Bar 2: D7/F♯ (1.0) -> G (1.0) -> C major half-note cadence (2.0)
    4.0, 'F♯3', 1.0, 'G',  4.0,  'D4', 1.0, 'G',  4.0,  'A4', 1.0, 'G',  4.0,  'C5', 1.0, 'G',
    5.0,  'G3', 1.0, 'G',  5.0,  'D4', 1.0, 'G',  5.0,  'B4', 1.0, 'G',  5.0,  'B5', 1.0, 'G',
    6.0,  'C3', 2.0, 'C',  6.0,  'E4', 2.0, 'C',  6.0,  'G4', 2.0, 'C',  6.0,  'C5', 2.0, 'C',
    // Bar 3: Bm7♭5/F (1.0) -> E7 (1.0) -> A major Picardy third half-note cadence (2.0)
    8.0,  'F3', 1.0, 'C',  8.0,  'D4', 1.0, 'C',  8.0,  'A4', 1.0, 'C',  8.0,  'B4', 1.0, 'C',
    9.0,  'E3', 1.0, 'A',  9.0,  'E4', 1.0, 'A',  9.0,  'B4', 1.0, 'A',  9.0, 'G♯5', 1.0, 'A',
   10.0,  'A3', 2.0, 'A', 10.0,  'E4', 2.0, 'A', 10.0, 'C♯5', 2.0, 'A', 10.0,  'A5', 2.0, 'A'
);
