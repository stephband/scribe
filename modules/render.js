
import create           from 'dom/create.js';
import { toRootName }   from 'midi/note.js';
import SequenceIterator from 'sequence/sequence-iterator.js';
import Stave            from '../modules/stave.js';
import createBars       from './create-bars.js';
import createElement    from './create-element.js';
import * as glyphs      from './glyphs.js';
import config           from './config.js';

function isInitialMeterEvent(event) {
    return event[0] <= 0 && event[1] === 'meter';
}

function isInitialKeyEvent(event) {
    return event[0] <= 0 && event[1] === 'key';
}

function toElements(nodes, symbol) {
    const element = createElement(symbol);
    if (element) { nodes.push(element); }
    return nodes;
}

export function toBarElements(elements, bar) {
    elements.push(create('div', {
        class: `${ bar.stave.type }-stave stave ${ bar.doubleBarLine ? 'end-bar ' : '' }bar${ bar.error ? ' error ': '' }`,
        data: { beat: bar.beat, duration: bar.duration, count: bar.count, key: toRootName(bar.key) },
        children: bar.symbols.reduce(toElements, [])
    }));

    return elements;
}

/* Glyphs for triplet mark d d = d 3 d, instead of saying Swing 8ths, for example
text = glyphs.textNoteShort
    + glyphs.textBeam8Short
    + glyphs.textNote8Short
    + '='
    + glyphs.textNoteShort
    + ' '
    + glyphs.textTuplet3Long
    + glyphs.note05Up
*/

export default function render(data, excludes, clef, keyname, meter, duration = Infinity, transpose = 0, displace = 0, settings = config) {
    const events = data.events;

    // If events contains no initial meter and meter is set, insert a meter event
    const meterEvent = events.find(isInitialMeterEvent);
    if (!meterEvent && meter) events.unshift([0, 'meter', meter[2], meter[3]]);

    // If events contains no initial key and keyname is set, insert a key event
    const keyEvent = events.find(isInitialKeyEvent);
    if (!keyEvent && keyname) events.unshift([0, 'key', keyname]);

    // Get the stave controller
    const stave = Stave.create(clef || 'treble');

    // Make transforms list
    const transforms = [];
    if (transpose) transforms.push("transpose", transpose);
    if (displace)  transforms.push("displace", displace);

    // Create sequence object
    const sequence = new SequenceIterator(events, data.sequences, transforms);

    // Create bar elements
    const bars = createBars(sequence, excludes, stave, settings);
    const elements = bars.reduce(toBarElements, []);

//const keysig = elements[0].querySelectorAll('.acci:not([data-beat])');

    // Creates stave with clef and key signature
    const bar0      = bars[0];
    const key       = bar0.key;
    const signature = stave.createSignatureSymbols(key);

    // Quick and dirty way of rendering clefs into left hand side bar
    const sidebar = create('div', {
        class: `${ stave.type }-stave signature-stave stave`,
        children: signature.map(createElement),
        data: { key: toRootName(key) }
    });

    const column = create('div', {
        id: 'side',
        class: 'side',
        data: { key: toRootName(key) }
    });

    let n = 24;
    while (n--) column.appendChild(sidebar.cloneNode(true));

    // Return array of elements
    elements.unshift(column);
    return elements;
}
