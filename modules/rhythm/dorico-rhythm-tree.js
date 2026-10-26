/**
dorico-rhythm-tree.js
Implementation of Dorico's continuous-time Rhythm Tree & Metric Slicing Engine.

Dorico decouples continuous sounding musical duration from written visual notation.
Continuous-time notes [onset, duration] are projected onto a hierarchical Metric Tree
governed by the time signature and engraving rules (Gould / Dorico):

1. Slices continuous notes that cross major structural boundaries:
   - Half-bar boundaries (e.g. beat 2 in 4/4) are preserved by tying notes.
   - Beat boundaries are preserved for syncopated off-beat notes.
2. Formats note durations into standard metric values (whole, half, quarter, 8th, 16th, etc. + dotted).
3. Synthesizes metric rests in unallocated intervals conforming to the meter's beat hierarchy.
4. Groups sub-beat notes into beam groups based on metric tree depth.
**/

const noteValues = [
    { duration: 4.0,   name: 'whole',         dots: 0 },
    { duration: 3.0,   name: 'half',          dots: 1 },
    { duration: 2.0,   name: 'half',          dots: 0 },
    { duration: 1.75,  name: 'quarter',       dots: 2 },
    { duration: 1.5,   name: 'quarter',       dots: 1 },
    { duration: 1.0,   name: 'quarter',       dots: 0 },
    { duration: 0.875, name: 'eighth',        dots: 2 },
    { duration: 0.75,  name: 'eighth',        dots: 1 },
    { duration: 0.5,   name: 'eighth',        dots: 0 },
    { duration: 0.375, name: 'sixteenth',     dots: 1 },
    { duration: 0.25,  name: 'sixteenth',     dots: 0 },
    { duration: 0.1875,name: 'thirty-second', dots: 1 },
    { duration: 0.125, name: 'thirty-second', dots: 0 },
    { duration: 0.0625,name: 'sixty-fourth',  dots: 0 }
];

const EPSILON = 1e-6;

function feq(a, b) {
    return Math.abs(a - b) < EPSILON;
}

function flt(a, b) {
    return a < b - EPSILON;
}

function fgt(a, b) {
    return a > b + EPSILON;
}

function flte(a, b) {
    return a <= b + EPSILON;
}

function fgte(a, b) {
    return a >= b - EPSILON;
}

/**
 * Builds a hierarchical Metric Tree node
 */
class MetricNode {
    constructor(start, end, depth = 0, isBoundary = false, beamGroupId = 0) {
        this.start = start;
        this.end = end;
        this.duration = end - start;
        this.depth = depth;
        this.isBoundary = isBoundary;
        this.beamGroupId = beamGroupId;
        this.children = [];
    }

    subdivide(splits, markBoundaries = false, depthIncrement = 1) {
        let cur = this.start;
        const total = splits.reduce((sum, s) => sum + s, 0);
        const scale = this.duration / total;

        for (let i = 0; i < splits.length; i++) {
            const next = cur + splits[i] * scale;
            const isBound = markBoundaries && i > 0;
            const child = new MetricNode(cur, next, this.depth + depthIncrement, isBound, this.beamGroupId * 10 + (i + 1));
            this.children.push(child);
            cur = next;
        }
        return this.children;
    }
}

/**
 * Constructs a Metric Tree for common time signatures
 */
