
import {
    assert,
    assertEquals as equals,
    assertGreaterOrEqual as gte,
    assertStrictEquals as is,
    assertObjectMatch as matches
} from 'jsr:@std/assert@1';

import { Sequence } from 'sequence/module.js';
import requestTree   from '../modules/tree.js';
import { quantiseBar as quantise } from '../modules/tree/quantise.js';
import grainPow2    from '../modules/number/grain-pow-2.js';
import grainOfBeat  from '../modules/bar/grain-of-beat.js';

import Stave        from '../modules/stave/stave.js';
import { identify } from '../modules/event.js';

Deno.test('identify()', () => {
    is(identify('D'), undefined);
    is(identify(123), undefined);
    is(identify(null), undefined);
    is(identify(undefined), undefined);

    const event = [0, 'note', 60];
    const id = identify(event);
    assert(typeof id === 'number');
    is(identify(event), id);
});

Deno.test('createSignatureSymbols() with string key', () => {
    const stave = new Stave('treble');
    const symbols = stave.createSignatureSymbols('D');
    is(symbols.length, 3); // clef + 2 sharps (F#, C#)
    is(symbols[0].type, 'clef');
    is(symbols[1].type, 'acci');
    is(symbols[1].event, undefined);
    is(symbols[2].type, 'acci');
    is(symbols[2].event, undefined);
});

Deno.test('showAtConcertPitch: true preserves concert key on parts', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 0b1010, 1],
        [0, "note", "C4", 0.5, 1]
    ]);
    const tree = await requestTree(sequence, undefined, undefined, undefined, 0, 0, Infinity, { showAtConcertPitch: true });
    assert(tree[0]);
    assert(tree[0][0]);
    is(tree[0][0].key, 0);
    is(tree[0][0].transpose, 0);
});

Deno.test('quantise chords with minDivision 1/3 and primes [2, 3]', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 0b1010, 1],
        [0.04, "chord", "C", "", 1],
        [0.52, "chord", "G", "7", 1]
    ]);
    const tree = await requestTree(sequence);
    assert(tree[0]);
    const part = tree[0][0];
    const chordSymbols = part.symbols.filter((s) => s.type === 'chord');
    is(chordSymbols.length, 2);
    is(chordSymbols[0].beat, 0);
    is(chordSymbols[1].beat, 0.5);
});

Deno.test('symbolise slash chords with new extension format {n}/', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 0b1010, 1],
        [0, "chord", "E", "{8}/", 2],
        [2, "chord", "B", "{8}7/", 2]
    ]);
    const tree = await requestTree(sequence);
    assert(tree[0]);
    const part = tree[0][0];
    const chordSymbols = part.symbols.filter((s) => s.type === 'chord');
    is(chordSymbols.length, 2);
    is(chordSymbols[0].beat, 0);
    is(chordSymbols[0].name, 'C/E');
    is(chordSymbols[1].beat, 2);
    is(chordSymbols[1].name, 'G7/B');
});

Deno.test('symbolise slash chords from chord symbol strings', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 0b1010, 1],
        [0, "chord", "C/E", 2],
        [2, "chord", "G7/B", 2]
    ]);
    const tree = await requestTree(sequence);
    assert(tree[0]);
    const part = tree[0][0];
    const chordSymbols = part.symbols.filter((s) => s.type === 'chord');
    is(chordSymbols.length, 2);
    is(chordSymbols[0].beat, 0);
    is(chordSymbols[0].name, 'C/E');
    is(chordSymbols[1].beat, 2);
    is(chordSymbols[1].name, 'G7/B');
});

Deno.test('DrumStave delegates spelling directly without RNN speller', async () => {
    const sequence = new Sequence([
        [0, "key", "D"],
        [0, "meter", 0b1010, 1],
        [0, "note", 38, 0.8, 1],
        [1, "note", 42, 0.8, 1]
    ]);
    sequence.parts = [{ staff: 'drum' }];
    const tree = await requestTree(sequence);
    assert(tree[0]);
    const part = tree[0][0];
    is(part.stave.pitched, false);
    const noteSymbols = part.symbols.filter((s) => s.type === 'note');
    is(noteSymbols.length, 2);
    is(noteSymbols[0].pitch, 'snare-drum-1');
    is(noteSymbols[0].row, 10);
    is(noteSymbols[1].pitch, 'closed-hi-hat');
    is(noteSymbols[1].row, 7);
    const acciSymbols = part.symbols.filter((s) => s.type === 'acci');
    is(acciSymbols.length, 0);
});

