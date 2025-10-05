
import mod from 'fn/mod.js';

/* mod12()
Finds the modulus `n % 12`, but using floored division (the JS operator uses
euclidean division).
*/

export default function mod12(n) {
    return mod(12, n);
}
