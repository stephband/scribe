import get               from 'fn/get.js';
import overload          from 'fn/overload.js';
import create            from 'dom/create.js';
import { toNoteNumber }  from 'midi/note.js';
import * as glyphs       from "./glyphs.js";
import { chordGlyphs }   from "./glyphs.js";
import { rflat, rsharp } from './pitch.js';
import { identify }      from './event.js';
import { beamThickness } from './beam.js';
import { toHTML }        from './html.js';
import map               from './object/map.js';
import truncate          from './number/truncate.js';
import config            from './config.js';


const abs = Math.abs;

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

const clefGlyphs = {
    'treble':      glyphs.clefTreble,
    'treble-down': glyphs.clefTrebleDown,
    'treble-up':   glyphs.clefTrebleUp,
    'alto':        glyphs.clefAlto,
    'bass':        glyphs.clefBass,
    'drum':        glyphs.clefDrum,
    'percussion':  glyphs.clefDrum
}

const restGlyphs = {
    // Triplet rests
    '1.33': glyphs.rest2,
    '0.67': glyphs.rest1,
    '0.33': glyphs.rest05,
    '0.17': glyphs.rest025,
    '0.08': glyphs.rest0125
};

//                    (C         )(7            )(sus      )(♭9      )(/G              )
const rchordparts = /^([A-G][♭♯]?)([∆\-ø+°♭♯\d]*)([a-zA-Z]*)([♭♯]?\d+)?(?:\/([A-G][♭♯]?))?$/;

function toEventIds(symbol) {
    let n = -1, string = '';
    while (symbol[++n]) string += (string ? ' ' : '') + identify(symbol[n].event);
    return string;
}

function toChordHTML($0, $root, $ext, $sub, $sup, $bass) {
    return toHTML($root)
        + (($ext || $sub || $sup) ? '<span class="chord-ext">'
            + ($ext ? toHTML($ext) : '')
            + ($sub ? '<sub>' + $sub + '</sub>' : '')
            + ($sup ? toHTML($sup) : '')
        + '</span>' : '')
        + ($bass ? '<span class="glyph glyph-slash">' + glyphs.chordBassSlash + '</span><span class="chord-bass">' + toHTML($bass) + '</span>' : '');
}

