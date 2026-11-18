

import requestTree from './tree.js';
import { createBarHTML, createSigHTML } from './create-html.js';

/**
.renderHTML(sequence, parts, key, timesig, transpose, displace, duration, settings, debug)
Builds the render tree and returns `{ header, bars }` HTML strings for
full or incremental shadow-DOM patching.
**/

export default async function renderHTML(sequence, parts, key, timesig, transpose, displace, duration, settings, debug) {
    // Create render tree
    const tree = await requestTree(sequence, parts, key, timesig, transpose, displace, duration, settings, debug);
    if (debug) debug.t1 = performance.now();

    // Create per-bar HTML strings
    const bars = [];
    let n = -1;
    while (tree[++n]) bars.push(createBarHTML(tree[n]));
    if (debug) debug.t2 = performance.now();

    // Create side-column signatures HTML
    let header = '';
    if (tree[0]) {
        const sig = createSigHTML(tree[0]);
        header = '<header id="side" class="side">';
        let i = 24;
        while (i--) header += sig;
        header += '</header>';
    }

    return { header, bars };
}
