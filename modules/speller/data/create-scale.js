
import { toNoteNumber } from 'midi/note.js';
import { Event, Sequence } from 'sequence/module.js';

export default function createScale(name, key, duration, ...data) {
    const events = [
        [0, "key", key],
        [0, "meter", 4, 1]
    ];

    const sequence = Sequence.from({ name, events });

    let n = -1;
    let beat = 0;
    while (n < data.length - 1) {
        const spelling    = data[++n];
        const expectedKey = data[++n];
        const event = sequence.create(beat, "note", toNoteNumber(spelling), 0.1, duration);
        event.expectedSpelling = spelling;
        event.expectedKey      = expectedKey;
        beat += duration;
    }

    return sequence;
}
