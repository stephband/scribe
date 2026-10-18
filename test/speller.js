import * as chromatic         from '../data/chromatic.js';
import * as major             from '../data/major.js';
import * as melodic           from '../data/melodic.js';
import * as bebop             from '../data/bebop.js';
import * as diminished        from '../data/diminished.js';
import * as triads            from '../data/triads.js';
import * as tetrads           from '../data/tetrads.js';
import * as alteredDiminished from '../data/altered-diminished.js';
import * as giantSteps        from '../data/giant-steps.js';
import * as bach              from '../data/bach.js';
import * as major251s         from "../data/major-ii-v-i.js";
import * as minor251s         from "../data/minor-ii-v-i.js";
import * as substitutions     from "../data/substitutions.js";
import * as blues             from "../data/blues.js";

import SpellerNetwork from '../modules/speller/speller-network.js';
import weights from '../modules/speller/speller-weights-8b.js';
import { toKeyName } from 'sequence/modules/event/key.js';
import { renderElements, renderStyle, renderDOM } from '../modules/render.js';
import { identify } from '../modules/event.js';
import truncate from '../modules/number/truncate.js';

const assign = Object.assign;
const tests  = assign({}, alteredDiminished, substitutions, blues, giantSteps, chromatic, major, melodic, bebop, diminished, triads, tetrads, bach, major251s, minor251s);

function renderNotation(sequence, clef = 'treble', keyName = 'C', meter = [0, 'meter', 4, 1]) {
    const container = document.createElement('div');
    container.className = 'scribe';
    container.append(...renderElements(sequence, clef, keyName, meter, 0, 0, sequence.options));
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
    let totalSpellingMatches = 0;
    let totalKeyMatches = 0;

    sequences.forEach((seq, index) => {
        const notes = seq.events.filter(e => e.type === 'note');
        if (notes.length === 0) return;

        // Clear any text events from prior test passes
        seq.events = seq.events.filter(e => e.type !== 'text');

        const keyEvent = seq.find({ type: 'key' });
        const keyName = toKeyName(keyEvent ? keyEvent[2] : 0);
        const predictions = speller.predictSequence(seq);

        let spellingMatches = 0;
        let keyMatches = 0;
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

            if (spellingMatch) spellingMatches++;
            if (keyMatch) keyMatches++;

            if (!spellingMatch || !keyMatch) {
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
        totalSpellingMatches += spellingMatches;
        totalKeyMatches += keyMatches;

        const isSpellingPerfect = spellingMatches === notes.length;
        const isKeyPerfect = keyMatches === notes.length;
        const spellingPct = ((spellingMatches / notes.length) * 100).toFixed(0);
        const keyPct = ((keyMatches / notes.length) * 100).toFixed(0);

        const header = document.createElement('header');
        header.className = `test-header ${isSpellingPerfect ? 'perfect' : 'has-diffs'}`;
        header.id = `test-${index + 1}`;
        header.innerHTML = `
            <div class="test-title">
                <strong class="test-name">${(seq.name || `Test ${index + 1}`).replace(/_/g, ' ')}</strong>
                <span class="test-key badge">Key: ${keyName}</span>
                <span class="test-count badge">${notes.length} notes</span>
            </div>
            <div class="test-scores">
                <span class="badge ${isSpellingPerfect ? 'badge-success' : 'badge-warn'}" title="Spelling accuracy">
                    <span class="badge-lbl">Spelling:</span>${spellingMatches}/${notes.length} (${spellingPct}%)
                </span>
                <span class="badge ${isKeyPerfect ? 'badge-success' : 'badge-neutral'}" title="Key prediction accuracy">
                    <span class="badge-lbl">Key:</span>${keyMatches}/${notes.length} (${keyPct}%)
                </span>
            </div>
        `;
        container.appendChild(header);

        // Render the sequence
        const stave = renderNotation(seq, 'treble', keyName);

        // Style discrepancy symbols
        const bars = Array.from(stave.querySelectorAll('.bar'));
        diffs.forEach(({ note, pred, spellingMatch, keyMatch, expectedSpelling, expectedKey }) => {
            const noteBeat = note[0];
            const barEl = bars.find((b) => {
                const barBeat = Number(b.dataset.beat);
                const barDur  = Number(b.dataset.duration);
                return noteBeat >= barBeat && noteBeat < barBeat + barDur;
            }) || stave;
            const barBeat = barEl.dataset?.beat !== undefined ? Number(barEl.dataset.beat) : 0;
            const beat = truncate(4, noteBeat - barBeat);
            const beatSelector = `[data-beat="${beat}"]`;

            const eventId = identify(note);

            // Give rendered note/accidental symbols the error class ONLY when spelling differed
            if (!spellingMatch) {
                barEl.querySelectorAll(`.note${beatSelector}, .acci${beatSelector}, .note[data-event="${eventId}"], .acci[data-event="${eventId}"]`)
                    .forEach(el => {
                        el.classList.add('error');
                        el.title = `Expected: ${expectedSpelling}, Predicted: ${pred.spelling}`;
                    });
            }

            // If key differed, give the local key text symbol the error class
            if (!keyMatch) {
                barEl.querySelectorAll(`.lyric${beatSelector}`)
                    .forEach(el => {
                        el.classList.add('error');
                        el.title = `Expected key: ${expectedKey}, Predicted key: ${pred.keyName}`;
                    });
            }
        });

        container.appendChild(stave);
    });

    if (summaryEl) {
        const overallSpellingPct = totalNotes ? ((totalSpellingMatches / totalNotes) * 100).toFixed(1) : '100.0';
        const overallKeyPct = totalNotes ? ((totalKeyMatches / totalNotes) * 100).toFixed(1) : '100.0';
        summaryEl.innerHTML = `
            <div class="summary-metric">
                <span class="metric-val">${sequences.length}</span>
                <span class="metric-lbl">Sequences</span>
            </div>
            <div class="summary-metric">
                <span class="metric-val">${totalNotes}</span>
                <span class="metric-lbl">Total Notes</span>
            </div>
            <div class="summary-metric ${totalSpellingMatches === totalNotes ? 'metric-success' : 'metric-highlight'}">
                <span class="metric-val">${overallSpellingPct}%</span>
                <span class="metric-lbl">Spelling Accuracy</span>
                <span class="metric-sub">${totalSpellingMatches} / ${totalNotes} notes</span>
            </div>
            <div class="summary-metric ${totalKeyMatches === totalNotes ? 'metric-success' : ''}">
                <span class="metric-val">${overallKeyPct}%</span>
                <span class="metric-lbl">Key Accuracy</span>
                <span class="metric-sub">${totalKeyMatches} / ${totalNotes} notes</span>
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
