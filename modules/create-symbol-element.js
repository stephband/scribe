import get from '../lib/fn/modules/get.js';
import overload from '../lib/fn/modules/overload.js';
import create from '../lib/dom/modules/create.js';
import * as glyphs from "./glyphs.js";
import { chordGlyphs } from "./glyphs.js";

const abs = Math.abs;


/* Event ids */

const $id = Symbol('scribe-id');

//const eventMap = {};
let id = 0;

export function identify(event) {
    if (event[$id]) return event[$id];
    event[$id] = (++id + '');
    //eventMap[id] = event;
    return event[$id];
}

export function findEvent(events, id) {
    return events.find((event) => (event[$id] === id));
}


/* Beams */

const beamThickness = 1.1;

function renderBeam(range, stems, beam) {
    return `<path class="beam-path-16th beam-path" d="
        M${beam[0]},              ${(-range * beam[0] / (stems.length - 1)) - 0.5 * beamThickness}
        L${beam[beam.length - 1]},${(-range * beam[beam.length - 1] / (stems.length - 1)) - 0.5 * beamThickness}
        L${beam[beam.length - 1]},${(-range * beam[beam.length - 1] / (stems.length - 1)) + 0.5 * beamThickness}
        L${beam[0]},              ${(-range * beam[0] / (stems.length - 1)) + 0.5 * beamThickness}
    Z"></path>`;
}

function create16thNoteBeams(stems, range) {
    const durations = stems.map(get('duration'));
    let html = '';
    let n = -1;
    let beam;

    while (durations[++n]) {
        if (durations[n] < 0.5 && durations[n].toFixed(2) !== '0.33') {
            // Push to existing beam
            if (beam) { beam.push(n); }
            // Or start new beam
            else { beam = [n]; }
        }
        // Render beam
        else if (beam) {
            html += renderBeam(range, stems, beam);
            beam = undefined;
        }
    }

    // Render beam
    if (beam) {
        html += renderBeam(range, stems, beam);
    }

    return html;
}

