
/**
Hash

Streams symbol properties and bar parameters into a 53-bit cyrb53 fingerprint
without allocating intermediate strings. State is module-scoped, hashes must be
built one at a time.

```
begin();
symbol(object, { id: true });
const hash = end();
```
**/

const { imul, round } = Math;

// Numbers are quantised before hashing so that floating point noise from
// subtracting bar beats (eg. 5.333.. - 4 vs 1.333..) does not prevent a match
const PRECISION = 1000000;

// Streaming cyrb53. State is module-scoped, which is fine as hashing is
// synchronous and never re-entrant.
let h1, h2;

export function begin() {
    h1 = 0xdeadbeef;
    h2 = 0x41c6ce57;
}

export function int(n) {
    h1 = imul(h1 ^ n, 2654435761);
    h2 = imul(h2 ^ n, 1597334677);
}

export function string(s) {
    let i = -1;
    while (++i < s.length) int(s.charCodeAt(i));
    // Terminate, so that 'ab' + 'c' does not hash as 'a' + 'bc'
    int(0);
}

export function value(v) {
    switch (typeof v) {
        case 'number':  return int(round(v * PRECISION));
        case 'string':  return string(v);
        case 'boolean': return int(v ? 1 : 2);
        // undefined, null, objects
        default:        return int(3);
    }
}

export function symbol(symbol, ignore) {
    let key, v;
    for (key in symbol) {
        if (ignore[key]) continue;
        v = symbol[key];

        // Undefined properties (eg. beam.stub) are as good as absent
        if (v === undefined) continue;

        if (typeof v === 'object') {
            // Hash voices by name. Other objects are references to symbols
            // (beam.note, tuplet[n], note.beam) that are hashed in their own
            // right as members of the symbols array.
            if (key !== 'voice' || !v) continue;
            string(key);
            string(v.name);
            continue;
        }

        string(key);
        value(v);
    }

    // Terminate symbol
    int(-1);
}

export function end() {
    h1  = imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
