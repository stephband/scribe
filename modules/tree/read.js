
import insert                  from 'fn/insert.js';
import nothing                 from 'fn/nothing.js';
import Event                   from 'sequence/modules/event.js';
import Stave                   from '../stave.js';
import Part                    from '../part.js';
import push                    from '../object/push.js';
import { toDisplay, byPartOrder } from '../display.js';
import log                     from '../log.js';
import toStopBeat              from '../event/to-stop-beat.js';


const { assign } = Object;


function toPartName(event) {
    if (event.object && event.object.name) return event.object.name;
    return 'default';
}

function toVoiceName(stave, voiceKey) {
    return voiceKey ?
        stave.voices[voiceKey - 1].name :
        undefined ;
}

function addRoute(routes, sourceId, route) {
    let list = routes.get(sourceId);
    if (!list) {
        list = [];
        routes.set(sourceId, list);
        routes.set(sourceId + '', list);
        if (!isNaN(sourceId)) {
            routes.set(Number(sourceId), list);
        }
    }
    list.push(route);
}

function getRoutes(event, routes) {
    if (!routes || routes.size === 0) return undefined;
    const id = event.target !== undefined ? event.target :
        event.object && event.object.id !== undefined ? event.object.id :
        0;
    return routes.get(id);
}

function toVoice(stave, event) {
    if (event.type === 'chord') return 'chord';
    if (event.type === 'text') return 'text';
    if (event.voice !== undefined) return event.voice + '';
    return stave.getVoice(event[2]).name;
}

function getOrCreatePart(parts, name) {
    let p = -1;
    while (parts[++p]) if (parts[p].name === name) return parts[p];

    const display = toDisplay(name);
    const stave   = Stave[display.staff || display.clef];
    const part    = new Part(name, stave, display.transpose);
    part.buffers  = {};
    insert(byPartOrder, parts, part);
    return part;
}

// Flags bar with a double bar line if the top-level sequence event stops inside it
function flagEndBar(bar, sequenceEvent) {
    if (!sequenceEvent) return false;
    const stopBeat = toStopBeat(sequenceEvent);
    if (stopBeat > bar.beat && stopBeat <= bar.beat + bar.duration) {
        bar.doubleBarLine = true;
        bar.endOfSequence = true;
        return true;
    }
    return false;
}