export default overload(get('type'), {
    clef: (symbol) => create('span', {
        class: `${ symbol.clef }-clef clef`,
        //data: { eventId: identify(symbol.event) },
        data: { eventId: null },
        html: glyphs[symbol.clef + 'Clef'] || ''
    }),

    chord: (symbol) => create('abbr', {
        class: "chord-abbr",
        title: "TODO - name of chord",
        data: {
            beat:     symbol.beat + 1,
            duration: symbol.duration,
            eventId:  identify(symbol.event)
        },
        html: '<span class="chord-root">' + symbol.root + '</span>'
            + (chordGlyphs[symbol.extension] ? chordGlyphs[symbol.extension] : symbol.extension)
            + (symbol.bass ? glyphs.chordBassSlash + '<span class="chord-bass">' + symbol.bass + '</span>' : '')
    }),

    timesig: (symbol) => create('span', {
        class: "timesig",
        data: {
            eventId: identify(symbol.event)
        },
        html: `<sup>${ glyphs['timeSig' + symbol.numerator] }</sup>
            <sub>${ glyphs['timeSig' + symbol.denominator] }</sub>`
    }),

    lyric: (symbol) => create('span', {
        class: "lyric",
        part:  "lyric",
        data: {
            beat:     symbol.beat + 1,
            duration: symbol.duration,
            eventId:  identify(symbol.event)
        },
        html: symbol.value
    }),

    acci: (symbol) => create('span', {
        class: "acci",
        data: symbol.beat === undefined ? { pitch: symbol.pitch } : {
            beat:    symbol.beat + 1,
            pitch:   symbol.pitch,
            part:    symbol.part,
            eventId: identify(symbol.event)
        },
        html: symbol.value === 1 ? glyphs.acciSharp :
            symbol.value === -1 ? glyphs.acciFlat :
            glyphs.acciNatural
    }),

    upledger: (symbol) => create('svg', {
        class: "up-ledge ledge",
        viewBox: `0 ${0.5 - symbol.rows} 4.4 ${symbol.rows}`,
        preserveAspectRatio: "xMidYMax",
        data: {
            beat:  symbol.beat + 1,
            pitch: symbol.pitch,
            part:  symbol.part
        },
        style: `height: ${ symbol.rows * 0.125 }em;`,
        html: `<g transform="translate(0 -8)">
            <line x1="0" x2="4.4" y1="8" y2="8"></line>
            <line x1="0" x2="4.4" y1="6" y2="6"></line>
            <line x1="0" x2="4.4" y1="4" y2="4"></line>
            <line x1="0" x2="4.4" y1="2" y2="2"></line>
            <line x1="0" x2="4.4" y1="0" y2="0"></line>
            <line x1="0" x2="4.4" y1="2" y2="2"></line>
            <line x1="0" x2="4.4" y1="4" y2="4"></line>
            <line x1="0" x2="4.4" y1="6" y2="6"></line>
            <line x1="0" x2="4.4" y1="8" y2="8"></line>
        </g>`
    }),

    downledger: (symbol) => create('svg', {
        class: "down-ledge ledge",
        viewBox: `0 -0.5 4.4 ${symbol.rows}`,
        preserveAspectRatio: "xMidYMin",
        data: {
            beat:  symbol.beat + 1,
            pitch: symbol.pitch,
            part:  symbol.part
        },
        style: `height: ${ symbol.rows * 0.125 }em;`,
        html: `<g transform="translate(0 -8)">
            <line x1="0" x2="4.4" y1="8" y2="8"></line>
            <line x1="0" x2="4.4" y1="6" y2="6"></line>
            <line x1="0" x2="4.4" y1="4" y2="4"></line>
            <line x1="0" x2="4.4" y1="2" y2="2"></line>
            <line x1="0" x2="4.4" y1="0" y2="0"></line>
            <line x1="0" x2="4.4" y1="2" y2="2"></line>
            <line x1="0" x2="4.4" y1="4" y2="4"></line>
            <line x1="0" x2="4.4" y1="6" y2="6"></line>
            <line x1="0" x2="4.4" y1="8" y2="8"></line>
        </g>`
    }),

    head: (symbol) => create('span', {
        class: "head",
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part,
            eventId:  identify(symbol.event)
        },
        html: `${ glyphs['head' + (symbol.duration + '').replace('.', '')] }`
    }),

    stem: (symbol) => create('svg', {
        class: `${symbol.stemDirection}-stem stem`,
        viewBox: "0 0 2.7 7",
        // Stretch stems by height
        preserveAspectRatio: "none",
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part
        },
        style: `--beam-y: ${symbol.beamY === undefined ? 0 : symbol.beamY};`,
        html: symbol.stemDirection === 'up' ?
            '<line class="stem-path" x1="2.4" y1="0" x2="2.4" y2="6"></line>' :
            '<line class="stem-path" x1="0.1" y1="0.3" x2="0.1" y2="7"></line>'
    }),

    beam: (symbol) => create('svg', {
        // Beam is sloped down
        class: `${symbol.updown}-beam beam`,
        viewBox: `0 ${(symbol.range > 0 ? -symbol.range : 0) - 0.5} ${symbol.stems.length - 1} ${abs(symbol.range) + 1}`,
        preserveAspectRatio: "none",
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part
        },
        /*style: 'grid-row-end: span ' + Math.ceil(1 - symbol.range),*/
        style: `height: ${ (abs(symbol.range) + 1) * 0.125 }em; align-self: ${symbol.range > 0 ? 'end' : 'start'};`,
        html: `
            <path class="beam-path" d="M0,${-0.5 * beamThickness} L${symbol.stems.length - 1},${-symbol.range - 0.5 * beamThickness} L${symbol.stems.length - 1},${-symbol.range + 0.5 * beamThickness} L0,${0.5 * beamThickness} Z"></path>
            ${ create16thNoteBeams(symbol.stems, symbol.range) }
        `
    }),

    tie: (symbol) => create('svg', {
        class: `${symbol.updown}-tie tie`,
        viewBox: `0 0 1 1`,
        preserveAspectRatio: "none",
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part
        },
        style: `height: 0.75em; align-self: ${symbol.updown === 'up' ? 'end' : 'start'};`,
        html: `<path class="tie-path" transform="translate(0, 0.14) scale(1 0.6)" d="M0.979174733,0.0124875307 C0.650597814,1.1195554 0.135029714,1.00095361 0.0165376402,0.026468657 C0.0113570514,0.0135475362 0.00253387291,0.00218807553 0,0 C0.0977526897,1.29523004 0.656681642,1.37089992 1,2.43111793e-08 C0.991901367,2.43111797e-08 0.987703936,0.01248753 0.979174733,0.0124875307 Z M0.979174733,0.0124875307"></path>`
    }),

    tail: (symbol) => create('span', {
        class: `${symbol.stemDirection}-tail tail`,
        data: {
            beat: symbol.beat + 1,
            pitch: symbol.pitch,
            duration: symbol.duration,
            part: symbol.part,
            eventId: identify(symbol.event)
        },
        html: glyphs['tail' + (symbol.stemDirection === 'up' ? 'Up' : 'Down') + (symbol.duration + '').replace('.', '')]
    }),

    rest: (symbol) => create('span', {
        class: "rest",
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part
        },
        html: `${ glyphs['rest' + (symbol.duration + '').replace('.', '')] }`
    }),

    default: (function (types) {
        return function (symbol) {
            if (types[symbol.type]) return;
            types[symbol.type] = true;
            console.log(symbol);
            console.error('Scribe: symbol type "' + symbol.type + '" not rendered');
        };
    })({})
});
