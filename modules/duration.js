
import { GR } from './constants.js';
import grainOfBeat from './bar/grain-of-beat.js';


/**
Valid note durations supported by standard musical notation.
**/
const NOTE_DURATIONS = [
    8,
    6,
    4,
    3,
    2,
    1.75,
    1.5,
    1,
    0.875,
    0.75,
    0.5,
    0.375,
    0.25,
    0.125
];

const MIN_NOTE_DURATION = 0.125;


/**
findBestDuration(space, soundingDuration)
Finds the largest valid note duration <= space that the sounding duration qualifies for.
**/
function findBestDuration(space, soundingDuration) {
    let n = -1;
    while (NOTE_DURATIONS[++n] !== undefined) {
        const d = NOTE_DURATIONS[n];
        if (d <= space && soundingDuration >= d * GR) {
            return d;
        }
    }
    // Fall back to smallest valid duration <= space
    let minD = MIN_NOTE_DURATION;
    while (minD * 2 <= space && minD < MIN_NOTE_DURATION) {
        minD *= 2;
    }
    return Math.min(space, minD);
}


/**
quantiseDurations(bar, tuplets, settings)
Iterates over a bar's tuplets and decides the written duration and articulation
(staccato, tenuto, tie) for each note event based on the available metric space
to the next event onset and the golden ratio conjugate (GR ≈ 0.618).
**/
export default function quantiseDurations(bar, tuplets, settings = {}) {
    if (!tuplets || !tuplets.length) return tuplets;

    // 1. Flatten events across all tuplets into an ordered list with tuplet context
    const entries = [];
    for (let t = 0; t < tuplets.length; ++t) {
        const tuplet = tuplets[t];
        let i = -1, event;
        while ((event = tuplet[++i]) !== undefined) {
            entries.push({ event, tuplet });
        }
    }

    if (!entries.length) return tuplets;

    const barStart = bar.beat;
    const barEnd   = bar.beat + bar.duration;

    // 2. Loop over each event to determine its available space and quantised duration
    for (let i = 0; i < entries.length; ++i) {
        const { event, tuplet } = entries[i];
        const beat = event[0];
        const soundingDuration = event[4];

        // Find onset of next distinct event in this voice
        let nextBeat = barEnd;
        for (let j = i + 1; j < entries.length; ++j) {
            if (entries[j].event[0] > beat) {
                nextBeat = entries[j].event[0];
                break;
            }
        }

        // Available space to next event onset or bar end
        const space = nextBeat - beat;

        // The metric grain at the boundary where the note crosses into nextBeat
        const boundaryGrain = bar.divisions ?
            grainOfBeat(bar.divisions, nextBeat - barStart) :
            1.0;

        // Overhang threshold required to justify a genuine tie into next beat:
        // Half of the grain at the nextBeat boundary (e.g. 0.5 beats at beat 1.0, 0.25 beats at beat 1.5).
        // Overhangs smaller than this threshold are treated as finger-pedal / legato overlap.
        const tieThreshold = 0.5 * boundaryGrain;

        let duration;
        let articulation;
        let tie = false;

        // Case A: Note sustains past the next event onset (overhang)
        if (soundingDuration > space) {
            const overhang = soundingDuration - space;

            if (overhang >= tieThreshold) {
                // Genuine hold: sustains into the next beat -> tie
                duration = space;
                tie = true;
            }
            else {
                // Human finger-pedal / legato overlap: truncate to space, mark tenuto, do not tie
                duration = space;
                articulation = 'tenuto';
                tie = false;
            }
        }
        // Case B: Space-claiming note: sounds for >= GR (61.8%) of available space
        else if (soundingDuration >= space * GR) {
            duration = space;
            if (soundingDuration >= 0.95 * space) {
                articulation = 'tenuto';
            }
        }
        // Case C: Articulated note released before next event: find largest fitting duration
        else {
            duration = findBestDuration(space, soundingDuration);

            // Staccato: sounding duration is short relative to written note (for notes <= 1 beat)
            if (duration <= 1.0 && soundingDuration < duration * GR) {
                articulation = 'staccato';
            }
            else if (soundingDuration >= 0.95 * duration) {
                articulation = 'tenuto';
            }
        }

        // Store raw sounding duration if not already preserved
        if (event.soundingDuration === undefined) {
            event.soundingDuration = soundingDuration;
        }

        // Assign quantised duration and articulation metadata
        event[4]               = duration;
        event.quantisedDuration = duration;
        event.articulation     = articulation;
        event.staccato         = articulation === 'staccato';
        event.tenuto           = articulation === 'tenuto';
        event.tie              = tie;
    }

    return tuplets;
}