Deno.test('DrumStave stem directions: upper voice (cymbals/hands) stemup true, lower voice (feet) stemup false', async () => {
    const sequence = new Sequence([
        [0, "meter", 0b1010, 1],
        [0, "note", 49, 0.8, 1], // Crash Cymbal 1 -> upper voice
        [0, "note", 36, 0.8, 1], // Bass Drum 1 -> lower voice
        [1, "note", 42, 0.8, 1], // Closed Hi-Hat -> upper voice
        [1, "note", 44, 0.8, 1]  // Pedal Hi-Hat -> lower voice
    ]);
    sequence.parts = [{ staff: 'drum' }];
    const tree = await requestTree(sequence);
    assert(tree[0]);
    const part = tree[0][0];

    // Check voices
    let upperVoice, lowerVoice, i = -1;
    while (part[++i]) {
        if (part[i].name === 'upper') upperVoice = part[i];
        if (part[i].name === 'lower') lowerVoice = part[i];
    }
    assert(upperVoice, 'upper voice should exist');
    assert(lowerVoice, 'lower voice should exist');
    is(upperVoice.stemup, true);
    is(lowerVoice.stemup, false);

    // Check note symbols
    const noteSymbols = part.symbols.filter((s) => s.type === 'note');
    is(noteSymbols.length, 4);

    const crash = noteSymbols.find((s) => s.pitch === 'crash-cymbal-1');
    const hihat = noteSymbols.find((s) => s.pitch === 'closed-hi-hat');
    const kick  = noteSymbols.find((s) => s.pitch === 'high-bass-drum');
    const pedal = noteSymbols.find((s) => s.pitch === 'pedal-hi-hat');

    assert(crash);
    assert(hihat);
    assert(kick);
    assert(pedal);

    is(crash.stemup, true);
    is(hihat.stemup, true);
    is(kick.stemup, false);
    is(pedal.stemup, false);
});

Deno.test('All voice-associated symbols have symbol.voice.name attached', async () => {
    const sequence = new Sequence([
        [0, "key", "Eb"],
        [0, "meter", 0b1010, 1],
        [0, "note", 63, 0.5, 1], // Eb4 in bar 0
        [1, "note", 65, 0.5, 1], // F4 in bar 0
        [4, "note", 67, 0.5, 1]  // G4 in bar 1
    ]);
    const tree = await requestTree(sequence);
    assert(tree[0]);
    assert(tree[1]);

    const bar0Part = tree[0][0];
    const bar1Part = tree[1][0];

    for (const symbol of bar0Part.symbols) {
        if (['note', 'rest', 'beam', 'tie', 'tuplet', 'acci', 'accent', 'ledge'].includes(symbol.type)) {
            assert(symbol.voice, `symbol of type ${symbol.type} should have voice`);
            is(typeof symbol.voice.name, 'string', `symbol.voice.name should be string on ${symbol.type}`);
        }
    }

    for (const symbol of bar1Part.symbols) {
        if (['note', 'rest', 'beam', 'tie', 'tuplet', 'acci', 'accent', 'ledge'].includes(symbol.type)) {
            assert(symbol.voice, `symbol of type ${symbol.type} should have voice`);
            is(typeof symbol.voice.name, 'string', `symbol.voice.name should be string on ${symbol.type}`);
        }
    }
});

Deno.test('Whole bar rest has voice.name attached on empty bars', async () => {
    const sequence = Sequence.from({
        parts: [
            { staff: "treble", name: "Lead", routing: { 1: 0 } },
            { staff: "bass", name: "Bass", routing: { 2: 0 } }
        ],
        events: [
            [0, "meter", 0b1010, 1],
            [0, "sequence", 10, 1, 8],
            [0, "sequence", 20, 2, 8]
        ],
        sequences: [
            {
                id: 10,
                events: [
                    [0, "note", 60, 1, 1],
                    [4, "note", 60, 1, 1]
                ]
            },
            {
                id: 20,
                events: [
                    [0, "note", 50, 1, 1]
                ]
            }
        ]
    });
    const tree = await requestTree(sequence);
    assert(tree[0]);
    assert(tree[1]);

    let bar1Bass;
    let i = -1;
    while (tree[1][++i]) {
        if (tree[1][i].name === 'Bass') bar1Bass = tree[1][i];
    }
    assert(bar1Bass, 'Bass part should exist on bar 1');
    const wholeRest = bar1Bass.symbols.find((s) => s.type === 'rest' && s.whole);
    assert(wholeRest, 'empty bar 1 for Bass should have whole rest');
    assert(wholeRest.voice, 'whole rest must have voice');
    is(wholeRest.voice.name, 'main');
});

