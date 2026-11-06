
import insert                 from 'fn/insert.js';
import slugify                from 'fn/slugify.js';
import Event                  from 'sequence/modules/event.js';
import { getDivisions }       from 'sequence/modules/event/meter.js';
import Stave                  from '../stave.js';
import quantise               from '../quantise.js';
import push                   from '../object/push.js';
import { toDisplay, byDisplayOrder } from '../display.js';
import log                    from '../log.js';
import toStopBeat             from '../event/to-stop-beat.js';


const { assign } = Object;


export function toDisplayObject(settings, name) {
    const slug = slugify(name);

    if (slug === 'default' && settings.display) {
        if (typeof settings.display === 'string') {
            if (!Stave[settings.display]) throw new Error(`Sequence display must be a display object or a stave type string`);
            return { staff: settings.display, transpose: 0 };
        }

        return settings.display ;
    }

    return toDisplay(slug);
}

export function toPartName(settings, event) {
    // Use the object name as the part name
    if (event.object && event.object.name) return event.object.name;

    // Use default sequence object default
    return 'default';
}

export function getPart(settings, bar, name) {
    //const index = toPartIndex(settings, name);
    let i = -1;
    while (bar[++i]) if (bar[i].name === name) {
        return bar[i];
    }

    const display = toDisplayObject(settings, name);
    const part = assign({
        type:    'part',
        name,
        stave:   Stave[display.staff || display.clef],
        symbols: []
    }, display);

    insert(byDisplayOrder, bar, part);
    return part;
}

export function toVoice(settings, stave, event) {
    if (event.type === 'chord') return 'chord';
    if (event.type === 'text') return 'text';
    if (event.voice !== undefined) return event.voice + '';
    const voice = stave.getVoice ? stave.getVoice(event[2]) : stave.voices?.[0];
    return voice ? voice.name : '0';
}

export function getVoice(settings, part, name) {
    let i = -1;
    while (part[++i]) if (part[i].name === name) {
        return part[i];
    }

    const staveVoice = part.stave && part.stave.voices && part.stave.voices.find((v) => v.name === name);
    const voice = assign({
        type: 'voice',
        name
    }, staveVoice);

    push(part, voice);
    return voice;
}

function quantiseNotesFromBuffers(settings, bar, buffers, drifts) {
    let name;
    for (name in buffers) {
        const buffer = buffers[name];
        // There is nothing to put in this bar
        if (!buffer.length) {
            // Reset drift to 0
            drifts[name] = 0;
            // Move to next buffer
            continue;
        }

        const [partname, voicename] = name.split('.');
        const part  = getPart(settings, bar, partname);
        const drift = drifts[name] || 0;

        const tuplets = voicename === 'chord' ?
            quantise(settings, bar, buffer, 1/3, [2, 3], drift) :
            quantise(settings, bar, buffer, undefined, undefined, drift) ;

        if (!tuplets) continue;
        const voice = getVoice(settings, part, voicename);
        voice.tuplets = tuplets;

        if (tuplets.length) {
            drifts[name] = tuplets[tuplets.length - 1].driftOut;
        }
    }
}

// Flags bar with a double bar line if the top-level sequence event stops
// inside it. Returns true if bar was flagged.
function flagEndBar(bar, sequenceEvent) {
    if (!sequenceEvent) return false;
    const stopBeat = toStopBeat(sequenceEvent);
    if (stopBeat > bar.beat && stopBeat <= bar.beat + bar.duration) {
        bar.doubleBarLine = true;
        return true;
    }
    return false;
}

