
import create      from 'dom/create.js';
import Sequence    from 'sequence/sequence.js';
import Stave       from '../modules/stave.js';
import createBars  from './create-bars.js';
import { toBarElements } from './create-bar-elements.js';
import * as glyphs from './glyphs.js';
import config      from './config.js';

function isInitialMeterEvent(event) {
    return event[0] <= 0 && event[1] === 'meter';
}

function isInitialKeyEvent(event) {
    return event[0] <= 0 && event[1] === 'key';
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

export default function render(data, clef, keyname, meter, transpose, settings = config) {
    // TODO, WARNING! This mutates events! We probably oughta clone events first.
    const events = data.events;

    // If events contains no initial meter and meter is set, insert a meter event
    const meterEvent = events.find(isInitialMeterEvent);
    if (!meterEvent && meter) events.unshift([0, 'meter', meter[2], meter[3]]);

    // If events contains no initial key and keyname is set, insert a key event
    const keyEvent = events.find(isInitialKeyEvent);
    if (!keyEvent && keyname) events.unshift([0, 'key', keyname]);

    // Create sequence object
    const sequence = new Sequence(events, data.sequences, data.name);

    // Get the stave controller
    const stave = Stave.create(clef || 'treble');

    const elements = [];

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

    return createBars(sequence, stave, settings).reduce(toBarElements, elements);
}
