
import create      from 'dom/create.js';
import { SequenceIterator } from 'sequence/sequence.js';
import Stave       from '../modules/stave.js';
import createBars  from './create-bars.js';
import createSymbolElement from './create-symbol-element.js';
import * as glyphs from './glyphs.js';
import config      from './config.js';

function isInitialMeterEvent(event) {
    return event[0] <= 0 && event[1] === 'meter';
}

function isInitialKeyEvent(event) {
    return event[0] <= 0 && event[1] === 'key';
}

function toElements(nodes, symbol) {
    const element = createSymbolElement(symbol);
    if (element) { nodes.push(element); }
    return nodes;
}

export function toBarElements(elements, bar) {
    elements.push(create('div', {
        class: `${ bar.stave.type }-stave stave ${ bar.error ? 'error ': '' }bar`,
        data: { beat: bar.beat, duration: bar.duration, count: bar.count },
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

export default function render(data, clef, keyname, meter, duration = Infinity, transpose = 0, displace = 0, settings = config) {
    // TODO, WARNING! This mutates events! We probably oughta clone events first.
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
    const sequence = new SequenceIterator(events, data.sequences, 0, duration, transforms);

    // Concat instructions line together from settings and tempo
    /*
    const instructions = [];
    if (settings.swingAsStraight8ths)  instructions.push('Swing 8ths');
    if (settings.swingAsStraight16ths) instructions.push('Swing 16ths');
    if (instructions.length) elements.push(create('p', {
        class: 'instruction',
        html: instructions.join(', ')
    }));
    */

    return createBars(sequence, stave, settings).reduce(toBarElements, []);
}
