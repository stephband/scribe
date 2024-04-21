
import overload from '../../fn/modules/overload.js';

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
