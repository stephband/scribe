
import toDuration from './to-duration.js';

const output = [];

export default function eventsAtBeat(beat, events) {
    output.length = 0;

    let event;
    let n = events.length;
    while (n--) {
        event = events[n];
        if (event[0] <= beat && (event[0] + toDuration(event)) > beat) {
            output.push(event);
        }
    }

    return output.reverse();
}
