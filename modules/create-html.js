import get               from 'fn/get.js';
import overload          from 'fn/overload.js';
import { toNoteNumber }  from 'midi/note.js';
import { toKeyName }     from 'sequence/modules/event/key.js';
import * as glyphs       from './glyphs.js';
import { toHTML }        from './html.js';
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
};

//                    (C         )(7            )(sus      )(♭9      )(/G              )
const rchordparts = /^([A-G][♭♯]?)([∆\-ø+°♭♯\d]*)([a-zA-Z]*)([♭♯]?\d+)?(?:\/([A-G][♭♯]?))?$/;

function toEventAttr(event) {
    return event && event.id !== undefined ? ` event="${ event.id }"` : '';
}

function toEventIds(symbol) {
    let n = -1, string = '';
    while (symbol[++n]) {
        const id = symbol[n].event && symbol[n].event.id;
        if (id !== undefined) string += (string ? ' ' : '') + id;
    }
    return string;
}

function toRestGlyph(duration) {
    // Duplet or dotted rest
    const glyph = glyphs['rest' + (duration + '').replace('.', '')];
    if (glyph) return glyph;

    // Tuplet rest
    let d = 0.0625;
    while (duration > (d *= 2));
    return glyphs['rest' + (d + '').replace('.', '')];
}

function toChordHTML(_, $root, $ext, $sub, $sup, $bass) {
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
        .from({ length }, (_, i) => string[string.length - 1 - i] || '0')
        .join('');
}


// HTML

