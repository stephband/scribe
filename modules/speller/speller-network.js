import { RecurrentNetwork } from "neuron/modules/rnn/network-cpu.js";
import schema from "./schema.js";
import { keyToClass } from "./key-tpc.js";
import { decodePredictions, encode } from "./sequence-encoder.js";

/**
 * SpellerNetwork: Musical Pitch Speller & Local Key Tracker
 *
 * Specialized configuration of RecurrentNetwork for Sequence streams:
 * - 2-layer BiGRU (hiddenDim = 48 per direction)
 * - Priming state: conditioned on initial key signature along the Line of Fifths (35 classes)
 * - Multi-task Head 1: Local key classification with accidental simplicity prior
 * - Multi-task Head 2: Tonal pitch-class (TPC) spelling classification
 */
export default class SpellerNetwork extends RecurrentNetwork {
    static from(weights) {
        return new SpellerNetwork(weights);
    }

    constructor(weights = null) {
        super(schema, weights);
    }

    /**
     * Forward pass across sequence of length T
     *
     * @param {Float32Array} X - Input features [T x inDim]
     * @param {number} T - Sequence length
     * @param {number} initialKey - Line-of-Fifths coordinate (-15 to 19)
     */
    forward(X, T, initialKey = 0) {
        const c_init = keyToClass(initialKey);
        const results = super.forward(X, T, { condition: c_init });

        return {
            probSpelling: results.spelling.probs,
            probKey: results.key.probs,
            predSpelling: results.spelling.preds,
            predKey: results.key.preds,
            logitsSpelling: results.spelling.logits,
            logitsKey: results.key.logits,
        };
    }

    /**
     * Computes multi-task cross-entropy losses and accuracies
     *
     * @param {Object} targets - { targetSpelling, targetKey }
     */
    computeLoss(targets) {
        const namedTargets = {
            spelling: targets.targetSpelling,
            key: targets.targetKey,
        };
        const res = super.computeLoss(namedTargets);

        return {
            totalLoss: res.totalLoss,
            lossSpelling: res.heads.spelling?.loss ?? 0,
            lossKey: res.heads.key?.loss ?? 0,
            accSpelling: res.heads.spelling?.acc ?? 0,
            accKey: res.heads.key?.acc ?? 0,
            heads: res.heads,
        };
    }

    /**
     * Backward pass
     *
     * @param {Object} targets - { targetSpelling, targetKey }
     */
    backward(targets) {
        const namedTargets = {
            spelling: targets.targetSpelling,
            key: targets.targetKey,
        };
        return super.backward(namedTargets);
    }

    /**
     * Complete training step: forward, compute loss, backward, clip gradients, Adam update
     */
    trainStep(X, T, initialKey, targets, lr = 0.005) {
        this.zeroGrad();
        const forwardResults = this.forward(X, T, initialKey);
        const lossResults = this.computeLoss(targets);
        this.backward(targets);
        const gradNorm = this.clipGradients(5.0);
        this.adamStep(lr);

        return {
            ...lossResults,
            gradNorm,
            ...forwardResults,
        };
    }

    /**
     * High-level inference on a Sequence event array
     *
     * @param {Array} events - Sequence events array
     * @param {Object} options - Optional overrides (e.g. initialKey)
     * @returns {Array} Array of decoded note objects with predicted TPC coordinates and names
     */
    predictSequence(events, options = {}) {
        const encoded = encode(events, options);
        const forwardOut = this.forward(
            encoded.features,
            encoded.noteCount,
            encoded.initialKey,
        );
        const decoded = decodePredictions(
            forwardOut.predSpelling,
            forwardOut.predKey,
        );

        return decoded.map((d, i) => ({
            note: encoded.notes[i],
            ...d,
        }));
    }
}

export { SpellerNetwork };
