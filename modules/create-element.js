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
        beat, duration, divisions, count
    });

    let n = -1;
    while (bar[++n]) element.appendChild(createPartElement(bar[n]));
    return element;
}

export function createPartElement({ name, stave, key, symbols }) {
    const element = create('music-stave', {
        class: `${ stave.type }-stave stave`,
        title: `${ name }`,
        stave: stave.type,
        key:   stave.pitched ?
            toKeyName(key) :
            undefined
    });

    let n = -1;
    while (symbols[++n]) element.appendChild(createSymbolElement(symbols[n]));
    return element;
}

export function createSigElement(bar0, defaultKeyName) {
    const element = create('music-sig');
    let n = -1;
    while (bar0[++n]) {
        const part = bar0[n];
        const stave = part.stave;
        const keyName = toKeyName(part.key !== undefined ? part.key : (defaultKeyName || bar0.key || 0));
        // Don't display "default" part name
        const labelElement = part.name === 'default' ? null : create('h2', {
            class: `part-name`,
            text: part.name
        });
        const staveElement = create('music-stave', {
            class: `${ stave.type }-stave signature-stave stave`,
            part:  part.name,
            stave: stave.type,
            key:   stave.pitched ? keyName : undefined
        });
        const symbols = stave.createSignatureSymbols(keyName);
        let i = -1;
        while (symbols[++i]) staveElement.appendChild(createSymbolElement(symbols[i]));
        // Don't display "default" part name
        if (part.name !== 'default') element.appendChild(labelElement);
        element.appendChild(staveElement);
    }
    return element;
}