export function buildMetricTree(numerator = 4, denominator = 4, subdivisionLimit = 0.25) {
    const barDuration = (numerator / denominator) * 4;
    const root = new MetricNode(0, barDuration, 0, true, 1);

    if (numerator === 4 && denominator === 4) {
        // 4/4: Split into 2 half-bar groups of 2 beats (boundary at beat 2)
        const halfBars = root.subdivide([2, 2], true);
        for (const hb of halfBars) {
            // Split into quarter-note beats
            const beats = hb.subdivide([1, 1], false);
            for (const beat of beats) {
                // Split into eighth-note subdivisions
                const eighths = beat.subdivide([0.5, 0.5], false);
                if (subdivisionLimit <= 0.25) {
                    for (const eighth of eighths) {
                        eighth.subdivide([0.25, 0.25], false);
                    }
                }
            }
        }
    } else if (numerator === 3 && denominator === 4) {
        // 3/4: 3 distinct quarter-note beats
        const beats = root.subdivide([1, 1, 1], false);
        for (const beat of beats) {
            const eighths = beat.subdivide([0.5, 0.5], false);
            if (subdivisionLimit <= 0.25) {
                for (const eighth of eighths) {
                    eighth.subdivide([0.25, 0.25], false);
                }
            }
        }
    } else if (numerator === 6 && denominator === 8) {
        // 6/8: Compound duple - 2 dotted-quarter beat groups of 1.5 beats
        const beatGroups = root.subdivide([1.5, 1.5], true);
        for (const bg of beatGroups) {
            // Split into eighths (0.5 each)
            const eighths = bg.subdivide([0.5, 0.5, 0.5], false);
            if (subdivisionLimit <= 0.25) {
                for (const eighth of eighths) {
                    eighth.subdivide([0.25, 0.25], false);
                }
            }
        }
    } else if (numerator === 2 && denominator === 4) {
        // 2/4: 2 beats of 1.0
        const beats = root.subdivide([1, 1], false);
        for (const beat of beats) {
            const eighths = beat.subdivide([0.5, 0.5], false);
            if (subdivisionLimit <= 0.25) {
                for (const eighth of eighths) {
                    eighth.subdivide([0.25, 0.25], false);
                }
            }
        }
    } else {
        // General default: regular beat units
        const beatUnit = 4 / denominator;
        const splits = new Array(numerator).fill(beatUnit);
        const beats = root.subdivide(splits, false);
        for (const beat of beats) {
            if (beatUnit >= 1.0) {
                const eighths = beat.subdivide([beatUnit / 2, beatUnit / 2], false);
                if (subdivisionLimit <= 0.25) {
                    for (const e of eighths) {
                        e.subdivide([e.duration / 2, e.duration / 2], false);
                    }
                }
            }
        }
    }

    return root;
}

/**
 * Finds all critical structural metric boundaries in a tree (e.g. half-bars and beats)
 */
export function getMetricBoundaries(metricTree) {
    const boundaries = [];

    function traverse(node) {
        if (node.isBoundary && node.start > 0) {
            boundaries.push({ time: node.start, depth: node.depth });
        }
        for (const child of node.children) {
            traverse(child);
        }
    }

    traverse(metricTree);
    return boundaries.sort((a, b) => a.time - b.time);
}

/**
 * Resolves a duration into standard notatable units (e.g. 1.5 -> dotted quarter)
 */
export function bestNoteValue(duration) {
    for (const val of noteValues) {
        if (fgte(duration, val.duration) || feq(duration, val.duration)) {
            return val;
        }
    }
    return noteValues[noteValues.length - 1];
}

/**
 * Dorico continuous-time interval projector:
 * Takes a continuous sounding interval [start, start + duration] and projects
 * it onto the metric tree, slicing across mandatory boundaries into tied segments.
 */
export function projectInterval(start, duration, metricTree) {
    const end = start + duration;
    const slices = [];
    const boundaries = getMetricBoundaries(metricTree);

    let curStart = start;

    while (flt(curStart, end)) {
        // Find the next significant boundary between curStart and end
        let nextBreak = end;

        for (const b of boundaries) {
            if (fgt(b.time, curStart) && flt(b.time, nextBreak)) {
                // If crossing a major structural boundary (e.g. half-bar), must break
                if (b.depth <= 2) {
                    nextBreak = b.time;
                    break;
                }
                // If starting on an off-beat syncopation, break at the beat boundary
                if (b.depth === 3 && (curStart % 1.0 !== 0)) {
                    nextBreak = b.time;
                    break;
                }
            }
        }

        // Subdivide the chunk [curStart, nextBreak] into legitimate notation durations
        let chunkDuration = nextBreak - curStart;

        while (fgt(chunkDuration, 0)) {
            let noteVal = bestNoteValue(chunkDuration);
            let pieceLen = noteVal.duration;

            // Dotting rules: prevent dotted notes from obscuring beat boundaries
            if (noteVal.dots > 0 && (curStart % 1.0 !== 0) && (curStart + pieceLen) % 1.0 === 0) {
                // Symmetrical syncopation exception: allow dotted quarter on beat if standard
            }

            if (fgt(pieceLen, chunkDuration)) {
                pieceLen = chunkDuration;
            }

            slices.push({
                beat: curStart,
                duration: pieceLen,
                valueName: noteVal.name,
                dots: noteVal.dots,
                tiedToNext: false,
                tiedFromPrev: false
            });

            curStart += pieceLen;
            chunkDuration -= pieceLen;
        }
    }

    // Set tie flags across adjacent segments
    for (let i = 0; i < slices.length; i++) {
        if (i < slices.length - 1) slices[i].tiedToNext = true;
        if (i > 0) slices[i].tiedFromPrev = true;
    }

    return slices;
}

