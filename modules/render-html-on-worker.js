
import Transform        from 'sequence/modules/transform.js';
import SequenceIterator from 'sequence/modules/sequence-iterator.js';
import compileWorker    from './compile-worker.js';
import workerCode       from './render/worker-code.js';
import serialise        from './render/serialise.js';
import Part             from './part.js';


const assign = Object.assign;
const renderWorker = compileWorker(workerCode);

function toPartJSON(part) {
    return (part.toJSON ? part : Part.from(part)).toJSON();
}

/**
renderHTMLOnWorker(sequence, parts, key, timesig, transpose, beat, duration, settings, debug, hashes)
Iterates and serialises `sequence` on the main thread, transfers the stride-8
`Float64Array` buffer to the render worker, and returns `{ signatures, bars, length }`.
**/

export default async function renderHTMLOnWorker(
    sequence,
    parts = sequence.parts,
    key,
    timesig,
    transpose = 0,
    beat = 0,
    duration = Infinity,
    settings,
    debug,
    hashes
) {
    // Make transforms list
    const array = [];
    if (transpose) array.push(Transform.TYPES.transpose, transpose);
    const transform = array.length ?
        Transform.from(array) :
        Transform.identity ;

    // Iterate sequence and pack renderable events into a transferable Float64Array
    const iterator = new SequenceIterator(sequence, transform, 0, beat + duration, undefined, { outputInBeats: true });
    const { data, texts } = serialise(iterator);

    if (debug) debug.ts = performance.now();

    const result = await renderWorker({
        data,
        texts,
        hashes,
        parts: parts && parts.map(toPartJSON),
        key,
        timesig,
        beat,
        settings,
        debug:   !!debug
    }, [data.buffer]);

    if (debug && result.debug) assign(debug, result.debug);

    return result;
}

export { renderWorker };
