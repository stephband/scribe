
import create from '../lib/dom/modules/create.js';

/* Beams */

export const beamThickness = 1.1;

function getDataDuration(note) {
    return parseFloat(note.dataset.duration);
}

function renderPathData(range, notes, beam) {
    return `M${beam[0]},              ${(-range * beam[0] / (notes.length - 1)) - 0.5 * beamThickness}
        L${beam[beam.length - 1]},${(-range * beam[beam.length - 1] / (notes.length - 1)) - 0.5 * beamThickness}
        L${beam[beam.length - 1]},${(-range * beam[beam.length - 1] / (notes.length - 1)) + 0.5 * beamThickness}
        L${beam[0]},              ${(-range * beam[0] / (notes.length - 1)) + 0.5 * beamThickness}
        Z`;
}

function create16thNoteBeams(svg, notes, range) {
    const durations = notes.map(getDataDuration);
    let html = '';
    let n = -1;
    let beam;

    while (durations[++n]) {
        if (durations[n] < 0.5 && durations[n].toFixed(2) !== '0.33') {
            // Push to existing beam
            if (beam) { beam.push(n); }
            // Or start new beam
            else { beam = [n]; }
        }
        // Render beam
        else if (beam) {
            svg.appendChild(create('path', {
                class: 'beam-path-16th beam-path',
                d: renderPathData(range, notes, beam)
            }));
            beam = undefined;
        }
    }

    // Render beam
    if (beam) {
        svg.appendChild(create('path', {
            class: 'beam-path-16th beam-path',
            d: renderPathData(range, notes, beam)
        }));
    }

    return html;
}


export function renderBeam(svg) {
    const ids    = svg.dataset.events.split(/\s+/);
    const parent = svg.parentElement;
    const notes  = ids.map((id) => parent.querySelector('.note[data-event="' + id + '"]'));
    const box = svg.viewBox.baseVal;
    const range =
        box.y < -0.5 ? box.y + 0.5 :
        box.height - 1;
    const html = create16thNoteBeams(svg, notes, -range);

    svg.append(html);

    //console.log(html);
}
