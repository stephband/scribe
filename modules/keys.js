
import overload from 'fn/overload.js';
import { transposeScale, transposeScale4ths } from './scale.js';

export default [
    //                                       C      D       E  F      G      A       B
    { name: 'C',  symbol: 'C∆',  spellings: [0,  1, 0, -1,  0, 0,  1, 0, -1, 0, -1,  0] },
    { name: 'D♭', symbol: 'D♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },
    { name: 'D',  symbol: 'D∆',  spellings: [0,  1, 0,  1,  0, 0,  1, 0,  1, 0, -1,  0] },
    { name: 'E♭', symbol: 'E♭∆', spellings: [0, -1, 0, -1,  0, 0, -1, 0, -1, 0, -1, -1] },
    { name: 'E',  symbol: 'E∆',  spellings: [0,  1, 0,  1,  0, 1,  1, 0,  1, 0,  1,  0] },
    { name: 'F',  symbol: 'F∆',  spellings: [0, -1, 0, -1,  0, 0,  1, 0, -1, 0, -1,  0] },
  //{ name: 'F♯', symbol: 'F♯∆', spellings: [1,  1, 0,  1,  0, 1,  1, 0,  1, 0,  1,  0] },  // (Should have G##?)
    { name: 'G♭', symbol: 'G♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },  // (Should have Ebb?)
    { name: 'G',  symbol: 'G∆',  spellings: [0,  1, 0, -1,  0, 0,  1, 0,  1, 0, -1,  0] },
    { name: 'A♭', symbol: 'A♭∆', spellings: [0, -1, 0, -1, -1, 0, -1, 0, -1, 0, -1, -1] },
    { name: 'A',  symbol: 'A∆',  spellings: [0,  1, 0,  1,  0, 0,  1, 0,  1, 0,  1,  0] },
    { name: 'B♭', symbol: 'B♭∆', spellings: [0, -1, 0, -1,  0, 0, -1, 0, -1, 0, -1,  0] },
    { name: 'B',  symbol: 'B∆',  spellings: [1,  1, 0,  1,  0, 1,  1, 0,  1, 0,  1,  0] }
];


export const cScale = [0,2,4,5,7,9,11];

const keynumbers = {
    'F♭': -8,
    'C♭': -7,
    'G♭': -6,
    'D♭': -5,
    'A♭': -4,
    'E♭': -3,
    'B♭': -2,
    'F':  -1,
    'C':   0,
    'G':   1,
    'D':   2,
    'A':   3,
    'E':   4,
    'B':   5,
    'F♯':  6,
    'C♯':  7,
    'G♯':  8,
    'D♯':  9,
    'A♯':  10,
    'E♯':  11,
    'B♯':  12
};

const accidentals = {
    'bb': '𝄫',
    'b': '♭',
    '':  '',
    '#':  '♯',
    '##':  '𝄪'
};

function normaliseKeyName(name) {
    return name.replace(/[#b]{1,2}$/, ($0) => accidentals[$0]);
}

export function toKeyNumber(keyname) {
    return typeof keyname === 'number' ?
        keyname :
        keynumbers[normaliseKeyName(keyname)] ;
}

export function toKeyScale(key) {
    return typeof key === 'number' ?
        transposeScale(cScale, key) :
        transposeScale4ths(cScale, keynumbers[key]) ;
}
