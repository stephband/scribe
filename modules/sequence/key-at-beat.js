
import by      from '../../../fn/modules/by.js';
import get     from '../../../fn/modules/get.js';
import toBeats from './to-beats.js';
import toKeys  from './to-keys.js';

/**
keysAtBeats(events)
Returns an array of `[beat, key]` entries, with an entry for each
unique beat found in events.
**/

export function keysAtBeats(events) {
    const harmonies = events.filter((event) => /^note|chord$/.test(event[1]));
    const beats = toBeats(harmonies);
    const keys  = toKeys(harmonies);
    return beats.map((beat, i) => [beat, keys[i]]);
}

/**
keyFromBeatKeys(beatkeys, beat)
**/

export function keyFromBeatKeys(beatkeys, beat) {
    let n = beatkeys.length;

    while (n--) {
        if (beatkeys[n][0] <= beat) {
            return beatkeys[n][1];
        }
    }

    return beatkeys[0][1];
}

/**
keyAtBeat(beatkeys, beat)
Get the key at the given beat by looking at the latest event
beat to see what it has.
**/

export default function keyAtBeat(events, beat) {
    const beatkeys = keysAtBeats(events.sort(by(get(0))));
    return keyFromBeatKeys(beatkeys, beat);
}

