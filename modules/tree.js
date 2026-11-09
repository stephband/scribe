import Event            from 'sequence/modules/event.js';
import Transform        from 'sequence/modules/transform.js';
import SequenceIterator from 'sequence/modules/sequence-iterator.js';
import read             from './tree/read.js';
import quantise         from './tree/quantise.js';
import spell            from './tree/spell.js';
import symbolise        from './tree/symbolise.js';
import config           from './config.js';

const { assign } = Object;

function spellPart({ spellables, transpose }) {
    if (!spellables || !spellables.length) return;
    // Transpose events
    if (transpose) {
        let n = -1;
        let event;
        while (event = spellables[++n]) event.transpose(transpose);
    }
    // Spell events and return promise
    return spell(spellables);
}

export default async function requestTree(sequence, parts = sequence.parts, key, timesig, transpose = 0, beat = 0, duration = Infinity, settings = {}) {
    settings = assign({}, config, settings);

    // If events contains no initial key and key is available insert a key event
    const keyEvent = key && Event.key(0, key);

    // If events contains no initial meter and meter is available insert a meter event
    const meterEvent = timesig && assign(Event.meter(0, 4, 1), { timesig });

    // Make transforms list
    const array = [];
    if (transpose) array.push(Transform.TYPES.transpose, transpose);
    if (beat)      array.push(Transform.TYPES.displace,  -1 * beat);
    const transform = array.length ?
        Transform.from(array) :
        Transform.identity ;

    // Create iterator from sequence, transform, startBeat, stopBeat
    const iterator = new SequenceIterator(sequence, transform, 0, duration);

    // Ingest sequence into tree of bars, parts and spellables
    const tree = read(settings, iterator, parts, keyEvent, meterEvent);

    // Metric quantisation of event beats
    quantise(settings, tree.parts, tree);

    // Spell pitched notes and chords
    if (settings.showAtConcertPitch) {
        await spell(tree.spellables);
    }
    else {
        await Promise.all(tree.parts.map(spellPart));
    }

    // Construct tree symbols, beams and bar repeats
    return symbolise(settings, tree.parts, tree);
}
