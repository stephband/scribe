export default function lengthOf(object) {
    if (object.length) return object.length;
    let n = -1;
    while (object[++n] !== undefined);
    return n;
}
