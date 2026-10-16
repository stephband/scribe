
import { toNoteNumber } from 'midi/note.js';
import { Sequence }     from 'sequence/module.js';

const { floor } = Math;

export function createTriads(name, key, duration, ...data) {
    const events = [
        [0, "key", key],
        [0, "meter", 4, 1]
    ];

    const sequence = Sequence.from({ name, events });

    for (let i = 0; i < data.length; i += 2) {
        const beat        = floor(i / 6) * duration;
        const spelling    = data[i];
        const expectedKey = data[i + 1];
        const event = sequence.create(beat, "note", toNoteNumber(spelling), 0.1, duration);
        event.expectedSpelling = spelling;
        event.expectedKey      = expectedKey;
    }

    return sequence;
}

export function createTetrads(name, key, duration, ...data) {
    const events = [
        [0, "key", key],
        [0, "meter", 4, 1]
    ];

    const sequence = Sequence.from({ name, events });

    for (let i = 0; i < data.length; i += 2) {
        const beat        = floor(i / 8) * duration;
        const spelling    = data[i];
        const expectedKey = data[i + 1];
        const event = sequence.create(beat, "note", toNoteNumber(spelling), 0.1, duration);
        event.expectedSpelling = spelling;
        event.expectedKey      = expectedKey;
    }

    return sequence;
}

export function createScale(name, key, duration, ...data) {
    const events = [
        [0, "key", key],
        [0, "meter", 4, 1]
    ];

    const sequence = Sequence.from({ name, events });

    for (let i = 0; i < data.length; i += 2) {
        const beat        = (i / 2) * duration;
        const spelling    = data[i];
        const expectedKey = data[i + 1];
        const event = sequence.create(beat, "note", toNoteNumber(spelling), 0.1, duration);
        event.expectedSpelling = spelling;
        event.expectedKey      = expectedKey;
    }

    return sequence;
}
