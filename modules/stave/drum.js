
import slugify           from 'fn/slugify.js';
import { toDrumName, toNoteNumber } from 'midi/note.js';
import * as glyphs       from "../glyphs.js";
import config            from '../config.js';
import Stave             from './stave.js';
import { eq, gte, lte, lt, gt } from '../number/float.js';
import push              from '../object/push.js';
import { createAccents } from '../symbol/accent.js';
import { createLedges }  from '../symbol/ledge.js';
import { createNotes }   from '../symbol/note.js';
import { createRests }   from '../symbol/rest.js';
import { createBeam, closeBeam } from '../symbol/beam.js';
import { closeTuplet }   from '../symbol/tuplet.js';
import getStopBeat       from '../event/to-stop-beat.js';
import detectRhythm, { straighten, hasHoles } from '../rhythm.js';
import { P16, GR }       from '../constants.js';


const global  = globalThis || window;
const assign  = Object.assign;
const { abs, ceil, floor, min, max, pow, sqrt, round } = Math;
const symbols = [];
const notes   = [];
const STATE   = { notes: [] };

const rhythms = [];

function detectRhythms(events, n, beat, duration, divisions) {
    const startBeat = beat;
    const stopBeat  = beat + duration;

    rhythms.length = 0;
    let data;
    while (lt(stopBeat, beat, P16)) {
        // Detect next rhythm data
        data = detectRhythm(beat, stopBeat - beat, events, n + 1);
        // If there's no data the rest of the bar is empty
        if (!data) break;
        // Update beat to end of data
        beat = data.beat + data.duration;
    }

    return rhythms;
}


function toDrumSlug(number) {
    return slugify(toDrumName(number));
}

function toMaxStopBeat(n, event) {
    return max(n, getStopBeat(event));
}

export default class DrumStave extends Stave {
    type = 'drum';

    pitched = false;

    rows = [
        "",
        "",
        "",
        /* Splash, Chinese */
        toDrumSlug(55) + ' ' + toDrumSlug(52),
        /* Crash 2 */
        toDrumSlug(57),
        /* Crash 1 */
        toDrumSlug(49),
        /* Ride Cymbal, Ride Bell, Ride Cymbal 2 */
        toDrumSlug(51) + ' ' + toDrumSlug(53) + ' ' + toDrumSlug(59),
        /* Closed Hi-hat, Open Hi-hat - Top line */
        toDrumSlug(42) + ' ' + toDrumSlug(46),
        /* High tom, Cowbell */
        toDrumSlug(50) + ' ' + toDrumSlug(56),
        /* Low mid tom, High mid tom */
        toDrumSlug(48) + ' ' + toDrumSlug(47),
        /* Snare drum 1, Snare drum 2 */
        toDrumSlug(38) + ' ' + toDrumSlug(40),
        /* Low tom, Sticks, Hand clap, Tambourine */
        toDrumSlug(45) + ' ' + toDrumSlug(31) + ' ' + toDrumSlug(39) + ' ' + toDrumSlug(54),
        /* High floor tom */
        toDrumSlug(43),
        /* Low floor tom */
        toDrumSlug(41),
        /* Low bass drum, High bass drum */
        toDrumSlug(35) + ' ' + toDrumSlug(36),
        /* Bottom line */
        "",
        /* Pedal Hi-hat */
        toDrumSlug(44),
        "",
        "",
        "",
        "",
        "",
        ""
    ];

