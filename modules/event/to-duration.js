
import get      from 'fn/get.js';
import overload from 'fn/overload.js';

export default overload(get(1), {
    chord:    (event) => event[3],
    lyric:    (event) => event[3],
    note:     (event) => event[4],
    sequence: (event) => event[4],
    // Return 0 duration as default
    default:  (event) => 0
});
