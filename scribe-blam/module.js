import { Handle }     from 'hyperblam/primitives/Handle.js';
import { nameToNum }  from 'hyperblam/tools/nameToNum.js';
import { Sequence }   from 'sequence/module.js';
import { timesigToMeter, meterToTimesig, getDivisions } from 'sequence/modules/event/meter.js';
import { toNoteNumber } from 'midi/note.js';

function toPitch(val) {
    if (val === null || val === undefined || val === '') return undefined;
    const num = Number(val);
    if (!isNaN(num) && num > 0) return num;
    return toNoteNumber(val);
}

import Stave from '../modules/stave.js';
import { renderDOM, renderStyle, remove } from '../modules/render-dom.js';
import config from '../modules/config.js';

const assign = Object.assign;
const shadowCSSUrl = new URL('../scribe-music/shadow.css', import.meta.url);

/**
<scribe-hyperblam>

Responsive music notation visualiser for Hyperblam. Listens to live Hyperblam
events (from tracks, sequencers, synths, or MIDI) and renders notation in real
time using Scribe.
**/

class ScribeHyperblam extends Handle {
    constructor() {
        super();

        this.defaultFrom = () => [
            this.closest('track-blam, sequencer-blam, synth-blam') ||
            document.querySelector('track-blam, sequencer-blam, synth-blam') ||
            this.parentNode
        ];

        this.defaultTo = () => [this];
        this.defaultFor = ['blam', 'blamplay', 'blamstop', 'blamend'/*, 'midiOn'*/];
        this.notes = [];
        this.renderPending = false;
        this.isRendering = false;
        this.renderQueued = false;
        this.clockStep = 0;

        // Shadow DOM for encapsulated notation rendering
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <link rel="stylesheet" href="${ shadowCSSUrl }" />
            <style></style>
        `;

        this.styleElem = shadow.querySelector('style');

        // Safari metrics workaround
        const isSafari = navigator.userAgent.includes('AppleWebKit/')
            && !navigator.userAgent.includes('Chrome/')
            && !navigator.userAgent.includes('Edge/')
            && !navigator.userAgent.includes('Gecko/');
        if (isSafari) this.classList.add('safari');

        // Re-measure and update notehead styles once web fonts finish loading
        this.onFontLoad = () => {
            if (this.styleElem && this.shadowRoot && this.shadowRoot.querySelector('.bar')) {
                this.styleElem.textContent = `:host { ${ renderStyle(this, this.shadowRoot) } }`;
            }
        };
        document.fonts?.addEventListener('loadingdone', this.onFontLoad);
    }

    connectedCallback() {
        super.connectedCallback?.();

        // If hyperblam has already defined its elements, ensure we initialize
        if (customElements.get('sequencer-blam') && !this.initialized) {
            this.onblamready();
        }
    }

    onblamready() {
        if (this.initialized) return;
        this.initialized = true;

        super.onblamready();

        this.audioElem = this.closest('audio-blam') || document.querySelector('audio-blam');

        // Discover ancestor/sibling sequencer for master clock step events
        this.sequencerElem = this.fromElems.find(el => el.nodeName === 'SEQUENCER-BLAM')
            || this.fromElems[0]?.closest('sequencer-blam')
            || document.querySelector('sequencer-blam');

        // Ensure our listener runs strictly after all <track-blam> instances have updated their
        // target players (note-blam, pad-blam) by moving scribe-hyperblam to the end of the listener queue.
        this.attachToSequencer = () => {
            if (this.sequencerElem) {
                this.sequencerElem.removeEventListener('blam', this);
                this.sequencerElem.removeEventListener('blamplay', this);
                this.sequencerElem.removeEventListener('blamstop', this);

                this.sequencerElem.addEventListener('blam', this);
                this.sequencerElem.addEventListener('blamplay', this);
                this.sequencerElem.addEventListener('blamstop', this);
            }
        };

        this.attachToSequencer();
        setTimeout(() => this.attachToSequencer(), 0);
        window.addEventListener('blamready', () => this.attachToSequencer(), { once: true });

        this.resetEvents();
        this.requestRender();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.sequencerElem) {
            this.sequencerElem.removeEventListener('blam', this);
            this.sequencerElem.removeEventListener('blamplay', this);
            this.sequencerElem.removeEventListener('blamstop', this);
        }
        document.fonts?.removeEventListener('loadingdone', this.onFontLoad);
    }

    /**
     * Clear recorded live notes and prepare sequence header (key, meter)
     */
    resetEvents() {
        this.notes = [];
        this.startAudioTime = undefined;
        this.clockStep = 0;

        const meter = this.meter;
        this.meterEvent = assign([0], timesigToMeter(meter));
        const key = this.key;

        const beatsPerBar = this.meterEvent[2] || 4;
        const barCount = this.bars === 'all' ? 2 : this.bars;
        this.startBeat = 0;
        this.windowDuration = barCount * beatsPerBar;

        const parts = this.parts;
        if (parts && parts.length > 1) {
            const objects = parts.map((name, i) => ({ id: i + 1, name }));
            const sequences = parts.map((name, i) => ({
                id: i + 1,
                name,
                events: []
            }));
            this.sequence = Sequence.from({
                objects,
                events: [
                    [0, 'key', key],
                    this.meterEvent,
                    ...parts.map((name, i) => [0, 'sequence', i + 1, i + 1, this.windowDuration])
                ],
                sequences
            });
        } else {
            this.sequence = Sequence.from({
                events: [
                    [0, 'key', key],
                    this.meterEvent
                ]
            });
        }

        console.log('<scribe-hyperblam> sequence:', this.sequence);
    }

    /**
     * Dispatcher for events routed by Hyperblam's Handle
     */
    handle(event) {
        switch (event.type) {
            case 'blamplay':
                // Sequencer playback started from the beginning: reset notation
                this.clockStep = 0;
                this.attachToSequencer?.();
                if (this.sequencerElem && (this.sequencerElem.time <= (this.context()?.currentTime || 0) + 0.15)) {
                    this.resetEvents();
                    this.requestRender();
                }
                break;

            case 'blamstop':
                // Playback paused or stopped
                break;

            case 'blam':
                this.handleBlam(event);
                break;

            // case 'midiOn':
            //     this.handleMidi(event);
            //     break;
        }
    }

    /**
     * Handle 'blam' events from Sequencers, Synths, or Notes
     */
    handleBlam(event) {
        const detail = event.detail;
        if (!detail) return;

        // 1. Clock tick from <sequencer-blam> (contains array of tracks)
        if (detail.tracks && detail.sequencer) {
            const sequencer = detail.sequencer;
            const scale = sequencer.scale || 1;
            const stepBeats = 0.25 * scale; // Duration of one step in crotchet beats

            if (this.clockStep === undefined) this.clockStep = 0;
            const beat = this.clockStep * stepBeats;

            // Filter tracks to those matching this.track attribute or this.fromElems
            const targetTracks = detail.tracks.filter(t => {
                if (this.track) return t.id === this.track;
                const trackFroms = this.fromElems.filter(el => el.nodeName === 'TRACK-BLAM');
                if (trackFroms.length) return trackFroms.includes(t);
                return true;
            });

            let hasNewNotes = false;

            for (const t of targetTracks) {
                // Determine whether this track plays on this step
                const isPlaying = t.playOrNot ? t.playOrNot(detail.tracks) : (t.cipher !== 0 && t.cipher !== '0' && t.probable);
                if (!isPlaying) continue;

                const targetPlayer = t.toElems?.[0]
                    || (t.getAttribute('to') ? document.querySelector(t.getAttribute('to')) : null);

                // Determine part: explicit attribute or inferred from track/target
                let part = t.getAttribute('part-name')
                    || t.dataset?.part
                    || targetPlayer?.getAttribute('part-name')
                    || targetPlayer?.dataset?.part;

                if (!part) {
                    const idStr = ((t.id || '') + ' ' + (targetPlayer?.id || '') + ' ' + (t.getAttribute('to') || '')).toLowerCase();
                    if (idStr.includes('bass')) {
                        part = 'bass';
                    } else if (/drum|kick|snare|hat|tom|cymbal|pad/.test(idStr)) {
                        part = 'drums';
                    } else {
                        part = 'default';
                    }
                }

                let pitch;
                if (part === 'drums') {
                    // Check if cipher itself is an explicit General MIDI note number (> 12) or drum name
                    if (typeof t.cipher === 'string' && isNaN(t.cipher) && t.cipher !== '?') {
                        pitch = toPitch(t.cipher);
                    } else if (t.cipher && !isNaN(t.cipher) && parseInt(t.cipher, 10) > 12) {
                        pitch = parseInt(t.cipher, 10);
                    }

                    if (!pitch) {
                        // Determine active sample index in the player's bank
                        let activeIndex;
                        if (t.cipher !== undefined && !isNaN(t.cipher)) {
                            activeIndex = parseInt(t.cipher, 10) - 1;
                        } else if (targetPlayer?.time === detail.time && targetPlayer?.sample?.index !== undefined) {
                            activeIndex = targetPlayer.sample.index - 1;
                        } else if (targetPlayer?.prevIndex !== undefined) {
                            activeIndex = targetPlayer.prevIndex;
                        }

                        const sampleElems = targetPlayer?.bankElem?.sampleElems
                            || targetPlayer?.querySelectorAll?.('sample-blam');
                        const sampleElem = (sampleElems && activeIndex !== undefined)
                            ? sampleElems[activeIndex]
                            : null;

                        // Check explicit note attribute:
                        // First on the active sample element (e.g. <sample-blam note="42">)
                        // Then on the track element (e.g. <track-blam note="36">)
                        // Then on the target player pad (e.g. <pad-blam id="kick" note="36">)
                        pitch = toPitch(sampleElem?.getAttribute?.('note'))
                            || toPitch(t.getAttribute('note'))
                            || toPitch(targetPlayer?.getAttribute?.('note'));

                        // Fallback to standard General MIDI drum map based on player or track ID
                        if (!pitch) {
                            const targetId = (targetPlayer?.id || t.getAttribute('to') || '').toLowerCase();
                            if (targetId.includes('kick')) {
                                pitch = 36; // Bass drum (C2 in MIDI = 36)
                            } else if (targetId.includes('snare')) {
                                pitch = 38; // Snare drum (D2 in MIDI = 38)
                            } else if (targetId.includes('hat')) {
                                // In standard kit-garage banks, sample 3 (index 2) is open hi-hat (46); samples 1 & 2 are closed (42)
                                pitch = (activeIndex === 2) ? 46 : 42;
                            } else {
                                pitch = 36;
                            }
                        }
                    }
                } else {
                    // Pitched / Melodic part (e.g. Bass)
                    // If target player already executed for this step, targetPlayer.noteNum is the exact played pitch
                    if (targetPlayer?.time === detail.time && targetPlayer?.noteNum !== undefined) {
                        pitch = targetPlayer.noteNum;
                    } else if (typeof t.cipher === 'string' && isNaN(t.cipher)) {
                        pitch = nameToNum(t.cipher);
                    } else if (targetPlayer?.noteNum !== undefined) {
                        pitch = targetPlayer.noteNum;
                    } else if (t.cipher !== undefined && !isNaN(t.cipher)) {
                        const playerNotes = targetPlayer?.notes;
                        if (playerNotes && playerNotes.length) {
                            const idx = (parseInt(t.cipher, 10) - 1) % playerNotes.length;
                            pitch = nameToNum(playerNotes[idx]);
                        } else {
                            pitch = 60 + parseInt(t.cipher, 10);
                        }
                    } else if (t.cipher === undefined) {
                        // Generative '?' cipher fallback
                        if (targetPlayer?.notes?.length) {
                            const pool = targetPlayer.notes;
                            pitch = nameToNum(pool[Math.floor(Math.random() * pool.length)]);
                        } else {
                            pitch = 33; // A1 default for bass
                        }
                    }
                }

                if (!pitch) pitch = 60;

                let duration;
                if (part === 'drums') {
                    duration = stepBeats;
                } else if (this.noteDuration) {
                    duration = this.noteDuration;
                } else {
                    const divisor = this.divisor;
                    const nextDivisorBeat = (Math.floor(beat / divisor + 1e-9) + 1) * divisor;
                    duration = Math.round((nextDivisorBeat - beat) * 1000) / 1000;
                }

                if (this.pushNote(beat, pitch, 0.1, duration, part)) {
                    hasNewNotes = true;
                }
            }

            this.clockStep++;

            if (hasNewNotes) {
                this.updateSequence();
                this.requestRender();
            }
        }
        /*
        // 2. Direct event from <synth-blam> (frequency & scheduled time)
        else if (detail.frequency) {
            let midi = Math.round(69 + 12 * Math.log2(detail.frequency / 440));
            const bpm = this.audioElem?.bpm || 120;
            const beatSec = 60 / bpm;

            if (this.startAudioTime === undefined) {
                this.startAudioTime = detail.time || this.context()?.currentTime || 0;
            }

            const rawBeat = (detail.time - this.startAudioTime) / beatSec;
            // Quantise to nearest sixteenth note (0.25 beats)
            const beat = Math.max(0, Math.round(rawBeat * 4) / 4);
            const divisor = this.divisor;
            const nextDivisorBeat = (Math.floor(beat / divisor + 1e-9) + 1) * divisor;
            const duration = this.noteDuration || Math.round((nextDivisorBeat - beat) * 1000) / 1000;
            const part = (event.target.id?.includes('bass') || event.target.nodeName === 'SYNTH-BLAM') ? 'bass' : 'default';

            this.addNote(beat, midi, 0.1, duration, part);
        }
        // 3. Direct event from <note-blam> (sampler instance & time)
        else if (event.target?.noteNum !== undefined) {
            let midi = event.target.noteNum;
            const bpm = this.audioElem?.bpm || 120;
            const beatSec = 60 / bpm;

            if (this.startAudioTime === undefined) {
                this.startAudioTime = detail.time || this.context()?.currentTime || 0;
            }

            const rawBeat = (detail.time - this.startAudioTime) / beatSec;
            const beat = Math.max(0, Math.round(rawBeat * 4) / 4);
            const divisor = this.divisor;
            const nextDivisorBeat = (Math.floor(beat / divisor + 1e-9) + 1) * divisor;
            const duration = this.noteDuration || Math.round((nextDivisorBeat - beat) * 1000) / 1000;
            const part = (event.target.id?.includes('bass') || event.target.nodeName === 'NOTE-BLAM') ? 'bass' : 'default';

            this.addNote(beat, midi, 0.1, duration, part);
        }
        */
    }

    /*
    handleMidi(event) {
        const detail = event.detail;
        if (!detail || detail.note === undefined) return;

        const bpm = this.audioElem?.bpm || 120;
        const beatSec = 60 / bpm;
        const curTime = this.context()?.currentTime || 0;

        if (this.startAudioTime === undefined) {
            this.startAudioTime = curTime;
        }

        const rawBeat = (curTime - this.startAudioTime) / beatSec;
        const beat = Math.max(0, Math.round(rawBeat * 4) / 4);
        const divisor = this.divisor;
        const nextDivisorBeat = (Math.floor(beat / divisor + 1e-9) + 1) * divisor;
        const duration = this.noteDuration || Math.round((nextDivisorBeat - beat) * 1000) / 1000;
        const velocity = detail.velocity !== undefined ? (detail.velocity / 127) * 0.1 : 0.1;

        this.addNote(beat, detail.note, velocity, duration, 'default');
    }
    */

    /**
     * Push a note without triggering immediate sequence rebuild or render
     */
    pushNote(beat, pitch, velocity = 0.1, duration = null, part = 'default') {
        const duplicate = this.notes.some(n =>
            Math.abs(n[0] - beat) < 0.001 && n[2] === pitch && (n.part || 'default') === part
        );
        if (duplicate) return false;

        if (duration === null || duration === undefined) {
            if (part === 'drums') {
                const scale = this.sequencerElem?.scale || 1;
                duration = 0.25 * scale;
            } else if (this.noteDuration) {
                duration = this.noteDuration;
            } else {
                const divisor = this.divisor;
                const nextDivisorBeat = (Math.floor(beat / divisor + 1e-9) + 1) * divisor;
                duration = Math.round((nextDivisorBeat - beat) * 1000) / 1000;
            }
        }

        // In monophonic pitched parts (like bass), clamp the previous note's duration so it doesn't overlap
        if (part !== 'drums') {
            const prevNote = this.notes.slice().reverse().find(n => (n.part || 'default') === part);
            if (prevNote && beat > prevNote[0]) {
                const gap = beat - prevNote[0];
                if (prevNote[4] > gap) {
                    prevNote[4] = gap;
                }
            }
        }

        const note = [beat, 'note', pitch, velocity, duration];
        note.part = part;
        this.notes.push(note);
        this.notes.sort((a, b) => a[0] - b[0]);
        return true;
    }

    /**
     * Append a note event to the live sequence
     */
    addNote(beat, pitch, velocity = 0.1, duration = null, part = 'default') {
        if (this.pushNote(beat, pitch, velocity, duration, part)) {
            this.updateSequence();
            this.requestRender();
        }
    }

    /**
     * Rebuild Sequence object and compute viewport startBeat and duration
     */
    updateSequence() {
        const meterEv = this.meterEvent;
        const keyEv = [0, 'key', this.key];

        const lastNote = this.notes[this.notes.length - 1];
        const beatsPerBar = meterEv[2] || 4;
        const scale = this.sequencerElem?.scale || 1;
        const currentBeat = this.clockStep !== undefined && this.clockStep > 0
            ? (this.clockStep - 1) * 0.25 * scale
            : (lastNote ? lastNote[0] : 0);
        const barCount = this.bars;

        const parts = this.parts || [...new Set(this.notes.map(n => n.part || 'default'))];
        const isMultiPart = parts.length > 1 || (parts.length === 1 && parts[0] !== 'default');

        if (barCount === 'all') {
            this.startBeat = 0;
            this.windowDuration = Infinity;

            if (isMultiPart) {
                const objects = parts.map((name, i) => ({ id: i + 1, name }));
                const sequences = parts.map((name, i) => ({
                    id: i + 1,
                    name,
                    events: this.notes
                        .filter(n => (n.part || 'default') === name)
                        .map(n => [n[0], n[1], n[2], n[3], n[4]])
                }));
                const maxBeat = Math.max(...this.notes.map(n => n[0] + (n[4] || 0)), beatsPerBar * 2);
                this.sequence = Sequence.from({
                    objects,
                    events: [
                        keyEv,
                        meterEv,
                        ...parts.map((name, i) => [0, 'sequence', i + 1, i + 1, maxBeat])
                    ],
                    sequences
                });
            } else {
                this.sequence = Sequence.from({ events: [keyEv, meterEv, ...this.notes] });
            }
        } else {
            const windowBeats = barCount * beatsPerBar;
            // Page-flip by window size (e.g. 2 bars)
            this.startBeat = Math.floor(currentBeat / windowBeats) * windowBeats;
            this.windowDuration = windowBeats;

            // Normalize notes to start relative to the current window (at beat 0)
            // so we don't trigger displaced key/meter events in Scribe
            const windowNotes = this.notes
                .filter(n => n[0] >= this.startBeat && n[0] < this.startBeat + windowBeats)
                .map(n => {
                    const mapped = [n[0] - this.startBeat, n[1], n[2], n[3], n[4]];
                    mapped.part = n.part || 'default';
                    return mapped;
                });

            if (isMultiPart) {
                const objects = parts.map((name, i) => ({ id: i + 1, name }));
                const sequences = parts.map((name, i) => ({
                    id: i + 1,
                    name,
                    events: windowNotes
                        .filter(n => n.part === name)
                        .map(n => [n[0], n[1], n[2], n[3], n[4]])
                }));
                this.sequence = Sequence.from({
                    objects,
                    events: [
                        keyEv,
                        meterEv,
                        ...parts.map((name, i) => [0, 'sequence', i + 1, i + 1, windowBeats])
                    ],
                    sequences
                });
            } else {
                this.sequence = Sequence.from({ events: [keyEv, meterEv, ...windowNotes] });
            }
        }

        console.log('<scribe-hyperblam> sequence:', this.sequence);
    }

    /**
     * Debounce renders to the next animation frame, safely handling re-entrancy
     */
    requestRender() {
        if (this.isRendering) {
            this.renderQueued = true;
            return;
        }

        if (this.renderPending) return;
        this.renderPending = true;

        requestAnimationFrame(async () => {
            this.renderPending = false;
            this.isRendering = true;
            try {
                await this.render();
            } finally {
                this.isRendering = false;
                if (this.renderQueued) {
                    this.renderQueued = false;
                    this.requestRender();
                }
            }
        });
    }

    /**
     * Render music notation into the shadow DOM
     */
    async render() {
        if (!this.sequence || !this.shadowRoot) return;

        try {
            const parts = this.parts || [...new Set(this.notes.map(n => n.part || 'default'))];
            const isMultiPart = parts.length > 1 || (parts.length === 1 && parts[0] !== 'default');

            const fragment = await renderDOM(
                this.sequence,
                this.key,
                this.meterEvent,
                this.transpose,
                0, // displace is 0 because notes are already window-relative!
                this.windowDuration,
                assign({}, config, {
                    display: isMultiPart ? undefined : (this.staff ? { staff: this.staff } : undefined),
                    swingAsStraight8ths: this.swing,
                    swingAsStraight16ths: this.shuffle,
                    tenutoThreshold: this.tenutoThreshold
                })
            );

            // Replace shadow DOM bars and header
            this.shadowRoot.querySelectorAll('.side, .bar').forEach(remove);
            this.shadowRoot.appendChild(fragment);

            // Calculate and apply dynamic CSS variables for font heads and clef metrics
            this.styleElem.textContent = `:host { ${ renderStyle(this, this.shadowRoot) } }`;
        } catch (err) {
            console.error('<scribe-hyperblam> render error:', err);
        }
    }

    // --- Attributes and Properties ---

    get staff() {
        return this.getAttribute('staff') || 'treble';
    }

    set staff(value) {
        if (value && !Stave[value]) {
            console.warn(`<scribe-hyperblam> Invalid staff="${value}" ignored`);
            return;
        }
        this.setAttribute('staff', value);
        this.requestRender();
    }

    get divisor() {
        return this.meterEvent?.[3] || 1;
    }

    get divisions() {
        const divs = getDivisions(this.meterEvent?.[2] || 4, this.meterEvent?.[3] || 1);
        return divs && divs.length ? divs : [this.meterEvent?.[2] || 4];
    }

    get noteDuration() {
        const val = this.getAttribute('note-duration');
        return val ? parseFloat(val) : null;
    }

    set noteDuration(value) {
        if (value === null || value === undefined) {
            this.removeAttribute('note-duration');
        } else {
            this.setAttribute('note-duration', value);
        }
    }

    get key() {
        return this.getAttribute('key') || 'C';
    }

    set key(value) {
        this.setAttribute('key', value);
        this.resetEvents();
        this.requestRender();
    }

    get meter() {
        return this.getAttribute('meter') || '4/4';
    }

    set meter(value) {
        this.setAttribute('meter', value);
        this.resetEvents();
        this.requestRender();
    }

    get bars() {
        const val = this.getAttribute('bars');
        if (val === 'all') return 'all';
        return val ? parseInt(val, 10) : 2;
    }

    set bars(value) {
        this.setAttribute('bars', value);
        this.updateSequence();
        this.requestRender();
    }

    get transpose() {
        const val = this.getAttribute('transpose');
        return val ? parseInt(val, 10) : 0;
    }

    set transpose(value) {
        this.setAttribute('transpose', value);
        this.requestRender();
    }

    get track() {
        return this.getAttribute('track');
    }

    set track(value) {
        this.setAttribute('track', value);
    }

    get swing() {
        return this.hasAttribute('swing');
    }

    set swing(value) {
        this.toBoolean('swing', value);
        this.requestRender();
    }

    get shuffle() {
        return this.hasAttribute('shuffle');
    }

    set shuffle(value) {
        this.toBoolean('shuffle', value);
        this.requestRender();
    }

    get tenutoThreshold() {
        const val = this.getAttribute('tenuto-threshold');
        return val !== null ? parseFloat(val) : 1;
    }

    set tenutoThreshold(value) {
        this.setAttribute('tenuto-threshold', value);
        this.requestRender();
    }

    get parts() {
        const val = this.getAttribute('parts');
        return val ? val.trim().split(/\s+/) : null;
    }

    set parts(value) {
        if (Array.isArray(value)) value = value.join(' ');
        this.setAttribute('parts', value);
        this.resetEvents();
        this.requestRender();
    }

    static get observedAttributes() {
        return ['staff', 'key', 'meter', 'bars', 'transpose', 'swing', 'shuffle', 'track', 'tenuto-threshold', 'parts', 'note-duration'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (['key', 'meter', 'parts'].includes(name)) {
            this.resetEvents();
        } else if (name === 'bars') {
            this.updateSequence();
        }
        this.requestRender();
    }
}

if (!customElements.get('scribe-hyperblam')) {
    customElements.define('scribe-hyperblam', ScribeHyperblam);
}

export default ScribeHyperblam;
export { ScribeHyperblam };
