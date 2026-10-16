import { classToKey, NUM_KEYS, NUM_TPCS } from "./key-tpc.js";
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
 * - 47-dim Sequence note event feature input (12 pitch class + 8 duration + 12 delta + 15 key)
 * - 2-layer stacked bidirectional GRU (hiddenDim = 48)
 * - Multi-task Head 1: Local key classification (layer 0, 15 classes [-7..7], weight 0.3, simplicity prior)
 * - Multi-task Head 2: Tonal pitch-class spelling classification (layer 1, 35 classes [-15..19], weight 1.0)
 */
export default {
    inDim: FEATURE_DIM,
    layers: [
        { hiddenDim: 48, bidirectional: true },
        { hiddenDim: 48, bidirectional: true },
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
        outDim: NUM_TPCS,
        lossWeight: 1.0,
    }],
};
