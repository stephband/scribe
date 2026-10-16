import * as chromatic from '../modules/speller/data/chromatic.js';
import * as major     from '../modules/speller/data/major.js';
import * as triads    from '../modules/speller/data/triads.js';

import SpellerNetwork from '../modules/speller/speller-network.js';
import weights from '../modules/speller/speller-weights.js';
import { toKeyName } from 'sequence/modules/event/key.js';
import { renderElements, renderStyle, renderDOM } from '../modules/render.js';
import truncate from '../modules/number/truncate.js';

const assign = Object.assign;
const tests  = assign({}, chromatic, major, triads);

function renderNotation(sequence, clef = 'treble', keyName = 'C', meter = [0, 'meter', 4, 1]) {
    const container = document.createElement('div');
    container.className = 'scribe';
    container.append(...renderElements(sequence, clef, keyName, meter));
    return container;
}

function refreshLayout(root) {
    root.querySelectorAll('.scribe').forEach((container) => {
        const styleCss = renderStyle(container, container);
        if (styleCss) {
            container.style.cssText += ';' + styleCss;
        }
        renderDOM(container, container);
    });
}

export function runSpellerTests(testSource = tests, containerId = 'tests-container', summaryId = 'summary-container') {
    const container = document.getElementById(containerId);
    const summaryEl = document.getElementById(summaryId);
    if (!container) return;

    container.innerHTML = '';

    const speller = SpellerNetwork.from(weights);
    const sequences = Object.values(testSource);

    let totalNotes = 0;
    let totalMatches = 0;

    sequences.forEach((seq, index) => {
        const notes = seq.events.filter(e => e.type === 'note');
        if (notes.length === 0) return;

        // Clear any text events from prior test passes
        seq.events = seq.events.filter(e => e.type !== 'text');

        const keyEvent = seq.find({ type: 'key' });
        const keyName = toKeyName(keyEvent ? keyEvent[2] : 0);
        const predictions = speller.predictSequence(seq);

        let matches = 0;
        const diffs = [];

        notes.forEach((note, i) => {
            const pred = predictions[i];
            const expectedSpelling = note.expectedSpelling;
            const expectedKey = note.expectedKey;

            note[2] = pred.spelling;
            note.spelling = pred.spelling;
            note.resultKey = pred.keyName;

            seq.create(note[0], 'text', note[4], note.resultKey);

            const spellingMatch = !expectedSpelling || expectedSpelling === pred.spelling;
            const keyMatch = !expectedKey || expectedKey === pred.keyName;

            if (spellingMatch && keyMatch) {
                matches++;
            } else {
                diffs.push({
                    note,
                    pred,
                    spellingMatch,
                    keyMatch,
                    expectedSpelling,
                    expectedKey
                });
            }
        });

        totalNotes += notes.length;
        totalMatches += matches;

        const accuracyPct = ((matches / notes.length) * 100).toFixed(0);
        const isPerfect = matches === notes.length;

        const header = document.createElement('header');
        header.className = `test-header ${isPerfect ? 'perfect' : 'has-diffs'}`;
        header.id = `test-${index + 1}`;
        header.innerHTML = `
            <div class="test-title">
                <strong class="test-name">${(seq.name || `Test ${index + 1}`).replace(/_/g, ' ')}</strong>
                <span class="test-key badge">Key: ${keyName}</span>
                <span class="test-count badge">${notes.length} notes</span>
            </div>
            <div class="test-score badge ${isPerfect ? 'badge-success' : 'badge-warn'}">
                ${matches}/${notes.length} (${accuracyPct}%)
            </div>
        `;
        container.appendChild(header);

        // Render the sequence
        const stave = renderNotation(seq, 'treble', keyName);

        // Style discrepancy symbols with the error class
        diffs.forEach(({ note, pred, spellingMatch, keyMatch, expectedSpelling, expectedKey }) => {
            const beat = truncate(4, note[0]);
            const beatSelector = note[0] === 0 ? '[data-beat="0"]' : `[data-beat^="${beat}"]`;

            // Give rendered note/accidental symbols the error class
            stave.querySelectorAll(`${beatSelector}[data-pitch="${pred.spelling}"]`)
                .forEach(el => {
                    el.classList.add('error');
                    el.title = !spellingMatch
                        ? `Expected: ${expectedSpelling}, Predicted: ${pred.spelling}`
                        : `Expected key: ${expectedKey}, Predicted key: ${pred.keyName}`;
                });

            // If key differed, give the local key text symbol the error class
            if (!keyMatch) {
                stave.querySelectorAll(`.lyric${beatSelector}`)
                    .forEach(el => {
                        el.classList.add('error');
                        el.title = `Expected key: ${expectedKey}, Predicted key: ${pred.keyName}`;
                    });
            }
        });

        container.appendChild(stave);
    });

    if (summaryEl) {
        const overallPct = totalNotes ? ((totalMatches / totalNotes) * 100).toFixed(1) : '100.0';
        summaryEl.innerHTML = `
            <div class="summary-metric">
                <span class="metric-val">${sequences.length}</span>
                <span class="metric-lbl">Sequences</span>
            </div>
            <div class="summary-metric">
                <span class="metric-val">${totalNotes}</span>
                <span class="metric-lbl">Total Notes</span>
            </div>
            <div class="summary-metric">
                <span class="metric-val">${totalMatches}</span>
                <span class="metric-lbl">Matches</span>
            </div>
            <div class="summary-metric ${totalMatches === totalNotes ? 'metric-success' : 'metric-highlight'}">
                <span class="metric-val">${overallPct}%</span>
                <span class="metric-lbl">Overall Accuracy</span>
            </div>
        `;
    }

    refreshLayout(container);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => refreshLayout(container));
    }
    window.addEventListener('load', () => refreshLayout(container));
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => runSpellerTests());
    } else {
        runSpellerTests();
    }
}