Deno.test('Percussion swing straightening quantises swung 8ths to straight 8ths without NaN rests', async () => {
    const sequence = new Sequence([
        [0, "meter", 0b1010, 1],
        [0,    "note", "F3", 0.1, 0.6],
        [1,    "note", "F3", 0.1, 0.2],
        [1.63, "note", "F3", 0.1, 0.2],
        [2,    "note", "F3", 0.1, 0.6],
        [3,    "note", "F3", 0.1, 0.2],
        [3.63, "note", "F3", 0.1, 0.2]
    ]);

    const tree = await requestTree(sequence, [{ staff: 'percussion' }], undefined, undefined, 0, 0, Infinity, { swingAsStraight8ths: true });
    assert(tree[0]);
    const part = tree[0][0];
    assert(part);

    const rests = part.symbols.filter((s) => s.type === 'rest');
    for (const rest of rests) {
        assert(!Number.isNaN(rest.duration), `Rest at beat ${rest.beat} has NaN duration`);
        assert(rest.duration >= 0.125, `Spurious tiny rest at beat ${rest.beat} with duration ${rest.duration}`);
    }

    const tuplets = part.symbols.filter((s) => s.type === 'tuplet');
    is(tuplets.length, 0, 'Straightened swing 8ths should not produce tuplet brackets');

    const notes = part.symbols.filter((s) => s.type === 'note');
    const noteBeats = notes.map((n) => n.beat);
    equals(noteBeats, [0, 1, 1.5, 2, 3, 3.5]);
});

Deno.test('Swing quantisation is restricted to whole beat meters (integer divisor)', async () => {
    // Meter with divisor 0.5 (non-integer)
    const sequence305 = new Sequence([
        [0, "meter", 0b100100, 0.5],
        [0,    "note", "F3", 0.1, 0.2],
        [0.66, "note", "F3", 0.1, 0.2]
    ]);

    const tree305 = await requestTree(sequence305, [{ staff: 'percussion' }], undefined, undefined, 0, 0, Infinity, { swingAsStraight8ths: true });
    assert(tree305[0]);
    const part305 = tree305[0][0];
    const tuplets305 = part305.symbols.filter((s) => s.type === 'tuplet');
    // In non-integer divisor meter, triplet tuplet should be preserved, not straightened
    is(tuplets305.length, 1);
    is(tuplets305[0].divisor, 3);

    const notes305 = part305.symbols.filter((s) => s.type === 'note');
    assert(notes305[1].beat > 0.6, `Note in 3/0.5 meter was unexpectedly straightened to ${notes305[1].beat}`);

    // Meter with divisor 1.5 tested directly in quantise
    const buffer15 = [
        [0, "note", "F3", 0.1, 0.2],
        [0.66, "note", "F3", 0.1, 0.2]
    ];
    const tuplets15 = quantise({ swingAsStraight8ths: true }, { beat: 0, duration: 3, divisor: 1.5 }, buffer15);
    is(tuplets15[0].divisor, 3, 'Meter with divisor 1.5 should keep divisor 3 (not straightened)');

    // 2/2 meter has divisor 2 (integer)
    const sequence22 = new Sequence([
        [0, "meter", 0b11, 2],
        [1,    "note", "F3", 0.1, 0.2],
        [1.63, "note", "F3", 0.1, 0.2]
    ]);

    const tree22 = await requestTree(sequence22, [{ staff: 'percussion' }], undefined, undefined, 0, 0, Infinity, { swingAsStraight8ths: true });
    assert(tree22[0]);
    const part22 = tree22[0][0];
    const notes22 = part22.symbols.filter((s) => s.type === 'note');
    // Swung note at 1.63 should be straightened to 1.5 in whole beat meter
    equals(notes22[1].beat, 1.5);
});

