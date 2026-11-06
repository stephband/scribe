import parseGain from 'sequence/modules/parse/parse-gain.js';
import { GR }    from './constants.js';

export default {
    showAtConcertPitch: false,

    // Spelling
    spellChordRootCFlatAsB:  true,
    spellChordRootBSharpAsC: true,
    spellChordRootESharpAsF: true,
    spellChordRootFFlatAsE:  true,

    // Swing and shuffle interpretation
    swingAsStraight8ths:  false,
    swingAsStraight16ths: false,

    // Accent thresholds
    marcatoThreshold: parseGain('-6dB'),
    accentThreshold:  parseGain('-12dB'),
    ghostThreshold:   parseGain('-30dB'),

    // Ratio of note duration below which a shorter note duration is displayed
    durationThreshold: GR,
    // Ratio of note duration below which note is accented staccato
    staccatoThreshold: 0.5,
    // Ratio of note duration above which note is accented as tenuto
    tenutoThreshold:   1,//23/24,

    // Number of consecutive repeats of a 1, 2 or 4 bar phrase required before
    // the repeats are notated with bar repeat symbols. 0 disables.
    barRepeat1Threshold: 3,
    barRepeat2Threshold: 2,
    barRepeat4Threshold: 1,

    // Allowed head durations
    headDurations: [
        1/8, 6/32, /*7/32,*/
        1/4, 6/16, /*7/16,*/
        1/2, 6/8,  /*7/8, */
        1,   6/4,  /*7/4, */
        2,   6/2,  /*7/2, */
        4,   6,    /*7,   */
        8
    ],

    // Allowed rest durations
    restDurations: [
        1/8, 6/32, // 7/32,
        1/4, 6/16, // 7/16,
        1/2, 6/8,  // 7/8,
        1,   6/4,  // 7/4,
        2,   3,    // 7/2
        4,   6,
        8
    ]
}
