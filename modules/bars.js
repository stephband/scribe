
import get              from 'fn/get.js';
import overload         from 'fn/overload.js';
import { toRootName }   from 'midi/note.js';
import { toKeyNumber, keyToRootNumber, rootToKeyNumber } from 'sequence/modules/event/keys.js';
import { toChordName }  from 'sequence/modules/event/chords.js';
import mod12            from './number/mod-12.js';
import join             from './object/join.js';
import toStopBeat       from './event/to-stop-beat.js';
import { getDivisions } from './bar/divisions.js';
import config           from './config.js';
import { keyToNumbers, keyWeightsForEvent, chooseKeyFromWeights } from './keys.js';
import { major }        from './scale.js';


const rslashbass = /\/\{(\d{1,2})\}$/;


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
            type: 'barrepeat',
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

function updateAccidentals(accidentals, key) {
    const numbers = keyToNumbers(key);

    numbers.reduce((accidentals, n, i) => {
        const acci = n - major[i];
        if (acci !== 0) {
            const name = toRootName(major[i]);
            let n = 10;
            while (n--) accidentals[name + n] = acci;
        }
        return accidentals;
    }, accidentals);

    return accidentals;
}

function substituteSpelling(settings, name) {
    if (name === 'C♭' && settings.spellChordRootCFlatAsB)  return 'B';
    if (name === 'E♯' && settings.spellChordRootESharpAsF) return 'F';
    if (name === 'B♯' && settings.spellChordRootBSharpAsC) return 'C';
    if (name === 'F♭' && settings.spellChordRootFFlatAsE)  return 'E';
    return name;
}

function createBar(count, beat, duration, divisor, stave, key, symbols, parts, settings) {
    // Track end of sequence and shove in a double bar line
    //if (sequence) {
    //    const sequenceStop = toStopBeat(sequence);
    //    if (sequenceStop > beat && sequenceStop <= beat + duration) {
    //        events.push(sequence);
    //    }
    //}

    // Create bar
    const bar = {
        type: 'bar',
        count,
        beat,
        duration,
        divisor: divisor || 4,
        divisions: getDivisions(duration, divisor),
        key,
        stave,
        symbols
    };

    let part;
    for (part of stave.parts) {
        const events = parts[part.name];
        if (!events || !events.length) continue;
        // Populate accidentals with key signature sharps and flats
        const accidentals = updateAccidentals({}, key);
        // Don't process the default center
        //centers.delete(part.centerRow || stave.centerRow);
        stave.createPartSymbols(bar, accidentals, part, events, settings);
    }

    return bar;
}

export default function createBars(sequence, excludes, stave, settings = config) {
    const events = [];
    const bars   = [];
    const jsons  = [];

    let beat     = 0;
    let key      = 0;
    let stopBeat = 0;
    let symbols  = [];
    let parts    = {};
    let duration, divisor, event, sequenceEvent;

    // Extract events from sequence iterator and divide them into parts
    for (event of sequence) {
        // While event time is beyond bar end create bar from current state
        while (event[0] >= beat + duration) {
            const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, symbols, parts, settings);

            // If a sequence event stopped in this bar
            if (sequenceEvent
                && toStopBeat(sequenceEvent) > beat
                && toStopBeat(sequenceEvent) <= beat + duration) {
                // Push in a double bar line
                console.log('DOUBLE BAR', event);
                symbols.push({ type: 'doublebarline', stave, event });
                sequenceEvent = undefined;
            }

            detectBarRepeats(bars, jsons, bar);
            bars.push(bar);
            beat    = bar.beat + bar.duration;
            symbols = [];
            parts   = {};
        }

        // Handle event types
        switch (event[1]) {
            // Meter events set bar duration
            case "key":
                if (event[0] !== beat) throw new Error(`Scribe "key" event at beat ${ event[0] } not at start of bar at beat ${ beat }`);
                key = toKeyNumber(event[2]);
                //updateAccidentals(accidentals, key);
                // TODO: Key is global and added to the side bar, we need to think about
                // how to make key signature changes
                // symbols.push.apply(symbols, stave.createKeySymbols(key));
                break;

            case "meter":
                if (event[0] !== beat) throw new Error(`Scribe "meter" event at beat ${ event[0] } not at start of bar at beat ${ beat }`);
                duration = event[2];
                divisor  = event[3];
                symbols.push({
                    type:        'timesig',
                    beat:        0,
                    numerator:   event[3] === 1.5 ? event[2] / 0.5 : event[2] / event[3],
                    denominator: event[3] === 1.5 ? 8 : 4 / event[3],
                    stave,
                    event
                });
                break;

            case "symbol":
                symbols.push({
                    type: 'symbol' + event[2],
                    stave
                });
                break;

            case "chord": {
                const keyWeights = keyWeightsForEvent(events, n, key);
                const keyNumber  = chooseKeyFromWeights(keyWeights);
                const extension  = toChordName(event[3]);
                const slashbass  = rslashbass.exec(extension);

                let root, bass, name;

                if (slashbass) {
                    const n = parseInt(slashbass[1], 10);
                    root = stave.getSpelling(keyNumber, mod12(event[2] - n));
                    bass = stave.getSpelling(keyNumber, event[2]);
                    name = substituteSpelling(settings, root) + extension.replace(rslashbass, '/' + substituteSpelling(settings, bass));
                }
                else {
                    root = stave.getSpelling(keyNumber, event[2]);
                    name = substituteSpelling(settings, root) + extension;
                }

                symbols.push({
                    type: 'chord',
                    beat: event[0] - beat,
                    name,
                    // Does chord cross into next bar? The symbol should not
                    duration: event[0] + event[4] > beat + duration ?
                        duration - event[0] + beat :
                        event[4],
                    event,
                    stave
                });

                break;
            }

            case "text":
                symbols.push({
                    type: 'text',
                    beat: event[0] - beat,
                    // Does chord cross into next bar? The symbol should not
                    duration: event[0] + event[3] > beat + duration ?
                        duration - event[0] + beat :
                        event[3],
                    value: event[2],
                    event,
                    stave
                });
                break;

            case "sequence":
                // If this sequence event comes from the top level sequence
                // flag a double bar line at the end of the sequence
                if (event.events === sequence.events) sequenceEvent = event;

                // Extend stop beat
                stopBeat = stopBeat < toStopBeat(event) ?
                    toStopBeat(event) :
                    stopBeat ;

                break;

            case "note":
                stopBeat = stopBeat < toStopBeat(event) ?
                    toStopBeat(event) :
                    stopBeat ;

                pushEventToPart(stave, parts, event);
                break;

            default:
                console.log('Scribe: ignoring event type "' + event[1] + '"');
        }

        // Store all events for the key analyser. We know event is an object at
        // this point, as the iterator emits transformed objects, so use the
        // event to pass the info down
        event.scribeIndex  = events.length;
        event.scribeEvents = events;

        // Add to events
        events.push(event);
    }

    // If no meter was declared this is a bar with indeterminate duration,
    // but we do need to know how much duration to render so get it from the
    // last event: TODO: check all events, the last may not be the longest
    if (!duration) {
        duration = scribeEvents.length ?
            toStopBeat(scribeEvents[scribeEvents.length - 1]) :
            1 ;
    }

    // Create bars up to stop beat
    while (beat < stopBeat) {
        const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, symbols, parts, settings);

        // If a sequence event stopped in this bar
        if (sequenceEvent
            && toStopBeat(sequenceEvent) > beat
            && toStopBeat(sequenceEvent) <= beat + duration) {
            // Flag the bar to make a double bar line
            bar.doubleBarLine = true;
            //symbols.push({ type: 'doublebarline', stave, event });
            sequenceEvent = undefined;
        }

        detectBarRepeats(bars, jsons, bar);
        bars.push(bar);
        beat    = bar.beat + bar.duration;
        symbols = [];
        parts   = {};
    }

    return bars;
}







