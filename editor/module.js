
import get      from '../../fn/modules/get.js';
import id       from '../../fn/modules/id.js';
import overload from '../../fn/modules/overload.js';
import create   from '../../dom/modules/create.js';
import events   from '../../dom/modules/events.js';
import gestures from '../../dom/modules/gestures.js';
import rect     from '../../dom/modules/rect.js';
import { toNoteName, toNoteNumber } from '../../midi/modules/note.js';

import createSymbols     from '../modules/create-symbols.js';
import createBarElements from '../modules/create-bar-elements.js';
import * as staves from '../modules/staves.js';

import isTransposeable from '../modules/event/is-transposeable.js';
import { selection, select, deselect, clear } from './modules/selection.js';


const stave   = staves.treble;
const body    = document.body;
const element = document.getElementById('scribe-bars');

// Zones cache
const zones = {};

function createDOM(sequence) {
    const symbols = createSymbols(sequence.events, 'treble', 'C', [0, "meter", 4, 1], 0);
    const bars    = createBarElements(symbols);

    // TEMP: Create 1 extra bar
    bars.push(create('div', {
        class: `treble-stave stave bar`,
        data: { beat: 4, duration: 4 },
    }));

    bars.forEach((barElement) => {
        const zoneElements = Array.from({ length: 8 }, (v, i) => {
            const beat    = i / 2;
            const absbeat = Number(barElement.dataset.beat) + beat;

            // Cache zones
            return zones[absbeat] || (zones[absbeat] = create('div', {
                class: 'zone',
                data: { beat: beat + 1, duration: 0.5, absbeat }
            }));
        });

        barElement.prepend.apply(barElement, zoneElements);
    });

    return bars;
}

function renderDOM(elements) {
    element.innerHTML = '';
    element.append.apply(element, elements);
}

const sequence = {
    events: [
        [0, 'note', 'G4', 1, 1]
    ]
};

const elements = createDOM(sequence);
renderDOM(elements);




// Track cursor
let cursor       = 0;
let editDuration = 0.5;
let rate         = 1.5;

function barAtBeat(b) {
    // TODO
    return Math.floor(b / 4);
}

function updateCursor(beat, barElements) {
    // Advance cursor;
    cursor = beat;
    const barN = barAtBeat(beat);
    barElements[barN].classList.add('cursor-active');
}




// Keys

import keyboard from '../../dom/modules/keyboard.js';

let timer;

function stopTimer() {
    clearTimeout(timer);
}

function updateNoteEvent(event) {
    event[4] += editDuration;

    // Render sequence
    const barElements = createDOM(sequence);
    renderDOM(barElements);
    updateCursor(cursor + editDuration, barElements);
    timer = setTimeout(updateNoteEvent, 1000 * editDuration / rate, event);
}

function addNoteEvent(pitch, dynamic) {
    const event = [cursor, 'note', pitch, dynamic, 0];
    updateNoteEvent(event);
    sequence.events.push(event);
}



function moveSelectionPitch(n) {
    let i = -1;
    let event;
    while (event = selection[++i]) {
        if (isTransposeable(event)) {
            event[2] = toNoteNumber(event[2]) + n;
        }
    }

    render(sequence);
}

function moveSelectionBeat(n) {
    let i = -1;
    let event;

    // If any events in selection would start before 0 as a result of this move
    // don't move any of them.
    while (event = selection[++i]) if (event[0] + n < 0) return;

    // Move 'em'
    i = -1;
    while (event = selection[++i]) event[0] += n;

    render(sequence);
}