export default function read(settings, sequence, parts, spellables, buffers, tree) {
    const drifts    = {};
    const keyEvents = [];
    // Guarantee the render of at least 1 bar
    let stopBeat = 1;
    let event;
    let sequenceEvent;
    let count = 0;

    let bar = {
        type:     'bar',
        count:    ++count,
        beat:     0,
        key:      0,
        duration: Infinity,
        divisor:  0
    };

    // Extract events from sequence iterator and divide them into voices
    for (event of sequence) {
        // While event time is beyond end of bar create bar from current state
        while (event[0] >= bar.beat + bar.duration) {
            quantiseNotesFromBuffers(settings, bar, buffers, drifts);
            if (flagEndBar(bar, sequenceEvent)) sequenceEvent = undefined;
            push(tree, bar);

            // Start new bar
            bar = {
                type:      'bar',
                count:     ++count,
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
                // If this sequence event comes from the top level sequence
                // flag a double bar line at the end of the sequence
                if (event.events === sequence.events) sequenceEvent = event;

                // Extend stop beat
                stopBeat = stopBeat < toStopBeat(event) ?
                    toStopBeat(event) :
                    stopBeat ;

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
                for (name in spellables) spellables[name].push(Event.from(event));
                break;
            }

            case "meter":
                if (event[0] !== bar.beat) throw new Error(`Scribe "meter" event at beat ${ event[0] } not at start of bar at beat ${ bar.beat }`);
                // Store the event on the bar, timesig symbols are created per
                // part in symbolisePart()
                bar.meterEvent = event;
                // Meter events set bar meter
                bar.duration  = event[2];
                bar.divisor   = event[3];
                bar.divisions = getDivisions(bar.duration, bar.divisor);
                break;

            case "note":
            case "chord":
            case "text": {
                // Extend stop beat
                const endBeat = toStopBeat(event);
                if (endBeat > stopBeat) stopBeat = endBeat;

                const partName  = toPartName(settings, event);
                const part      = getPart(settings, bar, partName);
                const voiceName = toVoice(settings, part.stave, event);
                //const staveType = toStave(settings, event.part);
                // Push
//                pushEventToPart(stave, key, parts, event);
                // If part is pitched
//                if (stave.pitched) {
//                    // Push note event to spellables
//                    if (!spellables[part]) spellables[part] = keyEvent ? [keyEvent] : [];
//                    spellables[part].push(event);
//                    spellables['*'].push(event);
//                }

                event.part  = partName;
                event.voice = voiceName;
                event.stave = part.stave;

                parts[partName] = true;

                // Push event into global part only if stave is pitched
                if (part.stave.pitched && event.type !== 'text') {
                    if (!spellables[partName]) {
                        spellables[partName] = keyEvents.map((e) => Event.from(e));
                    }
                    spellables[partName].push(event);
                }
                else if (event.type === 'note') {
                    // Delegate spelling directly to unpitched stave
                    event.pitchSpelling = part.stave.getSpelling(event[2]);
                }

                // Push event into part.voice buffer
                const name = partName + '.' + voiceName;
                if (!buffers[name]) buffers[name] = [];
                const buffer = buffers[name];
                buffer.push(event);
                break;
            }

            default:
                log('event type "' + event.type + '" ignored', '');
        }
    }

    // If no meter was declared this is a bar with indeterminate duration.
    // Set duration to contain all notes in a single bar.
    if (!bar.divisions) {
        bar.duration  = stopBeat - bar.beat;
        bar.divisor   = 1;
        bar.divisions = [bar.duration];
    }

    // Create bars up to stop beat or while voices still has events
    while (stopBeat > bar.beat + bar.duration) {
        quantiseNotesFromBuffers(settings, bar, buffers, drifts);
        if (flagEndBar(bar, sequenceEvent)) sequenceEvent = undefined;
        push(tree, bar);

        // Start new bar
        bar = {
            type:      'bar',
            count:     ++count,
            beat:      bar.beat + bar.duration,
            key:       bar.key,
            duration:  bar.duration,
            divisor:   bar.divisor,
            divisions: bar.divisions
        };
    }

    quantiseNotesFromBuffers(settings, bar, buffers, drifts);
    push(tree, bar);

    // Always render last bar with a double bar line
    bar.doubleBarLine = true;
    return tree;
}
