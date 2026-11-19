
import KeyEvent      from 'sequence/modules/event/key.js';
import MeterEvent    from 'sequence/modules/event/meter.js';
import deserialise   from './deserialise.js';
import read          from '../tree/read.js';
import quantise      from '../tree/quantise.js';
import spell         from '../spell.js';
import symbolise     from '../tree/symbolise.js';
import { begin, string, end }            from '../tree/hasher.js';
import { createBarHTML, createSigHTML }  from '../create-html.js';
import config        from '../config.js';


const { assign } = Object;

function spellPart({ spellables, transpose }) {
    if (!spellables || !spellables.length) return;
    if (transpose) {
        let n = -1;
        let event;
        while (event = spellables[++n]) event.transpose(transpose);
    }
    return spell(spellables);
}

function hashString(str) {
    begin();
    string(str);
    return end();
}

export default async function renderWorker({
    data,
    texts,
    hashes,
    parts,
    key,
    timesig,
    beat = 0,
    settings = {},
    debug: collectDebug
}) {
    const debug = collectDebug ? { w0: performance.now() } : null;
    settings = assign({}, config, settings);

    const keyEvent   = key && KeyEvent.of(0, key);
    const meterEvent = timesig && assign(MeterEvent.of(0, 0b1010, 1), { timesig });
    const events     = deserialise(data, texts);
    if (debug) debug.ta = performance.now();

    // Ingest events into tree of bars, parts and spellables
    const tree = read(settings, events, parts, keyEvent, meterEvent, beat);
    if (debug) debug.tb = performance.now();

    // Metric quantisation of event beats
    quantise(settings, tree.parts, tree);
    if (debug) debug.tc = performance.now();

    // Spell pitched notes and chords
    if (settings.showAtConcertPitch) {
        await spell(tree.spellables);
    }
    else {
        await Promise.all(tree.parts.map(spellPart));
    }
    if (debug) debug.td = performance.now();

    // Construct tree symbols, beams and bar repeats
    symbolise(settings, tree.parts, tree);
    if (debug) debug.t1 = performance.now();

    // Create per-bar HTML strings and filter to changed hashes
    const bars   = [];
    const length = tree.length;
    let index = -1;
    while (tree[++index]) {
        const bar  = tree[index];
        const html = createBarHTML(bar);
        const hash = hashString(html);
        if (!hashes || hashes[index] !== hash) {
            bars.push({ index, beat: bar.beat, html, hash });
        }
    }
    if (debug) debug.t2 = performance.now();

    // Create signature HTML for a single set of staves
    const signatures = [];
    if (tree[0]) {
        const html = createSigHTML(tree[0]);
        const hash = hashString(html);
        signatures.push({ beat: 0, html, hash });
    }
    if (debug) debug.w3 = performance.now();

    return { signatures, bars, length, debug };
}
