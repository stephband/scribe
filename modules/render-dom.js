
import create           from 'dom/create.js';
import px               from 'dom/parse-length.js';
import rect             from 'dom/rect.js';
import requestTree      from './tree.js';
import { createBarElement, createSigElement } from './create-element.js';
import * as glyphs      from './glyphs.js';
import truncate         from './number/truncate.js';
import log              from './log.js';


const global = globalThis || window;
const heads = [
    create('span', { html: glyphs.head1,       style: 'width: min-content;' }),
    create('span', { html: glyphs.head2,       style: 'width: min-content;' }),
    create('span', { html: glyphs.head4,       style: 'width: min-content;' }),
    create('span', { html: glyphs.headX,       style: 'width: min-content;' }),
    create('span', { html: glyphs.headDiamond, style: 'width: min-content;' }),
    create('span', { html: glyphs.acciFlat,    style: 'width: min-content;' }),
    create('span', { html: glyphs.acciSharp,   style: 'width: min-content;' })
];

const counts = { 'F♭': 7, 'C♭': 7, 'G♭': 6, 'D♭': 5, 'A♭': 4, 'E♭': 3, 'B♭': 2, 'F':  1, 'C':  0, 'G':  1, 'D':  2, 'A':  3, 'E':  4, 'B':  5, 'F♯': 6, 'C♯': 7, 'G♯': 7 };

const fontMetricsCache = new Map();
if (global.document?.fonts) {
    global.document.fonts.addEventListener('loadingdone', () => fontMetricsCache.clear());
}

function measureHeadMetrics(element, root) {
    let cacheKey;
    if (element && element.nodeType === 1) {
        const hostStyle = getComputedStyle(element);
        cacheKey = `${ hostStyle.fontFamily }|${ hostStyle.fontSize }`;
        const cached = fontMetricsCache.get(cacheKey);
        if (cached) return cached;
    }

    // Measure head widths. Be aware that root may be a fragment (a shadow root)
    // and getComputedStyle() won't work on a fragment
    root.append.apply(root, heads);

    const head1Width       = rect(heads[0]).width;
    const head2Width       = rect(heads[1]).width;
    const head3Width       = rect(heads[2]).width;
    const headXWidth       = rect(heads[3]).width;
    const headDiamondWidth = rect(heads[4]).width;
    const acciFlatWidth    = rect(heads[5]).width;
    const acciSharpWidth   = rect(heads[6]).width;
    const computed         = getComputedStyle(heads[0]);
    const fontSize         = px(computed.fontSize);

    if (global.DEBUG) log('post render font-size', fontSize, 'heads', `${ head1Width }, ${ head2Width }, ${ head3Width }`);

    heads.forEach(remove);

    const metrics = {
        head1Size:       truncate(6, head1Width / fontSize),
        head2Size:       truncate(6, head2Width / fontSize),
        head4Size:       truncate(6, head3Width / fontSize),
        headXSize:       truncate(6, headXWidth / fontSize),
        headDiamondSize: truncate(6, headDiamondWidth / fontSize),
        acciFlatSize:    truncate(6, acciFlatWidth / fontSize),
        acciSharpSize:   truncate(6, acciSharpWidth / fontSize)
    };

    if (cacheKey && fontSize > 0 && head1Width > 0) {
        fontMetricsCache.set(cacheKey, metrics);
    }

    return metrics;
}


/* Glyphs for triplet mark d d = d 3 d, instead of saying Swing 8ths, for example
text = glyphs.textNoteShort
    + glyphs.textBeam8Short
    + glyphs.textNote8Short
    + '='
    + glyphs.textNoteShort
    + ' '
    + glyphs.textTuplet3Long
    + glyphs.note05Up
*/


export function remove(element) {
    element.remove();
}

export function renderStyle(element, root = element) {
    const metrics = measureHeadMetrics(element, root);

    // Calculate clef and key signature width

    // TODO: sort out a better system of getting the key signature metrics in here.
    // One that isn't going to rely on the font so much? Or maybe include the
    // metrics in the font stylesheet?
    const staves = root.querySelectorAll('.side [key]');
    const c = Array.from(staves).map((element) => counts[element.getAttribute('key')] || 0);
    c.push(0);
    const count = Math.max.apply(Math, c);
    const sig = root.querySelector('.side music-sig');
    const hasPartNames = Boolean(sig && sig.querySelectorAll('.part-name').length > 0 && sig.querySelectorAll('music-stave').length > 1);
    const labelWidth = hasPartNames ? 'var(--signature-label) + var(--signature-gap) + ' : '';
    const hasMultipleParts = Boolean(
        root.querySelector('music-bar > music-stave:nth-of-type(2)') ||
        root.querySelector('.side music-stave:nth-of-type(2)')
    );

    if (element && element.toggleAttribute) {
        element.toggleAttribute('parts', hasMultipleParts);
    }

    return `
        --head-1-size:       ${ metrics.head1Size };
        --head-2-size:       ${ metrics.head2Size };
        --head-4-size:       ${ metrics.head4Size };
        --head-x-size:       ${ metrics.headXSize };
        --head-diamond-size: ${ metrics.headDiamondSize };
        --acci-flat-size:    ${ metrics.acciFlatSize };
        --acci-sharp-size:   ${ metrics.acciSharpSize };
        --signature-label:   ${ hasPartNames ? '0.3125em' : '0em' };
        --signature-gap:     ${ hasPartNames ? '0.1875em' : '0em' };
        --signature-width:   calc(${ labelWidth }${ (0.25 + 2.375 + count * 0.625 + 0.5).toFixed(6) }em);
        row-gap:             ${ hasMultipleParts ? 'var(--row-gap, 3em)' : 'var(--row-gap, 0)' };
    `;               // label and gap | margin | clef | accidentals | margin
}

export async function renderDOM(sequence, parts, key, timesig, transpose, displace, duration, settings) {
    // Create render tree
    const tree = await requestTree(sequence, parts, key, timesig, transpose, displace, duration, settings);

    // Create DOM tree
    const fragment = document.createDocumentFragment();
    let n = -1;
    while (tree[++n]) fragment.appendChild(createBarElement(tree[n]));

    // Create side column with signatures
    if (tree[0]) {
        const bar0   = tree[0];
        const sig    = createSigElement(bar0);
        const column = create('header', { id: 'side', class: 'side' });

        let n = 24;
        while (n--) column.appendChild(sig.cloneNode(true));

        fragment.prepend(column);
    }

    return fragment;
}
