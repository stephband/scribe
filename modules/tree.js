
import { getDivisions } from 'sequence/modules/event/meter.js';
import Transform        from 'sequence/modules/transform.js';
import SequenceIterator from 'sequence/modules/sequence-iterator.js';
import config from './config.js';
import Stave  from './stave.js';
import { accidentalsFromKey } from './accidentals.js';
import quantise from './quantise.js';
import speller  from './speller.js';
import last                      from './object/last.js';
import push                      from './object/push.js';
import { getDivisionBefore }     from './bar/divisions.js';
import { createRests }           from './symbol/rest.js';
import { createBeam, closeBeam } from './symbol/beam.js';
import { closeTuplet }           from './symbol/tuplet.js';
import { isTupletSymbol }        from './tuplet.js';
import { P24 }                   from './constants.js';
import toStopBeat                from './event/to-stop-beat.js';


const { values } = Object;


function toStave(settings, id) {
    // TODO
    return Stave.treble;
}

function toPart(settings, event) {
    // TODO
    return event.target || 0;
}

function toPartIndex(settings, name) {
    // TODO
    return 0;
}

function getPart(settings, bar, name) {
    const index = toPartIndex(settings, name);
    return bar[index] || (bar[index] = {
        type:    'part',
        stave:   toStave(settings, name),
        key:     bar.key,
        symbols: []
    });
}

function toVoice(settings, stave, event) {
    // TODO
    return 0;
}

function toVoiceIndex(settings, name) {
    // TODO
    return 0;
}

function getVoice(settings, part, name) {
    const index = toVoiceIndex(settings, name);
    return part[index] || (part[index] = {
        type: 'voice',
        name
    });
}

function quantiseNotesFromBuffers(settings, bar, buffers) {
    let name;
    for (name in buffers) {
        const [partname, voicename] = name.split('.');
        const part = getPart(settings, bar, partname);
        const tuplets = quantise(bar.beat, bar.duration, buffers[name]);
        if (!tuplets) continue;
        const voice = getVoice(settings, part, voicename);
        voice.tuplets = tuplets;
    }
}

