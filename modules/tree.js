
import byBeat           from 'sequence/modules/events/by-priority.js';
import Transform        from 'sequence/modules/transform.js';
import SequenceIterator from 'sequence/modules/sequence-iterator.js';
import config           from './config.js';
import speller          from './speller.js';
import symbolise        from './tree/symbolise.js';
import read, { toDisplayObject, getPart } from './tree/read.js';


const { assign, entries, values } = Object;


function spell(notes) {
    if (!notes.length) return;
    return speller.process(notes);
}

export { getPart, toDisplayObject };

export default async function requestTree(sequence, settings = {}, transpose = 0, displace = 0, duration = Infinity) {
    settings = assign({ display: sequence.display }, config, settings);

    // Make transforms list
    const array = [];
    if (transpose) array.push(Transform.TYPES.transpose, transpose);
    if (displace)  array.push(Transform.TYPES.displace,  displace);
    const transform = array.length ?
        Transform.from(array) :
        Transform.identity ;

    const iterator   = new SequenceIterator(sequence, transform, 0, duration);
    const parts      = {};
    const spellables = {};
    const buffers    = {};
    const tree       = {};

    // 1. Sort out timing
    // Loop over iterator, extract events into bars, parts and voices, and
    // quantise events
    read(settings, iterator, parts, spellables, buffers, tree);

    // 2. Sort out pitch
    // Assign note spelling per-part
    if (settings.showAtConcertPitch) {
        // Spell parts in concert pitch
        await spell([].concat.apply([], values(spellables)).sort(byBeat));
    }
    else {
        // Spell parts in per-part transposition
        await Promise.all(entries(spellables).map(([name, events]) => {
            const display   = toDisplayObject(settings, name);
            const transform = Transform.of('transpose', display.transpose || 0);
            events.forEach((event) => transform.apply(event));
            return spell(events);
        }));
    }
console.log('PARTS', parts);
console.log('SPELLABLES', spellables);
console.log('BUFFERS', buffers);
console.log('TREE', tree);
debugger
    // 3. Loop over bars, parts, voices and populate with symbols
    symbolise(settings, parts, buffers, tree);

    // Return tree object
    return tree;
}
