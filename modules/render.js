
import Sequence   from 'sequence/sequence.js';
import Stave      from '../modules/stave.js';
import { keysAtBeats, keyFromBeatKeys } from './sequence/key-at-beat.js';
import createBars from './create-bars.js';
import { toBarElements } from './create-bar-elements.js';
import config     from './config.js';

function isInitialMeterEvent(event) {
    return event[0] <= 0 && event[1] === 'meter';
}

function isInitialKeyEvent(event) {
    return event[0] <= 0 && event[1] === 'key';
}

export default function render(data, clef, keyname, meter, transpose) {
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

    // Create a map of keys at beats. Doing this here is an optimisation so we
    // don't end up running the keys matrix calculations on every note, which
    // causes measurable delay.
    const beatkeys = stave.pitched ?
        keysAtBeats(Array.from(sequence)) :
        null ;

    // TODO: this is a two-pass symbol generation, I wonder if we can get
    // it down to one?
    return createBars(sequence, stave, config).map(toBarElements);
}
