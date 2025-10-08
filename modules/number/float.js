
const { abs, EPSILON } = Math;

export function round(d, n) {
    return Math.round(n / d) * d;
}

export function eq(a, b, precision = EPSILON) {
    return a !== undefined && (a === b || abs(a - b) < precision);
}

export function lte(a, b, precision) {
    return eq(a, b, precision) || a < b;
}

export function gte(a, b, precision) {
    return eq(a, b, precision) || a > b;
}

export function gt(a, b, precision) {
    return a !== undefined && b !== undefined && !lte(a, b, precision);
}

export function lt(a, b, precision) {
    return a !== undefined && b !== undefined && !gte(a, b, precision);
}
