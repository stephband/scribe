
import { byGreater, mod12 } from './maths.js';

/**
transposeScale(notes, tranpose)
Returns a new scale, that is, an array of unique note numbers in the range
`0-12`, from an array of note numbers, `notes`.
**/

function unique(value, i, array) {
    return array.indexOf(value) === i;
}

export function transposeScale(scale, transpose) {
    return scale
    // Transpose
    .map((n) => mod12(n + transpose))
    // Make unique
    .filter(unique)
    // Small to big, BTW may not start with 0
    .sort(byGreater);
}

export function transposeScale4ths(scale, transpose) {
    return transposeScale(scale, transpose * 7);
}