Deno.test('Tuplet deterministic slot rendering with empty slot rest and chord', async () => {
    // Triplet on beat 1 with notes at slot 0 (C4, E4 chord) and slot 2 (G4), slot 1 is empty rest
    const sequence = new Sequence([
        [0, "meter", 0b1010, 1],
        [1.00, "note", 60, 0.1, 0.3], // C4 in slot 0
        [1.01, "note", 64, 0.1, 0.3], // E4 in slot 0
        [1.67, "note", 67, 0.1, 0.3]  // G4 in slot 2
    ]);

    const tree = await requestTree(sequence);
    assert(tree[0]);
    const part = tree[0][0];

    const tuplets = part.symbols.filter((s) => s.type === 'tuplet');
    is(tuplets.length, 1);
    is(tuplets[0].divisor, 3);

    // Symbols in the tuplet bracket: 2 notes in slot 0, 1 note in slot 2
    assert(tuplets[0][0], 'First note in tuplet');
    assert(tuplets[0][1], 'Second note in tuplet');
    assert(tuplets[0][2], 'Third note in tuplet');
    is(tuplets[0][3], undefined);

    // There should be a triplet rest at beat 1 + 1/3 (slot 1)
    const tupletRest = part.symbols.find((s) => s.type === 'rest' && Math.abs(s.beat - (1 + 1/3)) < 0.001);
    assert(tupletRest, 'Expected tuplet rest at slot 1');
    equals(Math.round(tupletRest.duration * 1000) / 1000, 0.333);
});

Deno.test('grainPow2 and grainOfBeat on quantised beat divisions', () => {
    is(grainPow2(0.125, 8, 0), 8);
    is(grainPow2(0.125, 8, 4), 4);
    is(grainPow2(0.125, 8, 2), 2);
    is(grainPow2(0.125, 8, 1), 1);
    is(grainPow2(0.125, 8, 0.5), 0.5);
    is(grainPow2(0.125, 8, 0.25), 0.25);
    is(grainPow2(0.125, 8, 0.125), 0.125);
    is(grainPow2(0.125, 8, 0.375), 0.125);

    // In a 4/4 bar with divisions [0, 2, 4]
    const divisions = [0, 2, 4];
    is(grainOfBeat(divisions, 0), 2);
    is(grainOfBeat(divisions, 1), 1);
    is(grainOfBeat(divisions, 1.5), 0.5);
    is(grainOfBeat(divisions, 2), 2);
});

Deno.test('PLL spring state (drift) is preserved across bar boundaries', async () => {
    // 2 bars of quarter notes in 4/4 with consistent laid-back drift (+0.03 beats)
    const sequence = new Sequence([
        [0, "meter", 0b1010, 1],
        [0.03, "note", 60, 0.1, 0.5],
        [1.03, "note", 60, 0.1, 0.5],
        [2.03, "note", 60, 0.1, 0.5],
        [3.03, "note", 60, 0.1, 0.5],
        [4.03, "note", 60, 0.1, 0.5],
        [5.03, "note", 60, 0.1, 0.5],
        [6.03, "note", 60, 0.1, 0.5],
        [7.03, "note", 60, 0.1, 0.5]
    ]);
    const tree = await requestTree(sequence);
    assert(tree[0], 'Bar 0 exists');
    assert(tree[1], 'Bar 1 exists');

    const voice0 = tree[0][0][0];
    const voice1 = tree[1][0][0];

    const lastTupletBar0 = voice0.tuplets[voice0.tuplets.length - 1];
    const firstTupletBar1 = voice1.tuplets[0];

    // Bar 0 final tuplet evolved positive drift
    assert(lastTupletBar0.driftOut > 0.01, `Expected bar 0 last tuplet driftOut > 0.01, got ${lastTupletBar0.driftOut}`);

    // Bar 1 first tuplet inherited that drift from bar 0 instead of resetting to 0
    is(firstTupletBar1.drift, lastTupletBar0.driftOut);
});

Deno.test('Meterless sequence renders as a single bar containing all notes', async () => {
    const sequence = new Sequence([
        [0, "note", 60, 0.1, 1],
        [1, "note", 62, 0.1, 1],
        [2, "note", 64, 0.1, 1]
    ]);

    const tree = await requestTree(sequence);
    is(1, tree.length, 'Tree has exactly one bar');
    is(3, tree[0].duration, 'Bar duration spans all notes');
    is(tree[0].divisions[0], 3, 'Bar divisions end at bar duration');
    is(undefined, tree[0].meterEvent, 'Bar has no meterEvent');

    const part = tree[0][0];
    const notes = part.symbols.filter((s) => s.type === 'note');
    is(3, notes.length, 'All notes rendered in the single bar');
});

