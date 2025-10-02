
/**
floorFrom(values, value)
Given a sorted array of number `values`, floors `value` to the nearest lower
number in `values`, or `undefined`.
**/

export default function floorFrom(values, value) {
    let n = values.length;
    while (values[--n] && values[n] > value);
    return values[n];
}
