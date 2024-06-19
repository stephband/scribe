/* Event ids */

const $id = Symbol('scribe-id');

let id = 0;

export function identify(event) {
    if (event[$id]) return event[$id];
    event[$id] = (++id + '');
    return event[$id];
}

export function find(events, id) {
    return events.find((event) => (event[$id] === id));
}
