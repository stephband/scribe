/**
musescore.js
JavaScript ES Module translation of MuseScore Studio's MIDI Quantization Engine:
Derived from MuseScore's `src/importexport/midi/internal/midiimport/importmidi_quant.cpp` & `importmidi_quant.h`.

MuseScore's quantization algorithm features:
1. Exact rational fraction arithmetic (ReducedFraction) to prevent floating-point drift.
2. Distinct, adaptive quantization rasters for standard notes vs. tuplets.
3. Dotted note preservation (reduceQuantIfDottedNote) preventing syncopation corruption.
4. Two-phase on-time and off-time quantization with minimum duration enforcement.
**/

/**
 * Exact Rational Fraction Class matching MuseScore's ReducedFraction
 */
export class Fraction {
    constructor(numerator = 0, denominator = 1) {
        if (denominator === 0) throw new Error("Fraction denominator cannot be zero");
        if (denominator < 0) {
            numerator = -numerator;
            denominator = -denominator;
        }
        this.num = Math.round(numerator);
        this.den = Math.round(denominator);
        this.reduce();
    }

    static gcd(a, b) {
        a = Math.abs(a);
        b = Math.abs(b);
        while (b) {
            const t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    reduce() {
        const d = Fraction.gcd(this.num, this.den);
        if (d > 1) {
            this.num /= d;
            this.den /= d;
        }
        return this;
    }

    clone() {
        return new Fraction(this.num, this.den);
    }

    static fromFloat(val, maxDenom = 64) {
        if (val === 0) return new Fraction(0, 1);
        let bestNum = 1, bestDen = 1, bestErr = Math.abs(val - 1);
        for (let den = 1; den <= maxDenom; den++) {
            const num = Math.round(val * den);
            const err = Math.abs(val - num / den);
            if (err < bestErr) {
                bestNum = num;
                bestDen = den;
                bestErr = err;
                if (err < 1e-6) break;
            }
        }
        return new Fraction(bestNum, bestDen);
    }

    static fromTicks(ticks, division = 480) {
        return new Fraction(ticks, division);
    }

    toTicks(division = 480) {
        return Math.round((this.num * division) / this.den);
    }

    toDouble() {
        return this.num / this.den;
    }

    add(other) {
        return new Fraction(
            this.num * other.den + other.num * this.den,
            this.den * other.den
        );
    }

    sub(other) {
        return new Fraction(
            this.num * other.den - other.num * this.den,
            this.den * other.den
        );
    }

    mul(other) {
        if (typeof other === 'number') {
            return new Fraction(this.num * other, this.den);
        }
        return new Fraction(this.num * other.num, this.den * other.den);
    }

    div(other) {
        if (typeof other === 'number') {
            return new Fraction(this.num, this.den * other);
        }
        return new Fraction(this.num * other.den, this.den * other.num);
    }

    eq(other) {
        return this.num * other.den === other.num * this.den;
    }

    lt(other) {
        return this.num * other.den < other.num * this.den;
    }

    lte(other) {
        return this.num * other.den <= other.num * this.den;
    }

    gt(other) {
        return this.num * other.den > other.num * this.den;
    }

    gte(other) {
        return this.num * other.den >= other.num * this.den;
    }
}

// MuseScore Constants
export const DIVISION = 480; // Standard ticks per quarter note
export const MIN_ALLOWED_DURATION = new Fraction(1, 16); // 1/64 note in beats (or 1/16 quarter note)

export const QuantValue = {
    Q_4:    new Fraction(1, 1),   // Quarter note (1 beat)
    Q_8:    new Fraction(1, 2),   // Eighth note (0.5 beats)
    Q_16:   new Fraction(1, 4),   // 16th note (0.25 beats)
    Q_32:   new Fraction(1, 8),   // 32nd note (0.125 beats)
    Q_64:   new Fraction(1, 16),  // 64th note (0.0625 beats)
    Q_128:  new Fraction(1, 32),
    Q_256:  new Fraction(1, 64)
};

/**
 * Quantizes an arbitrary rational fraction to the nearest grid raster.
 * Translation of MuseScore's `quantizeValue()`
 */
export function quantizeValue(value, quant) {
    const v = value.clone().reduce();
    const q = quant.clone().reduce();

    let valNum = v.num * q.den;
    const rastNum = q.num * v.den;
    const commonDen = v.den * q.den;

    // Nearest integer rounding matching MuseScore: ((valNum + rastNum / 2) / rastNum) * rastNum
    valNum = Math.floor((valNum + rastNum / 2) / rastNum) * rastNum;
    return new Fraction(valNum, commonDen).reduce();
}

/**
 * Halves the quantization raster if the note length is close to a dotted note (1.5x)
 * Translation of MuseScore's `reduceQuantIfDottedNote()`
 */
export function reduceQuantIfDottedNote(noteLen, raster) {
    let newRaster = raster.clone();
    const div = noteLen.div(raster);
    const ratio = div.toDouble();

    // 1.5: dotted note that is larger than quantization value
    if (ratio > 1.45 && ratio < 1.55) {
        newRaster = newRaster.div(2); // reduce quantization error for dotted notes
    }
    return newRaster;
}

/**
 * Determines the adaptive raster for a note of a given length.
 * Translation of MuseScore's `quantForLen()`
 */
export function quantForLen(noteLen, basicQuant) {
    let quant = basicQuant.clone();
    const limit = MIN_ALLOWED_DURATION.mul(2);

    while (quant.gt(noteLen) && quant.gte(limit)) {
        quant = quant.div(2);
    }

    if (quant.gte(limit)) {
        quant = reduceQuantIfDottedNote(noteLen, quant);
    }

    return quant;
}

/**
 * Determines the adaptive raster for a tuplet.
 * Translation of MuseScore's `quantForTuplet()`
 */
export function quantForTuplet(tupletLen, tupletRatio) {
    const quant = tupletLen.div(tupletRatio.num);
    const limit = MIN_ALLOWED_DURATION.mul(2);

    if (quant.gte(limit)) {
        return quant.div(2);
    }
    return quant;
}

/**
 * Finds the minimum quantization raster needed for notes in a chord.
 * Translation of MuseScore's `findMinQuant()`
 */
export function findMinQuant(chord, basicQuant) {
    let minQuant = null;
    const notes = chord.notes || [chord];

    for (const note of notes) {
        const offTime = note.offTime || (chord.onTime.add(note.duration));
        const noteLen = offTime.sub(chord.onTime);
        const q = quantForLen(noteLen, basicQuant);

        if (minQuant === null || q.lt(minQuant)) {
            minQuant = q;
        }
    }
    return minQuant || basicQuant;
}

/**
 * Finds quantized chord onset time.
 * Translation of MuseScore's `findQuantizedChordOnTime()`
 */
export function findQuantizedChordOnTime(chord, basicQuant) {
    const quant = findMinQuant(chord, basicQuant);
    return quantizeValue(chord.onTime, quant);
}

/**
 * Finds quantized note offset time, ensuring minimum duration.
 * Translation of MuseScore's `findQuantizedNoteOffTime()`
 */
export function findQuantizedNoteOffTime(onTime, offTime, basicQuant) {
    const noteLen = offTime.sub(onTime);
    let quant = quantForLen(noteLen, basicQuant);
    let qOffTime;

    while (true) {
        qOffTime = quantizeValue(offTime, quant);
        if (qOffTime.lte(onTime)) {
            if (quant.gte(MIN_ALLOWED_DURATION.mul(2))) {
                quant = quant.div(2);
                continue;
            }
            qOffTime = onTime.add(quant);
        }
        break;
    }

    return { offTime: qOffTime, quant };
}

/**
 * Full MuseScore MIDI Chord Quantizer:
 * Translates `Quantize::quantizeChords()`.
 *
 * Takes an array of raw notes/chords, quantizes on-times and off-times using
 * MuseScore's adaptive raster algorithms, resolves overlaps, and outputs
 * clean quantized events.
 *
 * @param {Array} events - Input note events [{ beat, duration, pitch, ... }]
 * @param {Object} [options] - Options { basicQuant: Fraction (default 1/16 note), swing: boolean }
 * @returns {Array} Quantized note events ready for notation
 */
export function quantizeChords(events, options = {}) {
    const basicQuant = options.basicQuant || QuantValue.Q_16;
    if (!events.length) return [];

    // 1. Group notes by raw onset into Chords (matching MuseScore's MidiChord grouping)
    const chords = [];
    const sorted = [...events].sort((a, b) => (a.beat !== undefined ? a.beat - b.beat : a[0] - b[0]));

    let currentChord = null;

    for (const e of sorted) {
        const onBeat = e.beat !== undefined ? e.beat : e[0];
        const dur = e.duration !== undefined ? e.duration : e[4] ?? 1.0;
        const pitch = e.pitch !== undefined ? e.pitch : e[2];

        const onTimeFrac = Fraction.fromFloat(onBeat);
        const durFrac = Fraction.fromFloat(dur);
        const offTimeFrac = onTimeFrac.add(durFrac);

        const noteObj = {
            pitch,
            onTime: onTimeFrac,
            offTime: offTimeFrac,
            sourceEvent: e
        };

        if (currentChord && currentChord.onTime.sub(onTimeFrac).toDouble() === 0) {
            currentChord.notes.push(noteObj);
        } else {
            currentChord = {
                onTime: onTimeFrac,
                notes: [noteObj]
            };
            chords.push(currentChord);
        }
    }

    // 2. Pass 1: Quantize Onset Times (quantizeOnTimes)
    for (const chord of chords) {
        chord.quantizedOnTime = findQuantizedChordOnTime(chord, basicQuant);
        for (const note of chord.notes) {
            note.quantizedOnTime = chord.quantizedOnTime;
        }
    }

    // 3. Pass 2: Quantize Offset Times (quantizeOffTimes)
    for (const chord of chords) {
        for (const note of chord.notes) {
            const res = findQuantizedNoteOffTime(chord.quantizedOnTime, note.offTime, basicQuant);
            note.quantizedOffTime = res.offTime;
            note.quantizedDuration = note.quantizedOffTime.sub(chord.quantizedOnTime);
        }
    }

    // 4. Flatten back to Scribe event structures
    const result = [];
    for (const chord of chords) {
        for (const note of chord.notes) {
            const beatVal = note.quantizedOnTime.toDouble();
            const durVal = Math.max(MIN_ALLOWED_DURATION.toDouble(), note.quantizedDuration.toDouble());

            if (Array.isArray(note.sourceEvent)) {
                // Scribe array format [beat, "note", pitch, dynamic, duration]
                const clone = [...note.sourceEvent];
                clone[0] = beatVal;
                clone[4] = durVal;
                result.push(clone);
            } else {
                // Object format
                result.push({
                    ...note.sourceEvent,
                    beat: beatVal,
                    duration: durVal
                });
            }
        }
    }

    return result.sort((a, b) => {
        const beatA = a.beat !== undefined ? a.beat : a[0];
        const beatB = b.beat !== undefined ? b.beat : b[0];
        return beatA - beatB;
    });
}

export default {
    Fraction,
    QuantValue,
    DIVISION,
    MIN_ALLOWED_DURATION,
    quantizeValue,
    reduceQuantIfDottedNote,
    quantForLen,
    quantForTuplet,
    findMinQuant,
    findQuantizedChordOnTime,
    findQuantizedNoteOffTime,
    quantizeChords
};
