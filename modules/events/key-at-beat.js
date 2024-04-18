
import toBeats from './to-beats.js';
import toKeys  from './to-keys.js';

export default function keyAtBeat(events, beat) {
    // Get the key at the given beat by looking at the latest event
    // beat to see what it has.
    const beats = toBeats(events);
    let n = beats.length;
    while (n--) {
        if (beats[n] <= beat) { break; }
    }

    return toKeys(events)[n];
}
