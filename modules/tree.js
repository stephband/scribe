
import Transform        from 'sequence/modules/transform.js';
import SequenceIterator from 'sequence/modules/sequence-iterator.js';
import config           from './config.js';
import spell            from './spell.js';
import read             from './tree/read.js';
import quantise         from './tree/quantise.js';
import symbolise        from './tree/symbolise.js';


const { assign } = Object;

export default async function requestTree(sequence, settings = {}, transpose = 0, displace = 0, duration = Infinity) {
    settings = assign({ display: sequence.display }, config, settings);

    // Make transforms list
    const array = [];
    if (transpose) array.push(Transform.TYPES.transpose, transpose);
    if (displace)  array.push(Transform.TYPES.displace,  displace);
    const transform = array.length ?
        Transform.from(array) :
        Transform.identity ;

    const iterator = new SequenceIterator(sequence, transform, 0, duration);

    // Ingest sequence into voice buffers, bar frames, and ordered parts
    const { parts, spellables, tree } = read(settings, iterator);

    // Metric quantisation of event beats
    quantise(settings, parts, tree);

    // Spell pitched notes and chords
    if (settings.showAtConcertPitch) {
        await spell(spellables);
    }
    else {
        // Spell parts in per-part transposition
        await Promise.all(parts.map((part) => {
            if (!part.spellables || !part.spellables.length) return;
            const transform = Transform.of('transpose', part.display.transpose || 0);
            part.spellables.forEach((event) => transform.apply(event));
            return spell(part.spellables);
        }));
    }

    // 4. Construct tree symbols, beams and bar repeats
    return symbolise(settings, parts, tree);
}
