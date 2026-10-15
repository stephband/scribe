
/* Event ids */
const $id = Symbol('scribe-id');
const map = {};

let id = 0;

export function original(event) {
    // Get original event
    while (event.event) event = event.event;
    return event;
}

export function identify(event) {
    // Get original event
    event = original(event);
    // If it has an id assigned return it
    if (event[$id]) return event[$id];
    // Increment id, assign it to symbol
    event[$id] = ++id;
    // Store it in a map
    map[id] = event;
    // And return it
    return id;
}

export function find(events, id) {
    return events.find((event) => (event[$id] === id));
}

export function retrieve(id) {
    return map[id];
}
