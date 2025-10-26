
import delegate from 'dom/delegate.js';
import events   from 'dom/events.js';
import keyboard from 'dom/keyboard.js';
import { select, deselect, clear } from './selection.js';


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




keyboard({
    // TODO: I'm doing this wrong. We want to map by key position,
    // not character name
    'backquote:down':   (e) => addNoteEvent('G3',  1),
    'backquote:up':     (e) => stopTimer(),
    'A:down':           (e) => addNoteEvent('Ab3', 1),
    'A:up':             (e) => stopTimer(),
    'Z:down':           (e) => addNoteEvent('A3',  1),
    'Z:up':             (e) => stopTimer(),
    'S:down':           (e) => addNoteEvent('Bb3', 1),
    'S:up':             (e) => stopTimer(),
    'X:down':           (e) => addNoteEvent('B3',  1),
    'X:up':             (e) => stopTimer(),
    'C:down':           (e) => addNoteEvent('C4',  1),
    'C:up':             (e) => stopTimer(),
    'F:down':           (e) => addNoteEvent('C#4', 1),
    'F:up':             (e) => stopTimer(),
    'V:down':           (e) => addNoteEvent('D4',  1),
    'V:up':             (e) => stopTimer(),
    'G:down':           (e) => addNoteEvent('Eb4', 1),
    'G:up':             (e) => stopTimer(),
    'B:down':           (e) => addNoteEvent('E4',  1),
    'B:up':             (e) => stopTimer(),
    'N:down':           (e) => addNoteEvent('F4',  1),
    'N:up':             (e) => stopTimer(),
    'J:down':           (e) => addNoteEvent('F#4', 1),
    'J:up':             (e) => stopTimer(),
    'M:down':           (e) => addNoteEvent('G4',  1),
    'M:up':             (e) => stopTimer(),
    'K:down':           (e) => addNoteEvent('G#4', 1),
    'K:up':             (e) => stopTimer(),
    'comma:down':       (e) => addNoteEvent('A4',  1),
    'comma:up':         (e) => stopTimer(),
    'L:down':           (e) => addNoteEvent('Bb4', 1),
    'L:up':             (e) => stopTimer(),
    'period:down':      (e) => addNoteEvent('B4',  1),
    'period:up':        (e) => stopTimer(),
    'slash:down':       (e) => addNoteEvent('C5',  1),
    'slash:up':         (e) => stopTimer(),
    'quote:down':       (e) => addNoteEvent('C#5', 1),
    'quote:up':         (e) => stopTimer(),
    'up:down':          (e) => moveSelectionPitch(stave, 1),
    'down:down':        (e) => moveSelectionPitch(stave, -1),
    'left:down':        (e) => moveSelectionBeat(-editDuration),
    'right:down':       (e) => moveSelectionBeat(editDuration),
    'shift-left:down':  (e) => moveSelectionDuration(-editDuration),
    'shift-right:down': (e) => moveSelectionDuration(editDuration),
    'backspace:down':   (e) => deleteSelection()
}, body);

