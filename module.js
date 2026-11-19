
import renderHTML from './modules/render-html-on-worker.js';


const DEBUG = globalThis.DEBUG;


function toHeaderHTML(signatures) {
    if (!signatures || !signatures[0]) return '';
    const sig = signatures[0].html;
    let html = '<header id="side" class="side">';
    let i = 24;
    while (i--) html += sig;
    return html + '</header>';
}

function patchDOM(node, internals, signatures, bars, length) {
    const sig     = signatures && signatures[0];
    const sigHash = sig ? sig.hash : undefined;

    if (!internals.bars) {
        const header = toHeaderHTML(signatures);
        const body   = bars.map((b) => b.html).join('');
        node.replaceChildren(internals.link, internals.style);
        internals.style.insertAdjacentHTML('afterend', header + body);
        internals.sigHash = sigHash;
        internals.hashes  = bars.map((b) => b.hash);
        internals.bars    = Array.from(node.querySelectorAll('music-bar'));
        return;
    }

    // Patch side header only when signatures change
    let side = internals.style.nextElementSibling;
    if (side && side.id !== 'side') side = null;

    if (sigHash !== internals.sigHash) {
        const header = toHeaderHTML(signatures);
        if (header && side) {
            side.outerHTML = header;
            side = internals.style.nextElementSibling;
        }
        else if (header) {
            internals.style.insertAdjacentHTML('afterend', header);
            side = internals.style.nextElementSibling;
        }
        else if (side) {
            side.remove();
            side = null;
        }
        internals.sigHash = sigHash;
    }

    // Patch only changed bars by index
    const barEls = internals.bars;
    const hashes = internals.hashes;
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
            const anchor = barEls.length ? barEls[barEls.length - 1] : (side || internals.style);
            anchor.insertAdjacentHTML('afterend', html);
            barEls.push(anchor.nextElementSibling);
        }
        hashes[index] = hash;
    }

    // Remove trailing bars if score shrank
    while (barEls.length > length) barEls.pop().remove();
    hashes.length = length;
}

export default class Scribe {
    constructor() {
        this.hashes = [];
    }

    render(sequence, parts = this.parts || sequence.parts || [{ staff: internals.staff.value }]) {
        const debug = DEBUG && sequence.name ? { name: sequence.name } : null ;
        if (debug) debug.t0 = performance.now();

        // Read through Data.of() synchronously before awaiting Worker so Signal
        // tracks sequence/event mutations while Worker runs on plain tuples
        const { key, timesig, transpose, beat, duration } = this;
        const settings  = assign({}, config, {
            swingAsStraight8ths:  internals.swingAsStraight8ths.value,
            swingAsStraight16ths: internals.swingAsStraight16ths.value
        });

        const rid = this.#frameId = (this.#frameId || 0) + 1;
        const { signatures, bars, length } = await renderHTML(sequence, parts, key, timesig, transpose, beat, duration, settings, debug, this.hashes);
        if (rid !== this.#frameId) return;
        if (debug) debug.t3 = performance.now();

        patchDOM(node, this, signatures, bars, length);
        if (debug) debug.t4 = performance.now();

    //    internals.style.textContent = `:host { ${ renderStyle(this, node) } }`;
    //    this.dispatchEvent(new CustomEvent('render'));
        if (debug) debug.t5 = performance.now();

        // Print performance logs
        if (debug) {
            const key   = `debug-scribe-music-${ slugify(debug.name) }`;
            const stats = JSON.parse(localStorage.getItem(key) || '[]');
            stats.push(debug);
            localStorage.setItem(key, JSON.stringify(stats));
            // Print title
            console.log(debug.name);
            // Print table
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
                style:  debug.t5 - debug.t4,
                main:   (debug.ts - debug.t0) + (debug.t5 - debug.t3),
                total:  debug.t5 - debug.t0
            })));
        }
    }
}
