
import { retrieve, move, durate, transpose } from '../modules/event.js';

export function moveEvents(beats, events) {
    let i = -1, event;
    while (event = events[++i]) move(beats, event);
    return events;
}

export function durateEvents(beats, events) {
    let i = -1, event;
    while (event = events[++i]) durate(beats, event);
    return events;
}

export function transposeEvents(semitones, events) {
    let i = -1, event;
    while (event = events[++i]) transpose(semitones, event);
    return events;
}




import { selection, select, deselect, clear } from './selection.js';


function addNoteEvent(pitch, dynamic) {
    const event = [cursor, 'note', pitch, dynamic, 0];
    updateNoteEvent(event);
    sequence.events.push(event);
}

function moveSelectionPitch(stave, n) {
    let i = -1;
    let event;

    // Check that all pitches may be transposed
    while (event = selection[++i]) {
        if (isTransposeable(event)) {
            const pitch = stave.movePitch(event[2], n);
            if (!pitch) return;
        }
    }

    // Transpose them
    i = -1;
    while (event = selection[++i]) {
        if (isTransposeable(event)) {
            event[2] = stave.movePitch(event[2], n);
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

function moveSelectionDuration(n) {
    let i = -1;
    let event;

    // If any events in selection would reach duration 0 as a result of this
    // move don't shorten any of them.
    while (event = selection[++i]) if (event[4] + n <= 0) return;

    // Move 'em'
    i = -1;
    while (event = selection[++i]) event[4] += n;

    render(sequence);
}

function deleteSelection() {
    let i;
    while (event = selection.pop()) {
        i = sequence.events.indexOf(event);
        sequence.events.splice(i, 1);
    }
    render(sequence);
}
