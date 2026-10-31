
import { assert } from 'jsr:@std/assert@1/assert';
import { assertEquals as equals } from 'jsr:@std/assert@1/equals';
import quantiseDurations from '../modules/duration.js';

Deno.test('quantiseDurations: space claiming at GR (0.618)', () => {
    // 4/4 bar with two notes: beat 0 and beat 1.5
    // Available space for note 0 is 1.5 beats (dotted quarter space)
    const bar = { beat: 0, duration: 4, divisions: [0, 2, 4] };

    // Note 0 sounds for 1.0 beat (> 1.5 * 0.618 = 0.927)
    // Should claim the full 1.5 beat space as a dotted quarter
    const tuplet0 = {
        beat: 0,
        duration: 2,
        divisor: 2,
        0: [0.0, 'note', 60, 0.1, 1.0]
    };
    const tuplet1 = {
        beat: 2,
        duration: 2,
        divisor: 2,
        0: [1.5, 'note', 62, 0.1, 0.5]
    };

    quantiseDurations(bar, [tuplet0, tuplet1]);

    const event0 = tuplet0[0];
    equals(event0[4], 1.5, 'Note 0 should claim full 1.5 space as dotted quarter');
    equals(event0.articulation, undefined, 'Should be normal release');
    equals(event0.tie, false, 'Should not tie');
});

Deno.test('quantiseDurations: legato overhang under threshold becomes tenuto without tie', () => {
    const bar = { beat: 0, duration: 4, divisions: [0, 2, 4] };

    // Note 0 at beat 0, next note at beat 1.0. Space is 1.0.
    // Note 0 sounds for 1.25 beats (overhang is 0.25 beats).
    // Grain at beat 0 is 2.0 (or 1.0), tieThreshold = (1 - 0.618) * 1.0 ≈ 0.382 beats.
    // Overhang 0.25 < 0.382 -> should truncate to 1.0, tenuto, NO tie!
    const tuplet0 = {
        beat: 0,
        duration: 1,
        divisor: 1,
        0: [0.0, 'note', 60, 0.1, 1.25]
    };
    const tuplet1 = {
        beat: 1,
        duration: 1,
        divisor: 1,
        0: [1.0, 'note', 62, 0.1, 0.5]
    };

    quantiseDurations(bar, [tuplet0, tuplet1]);

    const event0 = tuplet0[0];
    equals(event0[4], 1.0, 'Should truncate to space 1.0');
    equals(event0.tenuto, true, 'Should mark tenuto');
    equals(event0.tie, false, 'Should NOT tie finger-pedalled legato');
});

Deno.test('quantiseDurations: genuine sustained overhang triggers tie', () => {
    const bar = { beat: 0, duration: 4, divisions: [0, 2, 4] };

    // Note 0 at beat 0, next note at beat 1.0. Space is 1.0.
    // Note 0 sounds for 1.6 beats (overhang is 0.6 beats > tieThreshold).
    // Genuine sustained polyphonic hold -> should tie!
    const tuplet0 = {
        beat: 0,
        duration: 1,
        divisor: 1,
        0: [0.0, 'note', 60, 0.1, 1.6]
    };
    const tuplet1 = {
        beat: 1,
        duration: 1,
        divisor: 1,
        0: [1.0, 'note', 62, 0.1, 0.5]
    };

    quantiseDurations(bar, [tuplet0, tuplet1]);

    const event0 = tuplet0[0];
    equals(event0[4], 1.0, 'Should assign written duration 1.0');
    equals(event0.tie, true, 'Should flag for tie');
});

Deno.test('quantiseDurations: detached release triggers staccato', () => {
    const bar = { beat: 0, duration: 4, divisions: [0, 2, 4] };

    // Note 0 at beat 0, next note at beat 1.0. Space is 1.0.
    // Note 0 sounds for 0.4 beats (< 1.0 * 0.618 = 0.618).
    // Drops to best duration d <= 1.0: 0.5 (8th note).
    // 0.4 >= 0.5 * 0.618 = 0.309 -> writes as 8th note.
    const tuplet0 = {
        beat: 0,
        duration: 1,
        divisor: 1,
        0: [0.0, 'note', 60, 0.1, 0.4]
    };
    const tuplet1 = {
        beat: 1,
        duration: 1,
        divisor: 1,
        0: [1.0, 'note', 62, 0.1, 0.5]
    };

    quantiseDurations(bar, [tuplet0, tuplet1]);

    const event0 = tuplet0[0];
    equals(event0[4], 0.5, 'Should quantise to 8th note (0.5)');
});

Deno.test('quantiseDurations: next note at 1.5 with overhang up to 1.75 is tenuto, over 1.75 is tied', () => {
    const bar = { beat: 0, duration: 4, divisions: [0, 2, 4] };

    // Case 1: Sounding duration 1.70 (overhang 0.20 < 0.25) -> no tie, tenuto
    const t0a = { beat: 0, duration: 2, divisor: 2, 0: [0.0, 'note', 60, 0.1, 1.70] };
    const t1a = { beat: 2, duration: 2, divisor: 2, 0: [1.5, 'note', 62, 0.1, 0.5] };
    quantiseDurations(bar, [t0a, t1a]);
    equals(t0a[0][4], 1.5, 'Written duration should be 1.5');
    equals(t0a[0].tenuto, true, 'Should be tenuto');
    equals(t0a[0].tie, false, 'Should NOT tie at 1.70');

    // Case 2: Sounding duration 1.80 (overhang 0.30 >= 0.25) -> tied!
    const t0b = { beat: 0, duration: 2, divisor: 2, 0: [0.0, 'note', 60, 0.1, 1.80] };
    const t1b = { beat: 2, duration: 2, divisor: 2, 0: [1.5, 'note', 62, 0.1, 0.5] };
    quantiseDurations(bar, [t0b, t1b]);
    equals(t0b[0][4], 1.5, 'Written duration should be 1.5');
    equals(t0b[0].tie, true, 'Should tie at 1.80');
});

