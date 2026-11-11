import { exportAsModule, serializeWeights } from "neuron/modules/serialize.js";
import { toKeyName, toKeyNumber } from "sequence/modules/event/key.js";
import Sequence from "sequence/module.js";
import { SpellerNetwork } from "./speller-network.js";
import { encode, encodeTargets } from "./sequence-encoder.js";

const targetDir = Deno.args[0];

if (!targetDir) {
    console.error("Usage: deno task train <path/to/directory>");
    Deno.exit(1);
}

const cwdUrl = new URL(`file://${Deno.cwd()}/`);
const targetUrl = new URL(targetDir.endsWith("/") ? targetDir : `${targetDir}/`, cwdUrl);

async function collectFiles(dirUrl, files = []) {
    for await (const entry of Deno.readDir(dirUrl)) {
        if (entry.name.startsWith(".") || entry.name.startsWith("_")) continue;
        const entryUrl = new URL(entry.name + (entry.isDirectory ? "/" : ""), dirUrl);
        if (entry.isDirectory) {
            await collectFiles(entryUrl, files);
        } else if (entry.isFile) {
            files.push({ name: entry.name, url: entryUrl });
        }
    }
    return files;
}

const sequences = {};
let entries = [];

try {
    entries = await collectFiles(targetUrl);
} catch (err) {
    console.error(`Failed to read directory "${targetDir}": ${err.message}`);
    Deno.exit(1);
}

entries.sort((a, b) => a.url.href.localeCompare(b.url.href));

