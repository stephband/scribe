
import {
    assert,
    assertEquals as equals,
    assertGreaterOrEqual as gte,
    assertStrictEquals as is,
    assertObjectMatch as matches
} from 'jsr:@std/assert@1';

import { Sequence } from 'sequence/module.js';
import createTree   from '../modules/tree.js';
import quantise     from '../modules/quantise.js';

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
        [0, "meter", 4, 1],
        [0, "note", "C4", 0.5, 1]
    ]);
    const tree = await createTree(sequence, { showAtConcertPitch: true });
    assert(tree[0]);
    assert(tree[0][0]);
    is(tree[0][0].key, 0);
    is(tree[0][0].transpose, 0);
});

Deno.test('quantise chords with minDivision 1/3 and primes [2, 3]', async () => {
    const sequence = new Sequence([
        [0, "key", "C"],
        [0, "meter", 4, 1],
        [0.04, "chord", "C", "", 1],
        [0.52, "chord", "G", "7", 1]
    ]);
    const tree = await createTree(sequence);
    assert(tree[0]);
    const part = tree[0][0];
    const chordSymbols = part.symbols.filter((s) => s.type === 'chord');
    is(chordSymbols.length, 2);
    is(chordSymbols[0].beat, 0);
    is(chordSymbols[1].beat, 0.5);
});

Deno.test('DrumStave delegates spelling directly without RNN speller', async () => {
    const sequence = new Sequence([
        [0, "key", "D"],
        [0, "meter", 4, 1],
        [0, "note", 38, 0.8, 1],
        [1, "note", 42, 0.8, 1]
    ]);
    sequence.display = { staff: 'drum' };
    const tree = await createTree(sequence);
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
        [0, "meter", 4, 1],
        [0, "note", 49, 0.8, 1], // Crash Cymbal 1 -> upper voice
        [0, "note", 36, 0.8, 1], // Bass Drum 1 -> lower voice
        [1, "note", 42, 0.8, 1], // Closed Hi-Hat -> upper voice
        [1, "note", 44, 0.8, 1]  // Pedal Hi-Hat -> lower voice
    ]);
    sequence.display = { staff: 'drum' };
    const tree = await createTree(sequence);
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
        [0, "meter", 4, 1],
        [0, "note", 63, 0.5, 1], // Eb4 in bar 0
        [1, "note", 65, 0.5, 1], // F4 in bar 0
        [4, "note", 67, 0.5, 1]  // G4 in bar 1
    ]);
    const tree = await createTree(sequence);
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
        objects: [
            { id: 1, name: "Lead" },
            { id: 2, name: "Bass" }
        ],
        events: [
            [0, "meter", 4, 1],
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
    const tree = await createTree(sequence);
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
        [0, "meter", 4, 1],
        [0,    "note", "F3", 0.1, 0.6],
        [1,    "note", "F3", 0.1, 0.2],
        [1.63, "note", "F3", 0.1, 0.2],
        [2,    "note", "F3", 0.1, 0.6],
        [3,    "note", "F3", 0.1, 0.2],
        [3.63, "note", "F3", 0.1, 0.2]
    ]);

    const tree = await createTree(sequence, { display: 'percussion', swingAsStraight8ths: true });
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
        [0, "meter", 3, 0.5],
        [0,    "note", "F3", 0.1, 0.2],
        [0.66, "note", "F3", 0.1, 0.2]
    ]);

    const tree305 = await createTree(sequence305, { display: 'percussion', swingAsStraight8ths: true });
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
        [0, "meter", 4, 2],
        [1,    "note", "F3", 0.1, 0.2],
        [1.63, "note", "F3", 0.1, 0.2]
    ]);

    const tree22 = await createTree(sequence22, { display: 'percussion', swingAsStraight8ths: true });
    assert(tree22[0]);
    const part22 = tree22[0][0];
    const notes22 = part22.symbols.filter((s) => s.type === 'note');
    // Swung note at 1.63 should be straightened to 1.5 in whole beat meter
    equals(notes22[1].beat, 1.5);
});


