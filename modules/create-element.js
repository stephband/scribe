import get               from 'fn/get.js';
import overload          from 'fn/overload.js';
import create            from 'dom/create.js';
import { toNoteNumber }  from 'midi/note.js';
import { toKeyName }     from 'sequence/modules/event/key.js';
import * as glyphs       from "./glyphs.js";
import { identify }      from './event.js';
//import { beamThickness } from './beam.js';
import { toHTML }        from './html.js';
import map               from "./store.js";
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
    'alto':        glyphs.clefC,
    'tenor':       glyphs.clefC,
    'bass':        glyphs.clefBass,
    'drum':        glyphs.clefDrum,
    'percussion':  glyphs.clefDrum
}

//                    (C         )(7            )(sus      )(♭9      )(/G              )
const rchordparts = /^([A-G][♭♯]?)([∆\-ø+°♭♯\d]*)([a-zA-Z]*)([♭♯]?\d+)?(?:\/([A-G][♭♯]?))?$/;

function toEventIds(symbol) {
    let n = -1, string = '';
    while (symbol[++n]) string += (string ? ' ' : '') + identify(symbol[n].event);
    return string;
}
/*
function toStackIds(sequencer, string = '') {
    return sequencer.parent ?
        toStackIds(sequencer.parent, ('' + identify(sequencer.event)) + (string ? ' ' + string : string)) :
        string ;
}
*/
function toRestGlyph(duration) {
    // Duplet or dotted rest
    const glyph = glyphs['rest' + (duration + '').replace('.', '')];
    if (glyph) return glyph;

    // Tuplet rest
    let d = 0.0625;
    while (duration > (d *= 2));
    return glyphs['rest' + (d + '').replace('.', '')];
}

function toChordHTML($0, $root, $ext, $sub, $sup, $bass) {
    return '<span class="chord-root">' + toHTML($root) + '</span>'
        + (($ext || $sub || $sup) ? '<span class="chord-ext">'
            + ($ext ? toHTML($ext) : '')
            + ($sub ? '<span class="glyph glyph-sub">' + $sub + '</span>' : '')
            + ($sup ? toHTML($sup) : '')
        + '</span>' : '')
        + ($bass ? '<span class="glyph glyph-slash">' + glyphs.chordBassSlash + '</span><span class="chord-bass">' + toHTML($bass) + '</span>' : '');
}

function toRhythmBinary(length, number) {
    // Get binary string
    const string = number.toString(2);
    // Pad with 0s up to length and render in reverse order
    return Array
        .from({ length }, (n, i) => string[string.length - 1 - i] || '0')
        .join('');
}

function store(element, data) {
    map.set(element, data);
    return element;
}


// Elements

export function createBarElement(bar) {
    const { beat, duration, divisions, count } = bar;
    const element = create('music-bar', {
        class: `${ bar.doubleBarLine ? 'end-bar ' : '' }bar${ bar.error ? ' error ': '' }`,
        data: { beat, duration, divisions, count }
    });

    let n = -1;
    while (bar[++n]) element.appendChild(createPartElement(bar[n]));
    return element;
}

export function createPartElement({ stave, key, symbols }) {
    const element = create('music-stave', {
        class: `${ stave.type }-stave stave`,
        data: {
            stave: stave.type,
            key:   stave.pitched ?
                toKeyName(key) :
                undefined
        }
    });

    let n = -1;
    while (symbols[++n]) element.appendChild(createSymbolElement(symbols[n]));
    return element;
}

