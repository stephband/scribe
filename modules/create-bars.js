
import get        from 'fn/get.js';
import overload   from 'fn/overload.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import join       from './object/join.js';
import toStopBeat from './event/to-stop-beat.js';
import { createBar }  from './bar.js';
import { toKeyScale, toKeyNumber, cScale } from './keys.js';
import createBarElements from './create-bar-elements.js';
import config     from './config.js';


function pushEventToPart(stave, parts, event) {
    const partIndex  = stave.getPartIndex(event[2]);
    const partEvents = parts[partIndex] || (parts[partIndex] = []);
    parts[partIndex].push(event);
}

export default function createBars(sequence, stave, settings = config) {
    const bars = [];
    const ties = [];

    let beat   = 0;
    let events = [];
    let parts  = {};
    let key    = 0;
    let stopBeat = 0;
    let duration, divisor, event, sequenceEvent;

    // Extract events from sequence iterator
    for (event of sequence) {
        // If event is beyond current duration create bars
        while (event[0] >= beat + duration) {
            // Close current bar, push to bars
            bars.push(createBar(bars.length + 1, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings));

            // Update beat, start new accumulators
            beat = beat + duration;
            events = [];
            parts  = {};

            let t = -1;
            while (ties[++t]) {
                pushEventToPart(stave, parts, ties[t]);
                // If event does not extend beyond bar remove it from ties
                if (toStopBeat(ties[t]) < beat + duration) ties.splice(t--, 1);
            }
        }

        switch (event[1]) {
            case "note": {
                // Note events are pushed to parts
                pushEventToPart(stave, parts, event);
                // If event extends beyond bar push it into ties
                if (toStopBeat(event) > beat + duration) ties.push(event);

                if (stopBeat < toStopBeat(event)) {
                    stopBeat = toStopBeat(event);
                }

                break;
            }

            case "sequence": {
                if (event.events === sequence.events) {
                    sequenceEvent = event;
                }

                if (stopBeat < toStopBeat(event)) {
                    stopBeat = toStopBeat(event);
                }

                break;
            }

            case "key": {
                if (event[0] !== beat) {
                    new TypeError('Scribe: "key" event must occur at bar start – event [' + event.join(', ') + '] is on beat ' + (event[0] - beat) + ' of bar');
                }

                key = toKeyNumber(event[2]);
            }

            case "meter": {
                duration = event[2];
                divisor  = event[3];

                // If meter event does not land on current bar beat
                if (event[0] !== beat) {
                    // Create bar prematurely and start a new one, or error out?
                    console.log('TODO');
                }
            }

            default: {
                events.push(event);
            }
        }
    }

    // There are still events with long durations to symbolise into bars
    while (ties.length) {
        // Close current bar, push to bars
        bars.push(createBar(bars.length, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings));

        // Update beat, start new arrays
        beat = beat + duration;
        events = [];
        parts  = {};

        let t = -1;
        while (event = ties[++t]) {
            pushEventToPart(stave, parts, event);
            // If event does not extend beyond bar remove it from ties
            if (toStopBeat(event) < beat + duration) ties.splice(t--, 1);
        }
    }

    // Make sure we render up to full duration of note or sequence events
    // TODO: Surely we can find a more elegant way of doing this... do we really
    // still need the ties array? Can we not get rid of the loop above?
    while (beat < stopBeat - duration) {
        // Close current bar, push to bars
        bars.push(createBar(bars.length, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings));

        // Update beat, start new arrays
        beat = beat + duration;
        events = [];
        parts  = {};
    }

    // Close final bar, push to bars
    bars.push(createBar(bars.length, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings));

    // Return bars
    return bars;
}
