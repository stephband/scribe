
import by      from '../../../fn/modules/by.js';
import get     from '../../../fn/modules/get.js';
import toBeats from './to-beats.js';
import toKeys  from './to-keys.js';

export default function keyAtBeat(events, beat) {
    // Get the key at the given beat by looking at the latest event
    // beat to see what it has.
    const notes = events.filter((event) => event[1] === 'note' || event[1] === 'chord').sort(by(get(0)));
    const beats = toBeats(notes);
    const keys  = toKeys(notes);

    let n = beats.length;
    while (n--) {
        if (beats[n] <= beat) { break; }
    }

    return keys[n];
}