    #headnames = {
        31: 'headX',          // Sticks
        37: 'headCircle',     // Side Stick
        39: 'headX',          // Hand Clap
        42: 'headX',          // Closed Hi-Hat
        44: 'headX',          // Pedal Hi-Hat
        46: 'headCircleX',    // Open Hi-Hat
        49: 'headCircleX',    // Crash Cymbal 1
        51: 'headX',          // Ride Cymbal 1
        52: 'headCircleX',    // Chinese Cymbal
        53: 'headDiamond',    // Ride Bell
        54: 'headX',          // Tambourine
        55: 'headX',          // Splash Cymbal
        56: 'headTriangleUp', // Cowbell
        57: 'headCircleX',    // Crash Symbol 2
        58: 'headTriangleUp', // Vibraslap
        59: 'headX'           // Ride Cymbal 2
    };

    #ghostables = {
        31: true, // Sticks
        35: true, // Low bass drum
        36: true, // High bass drum
        37: true, // Side Stick
        38: true, // Snare drum 1
        40: true, // Snare drum 2
        41: true, // Low floor tom
        42: true, // Closed Hi-Hat
        43: true, // High floot tom
        45: true, // Low tom
        47: true, // Low mid tim
        48: true, // High mid tom
        50: true, // High tom
        56: true  // Cowbell
    };

    getNoteHTML(pitch, dynamic, duration) {
        const number    = toNoteNumber(pitch);
        const name      = this.#headnames[number];
        const ghostable = this.#ghostables[number];
        const html      = name ?
            `<span class="head" data-glyph="${ name }">${ glyphs[name] }</span>` :
            this.getHeadHTML(pitch, dynamic, duration) ;

        // Ghost note gets brackets
        return ghostable && dynamic < config.ghostThreshold ? `
            <span class="pre" data-glyph="headBracketLeft">${ glyphs.headBracketLeft }</span>
            ${ html }
            <span class="post" data-glyph="headBracketRight">${ glyphs.headBracketRight }</span>
            ` :
            html ;
    }

    parts = [{
        name:   'drums',
        beam:   'drums-beam',
        stemup: false
    }, {
        name:   'cymbals',
        beam:   'cymbals-beam',
        stemup: true
    }];

    getPart(number) {
        // Split drums stave into drums and cymbals parts
        return [35, 36, 37, 38, 40, 41, 43, 44, 45, 47, 48, 50].includes(toNoteNumber(number)) ?
            this.parts[0] :
            this.parts[1] ;
    }

    /**
    .getRow(pitch)
    Returns the row index of a given pitch name or number.
    **/
    getRow(part, n) {
        const pitch = typeof n === 'string' ? n : toDrumSlug(n) ;
        if (!pitch) throw new Error('Number not found for pitch ' + n);
        const i = this.rows.findIndex((row) => row.includes(pitch));
        //if (global.DEBUG && i === -1) throw new Error('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        if (i === -1) console.warn('Pitch "' + pitch + '" is not supported by stave ' + this.constructor.name);
        return i > -1 ? i : undefined ;
    }

    getSpelling(key, number) {
        return toDrumSlug(number);
    }

    createSignatureSymbols(key) {
        return [{
            type: 'clef',
            clef: this.type
        }];
    }

    yRatioToPitch(y) {
        const i = floor(y * this.rows.length);
        const j = i < 4 ? 4 : i > 17 ? 17 : i ;
        return this.pitches[j];
    }

    createSymbols(symbols, part, state, notes, beat, duration, settings, fn) {
        // Inside this fn beat is relative to bar
        const stave = this;

        // If duration is greater than a beamable note...
        if (gt(0.5, duration, P16)) {
            // ...and there is a beam, close it
            if (state.beam) {
                closeBeam(symbols, stave, part, state.beam);
                state.beam = undefined;
            }
        }
        // Otherwise make sure there is a beam
        else if (!state.beam) {
            state.beam = createBeam(part, beat);
        }

        // Insert heads
        const { key, beam, tuplet } = state;
        const noteSymbols = createNotes(stave, key, part, notes);

        // Empty note events, they have been consumed
        //notes.length = 0;

        if (!noteSymbols.length) return;

        // Create ledgers, accidentals and accents
        createLedges(symbols, stave, part, beat, noteSymbols);
        //createAccidentals(symbols, bar, part, accidentals, beat, noteSymbols);
        createAccents(symbols, stave, part, beat, noteSymbols, settings);

        // Push note symbols on to tuplet
        if (tuplet) push(tuplet, ...noteSymbols);

        // Assign beat, duration to note symbols and push into symbols
        let n = -1;
        while (noteSymbols[++n]) symbols.push(assign(noteSymbols[n], {
            beat,
            duration
        }));

        // Push note symbols on to beam
        if (beam) push(beam, ...noteSymbols);
        // Return note symbols
        return noteSymbols;
    }

    createRhythmSymbols(symbols, part, state, settings, data, startBeat, events, n) {
        const { duration, divisor, rhythm } = data;
        const division  = duration / divisor;
        const stave     = this;

        let { beat } = data;
        let event;
        notes.length = 0;
console.log('–––––––––––––––', JSON.stringify(data));
        // Get the binary representation of the rhythm
        const rh = data.rhythm.toString(2);
        // Loop through rhythm divisions, count from
        let i = -1;
        while (++i < divisor) {
            // Query the binary string from its end (the first slot) backwards
            if (rh[rh.length - 1 - i] === '1') {
                // Division has notes
console.log('✓', beat, duration, divisor, rh);
                // Fill notes with events playing during division, leaving event
                // as first event in the next division
                while ((event = events[++n]) && event[0] < beat + 0.5 * division) notes.push(event);
                --n;
if (!notes.length) throw new Error('THIS SHOULD NOT BE POSSIBLE');
                // Sort notes by pitch order, descending (ascending row order)
                //if (stave.pitched) notes.sort(byRow);
                // Impose max note duration, drum notation only has black notes
                const d = min(1, division);
                // Insert note symbols
                state.notes = this.createSymbols(symbols, part, state, notes, beat - startBeat, d, settings);
                // Insert rests where max note duration is less than division
                createRests(symbols, settings.restDurations, divisor, this, part, beat + d - startBeat, beat + division - startBeat);
                notes.length = 0;
            }
            else {
                // Division has no notes
console.log('✕', beat, duration, divisor, rh);
                // If this is the first slot in a duplet shorter than 4 beats...
                if (duration < 4 && divisor === 2 && i === 0) {
                    // HACK to back up and dot the previous note. There MUST be
                    // a better way.
                    let has;
                    let n = -1, note;
                    while (note = state.notes[++n]) {
                        if (note.beat === beat - duration - startBeat) {
                            note.duration = 1.5 * duration;
                            has = true;
                        }
                    }

                    let u = symbols.length;
                    if (has) while (symbols[--u] && symbols[u].beat >= beat - duration - startBeat) {
                        if (symbols[u].type === 'rest') symbols.splice(u, 1);
                    }
                }
                // If this is the second slot in a duplet shorter than 2 beats...
                else if (duration < 2 && divisor === 2 && i === 1) {
                    // ...give notes in the first slot full duration
                    let n = -1, note;
                    while (note = state.notes[++n]) note.duration = duration;
                    // ...and if duration longer than an eighth cancel any beam
                    if (duration > 0.5) {
                        closeBeam(symbols, stave, part, state.beam);
                        state.beam = undefined;
                    }
                }
                // If this is anything other than the first slot in a duplet
                // (which has already had rests laid up to it)...
                else if (divisor !== 2 || i !== 0) {
                    //createRests(symbols, settings.restDurations, divisor, this, part, beat - startBeat, beat + division - startBeat);
                    symbols.push({
                        type: 'rest',
                        beat:     beat - startBeat,
                        duration: division,
                        stave,
                        part
                    });
                }
            }

            // Update beat
            beat += division;
        }

        // Return beat
        return data.beat + data.duration;
    }

    createPartSymbols(key, accidentals, part, events, beat, duration, divisions, divisor, settings) {
        const startBeat = beat;
        const stopBeat  = beat + duration;
        const state     = STATE;
        const stave     = this;

        state.beam      = undefined;
        state.tuplet    = undefined;
        symbols.length  = 0;

        let n = -1;
        let event;

        // Ignore events that stop before beat, an extra cautious measure,
        // events array should already start with events at beat
        //while ((event = events[++n]) && lte(beat, event[0] + event[4], P16));
        while ((event = events[++n]) && lt(beat, event[0], P16));
        --n;

        let data, previousData;
        while (beat < stopBeat) {
            data = detectRhythm(beat, stopBeat - beat, events, n + 1, { maxDivision: 1 });
//console.log(beat, JSON.stringify(data));
            // If there's a beam and beat is on a division close it
            if (state.beam && divisions.find((division) => eq(beat - startBeat, division, P16))
                // or head started after a new division
                // || getDivision(divisions, , beat)
            ) {
                closeBeam(symbols, stave, part, state.beam);
                state.beam = undefined;
            }

            const { beam } = state;

            if (data) {
                switch (data.divisor) {
                    case 2:
                        // If we are rendering swing rhythms decide whether a duplet
                        // should render as a tuplet
                        if (data.rhythm === 1) {
                            break;
                        }
                        else if (data.duration === 1) {
                            if (!settings.swingAsStraight8ths) break;
                        }
                        else if (data.duration === 0.5) {
                            if (!settings.swingAsStraight16ths) break;
                        }
                        else {
                            break;
                        }

                    case 3:
                        // Convert eighth note swing rhythms to duplets
                        if (settings.swingAsStraight8ths && data.duration === 1) {
                            straighten(data);
                            break;
                        }

                        // Convert sixteenth note shuffle rhythms to duplets
                        if (settings.swingAsStraight16ths && data.duration === 0.5) {
                            straighten(data);
                            break;
                        }

                    default:
                        // Turn rhythm data into tuplet symbol
                        const tuplet = {
                            type: 'tuplet',
                            part,
                            beat:     data.beat - startBeat,
                            duration: data.duration,
                            divisor:  data.divisor,
                            rhythm:   data.rhythm,
                            stave:    this
                        };

                        symbols.push(tuplet);
                        state.tuplet = tuplet;

                        // Close beam if there any holes in tuplet
                        if (beam && hasHoles(data.divisor, data.rhythm)) {
                            closeBeam(symbols, stave, part, beam);
                            state.beam = undefined;
                        }
                }
            }

            // Create rests up to rhythm
            const b2 = data ?
                data.beat + (data.rhythm === 2 ? data.duration / 2 : 0) :
                stopBeat ;
            if (gt(beat, b2, P16)) createRests(symbols, settings.restDurations, divisor, this, part, beat - startBeat, b2 - startBeat);
            beat = b2;

            if (data) {
                beat = this.createRhythmSymbols(symbols, part, state, settings, data, startBeat, events, n);

                if (state.tuplet) {
                    closeTuplet(this, part, state.tuplet);
                    state.tuplet = undefined;

                    // If there's still a beam close it
                    if (state.beam) {
                        closeBeam(symbols, stave, part, state.beam);
                        state.beam = undefined;
                    }
                }

                n = data.index + data.count - 1;
            }
        }

        // If there's still a beam close it
        if (state.beam) {
            closeBeam(symbols, stave, part, state.beam);
            state.beam = undefined;
        }

        return symbols;
    }
}
