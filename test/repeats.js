
import { assert, assertEquals as equals } from 'jsr:@std/assert@1';
import { Sequence } from 'sequence/module.js';
import requestTree  from '../modules/tree.js';


// Summarise each bar of a part as 'x' (written out), '%1', '%2', '%4' (holds a
// bar repeat symbol) or '-' (emptied, covered by a neighbouring 2 or 4 bar
// repeat symbol)
function summarise(tree, name = 'default') {
    const summary = [];
    let n = -1;
    while (tree[++n]) {
        const part    = Array.from(tree[n]).find((part) => part.name === name);
        const repeat  = part.symbols.find((symbol) => symbol.type === 'barrepeat');
        const content = part.symbols.find((symbol) => symbol.type === 'note' || symbol.type === 'rest');
        summary.push(repeat ? '%' + repeat.count : content ? 'x' : '-');
    }
    return summary.join(' ');
}

// Naturals only, to keep the speller from spelling identical bars differently
const pitches = { A: 60, B: 62, C: 64, D: 65, E: 67, F: 69, G: 71 };

// Sequence of 4/4 bars from a pattern string where each character is a bar,
// '.' is an empty bar and a letter is a bar of notes unique to that letter
function fromPattern(pattern) {
    const events = [[0, 'meter', 0b1010, 1]];
    let n = -1;
    while (pattern[++n]) {
        const pitch = pitches[pattern[n]];
        if (!pitch) continue;
        events.push(
            [n * 4,     'note', pitch,      0.1, 1],
            [n * 4 + 1, 'note', pitch + 12, 0.1, 1],
            [n * 4 + 2, 'note', pitch,      0.1, 2]
        );
    }
    return new Sequence(events);
}

async function summarisePattern(pattern, settings) {
    return summarise(await requestTree(fromPattern(pattern), undefined, undefined, undefined, 0, 0, Infinity, settings));
}


Deno.test('Bar repeats: 1 bar repeats need 3 repeats', async () => {
    equals(await summarisePattern('AA'),         'x x');
    equals(await summarisePattern('AAA'),        'x x x');
    equals(await summarisePattern('AAAA'),       'x %1 %1 %1');
    equals(await summarisePattern('AAAAAB'),     'x %1 %1 %1 %1 x');
    equals(await summarisePattern('AAAABAAAAB'), 'x %1 %1 %1 x x %1 %1 %1 x');
    equals(await summarisePattern('AAAAAAAA'),   'x %1 %1 %1 %1 %1 %1 %1');
});

Deno.test('Bar repeats: 2 bar repeats need 2 repeats', async () => {
    equals(await summarisePattern('ABAB'),     'x x x x');
    equals(await summarisePattern('ABABAB'),   'x x - %2 - %2');
    equals(await summarisePattern('ABABABA'),  'x x - %2 - %2 x');
    equals(await summarisePattern('ABABABAB'), 'x x - %2 - %2 - %2');
});

Deno.test('Bar repeats: 4 bar repeats need 1 repeat', async () => {
    equals(await summarisePattern('ABCDABCD'),     'x x x x - - %4 -');
    equals(await summarisePattern('ABCDABCDABCD'), 'x x x x - - %4 - - - %4 -');
    equals(await summarisePattern('ABCDABC'),      'x x x x x x x');
    // A pending run of 1 bar repeats does not block a 4 bar repeat
    equals(await summarisePattern('ABCCABCC'),     'x x x x - - %4 -');
    equals(await summarisePattern('ABBBABBB'),     'x x x x - - %4 -');
});

Deno.test('Bar repeats: rest bars are not repeated', async () => {
    equals(await summarisePattern('A......A'), 'x x x x x x x x');
});

