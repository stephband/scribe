
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
import { P24 }                   from './constants.js';
import { toDisplay, byDisplayOrder } from './display.js';
import log                       from './log.js';
import toStopBeat                from './event/to-stop-beat.js';


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
        stave:   Stave[display.staff],
        symbols: []
    }, display);

    insert(byDisplayOrder, bar, part);
    return part;
}

function toVoice(settings, stave, event) {
    if (event.type === 'chord') return 'chord';
    // TODO
    return '0';
}

function getVoice(settings, part, name) {
    let i = -1;
    while (part[++i]) if (part[i].name === name) {
        return part[i];
    }

    const voice = {
        type: 'voice',
        name
    };

    push(part, voice);
    return voice;
}

function quantiseNotesFromBuffers(settings, bar, buffers) {
    let name;
    for (name in buffers) {
        const buffer = buffers[name];
        if (!buffer.length) continue;

        const [partname, voicename] = name.split('.');
        const part = getPart(settings, bar, partname);

        if (voicename === 'chord') {
            if (buffer[0][0] >= bar.beat + bar.duration) continue;
            const voice = getVoice(settings, part, voicename);
            while (buffer[0] && buffer[0][0] < bar.beat + bar.duration) {
                push(voice, buffer.shift());
            }
        }
        else {
            const tuplets = quantise(bar.beat, bar.duration, buffer);
            if (!tuplets) continue;
            const voice = getVoice(settings, part, voicename);
            voice.tuplets = tuplets;
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

function metricQuantise(settings, sequence, parts, buffers, tree) {
//    const jsons  = [];

    const keyEvents = [];
    //let keyEvent;
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
            quantiseNotesFromBuffers(settings, bar, buffers);
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
                if (event[0] !== bar.beat) throw new Error(`Scribe "key" event at beat ${ event[0] } not at start of bar at beat ${ bar.beat }`);
                bar.keyEvent = event;
                bar.key = event[2];
                keyEvents.push(event);

                // Push copy of key event to parts already discovered
                let name;
                for (name in parts) parts[name].push(Event.from(event));
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
            case "chord": {
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

                // Push event into global part
                if (!parts[partName]) {
                    parts[partName] = keyEvents.map((e) => Event.from(e));
                }
                parts[partName].push(event);

                // Push event into part.voice buffer
                const name = partName + '.' + voiceName;
                if (!buffers[name]) buffers[name] = [];
                const buffer = buffers[name];
                buffer.push(event);
                break;
            }

            case "symbol":
                symbols.push({
                    type: 'symbol' + event[2],
                    stave
                });
                break;

//            case "text":
//                symbols.push({
//                    type: 'text',
//                    beat: event[0] - beat,
//                    // Does text cross into next bar? The symbol should not
//                    duration: event[0] + event[2] > beat + duration ?
//                        duration - event[0] + beat :
//                        event[2],
//                    value: event[3],
//                    event,
//                    stave
//                });
//                break;


            default:
                log('event type "' + event.type + '" ignored', '');
        }
    }

    // If no meter was declared this is a bar with indeterminate duration,
    // but we do need to know how much duration to render so get it from the
    // last event: TODO: check all events, the last may not be the longest
//    if (bar.beat + bar.duration > stopBeat) {
//        bar.duration = stopBeat - bar.beat;
//        duration = events.length ?
//            toStopBeat(events[events.length - 1]) :
//            1 ;
//    }

    // Create bars up to stop beat or while voices still has events
    while (stopBeat > bar.beat + bar.duration) {
        quantiseNotesFromBuffers(settings, bar, buffers);
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

    quantiseNotesFromBuffers(settings, bar, buffers);
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

function createTies(symbols, bar, voice, notes, noteSymbols, tolerance = 0.125) {
    // No notes to tie
    if (!notes.length) return;

    let n = -1;
    while (noteSymbols[++n]) {
        const { beat, event, pitch, duration, stemup } = noteSymbols[n];
        const b4 = toStopBeat(event) - bar.beat;

        // If there is less than a 32nd of this note left splice it out
        if (beat + duration > b4 - tolerance) {
            const i = notes.indexOf(event);
            notes.splice(i, 1);
        }
        // Otherwise leave it in and create a tie symbol
        else {
            symbols.push({
                type: 'tie',
                beat,
                pitch,
                duration,
                // TODO: We now handle this in CSS with .note + .tie selector
                stemup,
                voice,
                event
            });
        }
    }
}


// Symbolise

const rslashbass = /\/\{(\d{1,2})\}$/;

function substituteSpelling(settings, name) {
    if (name === 'C♭' && settings.spellChordRootCFlatAsB)  return 'B';
    if (name === 'E♯' && settings.spellChordRootESharpAsF) return 'F';
    if (name === 'B♯' && settings.spellChordRootBSharpAsC) return 'C';
    if (name === 'F♭' && settings.spellChordRootFFlatAsE)  return 'E';
    return name;
}

function symboliseChords(settings, bar, stave, symbols, voice) {
    let i = -1, event;
    while (event = voice[++i]) {
        const extension = event.extension;
        const root      = substituteSpelling(settings, event.rootSpelling);
        const name      = event.bassSpelling ?
            root + extension.replace(rslashbass, '/' + substituteSpelling(settings, event.bassSpelling)) :
            root + extension ;

        symbols.push({
            type: 'chord',
            beat: event[0] - bar.beat,
            name,
            // Does chord cross into next bar? The symbol should not
            duration: event[0] + event[4] > bar.beat + bar.duration ?
                bar.duration - event[0] + bar.beat :
                event[4],
            event,
            stave
        });
    }
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
    if (bar.keyEvent) {
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
        else {
            const notes = buffers[part.name + '.' + voice.name];
            const l = symbols.length;
            symboliseVoice(settings, bar, stave, part.key, notes, symbols, voice);
            if (symbols.length > l) hasNotes = true;
        }
    }

    // If no note/rest symbols were created for this part in this bar, fill with
    // a whole bar rest
    if (!hasNotes) symbols.push({
        type:     'rest',
        beat:     0,
        duration: bar.duration,
        whole:    true,
        stave
    });
}

function fillToBeat(settings, bar, stave, voice, accidentals, notes, symbols, beam, beat, stopBeat) {
    // 1. While there are active notes sounding before stopBeat, emit note symbols
    while (notes.length && beat < stopBeat) {
        const noteSymbols = stave.createDupletNoteSymbols(symbols, bar, voice, accidentals, notes, beat, stopBeat, settings);
        const duration    = noteSymbols[0].duration;
        // Splices finished notes out of `notes`, or emits a tie symbol & keeps sustained notes in `notes`
        createTies(symbols, bar, voice, notes, noteSymbols);
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

function fillTupletToBeat(settings, bar, stave, voice, accidentals, notes, symbols, tupletSymbol, beam, beat, stopBeat, division) {
    // 1. While there are active notes sounding before stopBeat, emit tuplet-division note symbols
    while (notes.length && beat < stopBeat - P24) {
        const noteSymbols = stave.createNoteSymbols(symbols, bar, voice, accidentals, notes, beat - bar.beat, division, settings);
        createTies(symbols, bar, voice, notes, noteSymbols, 0.5 * division);
        if (division < 0.5) {
            if (!beam) beam = createBeam(beat - bar.beat, voice);
            push(beam, ...noteSymbols);
        }
        push(tupletSymbol, ...noteSymbols);
        beat += division;
    }
    // 2. Fill any remaining tuplet divisions up to stopBeat with tuplet rests
    while (beat < stopBeat - P24) {
        symbols.push({
            type:     'rest',
            beat:     beat - bar.beat,
            duration: division,
            stave,
            voice
        });
        beat += division;
    }
    return beam;
}

function symboliseVoice(settings, bar, stave, key, notes, symbols, voice) {
    const { tuplets } = voice;
    const accidentals = accidentalsFromKey(key);

    let beat = bar.beat;
    let beam;
    let tuplet;

    // Loop over voice
    let n = -1;
    while (tuplet = tuplets[++n]) {
        const isTuplet = isTupletSymbol(settings, stave, tuplet);
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

            // Loop through tuplet events
            let i = -1, event;
            while (event = tuplet[++i]) {
                // When the next event is at a new beat, resolve everything up to event[0]
                if (event[0] > beat) {
                    beam = fillTupletToBeat(settings, bar, stave, voice, accidentals, notes, symbols, symbol, beam, beat, event[0], division);
                    beat = event[0];
                }
                // Add this event to the active chord at `beat`
                notes.push(event);
            }

            // Fill remaining divisions to end of tuplet
            const stopBeat = tuplet.beat + tuplet.duration;
            beam = fillTupletToBeat(settings, bar, stave, voice, accidentals, notes, symbols, symbol, beam, beat, stopBeat, division);

            // Close any beams at tuplet end
            if (beam) beam = closeBeam(symbols, stave, voice, beam);
            // Close tuplet
            closeTuplet(stave, voice, symbol);
            // Update beat
            beat = stopBeat;
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

export default async function createTree(sequence, settings) {
    settings = assign({ display: sequence.display }, config, settings);

    const events = sequence.events;
    const array  = [];

    // Create sequence object
    // Make iterator
    const iterator = new SequenceIterator(events, sequence.sequences, Transform.from(array), null, sequence);
    const parts    = {};
    const buffers  = {};
    const tree     = {};

    // 1. Sort out timing
    // Loop over iterator, extract events into bars, parts and voices, and
    // quantise events
    metricQuantise(settings, iterator, parts, buffers, tree);

    // 2. Sort out pitch
    // Assign note spelling per-part
    // TODO!!! settings.showAtConcertPitch
    settings.showAtConcertPitch = false;
    if (settings.showAtConcertPitch) {
        // Spell parts in concert
        await spell([].concat.apply([], values(parts)).sort(byBeat));
    }
    else {
        // Spell parts in part transposition
        await Promise.all(entries(parts).map(([name, events]) => {
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

