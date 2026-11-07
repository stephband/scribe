
import weights    from '../speller/speller-weights-8b.js';
import SpellerRNN from '../speller/speller-rnn.js';

const speller = await SpellerRNN.from(weights);

export default function spell(events) {
    if (!events || !events.length) return;
    if (!events.some((e) => e.type === 'note' || e.type === 'chord')) return;
    return speller.process(events);
}
