import {
    assert,
    assertEquals as equals,
    assertGreaterOrEqual as gte,
    assertStrictEquals as is,
    assertObjectMatch as matches
} from 'jsr:@std/assert@1';

import Event                  from 'sequence/modules/event.js';
import Stave                  from '../modules/stave.js';
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
        divisions: [2, 4],
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
        divisions: [2, 4],
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
        divisions: [2, 4],
        key:       0
    };


    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0,       'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0,       4, config), [{ beat: 0,       duration: 4 }]);     // Whole
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5,     'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0.5,     4, config), [{ beat: 0.5,     duration: 0.5 }]);   // Double dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([1,       'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 1,       4, config), [{ beat: 1,       duration: 3 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([2,       'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 2,       4, config), [{ beat: 2,       duration: 2 }]);     // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([4 - 1.75,'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 4 - 1.75,4, config), [{ beat: 4 - 1.75,duration: 0.25 }]);  // Double dotted quarter
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
        divisions: [3],
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),   { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3 }]);                    // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.1]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3, tenuto: true }]);      //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 3 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2.1]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 2, tenuto: true }]);      // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 2 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 2 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.6]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1.5, tenuto: true }]);    // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1.5 }]);                  //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.1]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1, tenuto: true }]);      // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1, staccato: true }]);    // Quarter staccato
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 1, staccato: true }]);    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 0.5, staccato: true }]);  // 16th staccato
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0, 3, config), [{ beat: 0, duration: 0.25, staccato: true }]); // 32nd staccato
});

Deno.test('Notes at 0 in 3/4 bar, analysis window set to duration', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   1,
        divisions: [3],
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 4]),     { pitchSpelling: 'C4' })], 0, 3,     config), [{ beat: 0, duration: 3 }]);                    // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.5]),   { pitchSpelling: 'C4' })], 0, 3,     config), [{ beat: 0, duration: 3 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 3.1]),   { pitchSpelling: 'C4' })], 0, 3,     config), [{ beat: 0, duration: 3, tenuto: true }]);      //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2.7]),   { pitchSpelling: 'C4' })], 0, 3,     config), [{ beat: 0, duration: 3 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2.1]),   { pitchSpelling: 'C4' })], 0, 2,     config), [{ beat: 0, duration: 2, tenuto: true }]);      // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 2]),     { pitchSpelling: 'C4' })], 0, 2,     config), [{ beat: 0, duration: 2 }]);                    //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.85]),  { pitchSpelling: 'C4' })], 0, 1.75,  config), [{ beat: 0, duration: 1.75, tenuto: true }]);   // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.75]),  { pitchSpelling: 'C4' })], 0, 1.75,  config), [{ beat: 0, duration: 1.75 }]);                 //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.6]),   { pitchSpelling: 'C4' })], 0, 1.5,   config), [{ beat: 0, duration: 1.5, tenuto: true }]);    // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.5]),   { pitchSpelling: 'C4' })], 0, 1.5,   config), [{ beat: 0, duration: 1.5 }]);                  //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.1]),   { pitchSpelling: 'C4' })], 0, 1.0,   config), [{ beat: 0, duration: 1.0, tenuto: true }]);    // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 1.0]),   { pitchSpelling: 'C4' })], 0, 1.0,   config), [{ beat: 0, duration: 1.0 }]);                  //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.65]),  { pitchSpelling: 'C4' })], 0, 1.0,   config), [{ beat: 0, duration: 1.0 }]);                  //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.5]),   { pitchSpelling: 'C4' })], 0, 1.0,   config), [{ beat: 0, duration: 1.0, staccato: true }]);  //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.975]), { pitchSpelling: 'C4' })], 0, 0.875, config), [{ beat: 0, duration: 0.875, tenuto: true }]);  // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.875]), { pitchSpelling: 'C4' })], 0, 0.875, config), [{ beat: 0, duration: 0.875 }]);                //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.6]),   { pitchSpelling: 'C4' })], 0, 0.875, config), [{ beat: 0, duration: 0.875 }]);                //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.85]),  { pitchSpelling: 'C4' })], 0, 0.75,  config), [{ beat: 0, duration: 0.75, tenuto: true }]);   // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.75]),  { pitchSpelling: 'C4' })], 0, 0.75,  config), [{ beat: 0, duration: 0.75 }]);                 //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.5]),   { pitchSpelling: 'C4' })], 0, 0.75,  config), [{ beat: 0, duration: 0.75 }]);                 //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.6]),   { pitchSpelling: 'C4' })], 0, 0.5,   config), [{ beat: 0, duration: 0.5, tenuto: true }]);    // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.5]),   { pitchSpelling: 'C4' })], 0, 0.5,   config), [{ beat: 0, duration: 0.5 }]);                  //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.4]),   { pitchSpelling: 'C4' })], 0, 0.5,   config), [{ beat: 0, duration: 0.5 }]);                  //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.25]),  { pitchSpelling: 'C4' })], 0, 0.5,   config), [{ beat: 0, duration: 0.5, staccato: true }]);  //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.475]), { pitchSpelling: 'C4' })], 0, 0.375, config), [{ beat: 0, duration: 0.375, tenuto: true }]);  // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.375]), { pitchSpelling: 'C4' })], 0, 0.375, config), [{ beat: 0, duration: 0.375 }]);                //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.25]),  { pitchSpelling: 'C4' })], 0, 0.375, config), [{ beat: 0, duration: 0.375 }]);                //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.35]),  { pitchSpelling: 'C4' })], 0, 0.25,  config), [{ beat: 0, duration: 0.25, tenuto: true }]);   // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.25]),  { pitchSpelling: 'C4' })], 0, 0.25,  config), [{ beat: 0, duration: 0.25 }]);                 //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.125]), { pitchSpelling: 'C4' })], 0, 0.25,  config), [{ beat: 0, duration: 0.25, staccato: true }]); //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.225]), { pitchSpelling: 'C4' })], 0, 0.125, config), [{ beat: 0, duration: 0.125, tenuto: true }]);  // 32nd
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.125]), { pitchSpelling: 'C4' })], 0, 0.125, config), [{ beat: 0, duration: 0.125 }]);                //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0, 'note', 60, 0.1, 0.0625]),{ pitchSpelling: 'C4' })], 0, 0.125, config), [{ beat: 0, duration: 0.125, staccato: true }]);//
});

