
/**
ceilTo(values, value)
Given a sorted array of number `values`, ceils `value` to the nearest higher
number in `values`, or `undefined`.
**/

export default function ceilTo(values, value) {
    let n = -1;
    while (values[++n] && values[n] < value);
    return values[n];
}