/**
.createSymbolHTML(symbol)
Serialises a stave symbol descriptor object to an HTML string.
**/
export const createSymbolHTML = overload(get('type'), {
    barrepeat: ({ count, voice }) =>
        `<music-barrepeat class="barrepeat" count="${ count }"${ voice ? ` voice="${ voice.name }"` : '' }>${ glyphs['barRepeat' + count] }</music-barrepeat>`,

    clef: ({ clef }) =>
        `<music-clef class="${ clef === 'alto' || clef === 'tenor' ? 'c' : clef }-clef clef">${ clefGlyphs[clef] }</music-clef>`,

    chord: ({ beat, duration, name, event }) =>
        `<abbr class="chord chord-abbr" title="" beat="${ truncate(4, beat) }" duration="${ truncate(4, duration) }"${ toEventAttr(event) }>${ name.replace(rchordparts, toChordHTML) }</abbr>`,

    timesig: ({ stave, numerator, denominator, event }) => stave.getTimeSigHTML ?
        stave.getTimeSigHTML(numerator, denominator, event && event.id) :
        `<music-timesig class="timesig"${ toEventAttr(event) }><sup>${ glyphs['timeSig' + numerator] }</sup><sub>${ glyphs['timeSig' + denominator] }</sub></music-timesig>`,

    symbolcoda: () =>
        `<p class="coda">${ glyphs.coda }</p>`,

    text: ({ value, beat, duration, event }) =>
        `<span class="lyric" part="lyric" beat="${ truncate(4, beat) }" duration="${ truncate(4, duration) }"${ toEventAttr(event) }>${ value }</span>`,

    acci: ({ value, clump, cluster, beat, pitch, voice, event }) =>
        `<music-acci class="${ acciClasses[value] || 'acci' }${ clump ? ' acci-' + clump : '' }${ cluster ? ' acci-cluster' : '' }"${ beat !== undefined ? ` beat="${ beat && truncate(4, beat) }"` : '' } pitch="${ pitch }" voice="${ voice.name }"${ toEventAttr(event) }>${ acciGlyphs[value] || glyphs.acciNatural }</music-acci>`,

    accent: ({ dynamic, stave, stemup, beat, pitch, voice, event }) => {
        const isMarcato   = dynamic >= config.marcatoThreshold;
        const isDrumStave = stave.type === 'drum' || stave.type === 'percussion';
        const glyph = isDrumStave ?
            isMarcato ? stemup ? glyphs.marcatoUp : glyphs.marcatoDown :
            stemup ? glyphs.accentUp : glyphs.accentDown :
            isMarcato ? stemup ? glyphs.marcatoDown : glyphs.marcatoUp :
            stemup ? glyphs.accentDown : glyphs.accentUp;

        return `<music-accent class="${ stemup ? 'up' : 'down' }-accent accent${ isMarcato ? ' marcato-accent' : '' }" beat="${ truncate(4, beat) }" pitch="${ pitch }" voice="${ voice.name }"${ toEventAttr(event) }>${ glyph }</music-accent>`;
    },

    ledge: ({ rows, beat, pitch, voice }) =>
        `<music-ledge class="${ rows < 0 ? 'up' : 'down' }-ledge ledge" style="--rows: ${ abs(rows) };" beat="${ truncate(4, beat) }" pitch="${ pitch }" voice="${ voice.name }"></music-ledge>`,

    beam: (symbol) => {
        const { stemup, range, stub, beat, duration, y, pitch, divisor, voice, id } = symbol;
        const events = symbol.length ? toEventIds(symbol) : '';
        return `<music-beam class="${ stemup ? 'up' : 'down' }-beam ${ range < 0 ? 'rise-beam ' : '' }${ stub ? stub + '-beam' : '' }" style="--beat: ${ truncate(6, beat) }; --duration: ${ truncate(6, duration) };${ y ? ' --translate-y: ' + truncate(6, y * 0.125) + ';' : '' }${ range ? ' --range: ' + truncate(6, abs(range)) + ';' : '' }" beat="${ truncate(4, beat) }" pitch="${ pitch }"${ divisor !== undefined ? ` divisor="${ divisor }"` : '' } voice="${ voice.name }" beam="${ id }"${ events ? ` events="${ events }"` : '' }></music-beam>`;
    },

    note: ({ stemup, top, bottom, clusterup, clusterdown, beam, stemHeight, stave, pitch, dynamic, duration, event, beat, voice, staccato, tenuto }) =>
        `<music-note class="${ stemup ? 'up-note ' : 'down-note ' }${ top ? 'top-note ' : '' }${ bottom ? 'bottom-note ' : '' }${
            // Stem up
            stemup ?
                // Stem up, bottom note should not be clustered
                clusterup % 2 === 1 ? 'cluster-note ' : '' :
                // Stem down, top note cannot be clustered
                clusterdown % 2 === 1 ? 'cluster-note ' : ''
        }${ beam ? 'beam-note ' : '' }${ staccato ? 'staccato-note ' : '' }${ tenuto ? 'tenuto-note ' : '' }note"${ stemHeight ? ` style="--stem-height: ${ stemHeight };"` : '' } title="${ pitch } (${ event[2] })" beat="${ truncate(4, beat) }" duration="${ truncate(4, duration) }" pitch="${ pitch }" voice="${ voice.name }" stem="${ stemup ? 'up' : 'down' }"${ beam && beam.id !== undefined ? ` beam="${ beam.id }"` : '' }${ toEventAttr(event) }>${ stave.getNoteHTML(pitch, dynamic, duration, staccato, tenuto) }${ staccato ? '<music-accent class="staccato-accent accent"></music-accent>' : '' }${ tenuto ? '<music-accent class="tenuto-accent accent"></music-accent>' : '' }</music-note>`,

    tie: ({ beat, duration, pitch, voice, stemup, event }) =>
        `<svg class="${ stemup ? 'down' : 'up' }-tie tie" viewBox="0 0 1 1" preserveAspectRatio="none" beat="${ truncate(4, beat) }" pitch="${ pitch }" duration="${ truncate(4, duration) }" voice="${ voice.name }"${ toEventAttr(event) }><path class="tie-path" transform="translate(0, 0.14) scale(1 0.6)" d="M0.979174733,0.0124875307 C0.650597814,1.1195554 0.135029714,1.00095361 0.0165376402,0.026468657 C0.0113570514,0.0135475362 0.00253387291,0.00218807553 0,0 C0.0977526897,1.29523004 0.656681642,1.37089992 1,2.43111793e-08 C0.991901367,2.43111797e-08 0.987703936,0.01248753 0.979174733,0.0124875307 Z M0.979174733,0.0124875307"></path></svg>`,

    tuplet: ({ beat, duration, divisor, rhythm, voice, pitch, stemup, angle }) =>
        `<music-tuplet class="${ stemup ? 'up' : 'down' }-tuplet tuplet" beat="${ truncate(4, beat) }" pitch="${ pitch }" duration="${ truncate(4, duration) }" divisor="${ divisor }" rhythm="${ toRhythmBinary(divisor, rhythm) }" voice="${ voice.name }"${ angle ? ` style="--angle: ${ angle }deg;"` : '' }>${ glyphs['tuplet' + divisor] }</music-tuplet>`,

    rest: ({ beat, duration, voice, pitch, whole }) =>
        `<music-rest class="${ whole && duration > 3 ? 'whole-rest rest' : 'rest' }" beat="${ truncate(4, beat) }" duration="${ truncate(4, duration) }"${ pitch !== undefined ? ` pitch="${ pitch }"` : '' } voice="${ voice.name }" aria-hidden="true">${ whole && duration > 3 ? glyphs.rest4 : toRestGlyph(duration) }</music-rest>`,

    warning: ({ stemHeight, stave, pitch, dynamic, duration, beat, voice, beam, event }) =>
        `<data class="warning-note note"${ stemHeight ? ` style="--stem-height: ${ stemHeight };"` : '' } title="${ pitch } (${ toNoteNumber(pitch) })" beat="${ truncate(4, beat) }" duration="${ truncate(4, duration) }" pitch="${ pitch }" voice="${ voice.name }"${ beam && beam.id !== undefined ? ` beam="${ beam.id }"` : '' }${ toEventAttr(event) }>${ stave.getNoteHTML(pitch, dynamic, duration) }</data>`,

    default: (function (types) {
        return function (symbol) {
            if (types[symbol.type]) return '';
            types[symbol.type] = true;
            console.log(symbol);
            console.error('Scribe: symbol type "' + symbol.type + '" not rendered');
            return '';
        };
    })({})
});