Deno.test('Text events quantise and symbolise correctly in their own voice', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 0b1010, 1],
        [0, "text", 2, "Intro"],
        [2, "text", 2, "verse"]
    ]);

    const tree = await requestTree(sequence);
    assert(tree[0], 'Bar 0 exists');

    const part = tree[0][0];
    const textSymbols = part.symbols.filter((s) => s.type === 'text');
    is(2, textSymbols.length, '2 text symbols created');

    is(0, textSymbols[0].beat, 'First text at beat 0');
    is(2, textSymbols[0].duration, 'First text duration 2');
    is('Intro', textSymbols[0].value, 'First text value is "Intro"');
    is('text', textSymbols[0].voice.name, 'First text voice is "text"');
    assert(textSymbols[0].stave, 'First text has stave');

    is(2, textSymbols[1].beat, 'Second text at beat 2');
    is(2, textSymbols[1].duration, 'Second text duration 2');
    is('verse', textSymbols[1].value, 'Second text value is "verse"');
    is('text', textSymbols[1].voice.name, 'Second text voice is "text"');

    // Bar has only text events, so whole bar rest should exist with stave's default voice (not 'text')
    const rest = part.symbols.find((s) => s.type === 'rest' && s.whole);
    assert(rest, 'Whole bar rest exists when bar has only text');
    is('main', rest.voice.name, 'Whole bar rest has default stave voice, not text voice');
});

Deno.test('Text events truncate duration at bar line and coexist with notes', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 0b1010, 1],
        [0, "note", 60, 0.8, 1],
        [3, "text", 2, "overlapping-text"] // crosses bar boundary at beat 4
    ]);

    const tree = await requestTree(sequence);
    assert(tree[0], 'Bar 0 exists');

    const part = tree[0][0];
    const textSymbols = part.symbols.filter((s) => s.type === 'text');
    is(1, textSymbols.length, '1 text symbol in bar 0');
    is(3, textSymbols[0].beat, 'Text symbol at beat 3');
    is(1, textSymbols[0].duration, 'Text symbol duration truncated to 1 at bar end');
    is('overlapping-text', textSymbols[0].value);

    const noteSymbols = part.symbols.filter((s) => s.type === 'note');
    is(1, noteSymbols.length, 'Note symbol exists');

    // Since note exists, no whole bar rest
    const wholeRest = part.symbols.find((s) => s.type === 'rest' && s.whole);
    is(undefined, wholeRest, 'No whole bar rest when note is present');
});

Deno.test('Prune phantom trailing bars caused by raw note release overhang', async () => {
    // Note on beat 3 of 4/4 with raw duration 1.05 stops at beat 4.05.
    // In read(), stopBeat 4.05 creates Bar 2.
    // In symbolise(), the note is quantised to beat 3..4 without tying into Bar 2.
    // Bar 2 is pruned, leaving exactly 1 bar with doubleBarLine true.
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 0b1010, 1],
        [3, "note", "C4", 0.5, 1.05]
    ]);
    const tree = await requestTree(sequence);
    is(tree.length, 1, 'Should prune phantom trailing bar 2');
    is(tree[0].doubleBarLine, true, 'First bar should now have double bar line');
});

Deno.test('Retain trailing bar when note genuinely ties across bar line', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 0b1010, 1],
        [3, "note", "C4", 0.5, 2.0]
    ]);
    const tree = await requestTree(sequence);
    is(tree.length, 2, 'Should keep Bar 2 when note ties over');
    is(tree[1].doubleBarLine, true, 'Last bar should have double bar line');
});

Deno.test('Score parts: routes multiple sources to voices on a grand stave', async () => {
    const sequence = Sequence.from({
        events: [
            [0, "meter", 0b1010, 1],
            [0, "key", "C"],
            [0, "sequence", 1, 2, 4], // Melody (source 2)
            [0, "sequence", 2, 1, 4]  // Accompaniment (source 1)
        ],
        sequences: [
            { id: 1, events: [[0, "note", "E4", 0.1, 4]] },
            { id: 2, events: [[0, "note", "C3", 0.1, 4]] }
        ],
        parts: [{
            staff: "grand",
            name: "Piano",
            routing: {
                2: 1,
                1: 2
            }
        }]
    });

    const tree = await requestTree(sequence);
    is(tree.length, 1);
    is(tree[0].length, 1);
    is(tree[0][0].name, 'Piano');
    is(tree[0][0].stave.type, 'grand');

    const notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    is(notes.length, 2);
    is(notes.find((n) => n.pitch === 'E4').voice.name, 'rh');
    is(notes.find((n) => n.pitch === 'C3').voice.name, 'lh');
});

