import { RecurrentNetwork } from "neuron/modules/rnn/network-cpu.js";
import schema from "./schema.js";
import { tpcToSpelledPitch } from "./key-tpc.js";
import { decodePredictions, encode } from "./sequence-encoder.js";

/**
 * SpellerNetwork: Musical Pitch Speller & Local Key Tracker
 *
 * Specialized configuration of RecurrentNetwork for Sequence streams:
 * - 2-layer BiGRU (Layer 0 hiddenDim = 24, Layer 1 hiddenDim = 8 per direction)
 * - Input features: 39 dims per note event (12 pitch class + 4 duration + 8 delta + 15 key)
 * - Multi-task Head 1: Local key classification (25 classes [-12..12]) with accidental simplicity prior
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
     * High-level inference on a Sequence event array
     *
     * @param {Array} events - Sequence events array
     * @param {Object} options - Optional overrides (e.g. initialKey)
     * @returns {Array} Array of decoded note objects with predicted TPC coordinates and names
     */
    process(events, options = {}) {
        const encoded = encode(events, options);
        const outputs = this.forward(
            encoded.features,
            encoded.noteCount,
        );
        decodePredictions(
            outputs.spelling.preds,
            outputs.key.preds,
            encoded.notes,
        );

        return encoded.notes;
    }

    predictSequence(events, options = {}) {
        return this.process(events, options);
    }
}

export { SpellerNetwork };
