import RecurrentNetwork from 'neuron/modules/rnn/network-train.js';
import { exportAsModule, serializeWeights } from 'neuron/modules/serialize.js';
import Sequence from 'sequence/module.js';
import batch from '../modules/spell/batch.js';
import schema, { encode, decode, OUT_DIM } from '../modules/spell/schema.js';
import spell  from 'sequence/modules/spell.js';


if (!Deno.args.length) {
    console.error('Usage: deno run --allow-read --allow-write deno/train.js <path/to/dir-or-file> [...]');
    Deno.exit(1);
}

const cwdUrl    = new URL(`file://${Deno.cwd()}/`);
const rvalidExt = /\.(?:sequence|json|js)$/i;

async function collectFiles(targetUrl, files = []) {
    const stat = await Deno.stat(targetUrl);
    if (stat.isFile) {
        if (rvalidExt.test(targetUrl.pathname)) {
            const name = targetUrl.pathname.split('/').pop();
            files.push({ name, url: targetUrl });
        }
        return files;
    }

    const dirUrl = targetUrl.href.endsWith('/') ? targetUrl : new URL(targetUrl.href + '/');
    for await (const entry of Deno.readDir(dirUrl)) {
        if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
        const entryUrl = new URL(entry.name + (entry.isDirectory ? '/' : ''), dirUrl);
        if (entry.isDirectory) {
            await collectFiles(entryUrl, files);
        }
        else if (entry.isFile && rvalidExt.test(entry.name)) {
            files.push({ name: entry.name, url: entryUrl });
        }
    }
    return files;
}

function getExpectedSpelling(event) {
    if (event.label) {
        const parts = event.label.trim().split(/\s+/);
        return parts[1] || event.sourcePitch;
    }
    return event.sourcePitch;
}


/**
encodeTargets(head)

Builds a flat `Float32Array(head.count * 19)` multi-hot valid-key mask per slice.
For each slice `t`, every key `c` (`key = c - 9`) that spells the slice's notes
with the maximum number of ground-truth matches is marked `1`.
**/

export function encodeTargets(head) {
    const targets = new Float32Array(head.count * OUT_DIM);
    const counts  = new Uint16Array(OUT_DIM);
    let offset = 0;
    let slice  = head;

    while (slice && slice.length) {
        let bestMatches = 0;

        for (let c = 0; c < OUT_DIM; c++) {
            const key = c - 9;
            let matches = 0;
            let s = 0, event;
            while (event = slice[--s]) {
                if (event.type !== 'note') continue;
                const expected = getExpectedSpelling(event);
                if (!expected || spell(event[2], key) === expected) {
                    ++matches;
                }
            }
            counts[c] = matches;
            if (matches > bestMatches) bestMatches = matches;
        }

        for (let c = 0; c < OUT_DIM; c++) {
            if (counts[c] === bestMatches) {
                targets[offset + c] = 1;
            }
        }

        offset += OUT_DIM;
        slice = slice.next;
    }

    return { key: targets };
}


// 1. Collect and load sequences from CLI arguments
const entries = [];
for (const arg of Deno.args) {
    try {
        const targetUrl = new URL(arg, cwdUrl);
        await collectFiles(targetUrl, entries);
    }
    catch (err) {
        console.error(`Failed to read "${arg}": ${err.message}`);
        Deno.exit(1);
    }
}

entries.sort((a, b) => a.url.href.localeCompare(b.url.href));

const sequences = {};
for (const entry of entries) {
    const fileUrl = entry.url;

    if (entry.name.endsWith('.sequence')) {
        const text = await Deno.readTextFile(fileUrl);
        const seq  = Sequence.parse(text);
        seq.name   = seq.name || entry.name.replace(/\.sequence$/, '');
        sequences[seq.name] = seq;
    }
    else if (entry.name.endsWith('.json')) {
        const mod  = await import(fileUrl.href, { with: { type: 'json' } });
        const data = mod.default;
        if (data && (data.events || data.sequences)) {
            const seq = Sequence.from(data);
            seq.name  = seq.name || entry.name.replace(/\.json$/, '');
            sequences[seq.name] = seq;
        }
        else if (typeof data === 'object' && data !== null) {
            for (const [k, v] of Object.entries(data)) {
                if (v && (v.events || Array.isArray(v))) {
                    const seq = Sequence.from(v);
                    sequences[seq.name || k] = seq;
                }
            }
        }
    }
    else if (entry.name.endsWith('.js')) {
        const mod = await import(fileUrl.href);
        for (const [key, val] of Object.entries(mod)) {
            if (val && (val instanceof Sequence || Array.isArray(val.events))) {
                const seq = val instanceof Sequence ? val : Sequence.from(val);
                sequences[seq.name || key] = seq;
            }
        }
    }
}

