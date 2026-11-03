import {
    assert,
    assertEquals as equals,
    assertGreaterOrEqual as gte,
    assertStrictEquals as is,
    assertObjectMatch as matches
} from 'jsr:@std/assert@1';

import Event                  from 'sequence/modules/event.js';
import Stave                  from '../modules/stave.js';
import { getDivisions }       from 'sequence/modules/event/meter.js';
import { accidentalsFromKey } from '../modules/accidentals.js';
import config                 from '../modules/config.js';

const assign = Object.assign;

Deno.test('Notes at 0 in 4/4 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  4,
        divisor:   1,
        divisions: getDivisions(4, 1),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 4 }]);     // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 4 }]);     // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 3 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 2 }]);     // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 2 }]);     // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 1.5 }]);   // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 1 }]);     // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 1 }]);     // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 1 }]);     // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 1, staccato: true }]); // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 1, staccato: true }]); // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 0.5, staccato: true }]); // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0, 4, config), [{ beat: 0, duration: 0.25, staccato: true }]); // 32nd
});

Deno.test('Notes at 0 in 4/4 bar, analysis window set to duration', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  4,
        divisor:   1,
        divisions: getDivisions(4, 1),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0, 4,   config), [{ beat: 0, duration: 4 }]);    // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 3.5 }]);  // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0, 3,   config), [{ beat: 0, duration: 3 }]);    // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0, 2,   config), [{ beat: 0, duration: 2 }]);    // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0, 1.75,config), [{ beat: 0, duration: 1.75 }]); // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0, 1.5, config), [{ beat: 0, duration: 1.5 }]);  // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0, 8/8, config), [{ beat: 0, duration: 8/8 }]);  // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0, 7/8, config), [{ beat: 0, duration: 7/8 }]);  // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0, 6/8, config), [{ beat: 0, duration: 6/8 }]);  // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0, 4/8, config), [{ beat: 0, duration: 4/8 }]);  // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0, 3/8, config), [{ beat: 0, duration: 3/8 }]);  // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0, 2/8, config), [{ beat: 0, duration: 2/8 }]);  // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0, 1/8, config), [{ beat: 0, duration: 1/8 }]);  // 32nd
});

Deno.test('Notes stopping at end of 4/4 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  4,
        divisor:   1,
        divisions: getDivisions(4, 1),
        key:       0
    };


    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0,       'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0,       4, config), [{ beat: 0,       duration: 4 }]);     // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5,     'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0.5,     4, config), [{ beat: 0.5,     duration: 3.5 }]);   // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([1,       'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 1,       4, config), [{ beat: 1,       duration: 3 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2,       'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 2,       4, config), [{ beat: 2,       duration: 2 }]);     // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 1.75,'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 4 - 1.75,4, config), [{ beat: 4 - 1.75,duration: 1.75 }]);  // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 1.5, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 4 - 1.5, 4, config), [{ beat: 4 - 1.5, duration: 1.5 }]);   // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 8/8, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 4 - 8/8, 4, config), [{ beat: 4 - 8/8, duration: 8/8 }]);   // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 7/8, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 4 - 7/8, 4, config), [{ beat: 4 - 7/8, duration: 7/8 }]);   // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 6/8, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 4 - 6/8, 4, config), [{ beat: 4 - 6/8, duration: 6/8 }]);   // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 4/8, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 4 - 4/8, 4, config), [{ beat: 4 - 4/8, duration: 4/8 }]);   // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 3/8, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 4 - 3/8, 4, config), [{ beat: 4 - 3/8, duration: 3/8 }]);   // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 2/8, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 4 - 2/8, 4, config), [{ beat: 4 - 2/8, duration: 2/8 }]);   // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 1/8, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 4 - 1/8, 4, config), [{ beat: 4 - 1/8, duration: 1/8 }]);   // 32nd
});

Deno.test('Notes at 0 in 3/4 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   1,
        divisions: getDivisions(3, 1),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3 }]);     // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3 }]);     // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 2 }]);     // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 2 }]);     // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1.5 }]);   // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1 }]);     // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1 }]);     // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1 }]);     // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1, staccato: true }]); // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1, staccato: true }]); // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 0.5, staccato: true }]); // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 0.25, staccato: true }]); // 32nd
});

Deno.test('Notes at 0 in 3/4 bar, analysis window set to duration', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   1,
        divisions: getDivisions(3, 1),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0, 3,   config), [{ beat: 0, duration: 3 }]);    // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0, 3,   config), [{ beat: 0, duration: 3 }]);    // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0, 3,   config), [{ beat: 0, duration: 3 }]);    // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0, 2,   config), [{ beat: 0, duration: 2 }]);    // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0, 1.75,config), [{ beat: 0, duration: 1.75 }]); // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0, 1.5, config), [{ beat: 0, duration: 1.5 }]);  // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0, 8/8, config), [{ beat: 0, duration: 8/8 }]);  // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0, 7/8, config), [{ beat: 0, duration: 7/8 }]);  // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0, 6/8, config), [{ beat: 0, duration: 6/8 }]);  // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0, 4/8, config), [{ beat: 0, duration: 4/8 }]);  // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0, 3/8, config), [{ beat: 0, duration: 3/8 }]);  // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0, 2/8, config), [{ beat: 0, duration: 2/8 }]);  // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0, 1/8, config), [{ beat: 0, duration: 1/8 }]);  // 32nd
});

