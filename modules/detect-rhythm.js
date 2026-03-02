
/**
detectRhythm(events, startBeat, maxDuration)
Detects rhythmic grouping from event timings. Returns an object describing the
rhythm pattern, or undefined if no events are found.

Returns: `{ beat, duration, divisor, rhythm }` where:
- `beat`: Power-of-2 aligned start beat
- `duration`: Power-of-2 duration of the rhythm group
- `divisor`: Number of divisions across the duration
- `rhythm`: Bitmap marking which divisions contain events
**/

const { floor, ceil, log2, pow } = Math;

// Tolerance for floating point comparisons
const EPSILON = 0.001;

function nearlyEqual(a, b) {
    return Math.abs(a - b) < EPSILON;
}

function ceilPowerOf2(n) {
    if (n <= 0) return 1;
    return pow(2, ceil(log2(n)));
}

function floorPowerOf2(n) {
    if (n <= 0) return 1;
    return pow(2, floor(log2(n)));
}

function gcd(a, b) {
    while (!nearlyEqual(b, 0)) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a;
}

// Find the coarsest power-of-2 fraction that value aligns with
function findCoarsestGrid(value) {
    // Try progressively coarser grids: 1, 1/2, 1/4, 1/8...
    for (let divisor = 1; divisor <= 16; divisor *= 2) {
        const grid = 1 / divisor;
        if (nearlyEqual(value % grid, 0)) {
            return grid;
        }
    }
    // Fallback to finest grid
    return 1 / 16;
}

// Find GCD of all intervals to determine fundamental grid spacing
function findGridSpacing(events) {
    const beats = events.map(e => e[0]);
    let spacing = beats[1] - beats[0];

    for (let i = 2; i < beats.length; i++) {
        spacing = gcd(spacing, beats[i] - beats[0]);
    }

    return spacing;
}

// Check if event aligns with grid from baseBeat
function alignsWithGrid(eventBeat, baseBeat, spacing) {
    const offset = eventBeat - baseBeat;
    const divisions = offset / spacing;
    return nearlyEqual(divisions, Math.round(divisions));
}

export function detectRhythm(events, startBeat, maxDuration) {
    if (!events || events.length === 0) {
        return undefined;
    }

    // Find first event at or after startBeat
    let firstIndex = 0;
    while (firstIndex < events.length && events[firstIndex][0] < startBeat) {
        firstIndex++;
    }

    if (firstIndex >= events.length) {
        return undefined;
    }

    const firstBeat = events[firstIndex][0];

    // Single event case
    if (firstIndex === events.length - 1) {
        const grid = findCoarsestGrid(firstBeat - startBeat);
        const duration = Math.min(maxDuration, ceilPowerOf2(maxDuration));
        const divisor = Math.round(duration / grid);
        const divisionIndex = Math.round((firstBeat - startBeat) / grid);
        const rhythm = 1 << divisionIndex;

        return {
            beat: startBeat,
            duration,
            divisor,
            rhythm
        };
    }

    // Multiple events: find grid spacing
    const relevantEvents = events.slice(firstIndex);
    const spacing = findGridSpacing(relevantEvents);

    // Collect events that fit the grid
    const fittingEvents = [relevantEvents[0]];

    for (let i = 1; i < relevantEvents.length; i++) {
        if (alignsWithGrid(relevantEvents[i][0], firstBeat, spacing)) {
            fittingEvents.push(relevantEvents[i]);
        } else {
            // Found event that doesn't fit - stop here
            break;
        }
    }

    // Calculate duration: smallest power-of-2 containing all fitting events
    const lastBeat = fittingEvents[fittingEvents.length - 1][0];
    const span = lastBeat - firstBeat + spacing; // Include the last division
    let duration = ceilPowerOf2(span);
    duration = Math.min(duration, maxDuration);

    // Align beat to power-of-2 boundary if needed
    // For now, use firstBeat floored to duration boundary
    const beat = floor(firstBeat / duration) * duration;

    // Calculate divisor
    const divisor = Math.round(duration / spacing);

    // Build rhythm bitmap
    let rhythm = 0;
    for (const event of fittingEvents) {
        const divisionIndex = Math.round((event[0] - beat) / spacing);
        rhythm |= (1 << divisionIndex);
    }

    return { beat, duration, divisor, rhythm };
}
