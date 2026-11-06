
import * as hasher from './hasher.js';

/**
Bar repeats

Detects runs of repeated 1, 2 and 4 bar phrases within a single part and
replaces them with bar repeat symbols.

Rather than serialising and storing symbols to compare against, each part-bar
is reduced to a 53-bit fingerprint, streamed straight out of its symbols
without building any intermediate string. Comparing bars is then a comparison
of two numbers. A detector holds only the last handful of fingerprints (plus
references to the corresponding parts, so that it can retroactively replace
them), however long the music goes on.
**/


// Repeat periods, in bars, in order of preference
const PERIODS = [1, 2, 4];

// Symbol properties that differ between otherwise identical bars, or that
// reference objects that are not part of a bar's musical content
const IGNORE = { id: true, stave: true, event: true };


/* Replacement */

function empty(entry) {
    entry.part.symbols.length = entry.start;
}

function replace(entry, count) {
    const { part, start } = entry;
    const { stave, symbols } = part;

    symbols.length = start;

    // Grand staves get a repeat symbol in each stave, like whole bar rests
    if (stave.type === 'grand') {
        symbols.push({ type: 'barrepeat', count, stave, voice: stave.voices[0] });
        symbols.push({ type: 'barrepeat', count, stave, voice: stave.voices[1] });
    }
    else {
        symbols.push({ type: 'barrepeat', count, stave, voice: stave.voices && stave.voices[0] });
    }
}

// Replace the last n bars of history with p-bar repeats. One p-bar repeat
// symbol is placed per block of p bars. A 1-bar repeat sits in its bar, a
// 2-bar repeat sits in the second bar of its block and a 4-bar repeat in the
// third, in both cases to be rendered straddling the preceding barline.
function replaceBlocks(history, n, p) {
    // history is newest first, so history[k] is the bar k bars ago, and the
    // newest bar of each block is at a multiple of p
    let k = -1;
    while (++k < n) {
        const position = p - 1 - k % p;
        if (position === (p === 1 ? 0 : p / 2)) replace(history[k], p);
        else empty(history[k]);
    }
}


/* BarRepeats */

export default class BarRepeater {
    constructor(settings) {
        const thresholds = {
            1: settings.barRepeat1Threshold,
            2: settings.barRepeat2Threshold,
            4: settings.barRepeat4Threshold
        };

        // Periods with a threshold of 0 are disabled
        this.periods    = PERIODS.filter((p) => thresholds[p] > 0);
        this.thresholds = thresholds;

        // History must reach back far enough to replace threshold * p bars
        // and to compare against the p bars before those
        this.depth = this.periods.reduce((depth, p) => Math.max(depth, (thresholds[p] + 1) * p), 0);

        // Newest first
        this.history = [];
        // Count of consecutive bars that match the bar p bars earlier
        this.runs    = { 1: 0, 2: 0, 4: 0 };
        // Period of the run currently being replaced with repeats
        this.period  = 0;
    }

    /**
    .push(bar, part, start, tied)
    Fingerprints the symbols of `part` from index `start` (symbols before
    `start` are key signatures, time signatures and the like, and are never
    replaced). Where repetition is detected, replaces this bar of the part,
    and the part in previously pushed bars, with bar repeats. `tied` flags
    whether notes are tied into the bar from the previous bar.
    **/
    push(bar, part, start, tied) {
        const { periods, thresholds, history, runs } = this;
        if (!periods.length) return;

        const { symbols } = part;

        hasher.begin();
        hasher.value(bar.duration);
        hasher.value(bar.divisor);
        hasher.value(part.key);
        hasher.value(tied);

        let content = false;
        let n = start - 1;
        while (symbols[++n]) {
            const type = symbols[n].type;
            if (type === 'note' || type === 'chord') content = true;
            hasher.symbol(symbols[n], IGNORE);
        }

        const hash = hasher.end();
        const entry = { hash, part, start, tied, content };

        history.unshift(entry);
        if (history.length > this.depth) history.length = this.depth;

        // Update runs of matches for each period
        let p, i = -1;
        while (p = periods[++i]) {
            runs[p] = history[p] && history[p].hash === entry.hash ?
                runs[p] + 1 :
                0 ;
        }

        // Continue an established run, replacing each block as it completes
        if (this.period) {
            p = this.period;
            if (runs[p]) {
                if (runs[p] % p === 0) replaceBlocks(history, p, p);
                this.resetOthers(p);
                return;
            }

            // Run is broken
            this.period = 0;
        }

        // Establish a new run when threshold repeats of a phrase have been seen
        i = -1;
        while (p = periods[++i]) {
            n = thresholds[p] * p;
            if (runs[p] !== n) continue;

            // Every block in a run has identical fingerprints, so if these
            // checks fail now they would fail at every later block too.
            // The first replaced bar must not have notes tied into it from
            // the bar before, which would be left tied to nothing.
            if (history[n - 1].tied) continue;
            // Do not repeat phrases of nothing but rests
            if (!hasContent(history, p)) continue;

            replaceBlocks(history, n, p);
            this.period = p;
            this.resetOthers(p);
            return;
        }
    }

    // While a run is replacing bars other periods may not count those bars
    resetOthers(p) {
        const { periods, runs } = this;
        let q, i = -1;
        while (q = periods[++i]) if (q !== p) runs[q] = 0;
    }
}

function hasContent(history, p) {
    let k = -1;
    while (++k < p) if (history[k].content) return true;
    return false;
}
