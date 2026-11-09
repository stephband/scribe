
import insert                  from 'fn/insert.js';
import slugify                 from 'fn/slugify.js';
import Event                   from 'sequence/modules/event.js';
import { getDivisions }        from 'sequence/modules/event/meter.js';
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
    if (voiceKey === 0 || voiceKey === '0') {
        if (stave && stave.getVoice) return '0';
    }

    if (stave && stave.type === 'grand') {
        if (voiceKey === 1 || voiceKey === '1') return 'rh';
        if (voiceKey === 2 || voiceKey === '2') return 'lh';
        if (voiceKey === 3 || voiceKey === '3') return 'soprano';
        if (voiceKey === 4 || voiceKey === '4') return 'alto';
        if (voiceKey === 5 || voiceKey === '5') return 'tenor';
        if (voiceKey === 6 || voiceKey === '6') return 'bass';
    }

    if (stave && stave.voices) {
        if (stave.voices[voiceKey]) return stave.voices[voiceKey].name;
        const voice = stave.voices.find((v) => v.name === voiceKey);
        if (voice) return voice.name;
        if ((voiceKey === 1 || voiceKey === '1') && stave.voices.length === 1) {
            return stave.voices[0].name;
        }
    }
    return voiceKey + '';
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

function toVoice(settings, stave, event) {
    if (event.type === 'chord') return 'chord';
    if (event.type === 'text') return 'text';
    if (event.voice !== undefined) return event.voice + '';
    const voice = stave.getVoice ? stave.getVoice(event[2]) : stave.voices?.[0];
    return voice ? voice.name : '0';
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

export default function read(settings, sequence, parts, keyEvent, meterEvent) {
    const tree = {
        keys:       [],
        spellables: [],
        parts:      []
    };

    const routes = new Map();

    let bar = {
        type:      'bar',
        count:     1,
        beat:      0,
        duration:  Infinity,
        divisor:   0,
        divisions: undefined,
        key:       0
    };

    // Guarantee the render of at least 1 bar
    let stopBeat = 1;
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
    if (meterEvent) {
        bar.meterEvent = meterEvent;
        bar.duration   = meterEvent[2];
        bar.divisor    = meterEvent[3];
        bar.divisions  = meterEvent.divisions;
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
                duration:  bar.duration,
                divisor:   bar.divisor,
                divisions: bar.divisions
            };
        }

        // Handle event types
        switch (event.type) {
            case "sequence":
                if (event.events === sequence.events) sequenceEvent = event;
                stopBeat = stopBeat < toStopBeat(event) ? toStopBeat(event) : stopBeat;
                break;

            case "key": {
                // Ignore redundant key events that do not change the key
                if (tree.keys.length && tree.keys[tree.keys.length - 1][2] === event[2]) break;
                if (event[0] !== bar.beat) throw new Error(`Scribe "key" event at beat ${ event[0] } not at start of bar at beat ${ bar.beat }`);
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
                console.log('METER', event);
                if (event[0] !== bar.beat) throw new Error(`Scribe "meter" event at beat ${ event[0] } not at start of bar beat ${ bar.beat }`);
                bar.meterEvent = event;
                bar.duration   = event[2];
                bar.divisor    = event[3];
                bar.divisions  = getDivisions(bar.duration, bar.divisor);
                break;

            case "note":
            case "chord": {
                const endBeat = toStopBeat(event);
                if (endBeat > stopBeat) stopBeat = endBeat;

                const dests = getRoutes(event, routes);
                if (dests && dests.length) {
                    for (let i = 0; i < dests.length; i++) {
                        const { part, voiceName: routeVoice } = dests[i];
                        let voiceName;

                        if (event.type === 'chord') {
                            voiceName = 'chord';
                        } else if (routeVoice === '0' || routeVoice === 0) {
                            voiceName = toVoice(settings, part.stave, event);
                        } else {
                            voiceName = routeVoice;
                        }

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
                } else {
                    const part  = getOrCreatePart(tree.parts, toPartName(event));
                    const voiceName = event.type === 'chord' ? 'chord' : toVoice(settings, part.stave, event);

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
                } else {
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
    if (!bar.divisions) {
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
            duration:  bar.duration,
            divisor:   bar.divisor,
            divisions: bar.divisions
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
