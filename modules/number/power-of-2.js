
import sum from 'fn/sum.js';

export function ceilPowerOf2(n) {
    return 2 ** Math.ceil(Math.log2(n));
}

export function floorPow2(n) {
    return 2 ** Math.floor(Math.log2(n));
}

export function roundPowerOf2(n) {
    return 2 ** Math.round(Math.log2(n));
}

export function averagePowerOf2(...values) {
    return 2 ** (values.map(Math.log2).reduce(sum, 0) / values.length);
}

export function isPowerOf2(n) {
    return n > 0 && (n & (n - 1)) === 0;
}
