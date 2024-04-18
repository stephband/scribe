
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

    return beats.sort();
}
