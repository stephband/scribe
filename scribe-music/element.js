
import Data          from 'fn/data.js';
import Signal        from 'fn/signal.js';
import slugify       from 'fn/slugify.js';
import element, { getInternals } from 'dom/element.js';
import { Sequence }  from 'sequence/module.js';
import Stave         from '../modules/stave.js';
import renderHTML    from '../modules/render-html-on-worker.js';
import renderStyle   from '../modules/render-style.js';
import config        from '../modules/config.js';

import '../modules/setup-data.js';

const DEBUG  = globalThis.DEBUG;
const assign = Object.assign;
const define = Object.defineProperties;

/* ScribeMusic.stylesheet */
const shadowCSSUrl = new URL('shadow.css', import.meta.url);
const stylesheet = Signal.of();


function parseScript(script) {
    const type = (script.type || script.getAttribute('type') || '').trim().split(';')[0].toLowerCase();
    return type.endsWith('sequence') ?
        // Script contains sequence format text
        Sequence.parse(script.textContent) :
        // Script contains JSON
        Sequence.from(JSON.parse(script.textContent)) ;
}

function toHeaderHTML(signatures) {
    if (!signatures || !signatures[0]) return '';
    const sig = signatures[0].html;
    let html = '<header id="side" class="side">';
    let i = 24;
    while (i--) html += sig;
    return html + '</header>';
}

