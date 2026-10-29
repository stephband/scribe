
import {
    assert,
    assertEquals as equals,
    assertGreaterOrEqual as gte,
    assertStrictEquals as is,
    assertObjectMatch as matches
} from 'jsr:@std/assert@1';

import { Sequence } from 'sequence/module.js';
import createTree   from '../modules/tree.js';

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
