
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


function ignoreKeys(key, value) {
    if (key === "stave" || key === "event" || key === "sequence" || key === "beam") return undefined;
    return value;
}

function jsonifyBar(bar) {
    const clone = bar.symbols.filter((symbol) => symbol.type === 'chord' || symbol.type === 'note');
    return JSON.stringify(clone, ignoreKeys);
}

function detectBarRepeats(bars, jsons, bar) {
    const json = jsonifyBar(bar);

    switch (jsons.length) {
        case 1: break;
        case 2: break;
        case 3: {
            /* When jsons reaches 2 check for two single bar repeats, or three bars
               of the same materiel. Lop off a couple of bars at this point and replace
               the last couple with double bar repeat symbols. Do not truncate jsons,
               we want it to keep getting longer such that it hits case 7 repeatedly
               from now on. */
            if (json === jsons[0] && json === jsons[1] && bar.symbols.filter((symbol) => symbol.type !== 'clef' && symbol.type !== 'timesig').find((symbol) => symbol.type !== 'rest')) {
                bar.symbols = [{
                    type: 'BARREPEAT',
                    value: 1
                }];

                bars[bars.length - 1].symbols = bars[bars.length - 1].symbols.filter((symbol) => symbol.type === 'doublebarline' || symbol.type === 'clef').concat([{
                    type: 'BARREPEAT',
                    value: 1
                }]);

                bars[bars.length - 2].symbols = bars[bars.length - 2].symbols.filter((symbol) => symbol.type === 'doublebarline' || symbol.type === 'clef').concat([{
                    type: 'BARREPEAT',
                    value: 1
                }]);
            }

            break;
        }

        case 4: {
            /* If all are equal two single bar repeats were already inserted
               in case 2. Add another. */
            if (json === jsons[0] && json === jsons[1] && json === jsons[2] && json === jsons[3]) {
                bar.symbols = bar.symbols.filter((symbol) => symbol.type === 'doublebarline' || symbol.type === 'clef').concat([{
                    type: 'BARREPEAT',
                    value: 1
                }]);

                // Prevent jsons climbing into double bar repeat territory
                jsons.length = 3;
            }

            break;
        }

        case 4: break;
        case 5: {
            /* When jsons reaches 5 check for two double bar repeats, or six bars of
               the same materiel. Lop off a couple of bars at this point and replace
               the last couple with double bar repeat symbols. Do not truncate jsons,
               we want it to keep getting longer such that it hits case 7 repeatedly
               from now on. */
            if (json === jsons[1] && json === jsons[3] && jsons[0] === jsons[2] && jsons[0] === jsons[4]) {
                bar.symbols = bar.symbols.filter((symbol) => symbol.type === 'doublebarline' || symbol.type === 'clef').concat([{
                    type: 'BARREPEAT',
                    value: 2
                }]);

                // Lop off the previous bar
                bars.length -= 2;

                bars[bars.length - 1].symbols = bars[bars.length - 1].symbols.filter((symbol) => symbol.type === 'doublebarline' || symbol.type === 'clef').concat([{
                    type: 'BARREPEAT',
                    value: 2
                }]);
            }

            break;
        }

        case 6: break;
        case 7: {
            /* Double bars have already been added, determine whether we add another. */
            if (json === jsons[1] && json === jsons[3] && jsons[0] === jsons[2] && jsons[0] === jsons[4]) {
                bar.symbols = bar.symbols.filter((symbol) => symbol.type === 'doublebarline' || symbol.type === 'clef').concat([{
                    type: 'BARREPEAT',
                    value: 2
                }]);

                // Lop off the previous bar
                bars.length -= 1;

                // Prevent another double from happening on the very next bar
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
    while (jsons.length > 7) jsons.pop();
}


export default function createBars(sequence, stave, settings = config) {
    const bars = [];
    const ties = [];
    const jsons = [];

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
            const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings);
            detectBarRepeats(bars, jsons, bar);
            bars.push(bar);

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

    // Close final bar, push to bars
    const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings);
    detectBarRepeats(bars, jsons, bar);
    bars.push(bar);

    // Return bars
    return bars;
}
