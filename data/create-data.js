
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

export function createMelody(name, key, meter, options, ...data) {
    const events = [
        [0, "key", key],
        Array.isArray(meter) ? meter : [0, "meter", meter, 1]
    ];

    const sequence = Sequence.from({ name, events });
    let beat = 0;

    for (let i = 0; i < data.length; i += 3) {
        const spelling    = data[i];
        const duration    = data[i + 1];
        const expectedKey = data[i + 2];
        if (spelling) {
            const event = sequence.create(beat, "note", toNoteNumber(spelling), 0.1, duration);
            event.expectedSpelling = spelling;
            event.expectedKey      = expectedKey;
        }
        beat += duration;
    }

    sequence.options = options;

    return sequence;
}

export function createSequence(name, key, meter, options, ...data) {
    const events = [
        [0, "key", key],
        Array.isArray(meter) ? meter : [0, "meter", meter, 1]
    ];

    const sequence = Sequence.from({ name, events });

    for (let i = 0; i < data.length; i += 4) {
        const beat        = data[i];
        const spelling    = data[i + 1];
        const duration    = data[i + 2];
        const expectedKey = data[i + 3];
        const event = sequence.create(beat, "note", toNoteNumber(spelling), 0.1, duration);
        event.expectedSpelling = spelling;
        event.expectedKey      = expectedKey;
    }

    sequence.options = options;

    return sequence;
}