export default function read(settings, sequence, parts, keyEvent, meter, beat = 0) {
    const tree = {
        keys:       [],
        spellables: [],
        parts:      []
    };

    const routes = new Map();

    let bar = {
        type:      'bar',
        count:     1,
        beat,
        duration:  Infinity,
        divisor:   0,
        divisions: nothing,
        key:       0
    };

    // Guarantee the render of at least 1 bar
    let stopBeat = beat + 1;
    let event;
    let sequenceEvent;

    // If parts is an array, initialize parts and routes
    if (parts) {
        let p = -1;
        while (parts[++p]) {
            // Clone part
            // WHY ARE WE CLONING PART HERE?
            const part = Part.from(parts[p]);
            part.buffers = {};
            // Assign it to tree
            tree.parts.push(part);
            // Create route from part.routing
            for (const [sourceId, voiceKey] of Object.entries(part.routing)) {
                const voiceName = toVoiceName(part.stave, voiceKey);
                addRoute(routes, sourceId, { part, voiceName });
            }
        }
    }

    // Initial key
    if (keyEvent) {
        tree.keys.push(keyEvent);
        bar.keyEvent   = keyEvent;
        bar.key        = keyEvent[2];
    }

    // Initial meter
    if (meter) {
        const offset   = beat % meter.duration;
        bar.meterEvent = meter;
        bar.duration   = meter.duration - offset;
        bar.divisor    = meter.divisor;
        bar.divisions  = meter.divisions.map((n) => n - offset).filter((n) => n > 0);
    }

    // Extract events from sequence iterator and divide them into voices
    for (event of sequence) {
        // While event time is beyond end of bar advance bar state
        while (event[0] >= bar.beat + bar.duration) {
            if (flagEndBar(bar, sequenceEvent)) sequenceEvent = undefined;
            push(tree, bar);

            // Start new bar
            bar = {
                type:      'bar',
                count:     bar.count + 1,
                beat:      bar.beat + bar.duration,
                key:       bar.key,
                duration:  meter ? meter.duration : Infinity,
                divisor:   meter ? meter.divisor : 0,
                divisions: meter ? meter.divisions : nothing
            };
        }

        // Handle event types
        switch (event.type) {
            case "sequence":
                // Ignore sequence events that stop at or before beat
                if (toStopBeat(event) <= beat) break;

                if (event.events === sequence.events) sequenceEvent = event;
                stopBeat = stopBeat < toStopBeat(event) ? toStopBeat(event) : stopBeat;
                break;

            case "key": {
                // Ignore redundant key events that do not change the key
                if (tree.keys.length && tree.keys[tree.keys.length - 1][2] === event[2]) break;
                if (event[0] > bar.beat) throw new Error(`Scribe "key" event at beat ${ event[0] } not at start of bar at beat ${ bar.beat }`);
                bar.keyEvent = event;
                bar.key = event[2];
                tree.keys.push(event);

                // Push copy of key event to parts already discovered
                let p = -1;
                while (tree.parts[++p]) {
                    if (tree.parts[p].spellables) {
                        tree.parts[p].spellables.push(Event.from(event));
                    }
                }
                break;
            }

            case "meter":
                meter = event;

                // Meter falls on bar
                if (meter[0] === bar.beat) {
                    bar.meterEvent = event;
                    bar.duration   = meter.duration;
                    bar.divisor    = meter.divisor;
                    bar.divisions  = meter.divisions;
                    break;
                }

                console.warn(`Scribe "meter" event at beat ${ event[0] } not at start of bar beat ${ bar.beat }`);

                // Meter falls before bar, which should only occur at the beginning
                if (meter[0] < bar.beat) {
                    const offset   = (bar.beat - event[0]) % meter.duration;
                    bar.meterEvent = event;
                    bar.duration   = meter.duration - offset;
                    bar.divisor    = meter.divisor;
                    bar.divisions  = meter.divisions.map((n) => n - offset).filter((n) => n > 0);
                    break;
                }

                // Meter falls mid-bar
                bar.duration  = event[0] - bar.beat;
                bar.divisions = bar.divisions.filter((n) => n < bar.duration).concat(bar.duration);
                if (flagEndBar(bar, sequenceEvent)) sequenceEvent = undefined;
                push(tree, bar);

                // Start new bar
                bar = {
                    type:       'bar',
                    count:      bar.count + 1,
                    beat:       bar.beat + bar.duration,
                    key:        bar.key,
                    meterEvent: event,
                    duration:   meter.duration,
                    divisor:    meter.divisor,
                    divisions:  meter.divisions
                };

                //throw new Error(`Scribe "meter" event at beat ${ event[0] } not at start of bar beat ${ bar.beat }`);
                break;

            case "note":
            case "chord": {
                // Ignore events before beat
                if (event[0] < beat) break;

                const endBeat = toStopBeat(event);
                if (endBeat > stopBeat) stopBeat = endBeat;

                const dests = getRoutes(event, routes);
                if (dests && dests.length) {
                    for (let i = 0; i < dests.length; i++) {
                        const { part, voiceName: routeVoice } = dests[i];
                        const voiceName = event.type === 'chord' ? 'chord' :
                            routeVoice || toVoice(part.stave, event);

                        const e = dests.length > 1 && i < dests.length - 1 ? Event.from(event) : event;
                        e.part  = part.name;
                        e.voice = voiceName;
                        e.stave = part.stave;

                        // Push event into spellables if pitched stave
                        if (part.stave.pitched) {
                            if (!part.spellables) part.spellables = tree.keys.map((ev) => Event.from(ev));
                            part.spellables.push(e);
                            tree.spellables.push(e);
                        }

                        // Push event into voice buffer
                        const voiceBuffer = part.buffers[voiceName] || (part.buffers[voiceName] = []);
                        voiceBuffer.push(e);
                    }
                }
                else {
                    const part      = getOrCreatePart(tree.parts, toPartName(event));
                    const voiceName = toVoice(part.stave, event);

                    event.part  = part.name;
                    event.voice = voiceName;
                    event.stave = part.stave;

                    // Push event into spellables if pitched stave
                    if (part.stave.pitched) {
                        if (!part.spellables) part.spellables = tree.keys.map((e) => Event.from(e));
                        part.spellables.push(event);
                        tree.spellables.push(event);
                    }

                    // Push event into voice buffer
                    const voiceBuffer = part.buffers[voiceName] || (part.buffers[voiceName] = []);
                    voiceBuffer.push(event);
                }
                break;
            }

            case "text": {
                // Ignore events before beat
                if (event[0] < beat) break;

                const endBeat = toStopBeat(event);
                if (endBeat > stopBeat) stopBeat = endBeat;

                const dests = getRoutes(event, routes);
                if (dests && dests.length) {
                    for (let i = 0; i < dests.length; i++) {
                        const { part } = dests[i];
                        const voiceName = 'text';

                        const e = dests.length > 1 && i < dests.length - 1 ? Event.from(event) : event;
                        e.part  = part.name;
                        e.voice = voiceName;
                        e.stave = part.stave;

                        // Push event into voice buffer
                        const voiceBuffer = part.buffers[voiceName] || (part.buffers[voiceName] = []);
                        voiceBuffer.push(e);
                    }
                }
                else {
                    const part      = getOrCreatePart(tree.parts, toPartName(event));
                    const voiceName = 'text';

                    event.part  = part.name;
                    event.voice = voiceName;
                    event.stave = part.stave;

                    // Push event into voice buffer
                    const voiceBuffer = part.buffers[voiceName] || (part.buffers[voiceName] = []);
                    voiceBuffer.push(event);
                }
                break;
            }

            default:
                log('event type "' + event.type + '" ignored', '');
        }
    }

    // If no meter was declared, set duration to contain all notes in a single bar
    if (!bar.divisions.length) {
        bar.duration  = stopBeat - bar.beat;
        bar.divisor   = 1;
        bar.divisions = [bar.duration];
    }

    // Create bars up to stop beat
    while (stopBeat > bar.beat + bar.duration) {
        if (flagEndBar(bar, sequenceEvent)) sequenceEvent = undefined;
        push(tree, bar);

        // Start new bar
        bar = {
            type:      'bar',
            count:     bar.count + 1,
            beat:      bar.beat + bar.duration,
            key:       bar.key,
            duration:  meter.duration,
            divisor:   meter.divisor,
            divisions: meter.divisions
        };
    }

    push(tree, bar);

    // Assign part shells to each bar by order number
    let b = -1;
    while (bar = tree[++b]) {
        bar.length = tree.parts.length;
        let p = -1;
        while (tree.parts[++p]) {
            // Clone part
            const part = Part.from(tree.parts[p]);
            part.symbols = [];
            // Assign to bar
            bar[p] = part;
        }
    }

    tree.length = b;
    return tree;
}
