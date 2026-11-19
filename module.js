
import slugify       from 'fn/slugify.js';
import { Sequence }  from 'sequence/module.js';
import renderHTML    from './modules/render-html-on-worker.js';
import config        from './modules/config.js';


const DEBUG  = globalThis.DEBUG;
const assign = Object.assign;


function toHeaderHTML(signatures) {
    if (!signatures || !signatures[0]) return '';
    const sig = signatures[0].html;
    let html = '<header id="side" class="side">';
    let i = 24;
    while (i--) html += sig;
    return html + '</header>';
}

function patchDOM(node, state, signatures, bars, length) {
    const sig     = signatures && signatures[0];
    const sigHash = sig ? sig.hash : undefined;

    if (!state.bars) {
        const header = toHeaderHTML(signatures);
        const body   = bars.map((b) => b.html).join('');
        node.innerHTML = header + body;
        state.sigHash  = sigHash;
        state.hashes   = bars.map((b) => b.hash);
        state.bars     = Array.from(node.querySelectorAll('music-bar'));
        return;
    }

    // Patch side header only when signatures change
    let side = node.firstElementChild;
    if (!side || side.id !== 'side') side = null;

    if (sigHash !== state.sigHash) {
        const header = toHeaderHTML(signatures);
        if (header && side) {
            side.outerHTML = header;
            side = node.firstElementChild;
        }
        else if (header) {
            node.insertAdjacentHTML('afterbegin', header);
            side = node.firstElementChild;
        }
        else if (side) {
            side.remove();
            side = null;
        }
        state.sigHash = sigHash;
    }

    // Patch only changed bars by index
    const barEls = state.bars;
    const hashes = state.hashes;
    let i = -1;
    let bar;
    while (bar = bars[++i]) {
        const { index, html, hash } = bar;
        if (index < barEls.length) {
            const el   = barEls[index];
            const next = el.nextElementSibling;
            el.outerHTML = html;
            barEls[index] = next ? next.previousElementSibling : node.lastElementChild;
        }
        else {
            const anchor = barEls.length ? barEls[barEls.length - 1] : side;
            if (anchor) anchor.insertAdjacentHTML('afterend', html);
            else node.insertAdjacentHTML('beforeend', html);
            barEls.push(anchor ? anchor.nextElementSibling : node.lastElementChild);
        }
        hashes[index] = hash;
    }

    // Remove trailing bars if score shrank
    while (barEls.length > length) barEls.pop().remove();
    hashes.length = length;
}

export default class Scribe {
    #frameId = 0;

    staff     = 'treble';
    key       = 'C';
    transpose = 0;
    beat      = 0;
    duration  = Infinity;
    swingAsStraight8ths  = false;
    swingAsStraight16ths = false;

    constructor(node, options) {
        if (!node) throw new TypeError('Scribe(node) requires a DOM element');
        this.node   = node;
        this.hashes = [];
        this.bars   = null;
        if (options) assign(this, options);
    }

    async render(sequence, parts = this.parts || (sequence && sequence.parts) || [{ staff: this.staff }]) {
        if (!sequence) return;
        if (!(sequence instanceof Sequence)) sequence = Sequence.from(sequence);

        const debug = DEBUG && sequence.name ? { name: sequence.name } : null;
        if (debug) debug.t0 = performance.now();

        const { node, key, timesig, transpose, beat, duration, swingAsStraight8ths, swingAsStraight16ths } = this;
        const settings = assign({}, config, { swingAsStraight8ths, swingAsStraight16ths });

        const rid = ++this.#frameId;
        const { signatures, bars, length } = await renderHTML(sequence, parts, key, timesig, transpose, beat, duration, settings, debug, this.hashes);
        if (rid !== this.#frameId) return;
        if (debug) debug.t3 = performance.now();

        patchDOM(node, this, signatures, bars, length);
        if (debug) debug.t4 = performance.now();

        // Print performance logs
        if (debug && globalThis.localStorage) {
            const storageKey = `debug-scribe-music-${ slugify(debug.name) }`;
            const stats = JSON.parse(localStorage.getItem(storageKey) || '[]');
            stats.push(debug);
            localStorage.setItem(storageKey, JSON.stringify(stats));
            console.log(debug.name, sequence);
            console.table(stats.map((debug) => ({
                serial: debug.ts - debug.t0,
                treeA:  debug.ta - debug.w0,
                treeB:  debug.tb - debug.ta,
                treeC:  debug.tc - debug.tb,
                treeD:  debug.td - debug.tc,
                tree:   debug.t1 - debug.td,
                body:   debug.t2 - debug.t1,
                header: debug.w3 - debug.t2,
                worker: debug.t3 - debug.ts,
                DOM:    debug.t4 - debug.t3,
                main:   (debug.ts - debug.t0) + (debug.t4 - debug.t3),
                total:  debug.t4 - debug.t0
            })));
        }
    }
}