Deno.test('Score parts: routes sources to open score staves', async () => {
    const sequence = Sequence.from({
        events: [
            [0, "meter", 0b1010, 1],
            [0, "key", "C"],
            [0, "sequence", 1, "mel", 4],
            [0, "sequence", 2, "acc", 4]
        ],
        sequences: [
            { id: 1, events: [[0, "note", "E4", 0.1, 4]] },
            { id: 2, events: [[0, "note", "C3", 0.1, 4]] }
        ],
        parts: [
            { staff: "treble", name: "Melody", routing: { mel: 1 } },
            { staff: "bass", name: "Accompaniment", routing: { acc: 1 } }
        ]
    });

    const tree = await requestTree(sequence);
    is(tree.length, 1);
    is(tree[0].length, 2);
    is(tree[0][0].name, 'Melody');
    is(tree[0][0].stave.type, 'treble');
    is(tree[0][1].name, 'Accompaniment');
    is(tree[0][1].stave.type, 'bass');

    const p0Notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    const p1Notes = tree[0][1].symbols.filter((s) => s.type === 'note');
    is(p0Notes.length, 1);
    is(p0Notes[0].pitch, 'E4');
    is(p1Notes.length, 1);
    is(p1Notes[0].pitch, 'C3');
});

Deno.test('Score parts: routes SATB to four voices on a single grand stave', async () => {
    const sequence = Sequence.from({
        events: [
            [0, "meter", 0b1010, 1],
            [0, "key", "C"],
            [0, "sequence", 1, 1, 4],
            [0, "sequence", 2, 2, 4],
            [0, "sequence", 3, 3, 4],
            [0, "sequence", 4, 4, 4]
        ],
        sequences: [
            { id: 1, events: [[0, "note", "G5", 0.1, 4]] },
            { id: 2, events: [[0, "note", "E4", 0.1, 4]] },
            { id: 3, events: [[0, "note", "C4", 0.1, 4]] },
            { id: 4, events: [[0, "note", "C3", 0.1, 4]] }
        ],
        parts: [{
            staff: "grand",
            name: "Choir",
            routing: {
                1: 3,
                2: 4,
                3: 5,
                4: 6
            }
        }]
    });

    const tree = await requestTree(sequence);
    is(tree.length, 1);
    is(tree[0].length, 1);
    is(tree[0][0].name, 'Choir');
    is(tree[0][0].stave.type, 'grand');

    const notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    is(notes.length, 4);
    is(notes.find((n) => n.pitch === 'G5').voice.name, 'soprano');
    is(notes.find((n) => n.pitch === 'E4').voice.name, 'alto');
    is(notes.find((n) => n.pitch === 'C4').voice.name, 'tenor');
    is(notes.find((n) => n.pitch === 'C3').voice.name, 'bass');
});

Deno.test('Score parts: undefined routing implicitly maps { 0: 0 } and distributes voice 0 on grand stave', async () => {
    const sequence = Sequence.from({
        events: [
            [0, "meter", 0b1010, 1],
            [0, "key", "C"],
            [0, "note", "E4", 0.1, 4], // >= 60 -> rh
            [0, "note", "C3", 0.1, 4]  // < 60  -> lh
        ],
        parts: [{
            staff: "grand",
            name: "Piano"
            // routing undefined -> implicit { 0: 0 }
        }]
    });

    const tree = await requestTree(sequence);
    is(tree.length, 1);
    is(tree[0].length, 1);
    is(tree[0][0].name, 'Piano');
    is(tree[0][0].stave.type, 'grand');

    const notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    is(notes.length, 2);
    is(notes.find((n) => n.pitch === 'E4').voice.name, 'rh');
    is(notes.find((n) => n.pitch === 'C3').voice.name, 'lh');
});

Deno.test('Score parts: numeric voice keys map to grand stave voices (1: rh, 2: lh)', async () => {
    const sequence = Sequence.from({
        events: [
            [0, "meter", 0b1010, 1],
            [0, "key", "C"],
            [0, "sequence", 1, 2, 4],
            [0, "sequence", 2, 1, 4]
        ],
        sequences: [
            { id: 1, events: [[0, "note", "G4", 0.1, 4]] },
            { id: 2, events: [[0, "note", "F2", 0.1, 4]] }
        ],
        parts: [{
            staff: "grand",
            name: "Piano",
            routing: {
                2: 1, // source 2 -> voice 1 (rh)
                1: 2  // source 1 -> voice 2 (lh)
            }
        }]
    });

    const tree = await requestTree(sequence);
    is(tree[0][0].name, 'Piano');
    const notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    is(notes.length, 2);
    is(notes.find((n) => n.pitch === 'G4').voice.name, 'rh');
    is(notes.find((n) => n.pitch === 'F2').voice.name, 'lh');
});

