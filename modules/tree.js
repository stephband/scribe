
import insert  from 'fn/insert.js';
import slugify from 'fn/slugify.js';
import Event   from 'sequence/modules/event.js';
import { getDivisions } from 'sequence/modules/event/meter.js';
import byBeat           from 'sequence/modules/events/by-priority.js';
import Transform        from 'sequence/modules/transform.js';
import SequenceIterator from 'sequence/modules/sequence-iterator.js';
import config                    from './config.js';
import Stave                     from './stave.js';
import { accidentalsFromKey }    from './accidentals.js';
import quantise                  from './quantise.js';
import speller                   from './speller.js';
import last                      from './object/last.js';
import push                      from './object/push.js';
import { getDivisionBefore }     from './bar/divisions.js';
import { createRests }           from './symbol/rest.js';
import { createBeam, closeBeam } from './symbol/beam.js';
import { closeTuplet }           from './symbol/tuplet.js';
import { isTupletSymbol }        from './tuplet.js';
import { toDisplay, byDisplayOrder } from './display.js';
import log                       from './log.js';
import toStopBeat                from './event/to-stop-beat.js';


const { isInteger } = Number;
const { assign, entries, values } = Object;


function toDisplayObject(settings, name) {
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

function toPartName(settings, event) {
    // Use the object name as the part name
    if (event.object && event.object.name) return event.object.name;

    // Use default sequence object default
    return 'default';
}

function getPart(settings, bar, name) {
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

function toVoice(settings, stave, event) {
    if (event.type === 'chord') return 'chord';
    if (event.type === 'text') return 'text';
    if (event.voice !== undefined) return event.voice + '';
    const voice = stave.getVoice ? stave.getVoice(event[2]) : stave.voices?.[0];
    return voice ? voice.name : '0';
}

function getVoice(settings, part, name) {
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

function metricQuantise(settings, sequence, parts, spellables, buffers, tree) {
//    const jsons  = [];

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
//            detectBarRepeats(bars, jsons, bar);
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

function spell(notes) {
    if (!notes.length) return;
    return speller.process(notes);
}


function updateBeamWithNoteSymbols(symbols, bar, stave, voice, beam, noteSymbols) {
    const { beat, duration } = noteSymbols[0];

    // If notes have a duration too long for a beam
    if (duration >= 1) {
        // ...and there is a beam, close it
        if (beam) beam = closeBeam(symbols, stave, voice, beam);
        return;
    }

    // If there is a beam and notes are in a new bar division
    if (beam && getDivisionBefore(bar.divisions, beam.beat) !== getDivisionBefore(bar.divisions, beat)) {
        beam = closeBeam(symbols, stave, voice, beam);
    }

    // Make sure there is a beam
    if (!beam) {
        beam = createBeam(beat, voice);
    }

    // Push note symbols on to it
    push(beam, ...noteSymbols);

    return beam;
}


// Symbolise

const rslashextension = /^\{(\d{1,2})\}/;

function substituteSpelling(settings, name) {
    if (name === 'C♭' && settings.spellChordRootCFlatAsB)  return 'B';
    if (name === 'E♯' && settings.spellChordRootESharpAsF) return 'F';
    if (name === 'B♯' && settings.spellChordRootBSharpAsC) return 'C';
    if (name === 'F♭' && settings.spellChordRootFFlatAsE)  return 'E';
    return name;
}

function symboliseChords(settings, bar, stave, symbols, voice) {
    const { tuplets } = voice;
    let t = -1, tuplet;
    while (tuplet = tuplets[++t]) {
        let i = -1, event;
        while (event = tuplet[++i]) {
            const extension = event.extension;
            const root      = substituteSpelling(settings, event.rootSpelling);
            const name      = event.bassSpelling ?
                extension.replace(rslashextension, root) + substituteSpelling(settings, event.bassSpelling) :
                root ? root + extension : (event.toChordSymbol ? event.toChordSymbol(bar.key) : event.root + extension);

            symbols.push({
                type: 'chord',
                beat: event[0] - bar.beat,
                name,
                // Does chord cross into next bar? The symbol should not
                duration: event[0] + event[4] > bar.beat + bar.duration ?
                    bar.duration - event[0] + bar.beat :
                    event[4],
                event,
                stave,
                voice
            });
        }
    }
}

function symboliseText(settings, bar, stave, symbols, voice) {
    const { tuplets } = voice;
    if (!tuplets) return;
    let t = -1, tuplet;
    while (tuplet = tuplets[++t]) {
        let i = -1, event;
        while (event = tuplet[++i]) {
            const eventDuration = event[2] !== undefined ? event[2] : (event.duration || 0);
            symbols.push({
                type: 'text',
                beat: event[0] - bar.beat,
                // Does text cross into next bar? The symbol should not
                duration: event[0] + eventDuration > bar.beat + bar.duration ?
                    bar.duration - event[0] + bar.beat :
                    eventDuration,
                value: event[3] !== undefined ? event[3] : (event.text !== undefined ? event.text : event.value),
                event,
                stave,
                voice
            });
        }
    }
}

function getNoteVoice(part) {
    let i = -1;
    while (part[++i]) {
        if (part[i].name !== 'chord' && part[i].name !== 'text') return part[i];
    }
    return undefined;
}

function symboliseTree(settings, parts, buffers, tree) {
    // Loop over bars
    let n = -1;
    while (tree[++n]) symboliseBar(settings, parts, buffers, tree[n]);
    return tree;
}

function symboliseBar(settings, parts, buffers, bar) {
    // Ensure all score parts exist on this bar
    let name;
    for (name in parts) {
        const part = getPart(settings, bar, name);
        symbolisePart(settings, buffers, bar, part);
    }
}

function symbolisePart(settings, buffers, bar, part) {
    const { stave, symbols } = part;

    const transpose = settings.showAtConcertPitch ?
        0 :
        part.transpose || 0 ;

    part.key = transpose ?
        Event.of(0, 'key', bar.key).transpose(transpose)[2] :
        bar.key ;

    // Push in key signature
    if (stave.pitched && bar.keyEvent) {
        const keyEvent = transpose ?
            Event.from(bar.keyEvent).transpose(transpose) :
            bar.keyEvent ;

        symbols.push.apply(symbols, stave.createKeySymbols(keyEvent));
    }

    // Push in time signature
    if (bar.meterEvent) symbols.push({
        type:        'timesig',
        beat:        0,
        numerator:   bar.meterEvent[3] === 1.5 ? bar.meterEvent[2] / 0.5 : bar.meterEvent[2] / bar.meterEvent[3],
        denominator: bar.meterEvent[3] === 1.5 ? 8 : 4 / bar.meterEvent[3],
        stave,
        event:       bar.meterEvent
    });

    // Loop over voices
    let n = -1;
    let hasNotes = false;
    while (part[++n]) {
        const voice = part[n];
        if (voice.name === 'chord') {
            symboliseChords(settings, bar, stave, symbols, voice);
        }
        else if (voice.name === 'text') {
            symboliseText(settings, bar, stave, symbols, voice);
        }
        else {
            const notes = buffers[part.name + '.' + voice.name];
            const l = symbols.length;
            symboliseVoice(settings, bar, stave, part.key, notes, symbols, voice);
            if (symbols.length > l) hasNotes = true;
        }
    }

    // If no note/rest symbols were created for this part in this bar, fill with
    // a whole bar rest
    if (!hasNotes) {
        if (stave.type === 'grand') {
            symbols.push({
                type:     'rest',
                beat:     0,
                duration: bar.duration,
                whole:    true,
                stave,
                voice:    stave.voices[0]
            }, {
                type:     'rest',
                beat:     0,
                duration: bar.duration,
                whole:    true,
                stave,
                voice:    stave.voices[1]
            });
        }
        else {
            symbols.push({
                type:     'rest',
                beat:     0,
                duration: bar.duration,
                whole:    true,
                stave,
                voice:    getNoteVoice(part) || stave.voices[0]
            });
        }
    }
}

function fillToBeat(settings, bar, stave, voice, accidentals, notes, symbols, beam, beat, stopBeat) {
    // 1. While there are active notes sounding before stopBeat, emit note symbols
    while (notes.length && beat < stopBeat) {
        const noteSymbols = stave.createDupletNoteSymbols(symbols, bar, voice, accidentals, notes, beat, stopBeat, settings);
        const duration    = noteSymbols[0].duration;
        beam = updateBeamWithNoteSymbols(symbols, bar, stave, voice, beam, noteSymbols);
        beat += duration;
    }
    // 2. If active notes finished before stopBeat (or there were none), fill the gap with rests
    const gap = stopBeat - beat;
    if (gap > 0) {
        if (beam && gap > last(beam).duration) {
            beam = closeBeam(symbols, stave, voice, beam);
        }
        createRests(symbols, settings.restDurations, bar.divisions, stave, voice, beat - bar.beat, stopBeat - bar.beat);
    }
    return beam;
}

function symboliseVoice(settings, bar, stave, key, notes, symbols, voice) {
    const { divisor } = bar;
    const { tuplets } = voice;
    const swing       = settings.swingAsStraight8ths  && isInteger(divisor);
    const shuffle     = settings.swingAsStraight16ths && isInteger(divisor * 2);
    const accidentals = accidentalsFromKey(key);

    let beat = bar.beat;
    let beam;
    let tuplet;

    // Loop over voice
    let n = -1;
    while (tuplet = tuplets[++n]) {
        const isTuplet = isTupletSymbol(swing, shuffle, tuplet);
        if (isTuplet) {
            // Fill up to start of tuplet and close any preceding beam
            beam = fillToBeat(settings, bar, stave, voice, accidentals, notes, symbols, beam, beat, tuplet.beat);
            if (beam) beam = closeBeam(symbols, stave, voice, beam);
            beat = tuplet.beat;

            const division = tuplet.duration / tuplet.divisor;
            const symbol = {
                type:     'tuplet',
                beat:     tuplet.beat - bar.beat,
                duration: tuplet.duration,
                divisor:  tuplet.divisor,
                rhythm:   tuplet.rhythm,
                stave,
                voice
            };
            symbols.push(symbol);

            // Deterministic slot loop over tuplet divisions
            let i = 0;
            for (let s = 0; s < tuplet.divisor; ++s) {
                const slotBeat = tuplet.beat + s * division;

                // Collect all events belonging to slot s
                while (tuplet[i] && tuplet[i].slot === s) {
                    notes.push(tuplet[i++]);
                }

                if (notes.length) {
                    const noteSymbols = stave.createNoteSymbols(symbols, bar, voice, accidentals, notes, slotBeat - bar.beat, division, settings, false, 0.5 * division);
                    if (division < 0.5) {
                        if (!beam) beam = createBeam(slotBeat - bar.beat, voice);
                        push(beam, ...noteSymbols);
                    }
                    push(symbol, ...noteSymbols);
                }
                else {
                    symbols.push({
                        type:     'rest',
                        beat:     slotBeat - bar.beat,
                        duration: division,
                        stave,
                        voice
                    });
                }
            }

            // Close any beams at tuplet end
            if (beam) beam = closeBeam(symbols, stave, voice, beam);
            // Close tuplet
            closeTuplet(stave, voice, symbol);
            // Update beat
            beat = tuplet.beat + tuplet.duration;
        }
        else {
            let i = -1, event;
            while (event = tuplet[++i]) {
                // When the next event is at a new beat, resolve everything up to event[0]
                if (event[0] > beat) {
                    beam = fillToBeat(settings, bar, stave, voice, accidentals, notes, symbols, beam, beat, event[0]);
                    beat = event[0];
                }
                // Add this event to the active chord at `beat`
                notes.push(event);
            }
        }
    }

    beam = fillToBeat(settings, bar, stave, voice, accidentals, notes, symbols, beam, beat, bar.beat + bar.duration);
    if (beam) beam = closeBeam(symbols, stave, voice, beam);
    if (notes.length) console.log(notes.length + ' notes tied over to next bar');
}

export default async function createTree(sequence, settings = {}, transpose = 0, displace = 0, duration = Infinity) {
    settings = assign({ display: sequence.display }, config, settings);

    // Make transforms list
    const array = [];
    if (transpose) array.push(Transform.TYPES.transpose, transpose);
    if (displace)  array.push(Transform.TYPES.displace,  displace);
    const transform = array.length ?
        Transform.from(array) :
        Transform.identity ;

    const iterator   = new SequenceIterator(sequence, transform, 0, duration);
    const parts      = {};
    const spellables = {};
    const buffers    = {};
    const tree       = {};

    // 1. Sort out timing
    // Loop over iterator, extract events into bars, parts and voices, and
    // quantise events
    metricQuantise(settings, iterator, parts, spellables, buffers, tree);

    // 2. Sort out pitch
    // Assign note spelling per-part
    if (settings.showAtConcertPitch) {
        // Spell parts in concert
        await spell([].concat.apply([], values(spellables)).sort(byBeat));
    }
    else {
        // Spell parts in part transposition
        await Promise.all(entries(spellables).map(([name, events]) => {
            const display   = toDisplayObject(settings, name);
            const transform = Transform.of('transpose', display.transpose || 0);
            events.forEach((event) => transform.apply(event));
            return spell(events);
        }));
    }

    // 3. Loop over bars, parts, voices and populate with symbols
    symboliseTree(settings, parts, buffers, tree);

    // Return tree object
    return tree;
}