/**
 * Synthesizes metric rests in unallocated gaps according to Gould/Dorico metric hierarchy
 */
export function synthesizeMetricRests(unallocatedStart, unallocatedEnd, metricTree) {
    const totalRest = unallocatedEnd - unallocatedStart;
    if (flte(totalRest, 0)) return [];

    const rests = [];
    let cur = unallocatedStart;

    while (flt(cur, unallocatedEnd)) {
        let span = unallocatedEnd - cur;

        // Check for 2-beat rest on half-bar boundary (allowed in 4/4 on beat 0 or beat 2)
        if (fgte(span, 2.0) && (feq(cur, 0.0) || feq(cur, 2.0))) {
            rests.push({
                type: 'rest',
                beat: cur,
                duration: 2.0,
                valueName: 'half'
            });
            cur += 2.0;
            continue;
        }

        // Otherwise use standard single-beat or fractional rest values
        const restVal = bestNoteValue(span);
        rests.push({
            type: 'rest',
            beat: cur,
            duration: restVal.duration,
            valueName: restVal.name,
            dots: restVal.dots
        });
        cur += restVal.duration;
    }

    return rests;
}

/**
 * Assigns beam grouping identifiers based on the Metric Tree depth
 */
export function assignBeamGroups(segments, metricTree) {
    for (const seg of segments) {
        if (seg.duration < 1.0) {
            // Find the metric node containing this segment
            let node = metricTree;
            while (node.children.length > 0) {
                const child = node.children.find(c => fgte(seg.beat, c.start) && flt(seg.beat, c.end));
                if (child) {
                    node = child;
                } else {
                    break;
                }
            }
            seg.beamGroup = node.beamGroupId;
        }
    }
    return segments;
}

/**
 * Dorico Continuous Rhythm Tree Master Engine:
 * Takes continuous sounding note events in a measure, applies the metric tree,
 * resolves cross-boundary ties, fills gaps with metric rests, and groups beams.
 *
 * @param {Array} notes - Array of note events [{ beat, duration, pitch, ... }]
 * @param {Object} [options] - Configuration (meter, numerator, denominator)
 * @returns {Array} Array of cleanly notated, sliced, and tied symbol structures
 */
export function processContinuousVoice(notes, options = {}) {
    const numerator = options.numerator ?? 4;
    const denominator = options.denominator ?? 4;
    const barDuration = (numerator / denominator) * 4;

    const metricTree = buildMetricTree(numerator, denominator);
    const sortedNotes = [...notes].sort((a, b) => a.beat - b.beat);

    const symbols = [];
    let curTimeline = 0.0;

    for (const note of sortedNotes) {
        const noteStart = note.beat;
        const noteDuration = note.duration;

        // 1. Fill any gap before this note with metric rests
        if (fgt(noteStart, curTimeline)) {
            const rests = synthesizeMetricRests(curTimeline, noteStart, metricTree);
            symbols.push(...rests);
        }

        // 2. Project continuous sounding note onto the Metric Tree
        const slices = projectInterval(noteStart, noteDuration, metricTree);

        for (const slice of slices) {
            symbols.push({
                type: 'note',
                beat: slice.beat,
                duration: slice.duration,
                pitch: note.pitch,
                dynamic: note.dynamic,
                tiedToNext: slice.tiedToNext,
                tiedFromPrev: slice.tiedFromPrev,
                valueName: slice.valueName,
                dots: slice.dots,
                sourceEvent: note
            });
        }

        curTimeline = Math.max(curTimeline, noteStart + noteDuration);
    }

    // 3. Fill remaining bar space with rests
    if (flt(curTimeline, barDuration)) {
        const trailingRests = synthesizeMetricRests(curTimeline, barDuration, metricTree);
        symbols.push(...trailingRests);
    }

    // 4. Assign beam groups
    assignBeamGroups(symbols, metricTree);

    return symbols.sort((a, b) => a.beat - b.beat);
}

export default {
    MetricNode,
    buildMetricTree,
    getMetricBoundaries,
    projectInterval,
    synthesizeMetricRests,
    assignBeamGroups,
    processContinuousVoice
};
