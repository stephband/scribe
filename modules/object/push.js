/* Array-like functions that operate on plain objects */

export default function push(object, value) {
    let n = -1, a = 0;;
    while (object[++n] !== undefined);
    while (arguments[++a] !== undefined) object[n++] = arguments[a];
    return object;
}