Deno.test('Notes at 0.5 in 3/4 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   1,
        divisions: [3],
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Double dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.5]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 1.5 }]);     // Dotted quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 8/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Quarter
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 7/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Double dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 6/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.6]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5,  tenuto: true }]);     // Long 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 4/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.5,  staccato: true }]); // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1/8]), { pitchSpelling: 'C4' })], 0.5, 3, config), [{ beat: 0.5, duration: 0.25, staccato: true }]); // 32nd
});

Deno.test('Notes at 0.5 in 3/4 bar, analysis window set to duration', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   1,
        divisions: [3],
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3]),     { pitchSpelling: 'C4' })], 0.5, 0.5 + 3,     config), [{ beat: 0.5, duration: 0.5 }]);                   // 8th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2]),     { pitchSpelling: 'C4' })], 0.5, 0.5 + 2,     config), [{ beat: 0.5, duration: 0.5 }]);                   //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.75]),  { pitchSpelling: 'C4' })], 0.5, 0.5 + 1.75,  config), [{ beat: 0.5, duration: 0.5 }]);                   //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.5]),   { pitchSpelling: 'C4' })], 0.5, 0.5 + 1.5,   config), [{ beat: 0.5, duration: 1.5 }]);                   // << TODO!! Anomoly!!
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.0]),   { pitchSpelling: 'C4' })], 0.5, 0.5 + 1.0,   config), [{ beat: 0.5, duration: 0.5 }]);                   //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.875]), { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.875, config), [{ beat: 0.5, duration: 0.5 }]);                   //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.75]),  { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.75,  config), [{ beat: 0.5, duration: 0.5 }]);                   //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.6]),   { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.5,   config), [{ beat: 0.5, duration: 0.5,   tenuto: true }]);   //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.5]),   { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.5,   config), [{ beat: 0.5, duration: 0.5 }]);   //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.375]), { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.5,   config), [{ beat: 0.5, duration: 0.5 }]);                   //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.25]),  { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.5,   config), [{ beat: 0.5, duration: 0.5,   staccato: true }]); //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.475]), { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.375, config), [{ beat: 0.5, duration: 0.375, tenuto: true }]);   // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.375]), { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.375, config), [{ beat: 0.5, duration: 0.375 }]);   // Dotted 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.25]),  { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.375, config), [{ beat: 0.5, duration: 0.375 }]);                 //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.35]),  { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.25,  config), [{ beat: 0.5, duration: 0.25,  tenuto: true }]);   // 16th
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.25]),  { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.25,  config), [{ beat: 0.5, duration: 0.25 }]);   //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.16]),  { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.25,  config), [{ beat: 0.5, duration: 0.25 }]);                  //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.125]), { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.25,  config), [{ beat: 0.5, duration: 0.25,  staccato: true }]); //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.225]), { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.125, config), [{ beat: 0.5, duration: 0.125, tenuto: true }]);   // 32nd
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.125]), { pitchSpelling: 'C4' })], 0.5, 0.5 + 0.125, config), [{ beat: 0.5, duration: 0.125 }]);                 //
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 0.0625]),{ pitchSpelling: 'C4' })], 0.5, 0.5 + 0.125, config), [{ beat: 0.5, duration: 0.125, staccato: true }]); //
});

Deno.test('Notes at 0 in 6/8 bar', () => {
    const stave       = Stave.treble;
    const voice       = stave.voices[0];
    const accidentals = accidentalsFromKey(0);
    const bar         = {
        beat:      0,
        duration:  3,
        divisor:   0.5,
        divisions: [1.5, 3],
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
        divisions: [1.5, 3],
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
        divisions: [1.5, 3],
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
        divisions: [2, 3.5],
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
        divisions: [2, 3.5],
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
        divisions: [2, 3.5],
        key:       0
    };

    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 3]),   { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.5 }]);     // Dotted minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 2]),   { pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.5 }]);     // Minim
    matches(stave.createDupletNoteSymbols([], bar, voice, accidentals, [assign(Event.from([0.5, 'note', 60, 0.1, 1.75]),{ pitchSpelling: 'C4' })], 0.5, 3.5, config), [{ beat: 0.5, duration: 0.5 }]);     // Double dotted quarter
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
        divisions: [2, 3.5],
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
