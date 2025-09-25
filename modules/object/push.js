/* Array-like functions that operate on plain objects */

export default function push(object, value) {
    let n = -1;
    while (object[++n] !== undefined);
    object[n] = value;
    return object;
}