const createSymbolElement = overload(get('type'), {
    barrepeat: ({ count, duration }) => create('span', {
        class: 'barrepeat',
        html: glyphs['barRepeat' + count],
        beat: 0,
        duration
    }),

    clef: ({ clef }) => create('music-clef', {
        class: `${ clef === 'alto' || clef === 'tenor' ? 'c' : clef }-clef clef`,
        html: clefGlyphs[clef]
    }),

    chord: ({ beat, duration, name, event }) => store(create('abbr', {
        class: "chord chord-abbr",
        title: "",
        html: name.replace(rchordparts, toChordHTML),
        beat:     truncate(4, beat),
        duration: truncate(4, duration),
        event:    identify(event)
    }), event),

    timesig: ({ stave, numerator, denominator, event }) => stave.getTimeSigHTML ?
        create('fragment', stave.getTimeSigHTML(numerator, denominator, identify(event))) :
        store(create('music-timesig', {
            class: "timesig",
            html: `<sup>${ glyphs['timeSig' + numerator] }</sup>
                <sub>${ glyphs['timeSig' + denominator] }</sub>`,
            event: identify(event)
        }), event),

    symbolcoda: () => create('p', {
        html: glyphs.coda,
        class: "coda"
    }),
/*
    barcount: ({ text }) => create('span', {
        html: text,
        class: "barcount"
    }),
*/
    text: ({ value, beat, duration, event }) => store(create('span', {
        class: "lyric",
        part:  "lyric",
        html: value,
        beat:     truncate(4, beat),
        duration: truncate(4, duration),
        event:    identify(event)
    }), event),

    acci: ({ value, clump, cluster, beat, pitch, voice, event }) => {
        const element = create('music-acci', {
            class: (acciClasses[value] || 'acci') + (clump ? ' acci-' + clump : '' ) + (cluster ? ' acci-cluster' : ''),
            html:  acciGlyphs[value] || glyphs.acciNatural,
            beat:  beat && truncate(4, beat),
            pitch,
            voice: voice.name,
            event: event ? identify(event) : undefined
        });
        return event ? store(element, event) : element;
    },

    accent: ({ dynamic, stave, stemup, beat, pitch, voice, event }) => {
        const isMarcato   = dynamic >= config.marcatoThreshold;
        const isDrumStave = stave.type === 'drum' || stave.type === 'percussion';
        return store(create('music-accent', {
            class: `${ stemup ? 'up' : 'down' }-accent accent${ isMarcato ? ' marcato-accent' : '' }`,
            html: isDrumStave ?
                    isMarcato ? stemup ? glyphs.marcatoUp : glyphs.marcatoDown :
                stemup ? glyphs.accentUp : glyphs.accentDown :
                    isMarcato ? stemup ? glyphs.marcatoDown : glyphs.marcatoUp :
                stemup ? glyphs.accentDown : glyphs.accentUp,

            beat:  truncate(4, beat),
            pitch,
            voice: voice.name,
            event: identify(event)
        }), event);
    },

    ledge: ({ rows, beat, pitch, voice }) => create('music-ledge', {
        class: `${ rows < 0 ? 'up' : 'down' }-ledge ledge`,
        style: `--rows: ${ abs(rows) };`,
        beat:  truncate(4, beat),
        pitch,
        voice: voice.name
    }),

    beam: (symbol) => {
        const { stemup, range, stub, beat, duration, y, pitch, divisor, voice, id } = symbol;
        return create('music-beam', {
            class: `${ stemup ? 'up' : 'down' }-beam ${ range < 0 ? 'rise-beam ' : '' }${ stub ? stub + '-beam' : '' }`,
            style: `--beat: ${ truncate(6, beat) }; --duration: ${ truncate(6, duration) };${ y ? ' --translate-y: ' + truncate(6, y * 0.125) + ';' : '' }${ range ? ' --range: ' + truncate(6, abs(range)) + ';' : '' }`,
            beat:     truncate(4, beat),
            pitch,
            divisor,
            voice:    voice.name,
            beam:     id,
            events:   symbol.length ? toEventIds(symbol) : undefined
        });
    },

    note: ({ stemup, top, bottom, clusterup, clusterdown, beam, stemHeight, stave, pitch, dynamic, duration, event, beat, voice }) => store(create('music-note', {
        class: `${ stemup ? 'up-note ' : 'down-note ' }${ top ? 'top-note ' : '' }${ bottom ? 'bottom-note ' : '' }${
            // Stem up
            stemup ?
                // Stem up, bottom not should not be clustered
                clusterup % 2 === 1 ? 'cluster-note ' : '' :
                // Stem down, top note cannot be clustered
                clusterdown % 2 === 1 ? 'cluster-note ' : ''
        }${ beam ? 'beam-note ' : '' }note`,
        style: stemHeight ? `--stem-height: ${ stemHeight };` : undefined,
        html:  stave.getNoteHTML(pitch, dynamic, duration),
        title: `${ event.pitchSpelling } (${ event[2] })`,
        beat:     truncate(4, beat),
        duration: truncate(4, duration),
        pitch:    event.pitchSpelling,
        voice:    voice.name,
        stem:     stemup ? 'up' : 'down',
        beam:     beam && beam.id,
        event:    identify(event)
    }), event),

    tie: ({ beat, duration, pitch, voice, stemup, event }) => store(create('svg', {
        class: `${ stemup ? 'down' : 'up' }-tie tie`,
        viewBox: `0 0 1 1`,
        preserveAspectRatio: "none",
        html: `<path class="tie-path" transform="translate(0, 0.14) scale(1 0.6)" d="M0.979174733,0.0124875307 C0.650597814,1.1195554 0.135029714,1.00095361 0.0165376402,0.026468657 C0.0113570514,0.0135475362 0.00253387291,0.00218807553 0,0 C0.0977526897,1.29523004 0.656681642,1.37089992 1,2.43111793e-08 C0.991901367,2.43111797e-08 0.987703936,0.01248753 0.979174733,0.0124875307 Z M0.979174733,0.0124875307"></path>`,
        beat:     truncate(4, beat),
        pitch,
        duration: truncate(4, duration),
        voice:    voice.name,
        event:    identify(event)
    }), event),

    tuplet: ({ beat, duration, divisor, rhythm, voice, pitch, stemup, angle }) => create('music-tuplet', {
        class: `${ stemup ? 'up' : 'down' }-tuplet tuplet`,
        html: glyphs['tuplet' + divisor],
        beat: truncate(4, beat),
        pitch,
        duration: truncate(4, duration),
        divisor,
        // Rhythm is a binary number
        rhythm: toRhythmBinary(divisor, rhythm),
        voice: voice.name,
        style: angle ?
            `--angle: ${ angle }deg;` :
            undefined
    }),

    rest: ({ beat, duration, voice, pitch, whole }) => create('music-rest', {
        class: whole && duration > 3 ?
            'whole-rest rest' :
            'rest',
        html: whole && duration > 3 ?
            glyphs.rest4 :
            toRestGlyph(duration),
        beat: truncate(4, beat),
        duration: truncate(4, duration),
        pitch,
        voice: voice.name,
        'aria-hidden': 'true'
    }),

    warning: ({ stemHeight, stave, pitch, dynamic, duration, beat, voice, beam, event }) => store(create('data', {
        class: `warning-note note`,
        style: stemHeight ? `--stem-height: ${ stemHeight };` : undefined,
        html:  stave.getNoteHTML(pitch, dynamic, duration),
        title: `${ pitch } (${ toNoteNumber(pitch) })`,
        beat:     truncate(4, beat),
        duration: truncate(4, duration),
        pitch,
        voice:    voice.name,
        beam:     beam && beam.id,
        event:    identify(event)
    }), event),

    default: (function (types) {
        return function (symbol) {
            if (types[symbol.type]) return;
            types[symbol.type] = true;
            console.log(symbol);
            console.error('Scribe: symbol type "' + symbol.type + '" not rendered');
        };
    })({})
});
