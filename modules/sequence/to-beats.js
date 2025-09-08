
import get from 'fn/get.js';
import { byGreater } from '../maths.js';

const beats = [];

export default function toBeats(events) {
    beats.length = 0;

    var n = events.length;
    var event, beat;
    while (n--) {
        event = events[n];

        if (beat !== event[0]) {
            beat = event[0];
            beats.push(beat);
        }
    }

    return beats.sort(byGreater);
}

// TODO This would be better...
// events
// .map(get(0))
// .filter((v, i, array) => (array.indexOf(v) === i))
// .sort();