function metricQuantise(settings, sequence, parts, buffers, tree) {
//    const events = [];
//    const bars   = [];
//    const jsons  = [];

//    let keyEvent;
    // Guarantee the render of at least 1 bar
    let stopBeat = 1;
//    let symbols  = [];
    let event;
//    let sequenceEvent;

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
        // Store all events for the key analyser: we know event is an object at
        // this point, as the iterator emits transformed objects, so use the
        // event to store information scribe needs for analysis
//        event.scribeIndex  = events.length;
//        event.scribeEvents = events;
        // Add to events
//        events.push(event);

        // While event time is beyond end of bar create bar from current state
        while (event[0] >= bar.beat + bar.duration) {
            quantiseNotesFromBuffers(settings, bar, buffers);
            push(tree, bar);

//            const bar = createBar(bars.length + 1, beat, duration, divisor, stave, key, symbols, parts, sequenceEvent, settings);
//            detectBarRepeats(bars, jsons, bar);

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

//            beat = beat + duration;
//            symbols = [];
//            if (bar.doubleBarLine) sequenceEvent = undefined;
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
                if (event[0] !== bar.beat) throw new Error(`Scribe "key" event at beat ${ event[0] } not at start of bar at beat ${ beat }`);
                bar.key = event[2];
//                keyEvent = event;
                // TODO: Key is global and added to the side bar, we need to think about
                // how to make key signature changes
//                symbols.push.apply(symbols, stave.createKeySymbols(event));
                // Push key event to spellables
//                let part;
//                for (part in spellables) spellables[part].push(event);
                break;
            }

            case "meter":
                if (event[0] !== bar.beat) throw new Error(`Scribe "meter" event at beat ${ event[0] } not at start of bar at beat ${ beat }`);
                // Meter events set bar meter
                bar.duration  = event[2];
                bar.divisor   = event[3];
                bar.divisions = getDivisions(bar.duration, bar.divisor);
//                symbols.push({
//                    type:        'timesig',
//                    beat:        0,
//                    numerator:   event[3] === 1.5 ? event[2] / 0.5 : event[2] / event[3],
//                    denominator: event[3] === 1.5 ? 8 : 4 / event[3],
//                    stave,
//                    event
//                });
                break;

            case "note": {
                const partName  = toPart(settings, event);
                const stave     = toStave(settings, partName);
                const voiceName = toVoice(settings, stave, event);
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
                event.stave = stave;

                // Push note into global part
                if (!parts[partName]) parts[partName] = [];
                parts[partName].push(event);

                // Create bar part object
                const part = getPart(settings, bar, partName);

                // Push note into part.voice buffer
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

//            case "chord": {
//                //const keyWeights = keyWeightsForEvent(events, events.length - 1, key);
//                //const keyNumber  = chooseKeyFromWeights(keyWeights);
//                const keyNumber  = 0;
//                const extension  = event.extension;
//                const slashbass  = rslashbass.exec(extension);
//
//                let root, bass, name;
//
//                if (slashbass) {
//                    const n = parseInt(slashbass[1], 10);
//                    root = stave.getSpelling(mod12(event[2] - n), keyNumber);
//                    bass = stave.getSpelling(event[2], keyNumber);
//                    name = substituteSpelling(settings, root) + extension.replace(rslashbass, '/' + substituteSpelling(settings, bass));
//                }
//                else {
//                    root = stave.getSpelling(event[2], keyNumber);
//                    name = substituteSpelling(settings, root) + extension;
//                }
//
//                symbols.push({
//                    type: 'chord',
//                    beat: event[0] - beat,
//                    name,
//                    // Does chord cross into next bar? The symbol should not
//                    duration: event[0] + event[4] > beat + duration ?
//                        duration - event[0] + beat :
//                        event[4],
//                    event,
//                    stave
//                });
//
//                break;
//            }

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
//    bar.doubleBarLine = true;
    return tree;
}

function spell(notes) {
    if (!notes.length) return;
    return speller.process(notes);
}


function updateBeamWithNoteSymbols(symbols, bar, stave, part, beam, noteSymbols) {
    const { beat, duration } = noteSymbols[0];

    // If notes have a duration too long for a beam
    if (duration >= 1) {
        // ...and there is a beam, close it
        if (beam) beam = closeBeam(symbols, stave, part, beam);
        return;
    }

    // If there is a beam and notes are in a new bar division
    if (beam && getDivisionBefore(bar.divisions, beam.beat) !== getDivisionBefore(bar.divisions, beat)) {
        beam = closeBeam(symbols, stave, part, beam);
    }

    // Make sure there is a beam
    if (!beam) {
        beam = createBeam(part, beat);
    }

    // Push note symbols on to it
    push(beam, ...noteSymbols);

    return beam;
}

function createTies(symbols, bar, part, notes, noteSymbols, tolerance = 0.125) {
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
                part,
                event
            });
        }
    }
}


// Symbolise

function symboliseTree(settings, bars, buffers) {
    // Loop over bars
    let n = -1;
    while (bars[++n]) symboliseBar(settings, buffers, bars[n]);
    return bars;
}

function symboliseBar(settings, buffers, bar) {
console.log('Bar', bar.count, '-------------------------------------');
    // Loop over parts
    let n = -1;
    while (bar[++n]) symbolisePart(settings, buffers, bar, bar[n], n);
}

function symbolisePart(settings, buffers, bar, part, name) {
    const { stave, key, symbols } = part;
    // Loop over voices
    let n = -1;
    let notes;
    while (part[++n]) {
        notes = buffers[name + '.' + n];
        symboliseVoice(settings, bar, part, stave, key, notes, symbols, part[n]);
    }
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
            if (!beam) beam = createBeam(voice, beat - bar.beat);
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
            part:     voice
        });
        beat += division;
    }
    return beam;
}

function symboliseVoice(settings, bar, part, stave, key, notes, symbols, voice) {
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

export default async function createTree(sequence, settings = config) {
    const events = sequence.events;
    const array  = [];

    // Create sequence object
    // Make iterator
    const iterator = new SequenceIterator(events, sequence.sequences, Transform.from(array));
    const parts    = {};
    const buffers  = {};
    const tree     = {};

    // 1. Sort out timing
    // Loop over iterator, extract events into bars, parts and voices, and
    // quantise events
    metricQuantise(settings, iterator, parts, buffers, tree);

    // 2. Sort out pitch
    // Assign note spelling per-part
    await Promise.all(values(parts).map(spell));

    // 3. Loop over bars, parts, voices and populate with symbols
    symboliseTree(settings, tree, buffers);

    // Return tree object
    return tree;
}

