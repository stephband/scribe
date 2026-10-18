import { classToKey, NUM_ACCIDENTALS, NUM_KEYS } from "./key-tpc.js";
import { FEATURE_DIM } from "./sequence-encoder.js";

const simplicityAlpha = 0.05;
const simplicityPrior = new Float32Array(NUM_KEYS);
for (let c = 0; c < NUM_KEYS; c++) {
    simplicityPrior[c] = -simplicityAlpha * Math.abs(classToKey(c));
}

/**
 * Speller RNN Architecture Schema
 *
 * Defines the complete structural topology for both CPU and WebGPU Spellers:
 * - 39-dim Sequence note event feature input (12 pitch class + 4 duration + 8 delta + 15 key)
 * - 2-layer stacked bidirectional GRU (Layer 0 hiddenDim = 24, Layer 1 hiddenDim = 8)
 * - Multi-task Head 1: Local key classification (layer 0, 25 classes [-12..12], weight 0.3, simplicity prior)
 * - Multi-task Head 2: Accidental spelling classification (layer 1, 5 classes [𝄫, ♭, ♮, ♯, 𝄪], weight 1.0)
 */
export default {
    inDim: FEATURE_DIM,
    layers: [
        { hiddenDim: 24, bidirectional: true },
        { hiddenDim: 8,  bidirectional: true },
    ],
    heads: [{
        name: "key",
        layerIndex: 0,
        outDim: NUM_KEYS,
        lossWeight: 0.3,
        priorBias: simplicityPrior,
    }, {
        name: "spelling",
        layerIndex: 1,
        outDim: NUM_ACCIDENTALS,
        lossWeight: 1.0,
    }],
};