const createSymbolElement = overload(get('type'), {
    barrepeat: (symbol) => create('span', {
        class: 'barrepeat',
        html: glyphs['barRepeat' + symbol.count],
        data: {
            beat: 0,
            duration: symbol.duration
        }
    }),

    clef: (symbol) => create('span', {
        class: `${ symbol.clef === 'alto' || symbol.clef === 'tenor' ? 'c' : symbol.clef }-clef clef`,
        html: clefGlyphs[symbol.clef]
    }),

    chord: ({ beat, duration, name, event }) => store(create('abbr', {
        class: "chord chord-abbr",
        title: "",
        html: name.replace(rchordparts, toChordHTML),
        data: {
            beat:     truncate(4, beat),
            duration: truncate(4, duration),
            event:    identify(event)
        }
    }), event),

    timesig: (symbol) => symbol.stave.getTimeSigHTML ?
        create('fragment', symbol.stave.getTimeSigHTML(symbol.numerator, symbol.denominator, identify(symbol.event))) :
        store(create('span', {
            class: "timesig",
            html: `<sup>${ glyphs['timeSig' + symbol.numerator] }</sup>
                <sub>${ glyphs['timeSig' + symbol.denominator] }</sub>`,
            data: {
                event: identify(symbol.event)
            }
        }), symbol.event),

    symbolcoda: (symbol) => create('p', {
        html: glyphs.coda,
        class: "coda"
    }),

    barcount: (symbol) => create('span', {
        html: symbol.text,
        class: "barcount"
    }),

    text: (symbol) => store(create('span', {
        class: "lyric",
        part:  "lyric",
        html: symbol.value,
        data: {
            beat:     truncate(4, symbol.beat),
            duration: truncate(4, symbol.duration),
            event:    identify(symbol.event)
        }
    }), symbol.event),

    acci: (symbol) => store(create('music-acci', {
        class: (acciClasses[symbol.value] || 'acci') + (symbol.clump ? ' acci-' + symbol.clump : '' ) + (symbol.cluster ? ' acci-cluster' : ''),
        html: acciGlyphs[symbol.value] || glyphs.acciNatural,
        data: {
            beat:  symbol.beat && truncate(4, symbol.beat),
            pitch: symbol.pitch,
            part:  symbol.part.name,
            event: symbol.event && identify(symbol.event)
        }
    }), symbol.event),

    accent: (symbol) => {
        const isMarcato   = symbol.dynamic >= config.marcatoThreshold;
        const isDrumStave = symbol.stave.type === 'drum' || symbol.stave.type === 'percussion';

        return store(create('span', {
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
        }), symbol.event);
    },

    ledge: (symbol) => create('music-ledge', {
        class: `${ symbol.rows < 0 ? 'up' : 'down' }-ledge ledge`,
        style: `--rows: ${ abs(symbol.rows) };`,
        data: {
            beat:  truncate(4, symbol.beat),
            pitch: symbol.pitch,
            part:  symbol.part.name
        }
    }),

    beam: (symbol) => create('music-beam', {
        class: `${ symbol.stemup ? 'up' : 'down' }-beam ${ symbol.range < 0 ? 'rise-beam ' : '' }${ symbol.stub ? symbol.stub + '-beam' : '' }`,
        style: `--beat: ${ truncate(6, symbol.beat) }; --duration: ${ truncate(6, symbol.duration) };${ symbol.y ? ' --translate-y: ' + truncate(6, symbol.y * 0.125) + ';' : '' }${ symbol.range ? ' --range: ' + truncate(6, abs(symbol.range)) + ';' : '' }`,
        data: {
            beat:     truncate(4, symbol.beat),
            pitch:    symbol.pitch,
            divisor:  symbol.divisor,
            voice:    symbol.voice.name,
            beam:     symbol.id,
            events:   symbol.length ? toEventIds(symbol) : undefined
        }
    }),

    note: (symbol) => store(create('music-note', {
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
        title: `${ symbol.event.pitchSpelling } (${ symbol.event[2] })`,
        data: {
            beat:     truncate(4, symbol.beat),
            duration: truncate(4, symbol.duration),
            pitch:    symbol.event.pitchSpelling,
            part:     symbol.part.name,
            beam:     symbol.beam && symbol.beam.id,
            event:    identify(symbol.event),
//            stack:    toStackIds(symbol.event.sequencer)
        }
    }), symbol.event),

    tie: ({ beat, duration, pitch, part, stemup, event }) => store(create('svg', {
        class: `${ stemup ? 'down' : 'up' }-tie tie`,
        viewBox: `0 0 1 1`,
        preserveAspectRatio: "none",
        html: `<path class="tie-path" transform="translate(0, 0.14) scale(1 0.6)" d="M0.979174733,0.0124875307 C0.650597814,1.1195554 0.135029714,1.00095361 0.0165376402,0.026468657 C0.0113570514,0.0135475362 0.00253387291,0.00218807553 0,0 C0.0977526897,1.29523004 0.656681642,1.37089992 1,2.43111793e-08 C0.991901367,2.43111797e-08 0.987703936,0.01248753 0.979174733,0.0124875307 Z M0.979174733,0.0124875307"></path>`,
        data: {
            beat:     truncate(4, beat),
            pitch,
            duration: truncate(4, duration),
            part:     part.name,
            event:    identify(event)
        }
    }), event),

    tuplet: ({ beat, duration, divisor, rhythm, voice, pitch, stemup, angle }) => create('music-tuplet', {
        class: `${ stemup ? 'up' : 'down' }-tuplet tuplet`,
        html: glyphs['tuplet' + divisor],
        data: {
            beat: truncate(4, beat),
            pitch,
            duration: truncate(4, duration),
            divisor,
            // Rhythm is a binary number
            rhythm: toRhythmBinary(divisor, rhythm),
            part: voice.name
        },
        style: angle ?
            `--angle: ${ angle }deg;` :
            undefined
    }),

    rest: ({ beat, duration, part, pitch, whole }) => create('music-rest', {
        class: whole && duration > 3 ?
            'whole-rest rest' :
            'rest',
        html: whole && duration > 3 ?
            glyphs.rest4 :
            toRestGlyph(duration),
        data: {
            beat:     truncate(4, beat),
            pitch,
            duration: truncate(4, duration),
            part:     part.name
        },
        'aria-hidden': 'true'
    }),

    warning: (symbol) => store(create('data', {
        class: `warning-note note`,
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
    }), symbol.event),

    default: (function (types) {
        return function (symbol) {
            if (types[symbol.type]) return;
            types[symbol.type] = true;
            console.log(symbol);
            console.error('Scribe: symbol type "' + symbol.type + '" not rendered');
        };
    })({})
});
