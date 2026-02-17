import 'https://cdn.jsdelivr.net/gh/stephband/fn@1.5.x/deno/deno-2-support.js';

import Sequence   from 'sequence/module.js';
import Stave      from '../modules/stave.js';
import createBars from '../modules/create-bars.js';

// Get the stave controller
const stave = Stave['treble'];
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
    [0,    "note", "C4", 0.1, 0.67],
    [0.67, "note", "C4", 0.1, 0.67],
    [1.33, "note", "C4", 0.1, 0.67]
]), stave));

console.log(createBars(new Sequence([
    [0, "key", "Bb"],
    [0, "meter", 4, 1],
    [1, "note", "G3", 0.1, 3],
    [2, "note", "C4", 0.1, 4],
    [4, "note", "E4", 0.1, 2],
    [6, "note", "G4", 0.1, 4],
    [8, "note", "C#5", 0.1, 3]
]), stave));
*/

console.log(createBars(new Sequence([
    [0, "key", "Bb"],
    [0, "meter", 4, 1],
    [1.333, "note", "D4", 0.1, 0.333],
    [1.667, "note", "C4", 0.1, 0.333],
    [1.667, "note", "E4", 0.1, 0.333],
    [1.667, "note", "G4", 0.1, 0.333],
    [2,     "note", "C5", 0.1, 1]
]), stave));
