import get from 'fn/get.js';
import overload from 'fn/overload.js';
import create from 'dom/create.js';
import * as glyphs from "./glyphs.js";
import { chordGlyphs } from "./glyphs.js";
import { rflat, rsharp } from './regexp.js';
import { identify } from './event.js';
import { beamThickness } from './beam.js';

const abs = Math.abs;

const chordParts = {
    'flat':  `<span class="chord-flat">${ glyphs.acciFlat }</span>`,
    'sharp': `<span class="chord-sharp">${ glyphs.acciSharp }</span>`
};

const acciClasses = {
    '2':  'acci acci-doublesharp',
    '1':  'acci acci-sharp',
    '0':  'acci acci-natural',
    '-1': 'acci acci-flat',
    '-2': 'acci acci-doubleflat'
};

const acciGlyphs = {
    '2':  glyphs.acciDoubleSharp,
    '1':  glyphs.acciSharp,
    '0':  glyphs.acciNatural,
    '-1': glyphs.acciFlat,
    '-2': glyphs.acciDoubleFlat
};

const restGlyphs = {
    // Triplet rests
    '1.33': glyphs.rest2,
    '0.67': glyphs.rest1,
    '0.33': glyphs.rest05,
    '0.17': glyphs.rest025,
    '0.08': glyphs.rest0125
};

const rextensionparts = /^(∆|-|ø|7|\+)?(alt|sus|maj|min|dim|aug)?(.*)$/;

