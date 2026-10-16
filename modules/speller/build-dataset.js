import { toKeyNumber } from 'sequence/modules/event/key.js';
import transpose from './transpose.js';
import { encode, encodeTargets } from './sequence-encoder.js';

/**
 * Builds training dataset from an object or array of Sequences annotated with
 * expectedSpelling and expectedKey properties on note events.
 *
 * @param {Object|Array} sequences - Object of Sequences (e.g. scales.js exports)
 * @param {Object} [options] - Configuration
 * @param {number[]} [options.deltaRange=[-6..6]] - Line-of-Fifths transpositions
 * @returns {Array} Array of encoded training samples { features, noteCount, initialKey, targets, name }
 */
export function buildTrainingDataset(sequences, options = {}) {
    const deltaRange = options.deltaRange ?? [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
    const seqEntries = Array.isArray(sequences)
        ? sequences.map((seq, i) => [seq.name || `seq_${i}`, seq])
        : Object.entries(sequences);
    const dataset = [];

    for (const [name, seq] of seqEntries) {
        const notes = seq.events.filter((e) => e.type === 'note');
        if (notes.length === 0) continue;

        const keyEvent = seq.find({ type: 'key' });
        const initialKey = seq.initialKey !== undefined
            ? seq.initialKey
            : (keyEvent ? keyEvent[2] : 0);

        const targets = notes.map((n) => {
            const spelling = n.expectedSpelling ?? n.spelling;
            const key = n.expectedKey ?? n.key;
            const tpc = typeof spelling === 'number'
                ? spelling
                : toKeyNumber(spelling.replace(/\d+$/, ''));
            const keyCoord = key !== undefined && key !== null
                ? (typeof key === 'number' ? key : toKeyNumber(key))
                : initialKey;
            return { tpc, key: keyCoord };
        });

        for (const deltaK of deltaRange) {
            const aug = transpose(notes, targets, deltaK, initialKey);
            if (!aug) continue;

            const enc = encode(aug.noteEvents, { initialKey: aug.initialKey });
            const encodedTargets = encodeTargets(aug.targets);

            dataset.push({
                features: enc.features,
                noteCount: enc.noteCount,
                initialKey: enc.initialKey,
                targets: encodedTargets,
                name: `${name}_delta_${deltaK}`,
            });
        }
    }

    return dataset;
}

export default buildTrainingDataset;