Deno.test('Score parts: numeric voice keys map to SATB on grand stave (3: soprano, 4: alto, 5: tenor, 6: bass)', async () => {
    const sequence = Sequence.from({
        events: [
            [0, "meter", 0b1010, 1],
            [0, "key", "C"],
            [0, "sequence", 1, 1, 4],
            [0, "sequence", 2, 2, 4],
            [0, "sequence", 3, 3, 4],
            [0, "sequence", 4, 4, 4]
        ],
        sequences: [
            { id: 1, events: [[0, "note", "G5", 0.1, 4]] },
            { id: 2, events: [[0, "note", "E4", 0.1, 4]] },
            { id: 3, events: [[0, "note", "C4", 0.1, 4]] },
            { id: 4, events: [[0, "note", "C3", 0.1, 4]] }
        ],
        parts: [{
            staff: "grand",
            name: "SATB",
            routing: {
                1: 3,
                2: 4,
                3: 5,
                4: 6
            }
        }]
    });

    const tree = await requestTree(sequence);
    is(tree[0][0].name, 'SATB');
    const notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    is(notes.length, 4);
    is(notes.find((n) => n.pitch === 'G5').voice.name, 'soprano');
    is(notes.find((n) => n.pitch === 'E4').voice.name, 'alto');
    is(notes.find((n) => n.pitch === 'C4').voice.name, 'tenor');
    is(notes.find((n) => n.pitch === 'C3').voice.name, 'bass');
});

Deno.test('Score parts: routes multiple sources to a single voice', async () => {
    const sequence = Sequence.from({
        events: [
            [0, "meter", 0b1010, 1],
            [0, "key", "C"],
            [0, "sequence", 1, "flute1", 4],
            [0, "sequence", 2, "flute2", 4]
        ],
        sequences: [
            { id: 1, events: [[0, "note", "G5", 0.1, 4]] },
            { id: 2, events: [[0, "note", "E5", 0.1, 4]] }
        ],
        parts: [{
            staff: "treble",
            name: "Flutes",
            routing: {
                flute1: 0,
                flute2: 0
            }
        }]
    });

    const tree = await requestTree(sequence);
    is(tree.length, 1);
    is(tree[0].length, 1);
    is(tree[0][0].name, 'Flutes');
    const notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    is(notes.length, 2);
    is(notes[0].voice.name, 'main');
    is(notes[1].voice.name, 'main');
});

Deno.test('Score parts: routes one source to multiple parts', async () => {
    const sequence = Sequence.from({
        events: [
            [0, "meter", 0b1010, 1],
            [0, "key", "C"],
            [0, "sequence", 1, "lead", 4]
        ],
        sequences: [
            { id: 1, events: [[0, "note", "A4", 0.1, 4]] }
        ],
        parts: [
            { staff: "treble", name: "Solo", routing: { lead: 0 } },
            { staff: "treble", name: "Condensed", routing: { lead: 0 } }
        ]
    });

    const tree = await requestTree(sequence);
    is(tree[0].length, 2);
    is(tree[0][0].name, 'Solo');
    is(tree[0][1].name, 'Condensed');

    const part0Notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    const part1Notes = tree[0][1].symbols.filter((s) => s.type === 'note');
    is(part0Notes.length, 1);
    is(part0Notes[0].pitch, 'A4');
    is(part0Notes[0].event.part, 'Solo');

    is(part1Notes.length, 1);
    is(part1Notes[0].pitch, 'A4');
    is(part1Notes[0].event.part, 'Condensed');
});

