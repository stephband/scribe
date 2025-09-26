export default function join(object, string) {
    let s = '' + object[0];
    let n = 0;
    while (object[++n] !== undefined) s += string + object[n];
    return s;
}