Deno.test('Notes at 0.5 in 3/4 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   1,
        divisions: getDivisions(3, 1),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1.5 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1.5 }]);     // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1.5 }]);     // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1.5 }]);     // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5,  staccato: true }]); // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.25, staccato: true }]); // 32nd
});

Deno.test('Notes at 0 in 6/8 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   0.5,
        divisions: getDivisions(3, 0.5),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3 }]);     // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3 }]);     // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1.5 }]);   // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1.5 }]);   // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1.5 }]);   // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1 }]);     // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1 }]);     // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1 }]);     // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 0.5 }]);   // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 0.5 }]);   // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 0.5, staccato: true }]); // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 0.25, staccato: true }]); // 32nd
});

Deno.test('Notes at 0 in 6/8 bar, analysis window set to duration', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   0.5,
        divisions: getDivisions(3, 0.5),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0, 3,   config), [{ beat: 0, duration: 3 }]);    // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0, 3,   config), [{ beat: 0, duration: 3 }]);    // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0, 3,   config), [{ beat: 0, duration: 3 }]);    // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0, 2,   config), [{ beat: 0, duration: 1.5 }]);  // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0, 1.75,config), [{ beat: 0, duration: 1.5 }]);  // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0, 1.5, config), [{ beat: 0, duration: 1.5 }]);  // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0, 8/8, config), [{ beat: 0, duration: 8/8 }]);  // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0, 7/8, config), [{ beat: 0, duration: 7/8 }]);  // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0, 6/8, config), [{ beat: 0, duration: 6/8 }]);  // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0, 4/8, config), [{ beat: 0, duration: 4/8 }]);  // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0, 3/8, config), [{ beat: 0, duration: 3/8 }]);  // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0, 2/8, config), [{ beat: 0, duration: 2/8 }]);  // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0, 1/8, config), [{ beat: 0, duration: 1/8 }]);  // 32nd
});

Deno.test('Notes at 0.5 in 6/8 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   0.5,
        divisions: getDivisions(3, 0.5),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1 }]);       // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1 }]);       // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1 }]);       // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1 }]);       // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1 }]);       // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1 }]);       // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5,  staccato: true }]); // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.25, staccato: true }]); // 32nd
});

Deno.test('Notes at 0 in 7/8 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3.5,
        divisor:   0.5,
        divisions: getDivisions(3.5, 0.5),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 3.5 }]);   // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 3.5 }]);   // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 2 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 2 }]);     // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 2 }]);     // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 1.5 }]);   // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 1 }]);     // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 1 }]);     // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 1 }]);     // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 0.5 }]);   // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 0.5 }]);   // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 0.5, staccato: true }]); // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 0.25, staccato: true }]); // 32nd
});

Deno.test('Notes at 0 in 7/8 bar, analysis window set to duration', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3.5,
        divisor:   0.5,
        divisions: getDivisions(3.5, 0.5),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 3.5 }]);    // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0, 3.5, config), [{ beat: 0, duration: 3.5 }]);    // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0, 3,   config), [{ beat: 0, duration: 3 }]);    // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0, 2,   config), [{ beat: 0, duration: 2 }]);    // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0, 1.75,config), [{ beat: 0, duration: 1.75 }]); // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0, 1.5, config), [{ beat: 0, duration: 1.5 }]);  // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0, 8/8, config), [{ beat: 0, duration: 8/8 }]);  // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0, 7/8, config), [{ beat: 0, duration: 7/8 }]);  // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0, 6/8, config), [{ beat: 0, duration: 6/8 }]);  // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0, 4/8, config), [{ beat: 0, duration: 4/8 }]);  // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0, 3/8, config), [{ beat: 0, duration: 3/8 }]);  // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0, 2/8, config), [{ beat: 0, duration: 2/8 }]);  // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0, 1/8, config), [{ beat: 0, duration: 1/8 }]);  // 32nd
});

Deno.test('Notes at 0.5 in 7/8 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3.5,
        divisor:   0.5,
        divisions: getDivisions(3.5, 0.5),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 1.5 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 1.5 }]);     // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 1.5 }]);     // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 1.5 }]);     // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.5 }]);     // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.5 }]);     // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.5 }]);     // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.5,  staccato: true }]); // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.25, staccato: true }]); // 32nd
});

Deno.test('Notes at 2 in 7/8 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3.5,
        divisor:   0.5,
        divisions: getDivisions(3.5, 0.5),
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 1.5 }]);   // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 1.5 }]);   // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 1.5 }]);   // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 1 }]);     // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 1 }]);     // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 1 }]);     // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 0.5 }]);   // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 0.5 }]);   // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 0.5, staccato: true }]); // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 2, 3.5, config), [{ beat: 2, duration: 0.25, staccato: true }]); // 32nd
});
