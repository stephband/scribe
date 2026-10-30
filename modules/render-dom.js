
import create           from 'dom/create.js';
import px               from 'dom/parse-length.js';
import rect             from 'dom/rect.js';
//import Event            from 'sequence/modules/event.js';
//import Transform        from 'sequence/modules/transform.js';
//import SequenceIterator from 'sequence/modules/sequence-iterator.js';
//import { toKeyName }      from 'sequence/modules/event/key.js';
//import Stave            from './stave.js';
import createTree       from './tree.js';
import { createBarElement, createSigElement } from './create-element.js';
//import { renderBeam }   from './beam.js';
import * as glyphs      from './glyphs.js';
import truncate         from './number/truncate.js';
import config           from './config.js';
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

    // Calculate clef and key signature width

    // TODO: sort out a better system of getting the key signature metrics in here.
    // One that isn't going to rely on the font so much? Or maybe include the
    // metrics in the font stylesheet?
    const staves = root.querySelectorAll('.side [key]');
    const c = Array.from(staves).map((element) => counts[element.getAttribute('key')] || 0);
    c.push(0);
    const count = Math.max.apply(Math, c);
console.log('COUNT', count, (0.25 + 2.375 + count * 0.625 + 0.5).toFixed(6));
    return `
        --head-1-size:       ${ truncate(6, head1Width / fontSize) };
        --head-2-size:       ${ truncate(6, head2Width / fontSize) };
        --head-4-size:       ${ truncate(6, head3Width / fontSize) };
        --head-x-size:       ${ truncate(6, headXWidth / fontSize) };
        --head-diamond-size: ${ truncate(6, headDiamondWidth / fontSize) };
        --acci-flat-size:    ${ truncate(6, acciFlatWidth / fontSize) };
        --acci-sharp-size:   ${ truncate(6, acciSharpWidth / fontSize) };
        --signature-width: calc(var(--signature-label) + var(--signature-gap) + ${ (0.25 + 2.375 + count * 0.625 + 0.5).toFixed(6) }em);
    `;               // label and gap | margin | clef | accidentals | margin
}

export async function renderDOM(sequence, key, meter, transpose, displace, duration, settings) {
    // If events contains no initial key and key is available insert a key event
    const keyEvent = sequence.find({ beat: 0, type: 'key' })
        || key
        && sequence.create(0, 'key', key) ;

    // If events contains no initial meter and meter is available insert a meter event
    const meterEvent = sequence.find({ beat: 0, type: 'meter' })
        || meter
        && sequence.create(0, 'meter', meter[2], meter[3]) ;

    // Create render tree
    const tree = await createTree(sequence, settings, transpose, displace, duration);

    // Create DOM tree
    const fragment = document.createDocumentFragment();

    let n = -1;
    let bar, element;
    while (bar = tree[++n]) {
        element = createBarElement(bar);
        fragment.appendChild(element);
    }

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
