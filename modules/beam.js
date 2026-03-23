
import create from 'dom/create.js';
import rect   from 'dom/rect.js';
import { ceilPow2 } from './number/power-of-2.js';
import { eq, gte, lte, lt, gt } from './number/float.js';

import { P24, GR }       from './constants.js';

/* Beams */

export const beamThickness = 1.1;

function getDataBeat(note) {
    return parseFloat(note.dataset.beat);
}

function getDataDuration(note) {
    return parseFloat(note.dataset.duration);
}

function removeBeamPaths(svg) {
    const childNodes = svg.childNodes;
    while (childNodes.length > 1) {
        svg.removeChild(svg.lastChild);
    }
}

function renderPathData(range, xs, beam, beat, duration) {
    const i0 = beam[0];

    const x0 = beam.length === 1 ?
        // If beat is divisible by 2 x duration the sub beam projects forward
        beat % duration === 0 ?
            // Forward tail beam starts at i0
            xs[i0] :
            // Backward tail beam starts before i0
            xs[i0] - 0.4 * (xs[i0] - xs[i0 - 1]) :
        // Beam spans whole duration
        xs[i0] ;

    const x1 = beam.length === 1 ?
        // If beat is divisible by 2 x duration the sub beam projects forward
        beat % duration === 0 ?
            // Forward tail beam stops after i0
            xs[i0] + 0.5 * (xs[i0 + 1] - xs[i0]) :
            // Backward tail beam stops at i0
            xs[i0] :
        // Beam spans whole duration
        xs[beam[beam.length - 1]] ;

    return `M${ x0 },${ -range * x0 - 0.5 * beamThickness } L${ x1 },${ -range * x1 - 0.5 * beamThickness } L${ x1 },${ -range * x1 + 0.5 * beamThickness } L${ x0 },${ -range * x0 + 0.5 * beamThickness } Z` ;
}

function renderPath(svg, beats, xs, beam, range, duration, n) {
    svg.appendChild(create('path', {
        // Remember duration is the duration of the beam above this one
        class: `beam-path-${ 8 / duration } beam-path`,
        d: renderPathData(range, xs, beam, beats[n - 1], duration)
    }));
}

function createBeamPaths(svg, beats, durations, xs, i, range, duration) {
    // Don't render anything shorter than triplet 32nd note beams
    if (duration < 1/6) return;

    let n = i - 1;
    let beam;

    while (durations[++n]) {
        // If beam division is a half duration or less
        if (durations[n] <= 0.5 * duration
            // ...or a dotted half duration
            || durations[n] === 0.75 * duration
            // ...or double dotted half duration
            || durations[n] === 0.875 * duration
        ) {
            // Push to existing beam
            if (beam) { beam.push(n); }
            // Or start new beam
            else { beam = [n]; }
        }
        // Render beam
        else if (beam) {
            renderPath(svg, beats, xs, beam, range, duration, n);
            createBeamPaths(svg, beats, durations, xs, beam[0], range, duration / 2);
            beam = undefined;
        }
    }

    // Render beam
    if (beam) {
        renderPath(svg, beats, xs, beam, range, duration, n);
        createBeamPaths(svg, beats, durations, xs, beam[0], range, duration / 2);
    }
}

export function renderBeam(svg) {
    const id        = svg.dataset.beam;
    const parent    = svg.parentElement;
    /* There is only one .top-note (or .bottom-note) per beam division, select that */
    const notes     = Array.from(parent.querySelectorAll('.top-note[data-beam="' + id + '"]'));
    const beats     = notes.map(getDataBeat);
    const durations = notes.map(getDataDuration);
    const box       = svg.viewBox.baseVal;
    const range =
        box.y < -0.5 ? box.y + 0.5 :
        box.height - 1;

    const boxes  = notes.map(rect);
    const firstX = boxes[0].x;
    const lastX  = boxes[boxes.length - 1].x;
    const xs     = boxes.map((box) => (box.x - firstX) / (lastX - firstX));

    removeBeamPaths(svg);
    createBeamPaths(svg, beats, durations, xs, 0, -range, 0.5);
}