function patchShadow(shadow, internals, signatures, bars, length) {
    const sig     = signatures && signatures[0];
    const sigHash = sig ? sig.hash : undefined;

    if (!internals.bars) {
        const header = toHeaderHTML(signatures);
        const body   = bars.map((b) => b.html).join('');
        shadow.replaceChildren(internals.link, internals.style);
        internals.style.insertAdjacentHTML('afterend', header + body);
        internals.sigHash = sigHash;
        internals.hashes  = bars.map((b) => b.hash);
        internals.bars    = Array.from(shadow.querySelectorAll('music-bar'));
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
            barEls[index] = next ? next.previousElementSibling : shadow.lastElementChild;
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

/* Register <scribe-music> */

export default define(element('scribe-music', {
    shadow: `
        <link rel="stylesheet" href="${ shadowCSSUrl }" />
        <style></style>
    `,

    construct: function(shadow, internals) {
        // Listen to updates to ScribeMusic.stylesheet and update the link
        internals.link = shadow.querySelector('link');
        if (stylesheet.value) internals.link.href = stylesheet.value;

        // Shadow elements
        internals.style = shadow.querySelector('style');

        // Set up listeners for attribute/property changes
        internals.data      = Signal.of();
        internals.staff     = Signal.of('treble');
        internals.key       = Signal.of('C');
        internals.timesig   = Signal.of();
        internals.beat      = Signal.of(0);
        internals.duration  = Signal.of(Infinity);
        internals.transpose = Signal.of(0);
        internals.swingAsStraight8ths  = Signal.of(false);
        internals.swingAsStraight16ths = Signal.of(false);
        internals.debug     = Signal.of(false);

        /* Safari has some rounding errors to overcome... */
        internals.isSafari = navigator.userAgent.includes('AppleWebKit/')
            && !navigator.userAgent.includes('Chrome/')
            && !navigator.userAgent.includes('Edge/')
            && !navigator.userAgent.includes('Gecko/');

        internals.handleEvent = (e) => {
            switch (e.type) {
                case 'loadingdone':
                    internals.style.textContent = `:host { ${ renderStyle(this, shadow) } }`;
                    break;
            }
        };
    },

    connect: function(shadow, internals) {
        // If Safari
        if (internals.isSafari) this.classList.add('safari');

        // Update style on font load
        document.fonts.addEventListener('loadingdone', internals);

        // If there is no src use text content as data
        if (!this.src) {
            const source = this.textContent.trim();
            internals.data.value = Sequence.parse(source);
        }

        // Listens to changes
        return Signal.frame(async () => {
            if (!internals.data.value) return;

            const debug = DEBUG && internals.data.value.name ? { name: internals.data.value.name } : null ;
            if (debug) debug.t0 = performance.now();

            // Read through Data.of() synchronously before awaiting Worker so Signal
            // tracks sequence/event mutations while Worker runs on plain tuples
            const data      = internals.data.value;
            const parts     = data.parts || (internals.staff.value ? [{ staff: internals.staff.value }] : undefined);
            const key       = internals.key.value;
            const timesig   = internals.timesig.value;
            const transpose = internals.transpose.value;
            const beat      = internals.beat.value;
            const duration  = internals.duration.value;
            const settings  = assign({}, config, {
                swingAsStraight8ths:  internals.swingAsStraight8ths.value,
                swingAsStraight16ths: internals.swingAsStraight16ths.value
            });

            const rid = internals.frameId = (internals.frameId || 0) + 1;
            const { signatures, bars, length } = await renderHTML(
                data,
                parts,
                key,
                timesig,
                transpose,
                beat,
                duration,
                settings,
                debug,
                internals.hashes
            );
            if (rid !== internals.frameId || !this.isConnected) return;
            if (debug) debug.t3 = performance.now();

            patchShadow(shadow, internals, signatures, bars, length);
            if (debug) debug.t4 = performance.now();

        //    internals.style.textContent = `:host { ${ renderStyle(this, shadow) } }`;
        //    this.dispatchEvent(new CustomEvent('render'));
            if (debug) debug.t5 = performance.now();

            // Print performance logs
            if (debug) {
                const key   = `debug-scribe-music-${ slugify(debug.name) }`;
                const stats = JSON.parse(localStorage.getItem(key) || '[]');
                stats.push(debug);
                localStorage.setItem(key, JSON.stringify(stats));
                // Print title
                console.log(
                    debug.name,
                    internals.data.value
                );
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
        });
    },

    load: function(shadow, internals) {
        // Recalculate when style loads
        internals.style.textContent = `:host { ${ renderStyle(this, shadow) } }`;
    },

    disconnect: function(shadow, internals) {
        document.fonts.removeEventListener('loadingdone', internals);
    }
}, {
    staff: {
        /**
        staff="treble"
        Choose the default staff to render. Not that if the rendered sequence
        contains staff events, they override this choice. Possible staves are
        `"treble"`, `"bass"`, `"grand"`, `"drum"`, `"percussion"`, `"chord"`.
        **/
        attribute: function(value) { this.staff = value; },

        /**
        .staff = "treble"
        Choose the default staff to render. Not that if the rendered sequence
        contains staff events, they override this choice. Possible staves are
        `"treble"`, `"bass"`, `"grand"`, `"drum"`, `"percussion"`, `"chord"`.
        **/
        get: function() {  return getInternals(this).staff.value; },
        set: function(value) {
            if (!Stave[value]) {
                console.warn('<scribe-music> Attempt to set invalid staff="' + value + '" ignored');
                return;
            }

            getInternals(this).staff.value = value;
        }
    },

    key: {
        /**
        key="C"
        Choose the key signature. Defaults to "C".
        **/
        attribute: function(value) {
            this.key = value === '' ? 'C' : value;
        },

        /**
        .key="C"
        Choose the key signature.
        **/
        get: function() { return getInternals(this).key.value; },
        set: function(value) {
            const internals = getInternals(this);

            // Validate
            if (typeof value !== 'string' || !/^[A-G][#b♯♭]?$/.test(value)) {
                console.warn('<scribe-music> Attempt to set invalid key="' + value + '" ignored');
                return;
            }

            // Set
            internals.key.value = value.replace(/[#b]$/, ($0) => $0 === '#' ? '♯' : '♭');
        }
    },

    meter: {
        /**
        meter="4/4"
        Sets the meter. Note that this is overridden by any `"meter"` event
        found at beat `0` in the data.
        **/
        attribute: function(value) {
            // Default to 4/4 where meter attribute simply exists
            this.meter = value === '' ? '4/4' : value;
        },

        /**
        .meter = "4/4"
        Sets the meter. Note that this is overridden by any `"meter"` event
        found at beat `0` in the data.
        **/
        get: function() { return getInternals(this).timesig.value; },
        set: function(value) { getInternals(this).timesig.value = value; }
    },

    beat: {
        /**
        beat="0"
        Sets beat that notation is rendered from.
        **/
        attribute: function(value) { this.beat = value; },

        /**
        .beat = 0
        Sets beat that notation is rendered from.
        **/
        get: function() { return getInternals(this).beat.value; },
        set: function(value) {
            getInternals(this).beat.value = typeof value === 'number' ?
                value :
                parseFloat(value) ;
        }
    },

    duration: {
        /**
        duration="0"
        Sets duration of notation, in beats.
        **/
        attribute: function(value) { this.duration = value; },

        /**
        .duration = 0
        Sets duration of notation, in beats.
        **/
        get: function() { return getInternals(this).duration.value; },
        set: function(value) {
            getInternals(this).duration.value = typeof value === 'number' ?
                value :
                parseFloat(value) ;
        }
    },

    transpose: {
        /**
        transpose="0"
        Sets transposition value for display of notation.
        **/
        attribute: function(value) { this.transpose = value; },

        /**
        .transpose = 0
        Sets transposition value for display of notation.
        **/
        get: function() { return getInternals(this).transpose.value; },
        set: function(value) {
            // Set integer from value
            getInternals(this).transpose.value = typeof value === 'number' ?
                Math.round(value) :
                parseInt(value, 10) ;
        }
    },

    type: {
        /**
        type="sequence"
        Mimetype or type of data to fetch. Possible mimetypes:
        - `"sequence"`
        - `"text/sequence"`
        - `"text/x-abc"`
        - `"text/plain"`
        - `"application/json"`
        **/
        attribute: function(value) { this.type = value; },

        /**
        .type
        Mimetype or type of data to fetch.
        **/
        get: function() { return getInternals(this).type; },
        set: function(value) { getInternals(this).type = value; }
    },

    /**
    src="url"
    A path to an ABC, JSON or SEQUENCE file
    **/
    src: {
        attribute: function(src) { this.src = src; },
        get: function() { return getInternals(this).src; },
        set: async function(src) {
            const internals = getInternals(this);
            internals.src = src;
            const url = new URL(src, window.location);

            // src points to a hash in current document
            if (window.location.origin === url.origin && window.location.pathname === url.pathname) {
                const id = url.hash.slice(1);
                const findScript = () => {
                    const root = this.getRootNode();
                    return (root && root.getElementById ? root.getElementById(id) : document.getElementById(id))
                        || this.querySelector('#' + id);
                };

                const script = findScript();
                if (!script) {
                    if (document.readyState === 'loading') {
                        window.addEventListener('DOMContentLoaded', () => {
                            const script = findScript();
                            if (!script) throw new Error('<scribe-music> src script "' + src + '" not found in document');
                            this.data = parseScript(script);
                        }, { once: true });
                        return;
                    }
                    throw new Error('<scribe-music> src script "' + src + '" not found in document');
                }
                this.data = parseScript(script);
                return;
            }

            // Fetch url
            const response = await fetch(url);
            if (!response.ok) throw new Error(`${ response.status } ${ response.statusText } "${ url.href }"`);

            // Parse data by mimetype
            const type = this.type
                || (/\.sequence(?:\?.*)?$/i.test(url.pathname) && 'text/sequence')
                //|| (/\.abc(?:\?.*)?$/i.test(url.pathname) ? 'text/x-abc')
                || (/\.midi?(?:\?.*)?$/i.test(url.pathname) && 'audio/midi')
                || 'application/json';

            switch (type) {
                case 'sequence':
                case 'text/sequence': {
                    const text = await response.text();
                    this.data = Sequence.parse(text);
                    break;
                }
                case 'midi':
                case 'audio/midi': {
                    const data = await response.arrayBuffer();
                    this.data = Sequence.parseMIDI(data);
                    break;
                }
                case 'json':
                case 'application/json': {
                    const json = await response.json();
                    this.data = Sequence.from(json);
                    break;
                }
            }
        },
        default:   null
    },

    /**
    .data
    **/
    data: {
        get: function() { return Data.of(getInternals(this).data.value); },
        set: function(data) {
            getInternals(this).data.value = data instanceof Sequence ?
                data :
                data ? Sequence.from(data) : null;
        },
        default: null
    },

    swing: {
        attribute: function(value) { getInternals(this).swingAsStraight8ths.value = value !== null; }
    },

    shuffle: {
        attribute: function(value) { getInternals(this).swingAsStraight16ths.value = value !== null; }
    },

    debug: {
        attribute: function(value) { this.debug = value !== null; },
        get: function() { return getInternals(this).debug.value; },
        set: function(value) { getInternals(this).debug.value = !!value; }
    }
}, 'stephband.band/scribe/'), {
    // Define ScribeMusic.styleheet as the stylesheet signal
    stylesheet: {
        set: (url) => stylesheet.value = url,
        get: ()    => stylesheet.value
    }
});
