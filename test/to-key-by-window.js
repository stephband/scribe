import {
    assert,
    assertEquals as equals
} from 'jsr:@std/assert@1';

import { toKey, roll } from '../modules/spell/to-key-by-window.js';

Deno.test('toKey() Major scales in C', () => {
    equals(toKey([71, 73, 75, 76, 78, 80, 82], -4),-7); // Cb (pushes towards flatter key when key is flatter)
    equals(toKey([66, 68, 70, 71, 73, 75, 77], 0), -6); // Gb (pushes towards flat key when key is flat)
    equals(toKey([61, 63, 65, 66, 68, 70, 72], 0), -5); // Db
    equals(toKey([68, 70, 72, 73, 75, 77, 79], 0), -4); // Ab
    equals(toKey([63, 65, 67, 68, 70, 72, 74], 0), -3); // Eb
    equals(toKey([70, 72, 74, 75, 77, 79, 81], 0), -2); // Bb
    equals(toKey([65, 67, 69, 70, 72, 74, 76], 0), -1); // F
    equals(toKey([60, 62, 64, 65, 67, 69, 71], 0),  0); // C
    equals(toKey([67, 69, 71, 72, 74, 76, 78], 0),  1); // G
    equals(toKey([62, 64, 66, 67, 69, 71, 73], 0),  2); // D
    equals(toKey([69, 71, 73, 74, 76, 78, 80], 0),  3); // A
    equals(toKey([64, 66, 68, 69, 71, 73, 75], 0),  4); // E
    equals(toKey([71, 73, 75, 76, 78, 80, 82], 0),  5); // B
    equals(toKey([66, 68, 70, 71, 73, 75, 77], 1),  6); // F# (pushes towards sharp key when key is sharp)
    equals(toKey([61, 63, 65, 66, 68, 70, 72], 4),  7); // C# (pushes towards sharper key when key is sharper)
});

Deno.test('toKey() Melodic minor scales in C', () => {
    equals(toKey([66, 68, 69, 71, 73, 75, 77], -4), -7); // Gbm∆ | F7alt   | Cb7#11 -> Cb (pushes towards flatter key when key is flatter)
    equals(toKey([61, 63, 64, 66, 68, 70, 72],  0), -6); // Dbm∆ | C7alt   | Gb7#11 -> Gb
    equals(toKey([68, 70, 71, 73, 75, 77, 79],  0), -5); // Abm∆ | G7alt   | Db7#11 -> Db
    equals(toKey([63, 65, 66, 68, 70, 72, 74],  0), -4); // Ebm∆ | D7alt   | Ab7#11 -> Ab
    equals(toKey([70, 72, 73, 75, 77, 79, 81],  0), -3); // Bbm∆ | A7alt   | Eb7#11 -> Eb
    equals(toKey([65, 67, 68, 70, 72, 74, 76],  0), -2); // Fm∆  | E7alt   | Bb7#11 -> Bb
    equals(toKey([60, 62, 63, 65, 67, 69, 71],  0), -1); // Cm∆  | B7alt   | F7#11  -> F
    equals(toKey([67, 69, 70, 72, 74, 76, 78],  0),  0); // Gm∆  | F#7alt  | C7#11  -> C
    equals(toKey([62, 64, 65, 67, 69, 71, 73],  0),  1); // Dm∆  | C#7alt  | G7#11  -> G
    equals(toKey([69, 71, 72, 74, 76, 78, 80],  0),  2); // Am∆  | G#7alt  | D7#11  -> D
    equals(toKey([64, 66, 67, 69, 71, 73, 75],  0),  3); // Em∆  | D#7alt  | A7#11  -> A
    equals(toKey([71, 73, 74, 76, 78, 80, 82],  0),  4); // Bm∆  | A#7alt  | E7#11  -> E
    equals(toKey([66, 68, 69, 71, 73, 75, 77],  0),  5); // F#m∆ | E#7alt  | B7#11  -> B
    equals(toKey([61, 63, 64, 66, 68, 70, 72],  1),  6); // C#m∆ | B#7alt  | F#7#11 -> F# (pushes towards sharp key when key is sharp)
    equals(toKey([68, 70, 71, 73, 75, 77, 79],  4),  7); // G#m∆ | F##7alt | C#7#11 -> C# (pushes towards sharper key when key is sharper)
});

Deno.test('toKey() identifies triads and D major tetrad with tritone', () => {
    equals(toKey([60, 64, 67], 0), 0);          // C major in C -> C
    equals(toKey([69, 72, 76], 0), 0);          // A minor in C -> C
    equals(toKey([67, 71, 74], 0), 0);          // G major in C -> C
    equals(toKey([67, 71, 74], 1), 1);          // G major in G -> G
    equals(toKey([65, 69, 72], 0), 0);          // F major in C -> C
    equals(toKey([65, 69, 72], -1), -1);        // F major in F -> F
    equals(toKey([62, 66, 67, 73], 0), 2);      // D, F#, G, C# in C -> D
});

