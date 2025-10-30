
import create           from 'dom/create.js';
import px               from 'dom/parse-length.js';
import rect             from 'dom/rect.js';
import { toRootName }   from 'midi/note.js';
import SequenceIterator from 'sequence/sequence-iterator.js';
import Stave            from './stave.js';
import createBars       from './create-bars.js';
import createElement    from './create-element.js';
import { renderBeam }   from './beam.js';
import * as glyphs      from './glyphs.js';
import truncate         from './number/truncate.js';
import config           from './config.js';


function isInitialMeterEvent(event) {
    return event[0] <= 0 && event[1] === 'meter';
}

function isInitialKeyEvent(event) {
    return event[0] <= 0 && event[1] === 'key';
}

function toElements(nodes, symbol) {
    const element = createElement(symbol);
    if (element) { nodes.push(element); }
    return nodes;
}

export function toBarElements(elements, bar) {
    elements.push(create('div', {
        class: `${ bar.stave.type }-stave stave ${ bar.doubleBarLine ? 'end-bar ' : '' }bar${ bar.error ? ' error ': '' }`,
        data: {
            beat: bar.beat,
            duration: bar.duration,
            count: bar.count,
            key: toRootName(bar.key),
            stave: bar.stave.type
        },
        children: bar.symbols.reduce(toElements, [])
    }));

    return elements;
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

export function renderElements(data, excludes, clef, keyname, meter, duration = Infinity, transpose = 0, displace = 0, settings = config) {
    const events = data.events;

    // If events contains no initial meter and meter is set, insert a meter event
    const meterEvent = events.find(isInitialMeterEvent);
    if (!meterEvent && meter) events.unshift([0, 'meter', meter[2], meter[3]]);

    // If events contains no initial key and keyname is set, insert a key event
    const keyEvent = events.find(isInitialKeyEvent);
    if (!keyEvent && keyname) events.unshift([0, 'key', keyname]);

    // Get the stave controller
    const stave = Stave[clef || 'treble'];

    // Make transforms list
    const transforms = [];
    if (transpose) transforms.push("transpose", transpose);
    if (displace)  transforms.push("displace", displace);

    // Create sequence object
    const sequence = new SequenceIterator(events, data.sequences, transforms);

    // Create bar elements
    const bars = createBars(sequence, excludes, stave, settings);
    const elements = bars.reduce(toBarElements, []);

//const keysig = elements[0].querySelectorAll('.acci:not([data-beat])');

    // Creates stave with clef and key signature
    const bar0      = bars[0];
    const key       = bar0.key;
    const signature = stave.createSignatureSymbols(key);

    // Quick and dirty way of rendering clefs into left hand side bar
    const sidebar = create('div', {
        class: `${ stave.type }-stave signature-stave stave`,
        children: signature.map(createElement),
        data: { key: toRootName(key) }
    });

    const column = create('div', {
        id: 'side',
        class: 'side',
        data: { key: toRootName(key) }
    });

    let n = 24;
    while (n--) column.appendChild(sidebar.cloneNode(true));

    // Return array of elements
    elements.unshift(column);
    return elements;
}


const heads = [
    create('span', { html: glyphs.head1, style: 'width: min-content;' }),
    create('span', { html: glyphs.head2, style: 'width: min-content;' }),
    create('span', { html: glyphs.head4, style: 'width: min-content;' })
];

function remove(element) {
    element.remove();
}

export function renderStyle(element, root = element) {
    // Measure head widths. Be aware that root may be a fragment (a shadow root)
    // and getComputedStyle() won't work on a fragment
    root.append.apply(root, heads);

    const head1Width = rect(heads[0]).width;
    const head2Width = rect(heads[1]).width;
    const head3Width = rect(heads[2]).width;
    const computed   = window.getComputedStyle(heads[0]);
    const fontSize   = px(computed.fontSize);
console.log('FONT SIZE', fontSize);

    heads.forEach(remove);

    // Calculate clef and key signature width

    // TODO: sort out a better system of getting the key signature metrics in here.
    // One that isn't going to rely on the font so much? Or maybe include the
    // metrics in the font stylesheet?
    const side   = root.querySelector('.side');
    const key    = side.dataset.key;
    const counts = {'G♭': 6, 'C♯': 5, 'D♭': 5, 'G♯': 4, 'A♭': 4, 'D♯': 3, 'E♭': 3, 'B♭': 2, 'F':  1, 'C':  0, 'G':  1, 'D':  2, 'A':  3, 'E':  4, 'B':  5, 'F♯': 6};
    const count  = counts[key];

    return `--head-1-size: ${ truncate(6, head1Width / fontSize) }; `
        + `--head-2-size: ${ truncate(6, head2Width / fontSize) }; `
        + `--head-4-size: ${ truncate(6, head3Width / fontSize) }; `
        + `--signature-width: ${ (2.25 + count * 0.625 + 0.625).toFixed(4) }em;`;
}

export function renderDOM(element, root = element) {
    // Render beams
    root.querySelectorAll('.beam').forEach(renderBeam);
}
