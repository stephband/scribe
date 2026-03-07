
import slugify      from 'fn/slugify.js';
import { toDrumName, toNoteNumber } from 'midi/note.js';
import * as glyphs  from "../glyphs.js";
import config       from '../config.js';
import Stave        from './stave.js';
import { eq, gte, lte, lt, gt } from '../number/float.js';
import detectRhythm, { straighten, hasHoles } from '../rhythm.js';
import createRests  from '../symbol/create-rests.js';


const global  = globalThis || window;
const symbols = [];

// When dealing with rounding errors we only really need beat grid-level
// precision, our display grid has 24 slots but we only need to compare the
// smallest possible note values, 32nd notes, or ±1/16 precision
const p16     = 1/16;
const p24     = 1/24;





function toDrumSlug(number) {
    return slugify(toDrumName(number));
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

    createPartSymbols(key, accidentals, part, events, beat, duration, divisions, divisor, settings) {
        const startBeat = beat;
        const stopBeat  = beat + duration;
        const notes     = [];

console.log('PART', part.name);

        let n = -1;
        let event, beam;

        symbols.length = 0;

        // Ignore events that stop before beat, an extra cautious measure,
        // events array should already start with events at beat
        while ((event = events[++n]) && lte(beat, event[0] + event[4], p16));
        --n;

        while (beat < stopBeat) {

console.log('RTM', 'startBeat', startBeat, 'stopBeat', stopBeat, 'beat', beat, 'n', n + 1, events);

            const data = detectRhythm(beat, stopBeat - beat, events, n + 1);

            // If there's a beam and beat is on a division close it
            if (beam && bar.divisions.find((division) => eq(beat - startBeat, division, p16))
                // or head started after a new division
                // || getDivision(bar.divisions, , beat)
            ) {
                closeBeam(symbols, stave, part, beam);
                beam = undefined;
            }

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
                    // Convert swing rhythms to straight rhythms
                    if (settings.swingAsStraight8ths  && data.duration === 1) {
                        straighten(data);
                        break;
                    }

                    if (settings.swingAsStraight16ths && data.duration === 0.5) {
                        straighten(data);
                        break;
                    }

                default:
                    // Turn rhythm data into tuplet symbol
                    data.type  = 'tuplet';
                    data.part  = part;
                    data.stave = this;
                    symbols.push(data);

                    // Close beam if there any holes in tuplet
                    if (beam && rhythmHasHoles(divisor, rhythm)) {
                        closeBeam(symbols, stave, part, beam);
                        beam = undefined;
                    }
            }

            // Create rests up to rhythm
            const b = data.beat + (data.rhythm === 2 ? data.duration / 2 : 0);
            if (gt(beat, b, p24)) createRests(symbols, settings.restDurations, divisor, this, part, beat, b);

console.log('RHYTHM!', data.divisor);

            n    = data.index + data.count - 1;
            beat = data.beat + data.duration;
        }

        // If there's still a beam close it
        if (beam) closeBeam(symbols, stave, part, beam);

        return symbols;
    }
}
