
import nothing from '../../../fn/modules/nothing.js';
import scales  from '../keys.js';


const rchord = /([ABCDEFG][♭♯]?)([^\/]*)(?:\/([ABCDEFG]))?/;

const numbers = {
    'C': 0,
    'D': 2,
    'E': 4,
    'F': 5,
    'G': 7,
    'A': 9,
    'B': 11
};

const modes = {
    '∆':       0,
    '∆7':      0,
    '-7':      2,
    'sus♭9':   4,
    '7sus♭9':  4,
    '∆♯11':    5,
    '∆(♯11)':  5,
    '7':       7,
    '13':      7,
    'sus':     7,
    '7sus':    7,
    '-♭6':     9,
    'ø':       11,

    // Here we treat melodic minor as though it were the fourth degree of a
    // major scale, making the spellings work out nicely, or so it is hoped,
    // but also because it is strongly related (think E7alt -> Am).
    '-∆':      5,
    '13sus♭9': 7,
    '∆+':      8,
    '∆♯5':     8,
    '7♯11':    10,
    '7♭13':    0,
    'ø(9)':    2,
    '7alt':    4
};

// TODO Move this. It is used for lookup to get scale of chord, but we need to
// move this to a central place that handles theory
const chordNotes = {
    '∆':        [0, 2, 4, 7, 9, 11],
    '∆7':       [0, 2, 4, 7, 9, 11],
    '-':        [0, 3, 7],
    '-7':       [0, 2, 3, 5, 7, 9, 10],
    'sus♭9':    [0, 1, 5, 7, 10],
    '7sus♭9':   [0, 1, 5, 7, 10],
    '∆♯11':     [0, 2, 4, 6, 7, 9, 11],
    '∆(♯11)':   [0, 2, 4, 6, 7, 9, 11],
    '7':        [0, 4, 7, 10],
    '13':       [0, 4, 7, 9, 10],
    'sus':      [0, 2, 5, 7, 10],
    '7sus':     [0, 2, 5, 7, 10],
    '-♭6':      [0, 2, 3, 5, 7, 8],
    'ø':        [0, 3, 6, 10],

    // Melodic minor
    '-∆':       [0, 2, 3, 5, 7, 9, 11],
    '13sus♭9':  [0, 1, 5, 7, 9, 10],
    '∆+':       [0, 2, 4, 6, 8, 9, 11],
    '∆♯5':      [0, 2, 4, 6, 8, 9, 11],
    '7♯11':     [0, 2, 4, 6, 7, 9, 10],
    '7♭13':     [0, 2, 4, 7, 8, 10],
    'ø(9)':     [0, 2, 3, 6, 10],
    '7alt':     [0, 1, 3, 4, 6, 8, 10],
    '∆♭6':      [0, 4, 7, 8, 11]
};


// Map functions

export function normaliseChordName(str) {
    return str.replace(/(maj)|(min)/, ($0, $1, $2) => {
        return $1 ? '∆' : $2 ? '-' : '' ;
    });
}

export function toRoot(str) {
    var name = (rchord.exec(str) || nothing)[1];
    return numbers[name];
}

export function toExtension(str) {
    const chordName = normaliseChordName(str);
    return (rchord.exec(chordName) || empty)[2];
}

export function toMode(str) {
    return modes[toExtension(str)];
}

export function toBass(str) {
    var result = rchord.exec(str) || empty;
    return result[3] || result[1];
}

export function toKey(str) {
    return scales[mod12(toRoot(str) - toMode(str))];
}

export function toChordNotes(str) {
    var notes = chordNotes[toExtension(str)];
    var root  = toRoot(str);
    return notes ? notes
        .map((n) => (n + root) % 12)
        .sort() :
        [] ;
}