export default overload(get('type'), {
    clef: (symbol) => symbol.stave.getClefHTML ?
        // For support for piano stave treble and bass clef
        create('fragment', symbol.stave.getClefHTML()) :
        create('span', {
            class: `${ symbol.stave.type }-clef clef`,
            //data: { eventId: identify(symbol.event) },
            html: symbol.stave.clef
            //data: { symbol.event }
        }),

    chord: (symbol) => {
        const parts = rextensionparts.exec(symbol.extension);

        return create('abbr', {
            class: "chord chord-abbr",
            title: "TODO - name of chord",
            // Note that we must detect sharps before flats because HTML entities
            // contain hash symbols that can be interpreted as sharps
            html: '<span class="chord-root">' + symbol.root.replace(rsharp, chordParts.sharp).replace(rflat, chordParts.flat) + '</span>'
                + '<span class="chord-ext">'
                + (parts[1] ? '<span class="chord-ext-' + parts[1] + '">' + parts[1] + '</span>' : '')
                + (parts[2] ? '<sub>' + parts[2] + '</sub>' : '')
                + (parts[3] ? '<sup>' + parts[3].replace(rsharp, chordParts.sharp).replace(rflat, chordParts.flat) + '</sup>' : '')
                + '</span>'
                + (symbol.bass ? glyphs.chordBassSlash + '<span class="chord-bass">' + symbol.bass + '</span>' : ''),
            data: {
                beat:     symbol.beat + 1,
                duration: symbol.duration,
                event:  identify(symbol.event)
            }
        });
    },

    timesig: (symbol) => symbol.stave.getTimeSigHTML ?
        create('fragment', symbol.stave.getTimeSigHTML(symbol.numerator, symbol.denominator, identify(symbol.event))) :
        create('span', {
            class: "timesig",
            html: `<sup>${ glyphs['timeSig' + symbol.numerator] }</sup>
                <sub>${ glyphs['timeSig' + symbol.denominator] }</sub>`,
            data: {
                event: identify(symbol.event)
            }
        }),

    symbolcoda: (symbol) => create('p', {
        html: glyphs.coda,
        class: "coda"
    }),

    barcount: (symbol) => create('span', {
        html: symbol.text,
        class: "barcount"
    }),

    doublebarline: (symbol) => create('span', {
        html: glyphs.barLine + '&#x200A;' + glyphs.barLine,
        class: "barline"
    }),

    lyric: (symbol) => create('span', {
        class: "lyric",
        part:  "lyric",
        html: symbol.value,
        data: {
            beat:     symbol.beat + 1,
            duration: symbol.duration,
            event:  identify(symbol.event)
        }
    }),

    acci: (symbol) => create('span', {
        class: acciClasses[symbol.value] || 'acci',
        html: acciGlyphs[symbol.value] || glyphs.acciNatural,
        data: symbol.beat === undefined ? { pitch: symbol.pitch } : {
            beat:    symbol.beat + 1,
            pitch:   symbol.pitch,
            part:    symbol.part,
            event: identify(symbol.event)
        }
    }),

    upledger: (symbol) => create('svg', {
        class: "up-ledge ledge",
        viewBox: `0 ${0.5 - symbol.rows} 4.4 ${symbol.rows}`,
        preserveAspectRatio: "xMidYMax",
        style: `height: ${ symbol.rows * 0.125 }em;`,
        html: `
            <line x1="0" x2="4.4" y1="-6" y2="-6"></line>
            <line x1="0" x2="4.4" y1="-4" y2="-4"></line>
            <line x1="0" x2="4.4" y1="-2" y2="-2"></line>
            <line x1="0" x2="4.4" y1="0" y2="0"></line>
        `,
        data: {
            beat:  symbol.beat + 1,
            pitch: symbol.pitch,
            part:  symbol.part
        }
    }),

    downledger: (symbol) => create('svg', {
        class: "down-ledge ledge",
        viewBox: `0 -0.5 4.4 ${symbol.rows}`,
        preserveAspectRatio: "xMidYMin",
        style: `height: ${ symbol.rows * 0.125 }em;`,
        html: `
            <line x1="0" x2="4.4" y1="6" y2="6"></line>
            <line x1="0" x2="4.4" y1="4" y2="4"></line>
            <line x1="0" x2="4.4" y1="2" y2="2"></line>
            <line x1="0" x2="4.4" y1="0" y2="0"></line>
        `,
        data: {
            beat:  symbol.beat + 1,
            pitch: symbol.pitch,
            part:  symbol.part
        }
    }),

    note: (symbol) => create('data', {
        class: `${ symbol.stemDirection === 'up' ? 'up-note' : 'down-note' } note`,
        style: symbol.stemHeight && `--stem-height: ${ symbol.stemHeight };`,
        html:  symbol.stave.getNoteHTML(symbol.pitch, symbol.dynamic, symbol.duration),
        //value: symbol.event.join(' '),
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part,
            beam:     symbol.beam && identify(symbol.beam[0]),
            event:    identify(symbol.event)
        }
    }),

    beam: (symbol) => create('svg', {
        // 8th note beams can be rendered directly into the grid. Beams for
        // shorter durations are rendered as a post process once this SVG is in
        // the DOM and stem positions can be measured. See beam.js.
        class: `${symbol.direction}-beam beam`,
        viewBox: `0 ${ (symbol.range > 0 ? -symbol.range : 0) - 0.5 } 1 ${ abs(symbol.range) + 1 }`,
        preserveAspectRatio: "none",
        style: `height: ${ (abs(symbol.range) + 1) * 0.125 }em; align-self: ${ symbol.range > 0 ? 'end' : 'start' };`,
        html: `<path class="beam-path" d="M0,${ -0.5 * beamThickness } L1,${ -symbol.range - 0.5 * beamThickness } L1,${ -symbol.range + 0.5 * beamThickness } L0,${ 0.5 * beamThickness } Z"></path>`,
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part,
            events:   symbol.events.map(identify).join(' ')
        }
    }),

    tie: (symbol) => create('svg', {
        class: `${ symbol.updown }-tie tie`,
        viewBox: `0 0 1 1`,
        preserveAspectRatio: "none",
        html: `<path class="tie-path" transform="translate(0, 0.14) scale(1 0.6)" d="M0.979174733,0.0124875307 C0.650597814,1.1195554 0.135029714,1.00095361 0.0165376402,0.026468657 C0.0113570514,0.0135475362 0.00253387291,0.00218807553 0,0 C0.0977526897,1.29523004 0.656681642,1.37089992 1,2.43111793e-08 C0.991901367,2.43111797e-08 0.987703936,0.01248753 0.979174733,0.0124875307 Z M0.979174733,0.0124875307"></path>`,
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part
        }
    }),

    tuplet: (symbol) => create('span', {
        class: `${ symbol.down ? 'down' : 'up' }-tuplet tuplet`,
        html: glyphs['tuplet' + symbol.number],
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part
        },
        style: `--angle: ${ symbol.angle }deg;`
    }),

    rest: (symbol) => create('span', {
        class: "rest",
        html: restGlyphs[symbol.duration.toFixed(2)]
            || glyphs['rest' + (symbol.duration + '').replace('.', '')]
            || '',
        data: {
            beat:     symbol.beat + 1,
            pitch:    symbol.pitch,
            duration: symbol.duration,
            part:     symbol.part
        },
        'aria-hidden': 'true'
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
