
import { toRootNumber, toNoteNumber } from 'midi/note.js';
import mod12 from './number/mod-12.js';

/* Event ids */

const $id = Symbol('scribe-id');

const map = {};

let id = 0;

const weak = new WeakMap();

export function identify(event) {
    // Get original event
    while (event.event) event = event.event;

    if (event[$id]) return event[$id];
    event[$id] = ++id;
    map[id] = event;
    return id;
}

export function find(events, id) {
    return events.find((event) => (event[$id] === id));
}

export function retrieve(id) {
    return map[id];
}

export function move(n, event) {
    event[0] = event[0] + n;
    return event;
}

export function transpose(n, event) {
    switch (event[1]) {
        case "chord":
        case "key":
            event[2] = mod12(toRootNumber(event[2]) + n);
            break;
        case "note":
        case "start":
        case "stop":
            event[2] = toNoteNumber(event[2]) + n;
            break;
        case "sequence":
            console.log('TODO: transpose sequence');
            break;
    }

    return event;
}

export function durate(n, event) {
    switch (event[1]) {
        case "chord":
        case "note":
        case "sequence":
            event[4] = event[4] + n <= 0 ?
                event[4] :
                event[4] + n ;
            break;
    }

    return event;
}
