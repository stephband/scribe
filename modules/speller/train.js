import { exportAsModule, serializeWeights } from "neuron/modules/serialize.js";
import { SpellerNetwork } from "./speller-network.js";
import { buildTrainingDataset, createBaseProgressions } from "./data/corpus.js";

console.log("=== Pitch Speller Corpus Training & Weight Serialization ===\n");

// 1. Prepare Dataset
console.log(
    "1. Generating musical corpus with Line-of-Fifths augmentations...",
);
const dataset = buildTrainingDataset();
console.log(
    `   ✓ Generated ${dataset.length} augmented sequences covering all keys from G♭ to F♯.`,
);

let totalNotes = 0;
for (const s of dataset) totalNotes += s.noteCount;
console.log(`   ✓ Total training dataset size: ${totalNotes} note events.`);

// 2. Initialize SpellerNetwork (H = 48)
console.log(
    "\n2. Initializing SpellerNetwork (Hierarchical BiGRU: 32 -> 2x48 -> 35 classes)...",
);
const network = new SpellerNetwork();

// 3. Train the Network
console.log("\n3. Training network using BPTT and Adam optimizer...");
const { duration } = network.train(dataset, {
    epochs: 80,
    lr: 0.01,
    logInterval: 30,
});
console.log(`\n   ✓ Training completed in ${duration} seconds.`);

// 4. Validate on Held-Out Enharmonic Test Cases
console.log("\n4. Evaluating Enharmonic Disambiguation across Keys...");
const testCases = [
    {
        name: "C major: F# leading tone vs Gb passing tone",
        events: [
            [0.0, "key", 0],
            [0.0, "note", 60, 0.8, 1.0], // C4
            [1.0, "note", 64, 0.8, 1.0], // E4
            [2.0, "note", 66, 0.8, 0.5], // MIDI 66 -> F# (leads UP to G)
            [2.5, "note", 67, 0.8, 1.0], // G4
            [3.5, "note", 66, 0.8, 0.5], // MIDI 66 -> Gb (leads DOWN to F)
            [4.0, "note", 65, 0.8, 1.0], // F4
        ],
        expectedTpcs: [0, 4, 6, 1, -6, -1], // Note 2 is F# (6), Note 4 is Gb (-6)
    },
    {
        name: "A minor: G# leading tone (harmonic minor)",
        events: [
            [0.0, "key", 0],
            [0.0, "note", 69, 0.8, 1.0], // A4
            [1.0, "note", 68, 0.8, 1.0], // G#4 (MIDI 68 leads UP to A)
            [2.0, "note", 69, 0.8, 1.0], // A4
        ],
        expectedTpcs: [3, 8, 3], // G# is TPC +8
    },
    {
        name: "F major: Bb diatonic fourth vs A# chromatic",
        events: [
            [0.0, "key", -1],
            [0.0, "note", 65, 0.8, 1.0], // F4
            [1.0, "note", 69, 0.8, 1.0], // A4
            [2.0, "note", 70, 0.8, 1.0], // Bb4 (MIDI 70 is Bb, TPC -2)
            [3.0, "note", 72, 0.8, 1.0], // C5
        ],
        expectedTpcs: [-1, 3, -2, 0], // Bb is TPC -2
    },
];

for (const tc of testCases) {
    const preds = network.predictSequence(tc.events);
    let passed = true;
    for (let i = 0; i < tc.expectedTpcs.length; i++) {
        if (preds[i].tpc !== tc.expectedTpcs[i]) {
            passed = false;
            console.error(
                `   ✗ Mismatch in "${tc.name}" at note ${i}: expected ${
                    tc.expectedTpcs[i]
                }, got ${preds[i].tpc}`,
            );
        }
    }
    if (passed) {
        console.log(`   ✓ ${tc.name}: 100% correct`);
    } else {
        throw new Error(`Validation failed for ${tc.name}`);
    }
}

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
    "\nSpeller Corpus Training & Model Serialization completed with 100% success!",
);
