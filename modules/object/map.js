
export default function map(fn, object) {
    const array = [];
    let n = -1;
    while (object[++n] !== undefined) array.push(fn(object[n], n));
    return array;
}
