import { classToKey, NUM_CLASSES } from "./key-tpc.js";
import { FEATURE_DIM } from "./sequence-encoder.js";

const simplicityAlpha = 0.05;
const simplicityPrior = new Float32Array(NUM_CLASSES);
for (let c = 0; c < NUM_CLASSES; c++) {
    simplicityPrior[c] = -simplicityAlpha * Math.abs(classToKey(c));
}

/**
 * Speller RNN Architecture Schema
 *
 * Defines the complete structural topology for both CPU and WebGPU Spellers:
 * - 32-dim Sequence note event feature input
 * - 2-layer stacked bidirectional GRU (hiddenDim = 48)
 * - Line-of-Fifths categorical priming state (35 classes)
 * - Multi-task Head 1: Local key classification (layer 0, weight 0.3, simplicity prior)
 * - Multi-task Head 2: Tonal pitch-class spelling classification (layer 1, weight 1.0)
 */
export default {
    inDim: FEATURE_DIM,
    layers: [
        { hiddenDim: 48, bidirectional: true },
        { hiddenDim: 48, bidirectional: true },
    ],
    priming: {
        inDim: NUM_CLASSES,
        type: "categorical",
    },
    heads: [{
        name: "key",
        layerIndex: 0,
        outDim: NUM_CLASSES,
        lossWeight: 0.3,
        priorBias: simplicityPrior,
    }, {
        name: "spelling",
        layerIndex: 1,
        outDim: NUM_CLASSES,
        lossWeight: 1.0,
    }],
};
