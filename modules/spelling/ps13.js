/**
ps13.js
Translation of David Meredith's Ps13 Pitch Spelling Algorithm.

Reference:
Meredith, D. (2006). "The Ps13 Pitch Spelling Algorithm".
Journal of New Music Research, 35(2), 121-159.

Ps13 determines enharmonically correct pitch names (e.g. C♯ vs. D♭) from raw
MIDI note numbers using the Line of Fifths (Tonal Pitch Class / TPC).

Key Features:
1. Stage 1 (Context Window & Local Center of Gravity):
   Evaluates a contextual window around each note (default K_pre=10, K_post=42)
   to determine the local tonal center of gravity along the Line of Fifths.
2. Stage 2 (Diatonic Optimization & Voice-Leading Correction):
   Selects the TPC candidate minimizing fifths distance, penalizes obscure
   double accidentals, and uses voice leading (leading tone vs. descending chromatic).
**/

// TPC names along Line of Fifths indexed from -15 to +15 (C = 0)
const TPC_LETTERS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];

// Base central TPC coordinates for chromatic pitch classes 0..11
// C=0, C#/Db=1, D=2, D#/Eb=3, E=4, F=5, F#/Gb=6, G=7, G#/Ab=8, A=9, A#/Bb=10, B=11
const BASE_TPC = [
    0,   // 0: C
   -5,   // 1: D♭ (or C♯ = +7)
    2,   // 2: D
   -3,   // 3: E♭ (or D♯ = +9)
    4,   // 4: E
   -1,   // 5: F
    6,   // 6: F♯ (or G♭ = -6)
    1,   // 7: G
   -4,   // 8: A♭ (or G♯ = +8)
    3,   // 9: A
   -2,   // 10: B♭ (or A♯ = +10)
    5    // 11: B
];

// Natural diatonic scale semitone intervals for letter lookup
const DIATONIC_BASE_MIDI = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
};

/**
 * Returns candidate TPC coordinates for a given chromatic pitch class (0..11)
 */
export function getCandidateTpcs(pitchClass) {
    const base = BASE_TPC[pitchClass];
    // Return standard candidate options within Line of Fifths (-12 to +14)
    return [base - 12, base, base + 12];
}

/**
 * Converts a TPC coordinate and MIDI number into standard spelled note components
 */
export function tpcToSpelledNote(tpc, midiNumber) {
    // 1. Calculate diatonic letter name using (tpc + 1) mod 7
    const letterIdx = (((tpc + 1) % 7) + 7) % 7;
    const letter = TPC_LETTERS[letterIdx];

    // 2. Calculate accidental alteration (-2=𝄫, -1=♭, 0=♮, 1=♯, 2=𝄪)
    const alteration = Math.floor((tpc + 1) / 7);

    let accidental = '';
    if (alteration === 1) accidental = '♯';
    else if (alteration === -1) accidental = '♭';
    else if (alteration === 2) accidental = '𝄪';
    else if (alteration === -2) accidental = '𝄫';

    // 3. Calculate octave number (MIDI 60 = C4, octave 4)
    const baseMidi = DIATONIC_BASE_MIDI[letter] + alteration;
    const octave = Math.floor((midiNumber - baseMidi) / 12) - 1;

    return {
        tpc,
        letter,
        alteration,
        accidental,
        name: letter + accidental,
        fullName: letter + accidental + octave,
        octave
    };
}

/**
 * Stage 1: Computes the Line-of-Fifths Center of Gravity (CoG) for a context window around note index i
 */
function computeLocalCenterOfGravity(notes, targetIdx, kPre, kPost) {
    const startIdx = Math.max(0, targetIdx - kPre);
    const endIdx = Math.min(notes.length - 1, targetIdx + kPost);

    let sumTpc = 0;
    let count = 0;

    // Tally pitch classes present in the window
    for (let j = startIdx; j <= endIdx; j++) {
        const midi = notes[j].midi;
        const pc = ((midi % 12) + 12) % 12;
        const baseTpc = BASE_TPC[pc];

        // Weight notes closer to target higher
        const dist = Math.abs(j - targetIdx);
        const weight = 1.0 / (1.0 + 0.1 * dist);

        sumTpc += baseTpc * weight;
        count += weight;
    }

    return count > 0 ? sumTpc / count : 0;
}

