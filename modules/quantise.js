
import mod from 'fn/mod.js';

/**
function quantise(grid, amount, beat)

A quantise `grid` is an array of positive 64-bit beat numbers in ascending order.
There is no implicit beat 0, it should be included in the grid if desired. The
last number in the array is the grid's duration, not a quantisation beat. The
grid is looped, both forwards and backwards in time, at this duration.

Quantisation `amount` scales the amount of quantisation applied to `beat`.
**/

export default function quantise(grid, amount, beat) {
    const length    = grid.length;
    const duration  = grid[length - 1];
    const remainder = mod(duration, beat);

    // Scan forward until we find a quantisation entry greater than remainder
    let n = -1;
    while (remainder > grid[++n]);

    // Calculate distance from previous entry
    const fromgap = remainder - (n === 0 ?
        grid[length - 2] - duration :
        grid[n - 1]);

    // Calculate distance form next entry
    const togap = remainder - (n === length - 1 ?
        grid[0] + duration :
        grid[n]);

    // Apply scaled quantisation to nearest entry
    return beat - amount * (-togap < fromgap ? togap : fromgap) ;
}
