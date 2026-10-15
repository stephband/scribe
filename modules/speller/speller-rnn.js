import RNN from "neuron/modules/rnn.js";
import { initWebGPU } from "neuron/modules/gpu/context.js";
import schema from "./schema.js";
import { keyToClass } from "./key-tpc.js";
import { decodePredictions, encode } from "./sequence-encoder.js";

/**
 * SpellerRNN: WebGPU-accelerated Musical Pitch Speller & Key Tracker
 */
export default class SpellerRNN extends RNN {
    /**
     * Factory method: initializes WebGPU context, instantiates SpellerRNN,
     * validates weights byte length, and loads weights into GPU buffers.
     *
     * @param {Float32Array|ArrayBuffer|Uint8Array} weights - Model parameter weights
     * @param {GPUDevice} [device] - Optional WebGPU device
     * @returns {Promise<SpellerRNN>} Ready-to-run SpellerRNN instance
     */
    static async from(weights, device) {
        if (!device) {
            const gpu = await initWebGPU();
            device = gpu.device;
        }

        return new SpellerRNN(device, weights);
    }

    constructor(device, weights) {
        super(device, schema, weights);
    }

    /**
     * Complete GPU sequence inference on a Sequence event stream
     *
     * @param {Array} events - Sequence events array
     * @param {Object} options - Optional overrides
     * @returns {Promise<Array>} Decoded array of notes with predicted TPCs and keys
     */
    async predictSequence(events, options = {}) {
        const encoded = encode(events, options);
        const c_init = keyToClass(encoded.initialKey);
        const outputs = await this.predict(
            encoded.features,
            encoded.noteCount,
            { condition: c_init },
        );
        const decoded = decodePredictions(
            outputs.spelling.preds,
            outputs.key.preds,
        );

        return decoded.map((d, i) => ({
            note: encoded.notes[i],
            ...d,
        }));
    }
}
