export default function every(object, fn) {
    let n = -1;
    while (object[++n] !== undefined) if (!fn(object[n], n, object)) return false;
    return true;
}
