import parseGain from 'sequence/parse/parse-gain.js';

export default {
    // Spelling
    spellChordRootCFlatAsB:  true,
    spellChordRootBSharpAsC: true,
    spellChordRootESharpAsF: true,
    spellChordRootFFlatAsE:  true,

    // Swing and shuffle interpretation
    swingAsStraight8ths:  true,
    swingAsStraight16ths: true,

    // Accent thresholds
    marcatoThreshold: parseGain('-6dB'),
    accentThreshold:  parseGain('-12dB'),
    ghostThreshold:   parseGain('-24dB'),

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
