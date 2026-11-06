
import Event                  from 'sequence/modules/event.js';
import { accidentalsFromKey } from '../accidentals.js';
import { getDivisionBefore }  from '../bar/divisions.js';
import last                   from '../object/last.js';
import push                   from '../object/push.js';
import { createBeam, closeBeam } from '../symbol/beam.js';
import { createRests }        from '../symbol/rest.js';
import { closeTuplet }        from '../symbol/tuplet.js';
import { isTupletSymbol }     from '../tuplet.js';
import { getPart }            from './read.js';
import BarRepeater            from './bar-repeater.js';


const { isInteger } = Number;


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
    if (!tuplets) return;
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

export function symboliseBar(settings, parts, buffers, bar, detectors) {
    // Ensure all score parts exist on this bar
    let name;
    for (name in parts) {
        const part    = getPart(settings, bar, name);
        const repeats = detectors[name] || (detectors[name] = new BarRepeater(settings));
        symbolisePart(settings, buffers, bar, part, repeats);
    }
}

export function symbolisePart(settings, buffers, bar, part, repeats) {
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

    // Symbols from here on are the musical content of the bar, the stuff that
    // may be replaced by a bar repeat
    const start = symbols.length;

    // Loop over voices
    let n = -1;
    let hasNotes = false;
    let tied     = false;
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
            // Notes left in the buffer are tied in from the previous bar
            if (notes.length) tied = true;
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

    // Fingerprint the bar and replace it, and possibly preceding bars, with
    // bar repeats if this part is repeating itself
    repeats.push(bar, part, start, tied);
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

export function symboliseVoice(settings, bar, stave, key, notes, symbols, voice) {
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

export default function symbolise(settings, parts, buffers, tree) {
    // Per-part bar repeat detectors
    let detectors = {};

    // Loop over bars
    let n = -1;
    while (tree[++n]) {
        // Never repeat material from before a double bar line
        if (n && tree[n - 1].doubleBarLine) detectors = {};
        symboliseBar(settings, parts, buffers, tree[n], detectors);
    }

    return tree;
}
