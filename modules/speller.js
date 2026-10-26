
import weights    from './speller/speller-weights-8b.js';
import SpellerRNN from './speller/speller-rnn.js';

export default await SpellerRNN.from(weights);