Deno.test('Bar repeats: thresholds are configurable', async () => {
    equals(await summarisePattern('AA', { barRepeat1Threshold: 1 }), 'x %1');
    equals(await summarisePattern('AAAA', { barRepeat1Threshold: 0 }), 'x x x x');
    equals(await summarisePattern('ABABABAB', { barRepeat2Threshold: 0 }), 'x x x x - - %4 -');
    equals(await summarisePattern('ABCDABCD', {
        barRepeat1Threshold: 0,
        barRepeat2Threshold: 0,
        barRepeat4Threshold: 0
    }), 'x x x x x x x x');
});

Deno.test('Bar repeats: never repeat material from before a double bar line', async () => {
    const sequence = Sequence.from({
        events: [
            [0,  'meter', 0b1010, 1],
            [0,  'sequence', 10, 0, 8],
            [8,  'sequence', 10, 0, 8],
            [16, 'sequence', 10, 0, 8]
        ],
        sequences: [{
            id: 10,
            events: [[0, 'note', 60, 0.1, 4], [4, 'note', 60, 0.1, 4]]
        }]
    });

    const tree = await requestTree(sequence, undefined, undefined, undefined, 0, 0, Infinity, { barRepeat1Threshold: 1 });
    equals(summarise(tree), 'x %1 x %1 x %1');
});

Deno.test('Bar repeats: bars with notes tied in are not repeated', async () => {
    // Each bar ties a note into the next
    const events = [[0, 'meter', 0b1010, 1]];
    let n = -1;
    while (++n < 6) events.push([n * 4, 'note', 60, 0.1, 3], [n * 4 + 3, 'note', 62, 0.1, 2]);
    const tree = await requestTree(new Sequence(events));
    assert(!summarise(tree).includes('%'), summarise(tree));
});

Deno.test('Bar repeats: detected per part', async () => {
    const sequence = Sequence.from({
        parts: [
            { staff: 'treble', name: 'Lead', routing: { 1: 0 } },
            { staff: 'bass', name: 'Bass', routing: { 2: 0 } }
        ],
        events: [
            [0, 'meter', 0b1010, 1],
            [0, 'sequence', 10, 1, 24],
            [0, 'sequence', 20, 2, 24]
        ],
        sequences: [{
            // Lead: A B C D E F, nothing repeats
            id: 10,
            events: [60, 62, 64, 65, 67, 69].map((pitch, i) => [i * 4, 'note', pitch, 0.1, 4])
        }, {
            // Bass: the same bar six times
            id: 20,
            events: [0, 1, 2, 3, 4, 5].map((i) => [i * 4, 'note', 48, 0.1, 4])
        }]
    });

    const tree = await requestTree(sequence);
    equals(summarise(tree, 'Lead'), 'x x x x x x');
    equals(summarise(tree, 'Bass'), 'x %1 %1 %1 %1 %1');
});

Deno.test('Bar repeats: time signatures survive replacement', async () => {
    const sequence = new Sequence([
        [0,  'key', 'D'],
        [0,  'meter', 0b1010, 1],
        [0,  'note', 62, 0.1, 4],
        // Restated time signature
        [4,  'meter', 0b1010, 1],
        [4,  'note', 62, 0.1, 4],
        [8,  'note', 62, 0.1, 4],
        [12, 'note', 62, 0.1, 4]
    ]);

    const tree  = await requestTree(sequence, undefined, undefined, undefined, 0, 0, Infinity, { barRepeat1Threshold: 1 });
    const types = tree[1][0].symbols.map((symbol) => symbol.type);
    equals(summarise(tree), 'x %1 %1 %1');
    equals(types, ['timesig', 'barrepeat']);
});

Deno.test('Bar repeats: fingerprints ignore floating point noise in beats', async () => {
    // Triplets, whose beats are computed relative to bar beat
    const events = [[0, 'meter', 0b1010, 1]];
    let n = -1;
    while (++n < 4) events.push(
        [n * 4 + 1,   'note', 60, 0.1, 0.3],
        [n * 4 + 4/3, 'note', 62, 0.1, 0.3],
        [n * 4 + 5/3, 'note', 64, 0.1, 0.3]
    );
    const tree = await requestTree(new Sequence(events));
    equals(summarise(tree), 'x %1 %1 %1');
});
