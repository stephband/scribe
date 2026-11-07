
import slugify                from 'fn/slugify.js';
import Event                  from 'sequence/modules/event.js';
import { getDivisions }       from 'sequence/modules/event/meter.js';
import Stave                  from '../stave.js';
import { toDisplay, byPartOrder } from '../display.js';
import log                    from '../log.js';
import toStopBeat             from '../event/to-stop-beat.js';


const { assign, values } = Object;


function toDisplayObject(settings, name) {
    const slug = slugify(name);

    if (slug === 'default' && settings.display) {
        if (typeof settings.display === 'string') {
            if (!Stave[settings.display]) throw new Error(`Sequence display must be a display object or a stave type string`);
            return { staff: settings.display, transpose: 0 };
        }

        return settings.display;
    }

    return toDisplay(slug);
}

function toPartName(settings, event) {
    if (event.object && event.object.name) return event.object.name;
    return 'default';
}

function toVoiceName(stave, voiceKey) {
    if (stave && stave.type === 'grand') {
        if (voiceKey === 0 || voiceKey === '0') return '0';
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

function getRoute(event, routes) {
    if (!routes || routes.size === 0) return undefined;
    const id = event.object && event.object.id !== undefined ? event.object.id : 0;
    return routes.get(id);
}

function toVoice(settings, stave, event) {
    if (event.type === 'chord') return 'chord';
    if (event.type === 'text') return 'text';
    if (event.voice !== undefined) return event.voice + '';
    const voice = stave.getVoice ? stave.getVoice(event[2]) : stave.voices?.[0];
    return voice ? voice.name : '0';
}

function getOrCreatePart(settings, parts, keyEvents, name) {
    if (parts[name]) return parts[name];

    const display = toDisplayObject(settings, name);
    const stave   = Stave[display.staff || display.clef];

    const part = {
        name,
        display,
        stave,
        spellables: undefined,
        buffers:    {}
    };

    parts[name] = part;
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

export default function read(settings, sequence) {
    const tree       = [];
    const parts      = {};
    const spellables = [];
    const keyEvents  = [];
    const routes     = new Map();

    // If settings.parts is an array, initialize parts and routes
    if (settings.parts) {
        let p = -1;
        let partItem;
        while (partItem = settings.parts[++p]) {
            const name    = partItem.name || partItem.staff || 'default';
            const display = {
                staff:     partItem.staff,
                clef:      partItem.clef,
                transpose: partItem.transpose || 0
            };
            const stave   = Stave[display.staff || display.clef];
            if (!stave) {
                throw new Error(`Scribe parts staff "${ display.staff || display.clef }" not found`);
            }

            const part = {
                name,
                display,
                stave,
                spellables: undefined,
                buffers:    {}
            };
            parts[name] = part;

            const voices = partItem.voices || { 0: 0 };
            for (const [voiceKey, sourceId] of Object.entries(voices)) {
                const voiceName = toVoiceName(stave, voiceKey);
                routes.set(sourceId, { part, voiceName });
                routes.set(sourceId + '', { part, voiceName });
                if (!isNaN(sourceId)) {
                    routes.set(Number(sourceId), { part, voiceName });
                }
            }
        }
    }

    // Guarantee the render of at least 1 bar
    let stopBeat = 1;
    let event;
    let sequenceEvent;
    let bar = {
        type:      'bar',
        count:     1,
        beat:      0,
        key:       0,
        duration:  Infinity,
        divisor:   0
    };

    // Extract events from sequence iterator and divide them into voices
    for (event of sequence) {
        // While event time is beyond end of bar advance bar state
        while (event[0] >= bar.beat + bar.duration) {
            if (flagEndBar(bar, sequenceEvent)) sequenceEvent = undefined;
            tree.push(bar);

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
                if (keyEvents.length && keyEvents[keyEvents.length - 1][2] === event[2]) {
                    break;
                }
                if (event[0] !== bar.beat) throw new Error(`Scribe "key" event at beat ${ event[0] } not at start of bar at beat ${ bar.beat }`);
                bar.keyEvent = event;
                bar.key = event[2];
                keyEvents.push(event);

                // Push copy of key event to parts already discovered
                let name;
                for (name in parts) {
                    if (parts[name].spellables) {
                        parts[name].spellables.push(Event.from(event));
                    }
                }
                break;
            }

            case "meter":
                if (event[0] !== bar.beat) throw new Error(`Scribe "meter" event at beat ${ event[0] } not at start of bar at beat ${ bar.beat }`);
                bar.meterEvent = event;
                bar.duration   = event[2];
                bar.divisor    = event[3];
                bar.divisions  = getDivisions(bar.duration, bar.divisor);
                break;

            case "note":
            case "chord": {
                const endBeat = toStopBeat(event);
                if (endBeat > stopBeat) stopBeat = endBeat;

                const route = getRoute(event, routes);
                const part  = route ? route.part : getOrCreatePart(settings, parts, keyEvents, toPartName(settings, event));
                let voiceName;

                if (event.type === 'chord') {
                    voiceName = 'chord';
                } else if (route) {
                    if (part.stave.type === 'grand' && (route.voiceName === '0' || route.voiceName === 0)) {
                        // Voice 0 on a grand staff distributes to voices 1 (rh) and 2 (lh) by splitting
                        const voice = part.stave.getVoice ? part.stave.getVoice(event[2]) : undefined;
                        voiceName = voice ? voice.name : 'rh';
                    } else {
                        voiceName = route.voiceName;
                    }
                } else {
                    voiceName = toVoice(settings, part.stave, event);
                }

                event.part  = part.name;
                event.voice = voiceName;
                event.stave = part.stave;

                // Push event into spellables if pitched stave
                if (part.stave.pitched) {
                    if (!part.spellables) part.spellables = keyEvents.map((e) => Event.from(e));
                    part.spellables.push(event);
                    spellables.push(event);
                }

                // Push event into voice buffer
                const voiceBuffer = part.buffers[voiceName] || (part.buffers[voiceName] = []);
                voiceBuffer.push(event);
                break;
            }

            case "text": {
                const endBeat = toStopBeat(event);
                if (endBeat > stopBeat) stopBeat = endBeat;

                const route     = getRoute(event, routes);
                const part      = route ? route.part : getOrCreatePart(settings, parts, keyEvents, toPartName(settings, event));
                const voiceName = 'text';

                event.part  = part.name;
                event.voice = voiceName;
                event.stave = part.stave;

                // Push event into voice buffer
                const voiceBuffer = part.buffers[voiceName] || (part.buffers[voiceName] = []);
                voiceBuffer.push(event);
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
        tree.push(bar);

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

    tree.push(bar);

    // Sort parts once by display order, or preserve parts order if parts was provided
    const orderedParts = settings.parts ?
        settings.parts.map((item) => parts[item.name || item.staff || 'default']).filter(Boolean) :
        values(parts).sort(byPartOrder);

    // Assign part shells to each bar by order number
    let b = -1, barItem;
    while (barItem = tree[++b]) {
        barItem.length = orderedParts.length;
        let p = -1, partInfo;
        while (partInfo = orderedParts[++p]) {
            barItem[p] = assign({
                type:    'part',
                name:    partInfo.name,
                stave:   partInfo.stave,
                symbols: []
            }, partInfo.display);
        }
    }

    return { tree, parts: orderedParts, spellables };
}