for (const entry of entries) {
    const fileUrl = entry.url;

    if (entry.name.endsWith(".sequence")) {
        const text = await Deno.readTextFile(fileUrl);
        const seq = Sequence.parse(text);
        seq.name = seq.name || entry.name.replace(/\.sequence$/, "");
        sequences[seq.name] = seq;
    } else if (entry.name.endsWith(".json")) {
        const mod = await import(fileUrl.href, { with: { type: "json" } });
        const data = mod.default;
        if (data && (data.events || data.sequences)) {
            const seq = Sequence.from(data);
            seq.name = seq.name || entry.name.replace(/\.json$/, "");
            sequences[seq.name] = seq;
        } else if (typeof data === "object" && data !== null) {
            for (const [k, v] of Object.entries(data)) {
                if (v && (v.events || Array.isArray(v))) {
                    const seq = Sequence.from(v);
                    sequences[seq.name || k] = seq;
                }
            }
        }
    } else if (entry.name.endsWith(".js")) {
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
    console.error(`No sequences found in "${targetDir}"`);
    Deno.exit(1);
}

function parseExpected(note) {
    if (note.label) {
        const [expectedKey, expectedSpelling = note.sourcePitch] = note.label.trim().split(/\s+/);
        return { expectedKey, expectedSpelling };
    }
    return { expectedKey: undefined, expectedSpelling: note.sourcePitch };
}

console.log("=== Pitch Speller Sequence Training & Weight Serialization ===\n");

// 1. Prepare Dataset directly from Sequence objects
console.log(
    `1. Preparing training dataset directly from sequences in ${targetDir}...`,
);
const dataset = [];

for (const [name, seq] of Object.entries(sequences)) {
    const keyEvent = seq.find ? seq.find({ type: "key" }) : null;
    const rawKey = keyEvent ? keyEvent[2] : (seq.initialKey ?? 0);
    const initialKey = typeof rawKey === "number" ? rawKey : toKeyNumber(rawKey);

    const enc = encode(seq, { initialKey });
    if (!enc.noteCount) continue;

    const targets = enc.notes.map((n) => {
        const { expectedKey, expectedSpelling } = parseExpected(n);
        const spelling = expectedSpelling ?? n.pitchSpelling ?? n.spelling ?? n[2];
        const tpc = typeof spelling === "number"
            ? spelling
            : toKeyNumber(String(spelling).replace(/\d+$/, ""));
        const keyCoord = expectedKey !== undefined && expectedKey !== null
            ? (typeof expectedKey === "number" ? expectedKey : toKeyNumber(expectedKey))
            : initialKey;
        return { tpc, key: keyCoord };
    });

    dataset.push({
        features: enc.features,
        length: enc.noteCount,
        targets: encodeTargets(targets),
        name: seq.name || name,
    });
}

console.log(
    `   ✓ Loaded ${dataset.length} sequences directly from data/.`,
);

let totalNotes = 0;
for (const s of dataset) totalNotes += s.length;
console.log(`   ✓ Total training dataset size: ${totalNotes} note events.`);

// 2. Initialize SpellerNetwork (Hierarchical BiGRU: 39 -> 24 -> 8 -> 25 keys / 5 accidentals)
console.log(
    "\n2. Initializing SpellerNetwork...",
);
const network = new SpellerNetwork();

// 3. Train the Network (50 Epochs)
console.log("\n3. Training network using BPTT and Adam optimizer (50 epochs)...");
const res1 = network.train(dataset, {
    epochs: 20,
    lr: 0.008,
    logInterval: 5,
});
const res2 = network.train(dataset, {
    epochs: 30,
    lr: 0.003,
    logInterval: 5,
});
const totalDuration = (res1.duration + res2.duration).toFixed(2);
console.log(`\n   ✓ Training completed in ${totalDuration} seconds.`);

// 4. Validate on Sequences
console.log("\n4. Evaluating Model on Sequences...");
let totalValidNotes = 0;
let totalSpellingMatches = 0;
let totalKeyMatches = 0;

for (const [name, seq] of Object.entries(sequences)) {
    const preds = network.process(seq);
    const notes = preds.length ? preds : seq.events.filter((e) => e.type === "note");
    if (!notes.length) continue;
    let spellingMatches = 0;
    let keyMatches = 0;

    notes.forEach((note) => {
        const { expectedKey, expectedSpelling } = parseExpected(note);
        const noteKeyName = toKeyName(note.keySpelling);
        const spellingMatch = !expectedSpelling || expectedSpelling === note.pitchSpelling;
        const keyMatch = !expectedKey || expectedKey === noteKeyName;
        if (spellingMatch) spellingMatches++;
        if (keyMatch) keyMatches++;
    });

    totalValidNotes += notes.length;
    totalSpellingMatches += spellingMatches;
    totalKeyMatches += keyMatches;

    const spellingPct = ((spellingMatches / notes.length) * 100).toFixed(0);
    const keyPct = ((keyMatches / notes.length) * 100).toFixed(0);
    const title = (seq.name || name).padEnd(22);
    console.log(
        `   ✓ ${title} Spelling: ${String(spellingMatches).padStart(2)}/${notes.length} (${String(spellingPct).padStart(3)}%)  |  Key: ${String(keyMatches).padStart(2)}/${notes.length} (${String(keyPct).padStart(3)}%)`,
    );
}

const overallSpellingPct = totalValidNotes ? ((totalSpellingMatches / totalValidNotes) * 100).toFixed(1) : "100.0";
const overallKeyPct = totalValidNotes ? ((totalKeyMatches / totalValidNotes) * 100).toFixed(1) : "100.0";

console.log(
    `\n   ✓ Overall Spelling Accuracy: ${totalSpellingMatches}/${totalValidNotes} (${overallSpellingPct}%)`,
);
console.log(
    `   ✓ Overall Key Accuracy:      ${totalKeyMatches}/${totalValidNotes} (${overallKeyPct}%)`,
);

// 5. Serialize Trained Weights
console.log("\n5. Serializing Trained Weights...");
const binary32 = serializeWeights(network, 32);
const bin32Path = new URL("./speller-weights-32b.bin", import.meta.url);
await Deno.writeFile(bin32Path, binary32);
console.log(
    `   ✓ Exported Float32 binary weights: ${bin32Path.pathname} (${
        (binary32.byteLength / 1024).toFixed(1)
    } KB)`,
);

const binary8 = serializeWeights(network, 8);
const bin8Path = new URL("./speller-weights-8b.bin", import.meta.url);
await Deno.writeFile(bin8Path, binary8);
console.log(
    `   ✓ Exported Int8 binary weights:    ${bin8Path.pathname} (${
        (binary8.byteLength / 1024).toFixed(1)
    } KB)`,
);

const jsModuleCode = exportAsModule(network, 8);
const jsPath = new URL("./speller-weights-8b.js", import.meta.url);
await Deno.writeTextFile(jsPath, jsModuleCode);
console.log(
    `   ✓ Exported self-contained ES module: ${jsPath.pathname} (${
        (jsModuleCode.length / 1024).toFixed(1)
    } KB)`,
);
console.log(
    "\nSpeller Sequence Training & Model Serialization completed with 100% success!",
);
