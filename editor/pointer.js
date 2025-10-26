
import get      from 'fn/get.js';
import noop     from 'fn/noop.js';
import overload from 'fn/overload.js';
import create   from 'dom/create.js';
import delegate from 'dom/delegate.js';
import events   from 'dom/events.js';
import rect     from 'dom/rect.js';
import { retrieve } from '../modules/event.js';
import { selection, select, deselect, clear } from './selection.js';
import { highlightZones, unhighlightZones, unhighlightSymbols } from './zones.js';


const assign = Object.assign;
const { min, max, round } = Math;


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

function createEvent() {
    const event = Array.from(arguments);
    insertByBeat(sequence.events, event);
    return event;
}

let action;

// Selection rectangle
const rectangle = create('div', {
    hidden: true,
    class: 'select-rectangle rectangle'
});

document.body.append(rectangle);

export default function pointer(root, state) {
    events({ type: 'pointerdown', device: 'mouse pen touch' }, root)
    .filter((e) => e.isPrimary)
    .each(delegate({
        '.zone': (zone, e) => {
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

            const pointermoves = events('pointermove', body)
            .each((e) => {
                //console.log('MOVE');
                const ratio = (e.clientY - zoneRect.top) / zoneRect.height;
                const pitch = stave.yRatioToPitch(ratio);

                // If there is no pitch to move to do nothing
                if (!pitch) { return; }

                // Is there no change in pitch? Don't rerender.
                if (event[2] === pitch) { return; }

                // Update pitch
                event[2] = pitch;
                render(sequence);

                // Highlight zones
                const zones = Array.from(body.querySelectorAll('.zone'));
                activateZonesFromEvent(zones, event);
            });

            const pointerovers = events({ type: 'pointerover', select: '.zone' }, body)
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

            const pointerups = events('pointercancel pointerup', body).each(() => {
                pointermoves.stop();
                pointerovers.stop();
                pointerups.stop();

                // Unhighlight zones
                unhighlightZones();

                // Add event to selection
                select(event);
                highlightZones();
            });
        },

        '[data-event]': (element, e) => {
            // Select head
            const id    = parseInt(element.dataset.event, 10);
            const event = retrieve(id);

            action = {
                type: 'move',
                pageX: e.pageX,
                pageY: e.pageY,
                beats: 0,
                transpose: 0
            };

            // If head is in selection do nothing
            if (selection.includes(event)) return;

            // Deselect everything
            if (!e.shiftKey) clear();

            // Select event
            select(event);
            highlightZones(root, selection);
        },

        '[data-events]': (element, e) => {
            action = {
                type: 'move',
                pageX: e.pageX,
                pageY: e.pageY,
                beats: 0,
                transpose: 0
            };

            // Select head
            const events = element.dataset.events
                .split(/\s+/)
                .map(Number)
                .map(retrieve);

            // Deselect everything
            if (!e.shiftKey) clear();

            // Select events
            events.forEach(select);
            highlightZones(root, selection);
        },

        '.scribe': (scribe, e) => {
            // Deselect everything
            if (!e.shiftKey) {
                clear();
                unhighlightZones(root);
                unhighlightSymbols(root);
            }

            action = {
                type: 'select',
                root,
                pageX: e.pageX,
                pageY: e.pageY,
                // Get rect objects of selectable elements, assign data to them
                rects: Array.from(root.querySelectorAll('.chord[data-event], .note[data-event]'), (element) => assign(rect(element), {
                    element,
                    event: retrieve(parseInt(element.dataset.event, 10))
                }))
            };

            rectangle.hidden = false;
            document.body.classList.add('no-select');
        }
    }));

    events('click', root)
    .each(delegate({
        '.clef[data-event]': (button, e) => {
            const dialog  = element.getElementById('clef-dialog');
            //const eventId = button.dataset.eventId;
            //const event   = find(sequence.events, eventId) || defaultClef;
            const closes  = events('close', dialog)
                .each((e) => {
                    closes.stop();
                    if (dialog.returnValue) {
                        stave = staves[dialog.returnValue];
                        defaultClef[2] = dialog.returnValue;
                        render(sequence);
                    }
                });

            dialog.showModal();
        },

        '.keysig[data-event]': (button, e) => {
            const dialog  = element.getElementById('clef-dialog');
            const eventId = button.dataset.event;
            const event   = find(sequence.events, eventId) || createEvent(0, 'key', 'C');
            const closes  = events('close', dialog)
                .each((e) => {
                    closes.stop();
                    if (dialog.returnValue) {
                        defaultKey[2] = dialog.returnValue;
                        render(sequence);
                    }
                });

            dialog.showModal();
        },

        '.timesig[data-event]': (button, e) => {
            const dialog  = element.getElementById('timesig-dialog');
            const eventId = button.dataset.event;
            const event   = find(sequence.events, eventId) || createEvent(0, 'meter', 4, 1);
            const closes  = events('close', dialog)
                .each((e) => {
                    closes.stop();
                    if (dialog.returnValue) {
                        assign(event, timesigToMeter(dialog.returnValue));
                        render(sequence);
                    }
                });

            dialog.showModal();
        },
/*
        '*': () => {
            // Deselect everything
            clear();
            unhighlightSymbols();
            unhighlightZones();
            return;
        }
*/
    }));
}



const rowSize  = 4; // 4px row size
const beatSize = 32; // 32px beat size
const grain    = 0.5;

events({ type: 'pointermove', device: 'mouse pen touch' }, document)
.each(overload(() => action && action.type, {
    move: (e) => {
        const x = e.pageX - action.pageX;
        const y = e.pageY - action.pageY;

        // Move x
        const beats = round((x / beatSize) / grain) * grain;

        // Beat has changed
        if (beats !== action.beats) {
            let i = -1, event;
            while (event = selection[++i]) {
                event.move(beats - action.beats);
            }

            action.beats = beats;
        }

        // Move y
        const rows      = -1 * y / rowSize;
        const transpose = round(rows * 12 / 7);

        // Transpose has changed
        if (transpose !== action.transpose) {
            let i = -1, event;
            while (event = selection[++i]) {
                event.transpose(transpose - action.transpose);
            }

            action.transpose = transpose;
        }

        console.log(JSON.stringify(selection));
    },

    select: (e) => {
        const xmin  = min(e.pageX, action.pageX);
        const ymin  = min(e.pageY, action.pageY);
        const xmax  = max(e.pageX, action.pageX);
        const ymax  = max(e.pageY, action.pageY);
        const rects = action.rects;

        // Rectangular selection
        const selected = rects.filter((data) => (
            xmin < data.left + data.width / 2
            && xmax > data.left + data.width / 2
            && ymin < data.top + data.height / 2
            && ymax > data.top + data.height / 2
        )).map(get('event'));

        // Crude but works TODO: be kinder to the DOM
        selection.length = 0;
        selected.forEach(select);
        highlightZones(action.root, selection);

        assign(rectangle.style, {
            left:   xmin + 'px',
            top:    ymin + 'px',
            width:  (xmax - xmin) + 'px',
            height: (ymax - ymin) + 'px'
        });
    },

    default: noop
}));

events({ type: 'pointerup pointercancel', device: 'mouse pen touch' }, document)
.each(() => {
    action = undefined;
    rectangle.hidden = true;
    document.body.classList.remove('no-select');
});