Deno.test('3/4 meter: notes and text on third beat stay within their bar', async () => {
    const sequence = Sequence.from({
        events: [
            [0, "meter", 0b100, 1],
            [0, "key", "C"],
            [0, "text", 2, "kiss"],
            [0, "note", "G4", 0.1, 2],
            [2, "text", 1, "and"],
            [2, "note", "G3", 0.1, 1],
            [3, "text", 2, "then"],
            [3, "note", "A3", 0.1, 2],
            [5, "text", 1, "we"],
            [5, "note", "G3", 0.1, 1]
        ]
    });

    const tree = await requestTree(sequence);
    is(tree.length, 2);

    // Bar 0: beat 0
    const bar0Texts = tree[0][0].symbols.filter((s) => s.type === 'text');
    const bar0Notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    is(bar0Texts.map((s) => s.value).join(' '), 'kiss and');
    is(bar0Notes.length, 2);

    // Bar 1: beat 3
    const bar1Texts = tree[1][0].symbols.filter((s) => s.type === 'text');
    const bar1Notes = tree[1][0].symbols.filter((s) => s.type === 'note');
    is(bar1Texts.map((s) => s.value).join(' '), 'then we');
    is(bar1Notes.length, 2);
});

Deno.test('requestTree: default key and timesig without mutating sequence', async () => {
    const sequence = new Sequence([
        [0, "note", "D4", 0.1, 1],
        [3, "note", "E4", 0.1, 1],
        [5, "note", "F#4", 0.1, 1]
    ]);

    const initialLength = sequence.events.length;
    const tree = await requestTree(sequence, undefined, 'D', '3/4');

    // Does not mutate underlying sequence
    is(sequence.events.length, initialLength);

    // Segmented into 2 bars of 3/4
    is(tree.length, 2);
    is(tree[0].duration, 3);
    is(tree[0].key, 2); // D major = 2 sharps
    is(tree[0].meterEvent.timesig, '3/4');
    is(tree[1].beat, 3);
    is(tree[1].duration, 3);
});

Deno.test('requestTree: sequence events override default key and timesig', async () => {
    const sequence = new Sequence([
        [0, "key", "Eb"],
        [0, "meter", 0b1010, 1],
        [0, "note", "Eb4", 0.1, 1]
    ]);

    const tree = await requestTree(sequence, undefined, 'D', '3/4');

    // Overridden by beat 0 sequence events
    is(tree[0].duration, 4);
    is(tree[0].key, -3); // Eb major = 3 flats
});

Deno.test('requestTree: spells parts and resolves stave rows without showAtConcertPitch', async () => {
    const sequence = new Sequence([
        [0, "note", 60, 1, 1],
        [1, "note", 62, 1, 1],
        [2, "note", 64, 1, 1],
        [3, "note", 65, 1, 1]
    ]);

    const tree = await requestTree(sequence, undefined, 'C', '4/4');
    assert(tree[0]);
    assert(tree[0][0]);
    const noteSymbols = tree[0][0].symbols.filter((s) => s.type === 'note');
    is(noteSymbols.length, 4);
    is(noteSymbols[0].pitch, 'C4');
    is(typeof noteSymbols[0].row, 'number');
});

Deno.test('requestTree: anacrusis bar at beat=1 in 4/4 has duration 3, divisions [1, 3], 4/4 timesig, and following bars duration 4, divisions [2, 4]', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 0b1010, 1],
        [0.5, "note", "D3", 0.1, 0.5],
        [1, "note", "E3", 0.1, 1],
        [2, "note", "F3", 0.1, 1],
        [3, "note", "G3", 0.1, 1],
        [4, "note", "A3", 0.1, 4]
    ]);

    const tree = await requestTree(sequence, undefined, undefined, undefined, 0, 1);

    is(tree.length, 2);

    // 1) Rendering starts on beat 1
    is(tree[0].beat, 1);

    // 2) First bar is duration 3, divisor 1, divisions [1, 3]
    is(tree[0].duration, 3);
    is(tree[0].divisor, 1);
    equals(tree[0].divisions, [1, 3]);

    // 3) Following bar starts at beat 4 with duration 4, divisor 1, divisions [2, 4]
    is(tree[1].beat, 4);
    is(tree[1].duration, 4);
    is(tree[1].divisor, 1);
    equals(tree[1].divisions, [2, 4]);

    // 4) Time signature of 4/4 is displayed at the start of the first bar
    const timesig = tree[0][0].symbols.find((s) => s.type === 'timesig');
    assert(timesig, 'First bar should contain a timesig symbol');
    is(timesig.numerator, 4);
    is(timesig.denominator, 4);

    // Note at 0.5 (before beat 1) was ignored; notes at 1, 2, 3 are in bar 0
    const bar0Notes = tree[0][0].symbols.filter((s) => s.type === 'note');
    is(bar0Notes.length, 3);
    is(bar0Notes[0].beat, 0);
    is(bar0Notes[1].beat, 1);
    is(bar0Notes[2].beat, 2);
});