/**
.createPartHTML(part)
Serialises a bar part and its symbols into a `<music-stave>` HTML string.
**/
export function createPartHTML({ name, stave, key, symbols }) {
    let html = `<music-stave class="${ stave.type }-stave stave" title="${ name }" stave="${ stave.type }"${ stave.pitched ? ` key="${ toKeyName(key) }"` : '' }>`;
    let n = -1;
    while (symbols[++n]) html += createSymbolHTML(symbols[n]);
    return html + '</music-stave>';
}

/**
.createBarHTML(bar)
Serialises a tree bar and its parts into a `<music-bar>` HTML string.
**/
export function createBarHTML(bar) {
    const { beat, duration, divisions, count, doubleBarLine, error } = bar;
    let html = `<music-bar class="${ doubleBarLine ? 'end-bar ' : '' }bar${ error ? ' error ' : '' }" beat="${ beat }" duration="${ duration }" divisions="${ divisions }" count="${ count }">`;
    let n = -1;
    while (bar[++n]) html += createPartHTML(bar[n]);
    return html + '</music-bar>';
}

/**
.createSigHTML(bar0, defaultKeyName)
Serialises the side-column signature staves for `bar0` into a `<music-sig>` HTML string.
**/
export function createSigHTML(bar0, defaultKeyName) {
    const hasMultipleParts = bar0.length > 1;
    let html = '<music-sig>';
    let n = -1;
    while (bar0[++n]) {
        const part    = bar0[n];
        const stave   = part.stave;
        const keyName = toKeyName(part.key !== undefined ? part.key : (defaultKeyName || bar0.key || 0));

        // Don't display "default" part name, or any part name if there is only one part
        if (hasMultipleParts && part.name !== 'default') {
            html += `<h2 class="part-name">${ part.name }</h2>`;
        }

        html += `<music-stave class="${ stave.type }-stave signature-stave stave" part="${ part.name }" stave="${ stave.type }"${ stave.pitched ? ` key="${ keyName }"` : '' }>`;
        const symbols = stave.createSignatureSymbols(keyName);
        let i = -1;
        while (symbols[++i]) html += createSymbolHTML(symbols[i]);
        html += '</music-stave>';
    }
    return html + '</music-sig>';
}
