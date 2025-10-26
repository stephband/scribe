
import { identify } from '../modules/event.js';

function trunc2(n) {
    const decimals = ((n % 1) + '').slice(2,4)
    return Math.trunc(n) + (decimals ? '.' + decimals : '') ;
}

export function unhighlightZones(element) {
    // Unhighlight zones
    element
    .querySelectorAll('.zone.active')
    .forEach((zone) => zone.classList.remove('active'));
}

export function unhighlightSymbols(element) {
    // Unhighlight zones
    element
    .querySelectorAll('.selected')
    .forEach((element) => element.classList.remove('selected'));
}

export function highlightZones(element, events) {
    unhighlightZones(element);
    unhighlightSymbols(element);

    events.forEach((event) => {
        // Select all zones up to end of event duration
        /*
        let absbeat = event[0];
        while (absbeat < event[0] + event[4]) {
            const zone = element.querySelector('.zone[data-absbeat^="' + trunc2(absbeat) + '"]');
            if (zone) zone.classList.add('active');
            absbeat += editDuration;
        }
        */

        // Select elements identified by event

        element
        .querySelectorAll('[data-event="' + identify(event) + '"]')
        .forEach((element) => element.classList.add('selected'));
    });
}