if (Object.keys(sequences).length === 0) {
    console.error(`No sequences found in: ${Deno.args.join(', ')}`);
    Deno.exit(1);
}

console.log('=== Momentary-Key RNN Training & Weight Serialization ===\n');
console.log(`1. Preparing beat-slice dataset from ${Object.keys(sequences).length} sequences...`);

const dataset = [];
let totalSlices = 0;
let totalNotes  = 0;

for (const [name, seq] of Object.entries(sequences)) {
    const events = Array.from(seq);
    const head   = batch(events);
    if (!head.length) continue;

    const features = encode(head);
    const targets  = encodeTargets(head);

    let noteCount = 0;
    let slice = head;
    while (slice && slice.length) {
        let s = 0, event;
        while (event = slice[--s]) {
            if (event.type === 'note') ++noteCount;
        }
        slice = slice.next;
    }

    dataset.push({
        name: seq.name || name,
        head,
        features,
        length: head.count,
        targets,
        noteCount
    });

    totalSlices += head.count;
    totalNotes  += noteCount;
}

console.log(`   ✓ Encoded ${dataset.length} sequences (${totalSlices} beat slices, ${totalNotes} notes).`);

// 2. Initialize & train RecurrentNetwork
console.log(`\n2. Initializing RecurrentNetwork (${schema.inDim} -> ${schema.layers[0].hiddenDim}x2 BiGRU -> ${OUT_DIM} keys)...`);
const network = new RecurrentNetwork(schema);

console.log('\n3. Training network using BPTT and Adam optimizer (50 epochs)...');
const res1 = network.train(dataset, {
    epochs: 20,
    lr: 0.008,
    logInterval: 5
});
const res2 = network.train(dataset, {
    epochs: 20,
    lr: 0.003,
    logInterval: 5
});
const res3 = network.train(dataset, {
    epochs: 10,
    lr: 0.001,
    logInterval: 5
});
const totalDuration = (res1.duration + res2.duration + res3.duration).toFixed(2);
console.log(`\n   ✓ Training completed in ${totalDuration} seconds.`);

// 4. Evaluate note spelling accuracy
console.log('\n4. Evaluating Spelling Accuracy on Sequences...');
let totalValidNotes      = 0;
let totalSpellingMatches = 0;

for (const item of dataset) {
    const outputs = network.forward(item.features, item.length);
    decode(item.head, outputs);

    let matches = 0;
    let notes   = 0;
    let slice   = item.head;

    while (slice && slice.length) {
        let s = 0, event;
        while (event = slice[--s]) {
            if (event.type !== 'note') continue;
            const expected = getExpectedSpelling(event);
            ++notes;
            if (!expected || event.spell(event.key) === expected) {
                ++matches;
            }
        }
        slice = slice.next;
    }

    totalValidNotes      += notes;
    totalSpellingMatches += matches;

    const pct   = notes ? ((matches / notes) * 100).toFixed(1) : '100.0';
    const title = item.name.padEnd(24);
    console.log(`   ✓ ${title} Spelling: ${String(matches).padStart(4)}/${String(notes).padStart(4)} (${pct.padStart(5)}%)`);
}

const overallPct = totalValidNotes
    ? ((totalSpellingMatches / totalValidNotes) * 100).toFixed(2)
    : '100.00';

console.log(`\n   ✓ Overall Note Spelling Accuracy: ${totalSpellingMatches}/${totalValidNotes} (${overallPct}%)`);

// 5. Serialize trained weights
console.log('\n5. Serializing Trained Weights...');
const binary32  = serializeWeights(network, 32);
const bin32Path = new URL('../modules/spell/weights-32b.local.bin', import.meta.url);
await Deno.writeFile(bin32Path, binary32);
console.log(`   ✓ Exported Float32 binary weights: ${bin32Path.pathname} (${(binary32.byteLength / 1024).toFixed(1)} KB)`);

const binary8  = serializeWeights(network, 8);
const bin8Path = new URL('../modules/spell/weights-8b.local.bin', import.meta.url);
await Deno.writeFile(bin8Path, binary8);
console.log(`   ✓ Exported Int8 binary weights:    ${bin8Path.pathname} (${(binary8.byteLength / 1024).toFixed(1)} KB)`);

const jsModuleCode = exportAsModule(network, 8);
const jsPath       = new URL('../modules/spell/weights-8b.js', import.meta.url);
await Deno.writeTextFile(jsPath, jsModuleCode);
console.log(`   ✓ Exported self-contained ES module: ${jsPath.pathname} (${(jsModuleCode.length / 1024).toFixed(1)} KB)`);