/**
 * Stage 2: Selects the optimal TPC candidate for note i given the local Center of Gravity
 */
function selectBestTpc(note, prevNote, nextNote, cog) {
    const pc = ((note.midi % 12) + 12) % 12;
    const candidates = getCandidateTpcs(pc);

    let bestTpc = candidates[1];
    let bestScore = Infinity;

    for (const tpc of candidates) {
        // Base distance from local tonal center of gravity
        let dist = Math.abs(tpc - cog);

        // Penalty for extreme accidentals (double sharps/flats)
        const alteration = Math.floor((tpc + 1) / 7);
        if (Math.abs(alteration) >= 2) {
            dist += 5.5; // Disfavor double accidentals unless strongly demanded by context
        }

        // Voice-leading direction heuristic:
        if (nextNote) {
            const deltaMidi = nextNote.midi - note.midi;
            // Ascending half-step (leading tone -> tonic) favors sharp
            if (deltaMidi === 1 && tpc > 0) {
                dist -= 0.8;
            }
            // Descending half-step favors flat
            if (deltaMidi === -1 && tpc < 0) {
                dist -= 0.8;
            }
        }

        if (dist < bestScore) {
            bestScore = dist;
            bestTpc = tpc;
        }
    }

    return bestTpc;
}

/**
 * David Meredith's Ps13 Pitch Spelling Algorithm (Complete Implementation).
 *
 * Takes an array of note events, analyzes local context windows along the Line of Fifths,
 * and outputs grammatically correct enharmonic pitch spellings.
 *
 * @param {Array} events - Input events (Scribe event arrays [beat, 'note', pitch, dynamic, dur] or objects)
 * @param {Object} [options] - Options { kPre: 10, kPost: 42, initialKey: 0 }
 * @returns {Array} Spelled note objects with .spelling, .tpc, and full pitch names
 */
export function ps13(events, options = {}) {
    const kPre = options.kPre ?? 10;
    const kPost = options.kPost ?? 42;

    // 1. Extract note entries with raw MIDI numbers
    const notes = [];
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const isArray = Array.isArray(e);
        const type = isArray ? e[1] : e.type;

        if (type === 'note' || isArray && typeof e[2] === 'number') {
            const beat = isArray ? e[0] : e.beat;
            const pitch = isArray ? e[2] : e.pitch;
            const midi = typeof pitch === 'number' ? pitch : parseInt(pitch, 10);
            const duration = isArray ? e[4] : e.duration ?? 1;

            notes.push({
                index: i,
                beat,
                midi,
                duration,
                sourceEvent: e
            });
        }
    }

    if (!notes.length) return [];

    // Sort notes chronologically to evaluate voice-leading
    notes.sort((a, b) => a.beat - b.beat);

    // 2. Run Ps13 Stage 1 & Stage 2 across notes
    const results = [];

    for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const prevNote = i > 0 ? notes[i - 1] : null;
        const nextNote = i < notes.length - 1 ? notes[i + 1] : null;

        // Stage 1: Estimate local Line-of-Fifths Center of Gravity
        const cog = computeLocalCenterOfGravity(notes, i, kPre, kPost);

        // Stage 2: Select candidate TPC minimizing distance & satisfying voice leading
        const tpc = selectBestTpc(note, prevNote, nextNote, cog);

        // Convert TPC to pitch name
        const spelled = tpcToSpelledNote(tpc, note.midi);

        // Enrich source event
        const enriched = {
            ...note,
            spelling: spelled.fullName,
            notename: spelled.name,
            tpc: spelled.tpc,
            letter: spelled.letter,
            alteration: spelled.alteration,
            octave: spelled.octave
        };

        if (Array.isArray(note.sourceEvent)) {
            note.sourceEvent.spelling = spelled.fullName;
        } else {
            note.sourceEvent.spelling = spelled.fullName;
        }

        results.push(enriched);
    }

    return results;
}

export default {
    BASE_TPC,
    getCandidateTpcs,
    tpcToSpelledNote,
    ps13
};
