

import requestTree from './tree.js';
import { createBarHTML, createSigHTML } from './create-html.js';


const global = globalThis || window;

const fontMetricsCache = new Map();
if (global.document?.fonts) {
    global.document.fonts.addEventListener('loadingdone', () => fontMetricsCache.clear());
}

export default async function renderDOM(sequence, parts, key, timesig, transpose, displace, duration, settings, debug) {
    // Create render tree
    const tree = await requestTree(sequence, parts, key, timesig, transpose, displace, duration, settings, debug);
    if (debug) debug.t1 = performance.now();

    // Create HTML music
    let html = '';
    let n = -1;
    while (tree[++n]) html += createBarHTML(tree[n]);
    if (debug) debug.t2 = performance.now();

    // Create HTML signatures
    if (tree[0]) {
        let header = '<header id="side" class="side">';
        const bar0 = tree[0];
        const sig  = createSigHTML(bar0);

        let n = 24;
        while (n--) header += sig;

        header += '</header>';
        html = header + html;
    }

    return html;
}
