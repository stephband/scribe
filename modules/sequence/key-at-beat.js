
import by      from '../../../fn/modules/by.js';
import get     from '../../../fn/modules/get.js';
import toBeats from './to-beats.js';
import toKeys  from './to-keys.js';

/**
toBeatKeys(events)
Returns an array of `[beat, key]` entries, with an entry for each
unique beat found in events.
**/

export function toBeatKeys(events) {
    const beats = toBeats(events);
    const keys  = toKeys(events);
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
    const notes = events
        .filter((event) => /^note|chord$/.test(event[1]))
        .sort(by(get(0)));

    return keyFromBeatKeys(toBeatKeys(notes), beat);
}

