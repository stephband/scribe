import 'https://cdn.jsdelivr.net/gh/stephband/fn@1.5.1/deno/deno-2-support.js';

import Sequence   from 'sequence/sequence.js';
import Stave      from '../modules/stave.js';
import createBars from '../modules/create-bars.js';

// Get the stave controller
const stave = Stave.create('treble');
/*
console.log(createBars(new Sequence([]), stave));

console.log(createBars(new Sequence([
    [10, "note", "C4", 0.1, 4]
]), stave));

console.log(createBars(new Sequence([
    [0, "meter", 4, 1],
    [10, "note", "C4", 0.1, 4]
]), stave));

console.log(createBars(new Sequence([
    [0, "key", "Bb"],
    [0, "meter", 4, 1],
    [0, "note", "C4", 0.1, 4]
]), stave));
*/
console.log(createBars(new Sequence([
    [0, "key", "Bb"],
    [0, "meter", 4, 1],
    [1, "note", "G3", 0.1, 3],
    [2, "note", "C4", 0.1, 4],
    [4, "note", "E4", 0.1, 2],
    [6, "note", "G4", 0.1, 4],
    [8, "note", "C#5", 0.1, 2]
]), stave));