/*
export default function createBars(sequence, excludes, stave, settings = config) {
    const scribeEvents = [];
    const bars  = [];
    const jsons = [];

    let beat     = 0;
    let ties     = [];
    let events   = [];
    let parts    = {};
    let key      = 0;
    let stopBeat = 0;
    let duration, divisor, event, sequenceEvent;

    // Extract events from sequence iterator and divide them into parts
    for (event of sequence) {
        // Store all events for the key analyser. We know event is an object at
        // this point, as the iterator emits transformed objects, so use the
        // event to pass the info down
        event.scribeIndex  = scribeEvents.length;
        event.scribeEvents = scribeEvents;
        scribeEvents.push(event);

        // Exclude event types
        if (excludes.includes(event[1])) continue;

        // If event is beyond current duration create bars
        while (event[0] >= beat + duration) {
console.log('ARSE');
            // Close current bar, push to bars
            const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings);
            detectBarRepeats(bars, jsons, bar);
            bars.push(bar);
            key    = bar.key;
            ties   = bar.ties;
            beat   = beat + duration;
            events = [];
            parts  = {};

            let t = -1;
            while (ties[++t]) {
                pushEventToPart(stave, parts, ties[t]);
                // Extend stopBeat
                //if (stopBeat < toStopBeat(ties[t])) stopBeat = toStopBeat(ties[t]);
                // If event does not extend beyond bar remove it from ties
                if (toStopBeat(ties[t]) < beat + duration) ties.splice(t--, 1);
            }
        }

        switch (event[1]) {
            case "note": {
                // Note events are pushed to parts
                pushEventToPart(stave, parts, event);
                // If event extends beyond bar push it into ties
// TEMP!!!
if (stave.pitched) {
    if (stopBeat < toStopBeat(event)) stopBeat = toStopBeat(event);
}

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
        key    = bar.key;
        ties   = bar.ties;
        beat   = beat + duration;
        events = [];
        parts  = {};

        let t = -1;
        while (event = ties[++t]) {
            pushEventToPart(stave, parts, event);
            // Extend stopBeat
            //if (stopBeat < toStopBeat(ties[t])) stopBeat = toStopBeat(ties[t]);
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
        key    = bar.key;
        ties   = bar.ties;
        beat   = beat + duration;
        events = [];
        parts  = {};

        let t = -1;
        while (event = ties[++t]) {
            pushEventToPart(stave, parts, event);
            // Extend stopBeat
            //if (stopBeat < toStopBeat(ties[t])) stopBeat = toStopBeat(ties[t]);
            // If event does not extend beyond bar remove it from ties
            if (toStopBeat(event) < beat + duration) ties.splice(t--, 1);
        }
    }

    // If no meter was declared this is a bar with indeterminate duration,
    // but we do need to know how much duration to render so get it from the
    // last event: TODO: check all events, the last may not be the longest
    if (!duration) {
        duration = scribeEvents.length ?
            getStopBeat(scribeEvents[scribeEvents.length - 1]) :
            1 ;
    }

    // Close final bar, push to bars
    const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, events, parts, sequenceEvent, settings);
    detectBarRepeats(bars, jsons, bar);
    bars.push(bar);

    // Return bars
    return bars;
}
*/
