
/* Event ids */

const $id = Symbol('scribe-id');
const map = {};

let id = 0;

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
