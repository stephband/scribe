
const { abs, EPSILON } = Math;

export function round(d, n) {
    return Math.round(n / d) * d;
}

export function eq(b, a, precision = EPSILON) {
    return a !== undefined && (a === b || abs(b - a) < precision);
}

export function lte(b, a, precision) {
    return eq(b, a, precision) || a < b;
}

export function gte(b, a, precision) {
    return eq(b, a, precision) || a > b;
}

export function gt(b, a, precision) {
    return a !== undefined && b !== undefined && !lte(b, a, precision);
}

export function lt(b, a, precision) {
    return a !== undefined && b !== undefined && !gte(b, a, precision);
}
