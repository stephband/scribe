
import toDuration from '../event/to-duration.js';

const output = [];

/**
eventsAtBeat(events, beat)
Returns an array of events at, or whose duration covers, `beat`.
**/

export default function eventsAtBeat(events, beat) {
    output.length = 0;

    let event;
    let n = -1;
    while (event = events[++n]) {
        if (event[0] > beat) break;
        if (event[0] === beat || event[0] + toDuration(event) > beat) {
            output.push(event);
        }
    }

    return output;
}