export default overload(get('type'), {
    barrepeat: (symbol) => create('span', {
        class: 'barrepeat',
        html: glyphs['barRepeat' + symbol.count],
        data: {
            beat: 0,
            duration: symbol.duration
        }
    }),

    clef: (symbol) => create('span', {
        class: `${ symbol.clef }-clef clef`,
        html: clefGlyphs[symbol.clef]
    }),

    chord: (symbol) => {
        return create('abbr', {
            class: "chord chord-abbr",
            title: "",
            html: symbol.name.replace(rchordparts, toChordHTML),
            data: {
                beat:     truncate(4, symbol.beat),
                duration: truncate(4, symbol.duration),
                event:    identify(symbol.event)
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

    text: (symbol) => create('span', {
        class: "lyric",
        part:  "lyric",
        html: symbol.value,
        data: {
            beat:     truncate(4, symbol.beat),
            duration: truncate(4, symbol.duration),
            event:    identify(symbol.event)
        }
    }),

    acci: (symbol) => create('span', {
        class: (acciClasses[symbol.value] || 'acci') + (symbol.clump ? ' acci-' + symbol.clump : '' ) + (symbol.cluster ? ' acci-cluster' : ''),
        html: acciGlyphs[symbol.value] || glyphs.acciNatural,
        data: {
            beat:  symbol.beat && truncate(4, symbol.beat),
            pitch: symbol.pitch,
            part:  symbol.part.name,
            event: symbol.event && identify(symbol.event)
        }
    }),

    accent: (symbol) => {
        const isMarcato   = symbol.dynamic >= config.marcatoThreshold;
        const isDrumStave = symbol.stave.type === 'drum' || symbol.stave.type === 'percussion';

        return create('span', {
            class: `${ symbol.stemup ? 'up' : 'down' }-accent accent${ isMarcato ? ' marcato-accent' : '' }`,
            html: isDrumStave ?
                    isMarcato ? symbol.stemup ? glyphs.marcatoUp : glyphs.marcatoDown :
                symbol.stemup ? glyphs.accentUp : glyphs.accentDown :
                    isMarcato ? symbol.stemup ? glyphs.marcatoDown : glyphs.marcatoUp :
                symbol.stemup ? glyphs.accentDown : glyphs.accentUp,

            data: {
                beat:  truncate(4, symbol.beat),
                pitch: symbol.pitch,
                part:  symbol.part.name,
                event: identify(symbol.event)
            }
        });
    },

    ledge: (symbol) => create('svg', {
        class:   `${ symbol.rows < 0 ? 'up' : 'down' }-ledge ledge`,
        viewBox: symbol.rows < 0 ?
            // Up ledge start from 1 row above stave.topRow
            `0 ${ 9 + symbol.rows - 0.5 } 5 ${ abs(symbol.rows) }` :
            // Down ledge starts from 1 row below stave.bottomRow
            `0 -0.5 5 ${ abs(symbol.rows) }` ,
        preserveAspectRatio: "xMidYMin",
        html: `
            <line x1="0" x2="5" y1="0" y2="0"></line>
            <line x1="0" x2="5" y1="2" y2="2"></line>
            <line x1="0" x2="5" y1="4" y2="4"></line>
            <line x1="0" x2="5" y1="6" y2="6"></line>
            <line x1="0" x2="5" y1="8" y2="8"></line>
        `,
        data: {
            beat:  truncate(4, symbol.beat),
            pitch: symbol.pitch,
            part:  symbol.part.name
        }
    }),

    note: (symbol) => create('data', {
        class: `${ symbol.stemup ? 'up-note ' : 'down-note ' }${ symbol.top ? 'top-note ' : '' }${ symbol.bottom ? 'bottom-note ' : '' }${
            // Stem up
            symbol.stemup ?
                // Stem up, bottom not should not be clustered
                symbol.clusterup % 2 === 1 ? 'cluster-note ' : '' :
                // Stem down, top note cannot be clustered
                symbol.clusterdown % 2 === 1 ? 'cluster-note ' : ''
        }${ symbol.beam ? 'beam-note ' : '' }note`,
        style: symbol.stemHeight ? `--stem-height: ${ symbol.stemHeight };` : undefined,
        html:  symbol.stave.getNoteHTML(symbol.pitch, symbol.dynamic, symbol.duration),
        title: `${ symbol.pitch } (${ toNoteNumber(symbol.pitch) })`,
        data: {
            beat:     truncate(4, symbol.beat),
            duration: truncate(4, symbol.duration),
            pitch:    symbol.pitch,
            part:     symbol.part.name,
            beam:     symbol.beam && symbol.beam.id,
            event:    identify(symbol.event)
        }
    }),

    beam: (symbol, settings) => create('svg', {
        // 8th note beams can be rendered directly into the grid. Beams for
        // shorter durations are rendered as a post process once this SVG is in
        // the DOM and stem positions can be measured. See beam.js.
        class: `${ symbol.stemup ? 'up' : 'down' }-beam beam`,
        viewBox: `0 ${ (symbol.range < 0 ? symbol.range : 0) - 0.5 } 1 ${ abs(symbol.range) + 1 }`,
        preserveAspectRatio: "none",
        style: `--duration: ${ truncate(4, symbol.duration) }; ${ symbol.y ? '--translate-y:' + (symbol.y * 0.125) + ';' : '' } height: ${ (abs(symbol.range) + beamThickness) * 0.125 }em; align-self: ${ symbol.range < 0 ? 'end' : 'start' };`,
        html: `<path class="beam-path" d="M0,${ -0.5 * beamThickness } L1,${ symbol.range - 0.5 * beamThickness } L1,${ symbol.range + 0.5 * beamThickness } L0,${ 0.5 * beamThickness } Z"></path>`,
        data: {
            beat:     truncate(4, symbol.beat),
            pitch:    symbol.pitch,
            part:     symbol.part.name,
            beam:     symbol.id,
            events:   toEventIds(symbol)
        }
    }),

    tie: (symbol) => create('svg', {
        class: `${ symbol.stemup ? 'down' : 'up' }-tie tie`,
        viewBox: `0 0 1 1`,
        preserveAspectRatio: "none",
        html: `<path class="tie-path" transform="translate(0, 0.14) scale(1 0.6)" d="M0.979174733,0.0124875307 C0.650597814,1.1195554 0.135029714,1.00095361 0.0165376402,0.026468657 C0.0113570514,0.0135475362 0.00253387291,0.00218807553 0,0 C0.0977526897,1.29523004 0.656681642,1.37089992 1,2.43111793e-08 C0.991901367,2.43111797e-08 0.987703936,0.01248753 0.979174733,0.0124875307 Z M0.979174733,0.0124875307"></path>`,
        data: {
            beat:     truncate(4, symbol.beat),
            pitch:    symbol.pitch,
            duration: truncate(4, symbol.duration),
            part:     symbol.part.name,
            event:    identify(symbol.event)
        }
    }),

    tuplet: (symbol) => create('span', {
        class: `${ symbol.stemup ? 'up' : 'down' }-tuplet tuplet`,
        html: glyphs['tuplet' + symbol.divisor],
        data: {
            beat:     truncate(4, symbol.beat),
            pitch:    symbol.pitch,
            duration: truncate(4, symbol.duration),
            divisor:  symbol.divisor,
            // Rhythm is a binary number
            rhythm:   symbol.rhythm.toString(2).split('').reverse().join(''),
            part:     symbol.part.name
        },
        style: `--angle: ${ symbol.angle }deg;`
    }),

    rest: (symbol) => create('span', {
        class: "rest",
        html: restGlyphs[symbol.duration.toFixed(2)]
            || glyphs['rest' + (symbol.duration + '').replace('.', '')]
            || '',
        data: {
            beat:     truncate(4, symbol.beat),
            pitch:    symbol.pitch,
            duration: truncate(4, symbol.duration),
            part:     symbol.part.name
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
