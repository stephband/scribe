
import { mod } from '../lib/fn/modules/mod.js';

/* mod12()
Finds the modulus `n % 12`, but using floored division (the JS operator uses
euclidean division).
*/

export function mod12(n) { return mod(12, n); }



export function byGreater(a, b) {
    return a > b ? 1 :
        a < b ? -1 :
        0 ;
}