Deno.test('toKey() Major triads in C and in their own keys', () => {
    // Each major triad belongs to {k-1, k, k+1}; in C (0) it picks the one closest to C
    equals(toKey([66, 70, 73], 0), -5); // Gb maj in C -> Db
    equals(toKey([61, 65, 68], 0), -4); // Db maj in C -> Ab
    equals(toKey([68, 72, 75], 0), -3); // Ab maj in C -> Eb
    equals(toKey([63, 67, 70], 0), -2); // Eb maj in C -> Bb
    equals(toKey([70, 74, 77], 0), -1); // Bb maj in C -> F
    equals(toKey([65, 69, 72], 0),  0); // F  maj in C -> C
    equals(toKey([60, 64, 67], 0),  0); // C  maj in C -> C
    equals(toKey([67, 71, 74], 0),  0); // G  maj in C -> C
    equals(toKey([62, 66, 69], 0),  1); // D  maj in C -> G
    equals(toKey([69, 73, 76], 0),  2); // A  maj in C -> D
    equals(toKey([64, 68, 71], 0),  3); // E  maj in C -> A
    equals(toKey([71, 75, 78], 0),  4); // B  maj in C -> E

    // In their own key (-5..+5), each major triad stays on its tonic
    equals(toKey([61, 66, 70], -6), -6); // Gb
    equals(toKey([61, 65, 68], -5), -5); // Db
    equals(toKey([68, 72, 75], -4), -4); // Ab
    equals(toKey([63, 67, 70], -3), -3); // Eb
    equals(toKey([70, 74, 77], -2), -2); // Bb
    equals(toKey([65, 69, 72], -1), -1); // F
    equals(toKey([60, 64, 67],  0),  0); // C
    equals(toKey([67, 71, 74],  1),  1); // G
    equals(toKey([62, 66, 69],  2),  2); // D
    equals(toKey([69, 73, 76],  3),  3); // A
    equals(toKey([64, 68, 71],  4),  4); // E
    equals(toKey([71, 75, 78],  5),  5); // B
});

Deno.test('toKey() Minor triads in C', () => {
    equals(toKey([63, 66, 70], 0), -5); // Ebm in C -> Db
    equals(toKey([70, 73, 77], 0), -4); // Bbm in C -> Ab
    equals(toKey([65, 68, 72], 0), -3); // Fm  in C -> Eb
    equals(toKey([60, 63, 67], 0), -2); // Cm  in C -> Bb
    equals(toKey([67, 70, 74], 0), -1); // Gm  in C -> F
    equals(toKey([62, 65, 69], 0),  0); // Dm  in C -> C
    equals(toKey([69, 72, 76], 0),  0); // Am  in C -> C
    equals(toKey([64, 67, 71], 0),  0); // Em  in C -> C
    equals(toKey([71, 74, 78], 0),  1); // Bm  in C -> G
    equals(toKey([66, 69, 73], 0),  2); // F#m in C -> D
    equals(toKey([61, 64, 68], 0),  3); // C#m in C -> A
    equals(toKey([68, 71, 75], 0),  4); // G#m in C -> E
});

Deno.test('toKey() Lone notes', () => {
    equals(toKey([63],  0), -2);
    equals(toKey([63], -3), -3);

    equals(toKey([16],  8),  5); // D## in G# picks key of B
    equals(toKey([21],  8),  4); // G## in G# picks key of E
    equals(toKey([26],  8),  3); // C## in G# picks key of A
    equals(toKey([31],  8),  2); // F## in G# picks key of D
    equals(toKey([36],  8),  7); // B# in G# picks key of C#
    equals(toKey([41],  8),  6); // E# in G# picks key of F#
    equals(toKey([46],  8),  6); // A# in G# picks key of F#
    equals(toKey([51],  8),  6); // D# in G# picks key of F#
    equals(toKey([56],  8),  6); // G# in G# picks key of F#
    equals(toKey([61],  8),  6); // C# in G# picks key of F#

    equals(toKey([66],  8),  6); // F# in G# picks key of F#
    equals(toKey([66],  7),  6); // F# in C# picks key of F#
    equals(toKey([66],  6),  6); // F# in F# picks key of F#
    equals(toKey([66],  5),  5); // F# in B  picks key of B
    equals(toKey([66],  4),  4); // F# in E  picks key of E
    equals(toKey([66],  3),  3); // F# in A  picks key of A
    equals(toKey([66],  2),  2); // F# in D  picks key of D
    equals(toKey([66],  1),  1); // F# in G  picks key of G
    equals(toKey([66],  0),  1); // F# in C  picks key of G
    equals(toKey([66], -1),  1); // F# in F  picks key of G
    equals(toKey([66], -2),  1); // F# in Bb picks key of G
    equals(toKey([66], -3), -5); // F# in Eb picks key of Db
    equals(toKey([66], -4), -5); // F# in Ab picks key of Db
    equals(toKey([66], -5), -5); // F# in Db picks key of Db
    equals(toKey([66], -6), -6); // F# in Gb picks key of Gb
});

Deno.test('toKey() resolves A♭/G♯ chords out of C to the appropriate sharp/flat key', () => {
    equals(toKey([64, 68, 71, 74], 0), 3);      // E7 -> A (spells G#)
    equals(toKey([65, 68, 72], 0), -3);         // Fm -> Eb (spells Ab)
    equals(toKey([70, 74, 77, 68, 64], 0), -2); // Bb7#11 -> Bb (spells Ab)
});

Deno.test('toKey() resolves B-F tritone according to home key', () => {
    const probs = roll([65, 71]);
    equals(probs[0], 1);
    equals(probs[6], 1);
    equals(toKey([65, 71], 0), 0);
    equals(toKey([65, 71], -6), -6);
    equals(toKey([65, 71], 6), 6);
});

Deno.test('toKey() wraps enharmonic key signatures and respects readability ceiling', () => {
    equals(toKey([66, 68, 70, 71, 73, 75, 77], 0), -6); // Gb in C
    equals(toKey([66, 68, 70, 71, 73, 75, 77], 4), 6);  // F# in E
    equals(toKey([66, 68, 70, 71, 73, 75, 77], 6), 6);  // F# stays F# in F#
});

Deno.test('toKey() falls back to input key on empty or fully chromatic input', () => {
    equals(toKey([], 2), 2);
    const chromatic = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71];
    equals(toKey(chromatic, 2), 2);
});
