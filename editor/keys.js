
import remove   from 'fn/remove.js';
import delegate from 'dom/delegate.js';
import events   from 'dom/events.js';
import keyboard from 'dom/keyboard.js';
import { moveEvents, transposeEvents, durateEvents } from './actions.js';
import { selection, select, deselect, clear } from './selection.js';
import { highlightZones, unhighlightZones, unhighlightSymbols } from './zones.js';


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



function getZoneBeat(duration, zone) {
    const bar   = zone.parentElement;
    const index = Number(zone.dataset.index);
    return Number(bar.dataset.beat) + index * duration;
}

function createOrDeleteNote(sequence, root, zone, pitch, gain, duration) {
    const bar     = zone.parentElement;
    const barBeat = Number(bar.dataset.beat);
    const index   = Number(zone.dataset.index);
    const beat    = barBeat + index * duration;
    const event   = sequence.find(beat, "note", pitch);

    if (event) {
        sequence.delete(beat, "note", pitch);
    }
    else {
        select(sequence.create(beat, "note", pitch, gain, duration));
        highlightZones(root, selection);
    }

    // Refocus zone (its a new element). Nasty. TODO.
    requestAnimationFrame(() => {
        const zone = document.querySelector('.bar[data-beat="' + barBeat + '"] > .zone[data-index="' + index + '"]');
        zone.focus();
    });
}

function deleteEvents(sequence, events) {
    events.reduce(remove, sequence.events);
}

let previouslyActive;

export default function keys(root, state) {
    events('focusin', document)
    .each((e) => {
        const { sequence, duration } = state;
        const zone = document.activeElement;
        const beat = getZoneBeat(duration, zone);

        //console.log('zone', zone);
        previouslyActive = zone;

        // Empty selection when zone focus changes
        clear();

        // Select events corresponding to focused zone
        sequence
        .select(beat, "note")
        .forEach(select);

        highlightZones(root, selection);

        // Update readouts
        //document.querySelector('.beat').textContent = beat;
    });

    keyboard({
        'shift:down': (e) => document.body.classList.add('shift-key'),
        'shift:up':   (e) => document.body.classList.remove('shift-key'),
        'alt:down':   (e) => document.body.classList.add('alt-key'),
        'alt:up':     (e) => document.body.classList.remove('alt-key'),
        'ctrl:down':  (e) => document.body.classList.add('ctrl-key'),
        'ctrl:up':    (e) => document.body.classList.remove('ctrl-key'),
        'meta:down':  (e) => document.body.classList.add('meta-key'),
        'meta:up':    (e) => document.body.classList.remove('meta-key'),

        'tab':        (e) => {
            if (document.activeElement === document.body && previouslyActive) {
                previouslyActive.focus();
            }
            else {
                return true;
            }
        },

        '1:down':     (e) => { console.log(1), document.body.dataset.zone = state.duration = 1 },
        '2:down':     (e) => document.body.dataset.zone = state.duration = 1/2,
        '3:down':     (e) => document.body.dataset.zone = state.duration = 1/3,
        '4:down':     (e) => document.body.dataset.zone = state.duration = 1/4,
        '5:down':     (e) => document.body.dataset.zone = state.duration = 1/5,
        '6:down':     (e) => document.body.dataset.zone = state.duration = 1/6,
        '7:down':     (e) => document.body.dataset.zone = state.duration = 1/7,
        '8:down':     (e) => document.body.dataset.zone = state.duration = 1/8,
        '9:down':     (e) => document.body.dataset.zone = state.duration = 1/9,
        // TODO: I'm doing this wrong. We want to map by key position,
        // not character name
        'backquote:down':   (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'G3',  0.1, state.duration),
        'A:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'Ab3', 0.1, state.duration),
        'Z:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'A3',  0.1, state.duration),
        'S:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'Bb3', 0.1, state.duration),
        'X:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'B3',  0.1, state.duration),
        'C:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'C4',  0.1, state.duration),
        'F:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'C#4', 0.1, state.duration),
        'V:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'D4',  0.1, state.duration),
        'G:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'Eb4', 0.1, state.duration),
        'B:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'E4',  0.1, state.duration),
        'N:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'F4',  0.1, state.duration),
        'J:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'F#4', 0.1, state.duration),
        'M:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'G4',  0.1, state.duration),
        'K:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'G#4', 0.1, state.duration),
        'comma:down':       (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'A4',  0.1, state.duration),
        'L:down':           (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'Bb4', 0.1, state.duration),
        'period:down':      (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'B4',  0.1, state.duration),
        'slash:down':       (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'C5',  0.1, state.duration),
        'quote:down':       (e) => createOrDeleteNote(state.sequence, root, document.activeElement, 'C#5', 0.1, state.duration),

        'down:down':        (e) => transposeEvents(-1, selection),
        'up:down':          (e) => transposeEvents(1, selection),
        'left:down':        (e) => moveEvents(-state.duration, selection),
        'right:down':       (e) => moveEvents(state.duration, selection),
        'shift-left:down':  (e) => durateEvents(-state.duration, selection),
        'shift-right:down': (e) => durateEvents(state.duration, selection),
        'backspace:down':   (e) => deleteEvents(state.sequence, selection)
    }, document.body);
}

