
import get        from 'fn/get.js';
import overload   from 'fn/overload.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import join       from './object/join.js';
import toStopBeat from './event/to-stop-beat.js';
import { createBar }  from './bar.js';
import getStopBeat from './event/to-stop-beat.js';
import config     from './config.js';


/* Bar repeats */

function ignoreKeys(key, value) {
    if (key === "stave" || key === "event" || key === "sequence" || key === "beam") return undefined;
    return value;
}

function jsonifyBar(bar) {
    const clone = bar.symbols.filter((symbol) => symbol.type === 'chord' || symbol.type === 'note');
    return JSON.stringify(clone, ignoreKeys);
}

function replaceWithRepeat(bar, count) {
    bar.symbols = bar.symbols
        .filter((symbol) => symbol.type === 'doublebarline' || symbol.type === 'clef')
        .concat([{
            type: 'BARREPEAT',
            count,
            duration: bar.duration
        }]);
}

function detectBarRepeats(bars, jsons, bar) {
    const json = jsonifyBar(bar);

    switch (jsons.length) {
        case 1: break;
        case 2: break;
        case 3: {
            // If bars have no events of interest they are just rests, we don't
            // want to bar repeat rest bars
            if (json === '[]' && jsons[0] === '[]') {
                jsons.length = 0;
            }
            // When jsons reaches 3 check for 3 bar repeats, or 4 identical bars
            else if (json === jsons[0] && json === jsons[1] && json === jsons[2] && bar.symbols.filter((symbol) => symbol.type !== 'clef' && symbol.type !== 'timesig').find((symbol) => symbol.type !== 'rest')) {
                // Replace the last three bars with single bar repeat symbols
                replaceWithRepeat(bars[bars.length - 2], 1);
                replaceWithRepeat(bars[bars.length - 1], 1);
                replaceWithRepeat(bar, 1);
            }
            else if (json !== jsons[1] || jsons[0] !== jsons[2]) {
                // There is no double bar repeat cooking return to testing for
                // single bar repeats
                jsons.length = 2;
            }

            break;
        }

        case 4: {
            // If all are equal two single bar repeats were already inserted
            // in case 3. Lucky us. Add another.
            if (json === jsons[0] && json === jsons[1] && json === jsons[2] && json === jsons[3]) {
                // Replace the last bar with a single bar repeat symbol
                replaceWithRepeat(bar, 1);
                // Come back to case 4 on the next iteration
                jsons.length = 3;
            }
            else if (json !== jsons[1] || jsons[0] !== jsons[2] || json !== jsons[3]) {
                // There is no double bar repeat cooking and we got here we know
                // we've been bar repeat mode (do we?), go back to testing for
                // single bar repeats
                jsons.length = 2;
            }

            break;
        }

        case 5: {
            // When jsons reaches 5 check for two double bar repeats, or six
            // bars of identical materiel
            if (json === jsons[1] && json === jsons[3] && jsons[0] === jsons[2] && jsons[0] === jsons[4]) {
                // Lop off the previous 2 bars
                bars.length -= 2;
                // Replace the last 2 bars with two bars of double bar repeat
                // symbol
                replaceWithRepeat(bars[bars.length - 1], 2);
                replaceWithRepeat(bar, 2);
            }
            else {
                // Go back to testing case 5 ?? What about single repeats?
                jsons.length = 4;
            }

            break;
        }

        case 6: break;
        case 7: {
            // Double bars have already been added, determine whether we add another
            if (json === jsons[1] && json === jsons[3] && jsons[0] === jsons[2] && jsons[0] === jsons[4]) {
                // Lop off the previous bar
                bars.length -= 1;
                // Replace last bar with a double bar symbol
                replaceWithRepeat(bar, 2);
                // Prevent another double from happening on the very next bar,
                // go back to case 6, thus case 7 in two iterations
                jsons.length = 5;
            }
            else {
                // Prevent another double from happening on the very next bar
                jsons.length = 1;
            }

            break;
        }
    }

    jsons.unshift(json);
    while (jsons.length > 8) jsons.pop();
}


/* Bars */

function pushEventToPart(stave, parts, event) {
    const part = event.target ?
        // TEMP Experimental parts syphoner - but is this the way to do it?
        stave.parts[event.target] :
        // Stave decides on part automatically
        stave.getPart(event[2]) ;

    const partEvents = parts[part.name] || (parts[part.name] = []);
    parts[part.name].push(event);
}

export default function createBars(sequence, excludes, stave, settings = config) {
    const scribeEvents = [];
    const bars  = [];
    const ties  = [];
    const jsons = [];

    let beat   = 0;
    let events = [];
    let parts  = {};
    let key    = 0;
    let stopBeat = 0;
    let duration, divisor, event, sequenceEvent;

    // Extract events from sequence iterator
    for (event of sequence) {
        // Store all events for the key analyser. We know event is an object at
        // this point, as the iterator emits transformed objects, so use the
        // event to pass the info down
        event.scribeIndex  = scribeEvents.length;
        event.scribeEvents = scribeEvents;
        scribeEvents.push(event);

        if (excludes.includes(event[1])) continue;

        // If event is beyond current duration create bars
        while (event[0] >= beat + duration) {
            // Close current bar, push to bars
            const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings);
            detectBarRepeats(bars, jsons, bar);
            bars.push(bar);
            key = bar.key;

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
                if (stopBeat < toStopBeat(event)) stopBeat = toStopBeat(event);
                break;
            }

            case "sequence": {
                if (event.events === sequence.events) sequenceEvent = event;
                if (stopBeat < toStopBeat(event)) stopBeat = toStopBeat(event);
                break;
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
        const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings);
        detectBarRepeats(bars, jsons, bar);
        bars.push(bar);

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
        const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings);
        detectBarRepeats(bars, jsons, bar);
        bars.push(bar);

        // Update beat, start new arrays
        beat = beat + duration;
        events = [];
        parts  = {};
    }

    // If no meter was declared this is a bar with indeterminate duration,
    // but we do need to know how much duration to render so get it from the
    // last event: TODO: check all events, the last may not be the longest
    if (!duration) duration = getStopBeat(scribeEvents[scribeEvents.length - 1]);

    // Close final bar, push to bars
    const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings);
    detectBarRepeats(bars, jsons, bar);
    bars.push(bar);

    // Return bars
    return bars;
}
