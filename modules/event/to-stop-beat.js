
import toDuration from './to-duration.js';

export default function toStopBeat(event) {
    return event[0] + toDuration(event);
}