keyboard({
    // TODO: I'm doing this wrong. We want to map by key position,
    // not character name
    'backquote:down': (e) => addNoteEvent('G3',  1),
    'backquote:up':   (e) => stopTimer(),
    'A:down':         (e) => addNoteEvent('Ab3', 1),
    'A:up':           (e) => stopTimer(),
    'Z:down':         (e) => addNoteEvent('A3',  1),
    'Z:up':           (e) => stopTimer(),
    'S:down':         (e) => addNoteEvent('Bb3', 1),
    'S:up':           (e) => stopTimer(),
    'X:down':         (e) => addNoteEvent('B3',  1),
    'X:up':           (e) => stopTimer(),
    'C:down':         (e) => addNoteEvent('C4',  1),
    'C:up':           (e) => stopTimer(),
    'F:down':         (e) => addNoteEvent('C#4', 1),
    'F:up':           (e) => stopTimer(),
    'V:down':         (e) => addNoteEvent('D4',  1),
    'V:up':           (e) => stopTimer(),
    'G:down':         (e) => addNoteEvent('Eb4', 1),
    'G:up':           (e) => stopTimer(),
    'B:down':         (e) => addNoteEvent('E4',  1),
    'B:up':           (e) => stopTimer(),
    'N:down':         (e) => addNoteEvent('F4',  1),
    'N:up':           (e) => stopTimer(),
    'J:down':         (e) => addNoteEvent('F#4', 1),
    'J:up':           (e) => stopTimer(),
    'M:down':         (e) => addNoteEvent('G4',  1),
    'M:up':           (e) => stopTimer(),
    'K:down':         (e) => addNoteEvent('G#4', 1),
    'K:up':           (e) => stopTimer(),
    'comma:down':     (e) => addNoteEvent('A4',  1),
    'comma:up':       (e) => stopTimer(),
    'L:down':         (e) => addNoteEvent('Bb4', 1),
    'L:up':           (e) => stopTimer(),
    'period:down':    (e) => addNoteEvent('B4',  1),
    'period:up':      (e) => stopTimer(),
    'slash:down':     (e) => addNoteEvent('C5',  1),
    'slash:up':       (e) => stopTimer(),
    'quote:down':     (e) => addNoteEvent('C#5', 1),
    'quote:up':       (e) => stopTimer(),
    'up:down':        (e) => moveSelectionPitch(1),
    'down:down':      (e) => moveSelectionPitch(-1),
    'left:down':      (e) => moveSelectionBeat(-editDuration),
    'right:down':     (e) => moveSelectionBeat(editDuration)
}, body);















// Touch

function render(sequence) {
    const barElements = createDOM(sequence);
    renderDOM(barElements);
}

function addNoteEventByTouch(beat, pitch, dynamic, duration) {
    const event = [beat, 'note', pitch, dynamic, duration];
    sequence.events.push(event);
    render(sequence);
    return event;
}

function activateZonesFromEvent(zones, event) {
    const iStart = zones.findIndex((zone) => Number(zone.dataset.absbeat) === event[0]);
    const iStop  = zones.findIndex((zone) => Number(zone.dataset.absbeat) === event[0] + event[4]);

    zones.forEach((zone) => zone.classList.remove('active'));

    zones
    .slice(iStart, iStop)
    .forEach((zone) => zone.classList.add('active'));
}

gestures({ select: '.zone', threshold: 0, device: 'mouse pen touch' }, body)
.each((stream) => stream.reduce(overload((data, e) => e.type, {
    'pointerdown': (data, e) => {
        const zone     = e.target;
        const zoneRect = rect(zone);
        const ratio    = (e.clientY - zoneRect.top) / zoneRect.height;
        const beat     = Number(zone.dataset.absbeat);
        const pitch    = stave.yRatioToPitch(ratio);
        const duration = Number(zone.dataset.duration);
        const event    = addNoteEventByTouch(beat, pitch, 0.2, duration);
        const zones    = Array.from(body.querySelectorAll('.zone'));

        // Clear selection
        clear();
        activateZonesFromEvent(zones, event);

        data.pointermoves = events('pointermove', body)
        .each((e) => {
            //console.log('MOVE');
            const ratio = (e.clientY - zoneRect.top) / zoneRect.height;
            const pitch = stave.yRatioToPitch(ratio);

            // Is there no change in pitch? Don't rerender.
            if (event[2] === pitch) { return data; }

            // Update pitch
            event[2] = pitch;
            render(sequence);

            // Highlight zones
            const zones = Array.from(body.querySelectorAll('.zone'));
            activateZonesFromEvent(zones, event);
        });

        data.pointerovers = events({ type: 'pointerover', select: '.zone' }, body)
        .each((e) => {
            const zone = e.target;
            const beat = Number(zone.dataset.absbeat);

            // Are we trying to edit backwards? That doesn't make sense.
            if (beat < event[0]) { return; }

            // Update duration
            const duration = Number(zone.dataset.duration);
            event[4] = beat + duration - event[0];
            render(sequence);

            // Highlight zones
            const zones = Array.from(body.querySelectorAll('.zone'));
            activateZonesFromEvent(zones, event);
        });

        data.event = event;
        return data;
    },

    'pointermove': id,

    default: (data, e) => {
        data.pointerovers.stop();
        data.pointermoves.stop();

        // Unhighlight zones
        body
        .querySelectorAll('.zone.active')
        .forEach((zone) => zone.classList.remove('active'));

        select(data.event);

        return data;
    }
}), {}));
