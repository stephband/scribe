
import create from '../lib/dom/modules/create.js';

/* Beams */

export const beamThickness = 1.1;

function getDataDuration(note) {
    return parseFloat(note.dataset.duration);
}

function removeBeamPaths(svg) {
    const childNodes = svg.childNodes;
    while (childNodes.length > 1) {
        svg.removeChild(svg.lastChild);
    }
}

function renderPathData(range, notesLength, beam) {
    return `M${beam[0]}, ${ (-range * beam[0] / (notesLength - 1)) - 0.5 * beamThickness }
        L${beam[beam.length - 1]},${ (-range * beam[beam.length - 1] / (notesLength - 1)) - 0.5 * beamThickness }
        L${beam[beam.length - 1]},${ (-range * beam[beam.length - 1] / (notesLength - 1)) + 0.5 * beamThickness }
        L${beam[0]}, ${ (-range * beam[0] / (notesLength - 1)) + 0.5 * beamThickness }
        Z`;
}

function createNoteBeams(svg, durations, i, range, duration) {
    // Don't render anything shorter than 32nd note beams
    if (duration < 0.125) return;

    let n = i - 1;
    let beam;

    while (durations[++n]) {
        if (durations[n] <= duration) {
            // Push to existing beam
            if (beam) { beam.push(n); }
            // Or start new beam
            else { beam = [n]; }
        }
        // Render beam
        else if (beam) {
            svg.appendChild(create('path', {
                // Remember duration is the duration of the beam above this one
                class: `beam-path-${ 4 / duration } beam-path`,
                d: renderPathData(range, durations.length, beam)
            }));

            createNoteBeams(svg, durations, beam[0], range, duration / 2);
            beam = undefined;
        }
    }

    // Render beam
    if (beam) {
        svg.appendChild(create('path', {
            class: `beam-path-${ 4 / duration } beam-path`,
            d: renderPathData(range, durations.length, beam)
        }));

        createNoteBeams(svg, durations, beam[0], range, duration / 2);
        beam = undefined;
    }
}

export function renderBeam(svg) {
    const ids       = svg.dataset.events.split(/\s+/);
    const parent    = svg.parentElement;
    const notes     = ids.map((id) => parent.querySelector('.note[data-event="' + id + '"]'));
    const durations = notes.map(getDataDuration);
    const box       = svg.viewBox.baseVal;
    const range =
        box.y < -0.5 ? box.y + 0.5 :
        box.height - 1;

    removeBeamPaths(svg);
    createNoteBeams(svg, durations, 0, -range, 0.25);
}
