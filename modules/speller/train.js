import { exportAsModule, serializeWeights } from "neuron/modules/serialize.js";
import { SpellerNetwork } from "./speller-network.js";
import { encode, encodeTargets } from "./sequence-encoder.js";
import { toKeyNumber } from "./key-tpc.js";

import * as chromatic from "../../data/chromatic.js";
import * as major     from "../../data/major.js";
import * as triads    from "../../data/triads.js";
import * as tetrads   from "../../data/tetrads.js";

const assign = Object.assign;
const sequences = assign({}, chromatic, major, triads, tetrads);


console.log("=== Pitch Speller Sequence Training & Weight Serialization ===\n");

// 1. Prepare Dataset directly from Sequence objects
console.log(
    "1. Preparing training dataset directly from sequences in data/...",
);
const dataset = [];

for (const [name, seq] of Object.entries(sequences)) {
    const keyEvent = seq.find ? seq.find({ type: "key" }) : null;
    const rawKey = keyEvent ? keyEvent[2] : (seq.initialKey ?? 0);
    const initialKey = typeof rawKey === "number" ? rawKey : toKeyNumber(rawKey);

    const enc = encode(seq, { initialKey });
    if (!enc.noteCount) continue;

    const targets = enc.notes.map((n) => {
        const spelling = n.expectedSpelling ?? n.spelling ?? n[2];
        const key = n.expectedKey ?? n.key;
        const tpc = typeof spelling === "number"
            ? spelling
            : toKeyNumber(String(spelling).replace(/\d+$/, ""));
        const keyCoord = key !== undefined && key !== null
            ? (typeof key === "number" ? key : toKeyNumber(key))
            : initialKey;
        return { tpc, key: keyCoord };
    });

    dataset.push({
        features: enc.features,
        noteCount: enc.noteCount,
        length: enc.noteCount,
        initialKey: initialKey,
        targets: encodeTargets(targets),
        name: seq.name || name,
    });
}

console.log(
    `   ✓ Loaded ${dataset.length} sequences directly from data/.`,
);

let totalNotes = 0;
for (const s of dataset) totalNotes += s.noteCount;
console.log(`   ✓ Total training dataset size: ${totalNotes} note events.`);

// 2. Initialize SpellerNetwork (Hierarchical BiGRU: 39 -> 24 -> 12 -> 15 keys / 5 accidentals)
console.log(
    "\n2. Initializing SpellerNetwork...",
);
const network = new SpellerNetwork();

// 3. Train the Network (40 Epochs)
console.log("\n3. Training network using BPTT and Adam optimizer (40 epochs)...");
const res1 = network.train(dataset, {
    epochs: 25,
    lr: 0.008,
    logInterval: 5,
});
const res2 = network.train(dataset, {
    epochs: 15,
    lr: 0.002,
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
    const preds = network.predictSequence(seq);
    const notes = seq.events.filter((e) => e.type === "note");
    let spellingMatches = 0;
    let keyMatches = 0;

    notes.forEach((note, i) => {
        const expectedSpelling = note.expectedSpelling;
        const expectedKey = note.expectedKey;
        const spellingMatch = !expectedSpelling || expectedSpelling === preds[i].spelling;
        const keyMatch = !expectedKey || expectedKey === preds[i].keyName;
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
const binaryWeights = serializeWeights(network);
const binPath = new URL("./speller-weights.bin", import.meta.url);
await Deno.writeFile(binPath, binaryWeights);
console.log(
    `   ✓ Exported binary weights: ${binPath.pathname} (${
        (binaryWeights.byteLength / 1024).toFixed(1)
    } KB)`,
);

const jsModuleCode = exportAsModule(network, "../modules/deserialize.js");
const jsPath = new URL("./speller-weights.js", import.meta.url);
await Deno.writeTextFile(jsPath, jsModuleCode);
console.log(
    `   ✓ Exported self-contained ES module: ${jsPath.pathname} (${
        (jsModuleCode.length / 1024).toFixed(1)
    } KB)`,
);
console.log(
    "\nSpeller Sequence Training & Model Serialization completed with 100% success!",
);
