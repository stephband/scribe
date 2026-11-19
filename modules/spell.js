// Inside a browser run the tiny BiGRU as a worker. Inside a worker or other
// non-DOM environment, run the tiny BiGRU synchronously
import RNN     from 'neuron/modules/rnn/network-cpu.js';
//import RNN     from 'neuron/modules/rnn/network-worker.js';
import batch   from './spell/batch.js';
import schema, { encode, decode } from './spell/schema.js';
import weights from './spell/weights-8b.js';

const rnn = new RNN(schema, weights);

export default async function spell(events) {
    if (!events || !events.length) return;
    const head = batch(events);
    if (!head.length) return;
    const data    = encode(head);
    const outputs = await rnn.predict(data, head.count);
    return decode(head, outputs);
}
