import { RecurrentNetwork } from "neuron/modules/rnn/network-cpu.js";
import schema from "./schema.js";
import { tpcToSpelledPitch } from "./key-tpc.js";
import { decodePredictions, encode } from "./sequence-encoder.js";

/**
 * SpellerNetwork: Musical Pitch Speller & Local Key Tracker
 *
 * Specialized configuration of RecurrentNetwork for Sequence streams:
 * - 2-layer BiGRU (Layer 0 hiddenDim = 24, Layer 1 hiddenDim = 12 per direction)
 * - Input features: 39 dims per note event (12 pitch class + 4 duration + 8 delta + 15 key)
 * - Multi-task Head 1: Local key classification (15 classes [-7..7]) with accidental simplicity prior
 * - Multi-task Head 2: Accidental spelling classification (5 classes [𝄫, ♭, ♮, ♯, 𝄪])
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
     */
    forward(X, T) {
        const results = super.forward(X, T);

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
    trainStep(X, T, _condition, targets, lr = 0.005) {
        this.zeroGrad();
        const forwardResults = this.forward(X, T);
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
        );
        const decoded = decodePredictions(
            forwardOut.predSpelling,
            forwardOut.predKey,
            encoded.notes,
        );

        return decoded.map((d, i) => {
            const note = encoded.notes[i];
            return {
                note,
                ...d,
                spelling: tpcToSpelledPitch(note[2], d.tpc),
            };
        });
    }
}

export { SpellerNetwork };
