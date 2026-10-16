import { exportAsModule, serializeWeights } from "neuron/modules/serialize.js";
import { SpellerNetwork } from "./speller-network.js";
import { buildTrainingDataset } from "./data/build-dataset.js";
import * as defaultSequences from "./data/scales.js";

console.log("=== Pitch Speller Sequence Training & Weight Serialization ===\n");

// 1. Prepare Dataset directly from Sequence objects
console.log(
    "1. Generating training dataset with Line-of-Fifths augmentations from sequences...",
);
const dataset = buildTrainingDataset(defaultSequences);
console.log(
    `   ✓ Generated ${dataset.length} augmented sequences covering keys from G♭ to F♯.`,
);

let totalNotes = 0;
for (const s of dataset) totalNotes += s.noteCount;
console.log(`   ✓ Total training dataset size: ${totalNotes} note events.`);

// 2. Initialize SpellerNetwork (Hierarchical BiGRU: 32 -> 2x48 -> 35 classes)
console.log(
    "\n2. Initializing SpellerNetwork...",
);
const network = new SpellerNetwork();

// 3. Train the Network
console.log("\n3. Training network using BPTT and Adam optimizer...");
const { duration } = network.train(dataset, {
    epochs: 30,
    lr: 0.01,
    logInterval: 10,
});
console.log(`\n   ✓ Training completed in ${duration} seconds.`);

// 4. Validate on Sequences
console.log("\n4. Evaluating Model on Sequences...");
let totalValidNotes = 0;
let totalValidMatches = 0;

for (const [name, seq] of Object.entries(defaultSequences)) {
    const preds = network.predictSequence(seq);
    const notes = seq.events.filter((e) => e.type === "note");
    let matches = 0;

    notes.forEach((note, i) => {
        const expectedSpelling = note.expectedSpelling;
        const expectedKey = note.expectedKey;
        const spellingMatch = !expectedSpelling || expectedSpelling === preds[i].spelling;
        const keyMatch = !expectedKey || expectedKey === preds[i].keyName;
        if (spellingMatch && keyMatch) matches++;
    });

    totalValidNotes += notes.length;
    totalValidMatches += matches;
    const pct = ((matches / notes.length) * 100).toFixed(0);
    console.log(`   ✓ ${seq.name || name}: ${matches}/${notes.length} (${pct}%)`);
}

console.log(
    `\n   ✓ Overall accuracy across sequences: ${totalValidMatches}/${totalValidNotes} (${
        ((totalValidMatches / totalValidNotes) * 100).toFixed(1)
    }%)`,
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
