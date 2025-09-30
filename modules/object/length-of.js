export default function lengthOf(object) {
    let n = -1;
    while (object[++n] !== undefined);
    return n;
}
