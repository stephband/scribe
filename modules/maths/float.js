export function round(d, n) {
    return Math.round(n / d) * d;
}

export function equal(a, b, precision = Math.EPSILON) {
    return a === b || Math.abs(a - b) < precision;
}

export function lte(a, b, precision) {
    return equal(a, b, precision) || a < b;
}

export function gte(a, b, precision) {
    return equal(a, b, precision) || a > b;
}

export function gt(a, b, precision) {
    return !lte(a, b, precision);
}

export function lt(a, b, precision) {
    return !gte(a, b, precision);
}
