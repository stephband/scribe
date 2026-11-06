
import weights    from './spell/speller-weights-8b.js';
import SpellerRNN from './spell/speller-rnn.js';

const speller = await SpellerRNN.from(weights);

export default function spell(notes) {
    if (!notes || !notes.length) return;
    if (!notes.some((e) => e.type === 'note' || e.type === 'chord')) return;
    return speller.process(notes);
}
