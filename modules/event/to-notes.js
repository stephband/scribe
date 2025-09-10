
/** toScale(event)
Returns an array of octave 0 note numbers that `event` represents.

```js
toScale([0, 'note', 3, 1, 1])      // [3]
toScale([0, 'note', 16, 1, 1])     // [4]
toScale([0, 'chord', 'Gm7', 1, 1]) // [0, 2, 4, 5, 7, 9, 10]
```
**/

import get              from 'fn/get.js';
import overload         from 'fn/overload.js';
import { toRootNumber } from 'midi/note.js';
import { toChordNotes } from './chord.js';


export default overload(get(1), {
    // Only chords and notes have scale
    chord:   (event) => toChordNotes(event[2], event[3]),
    note:    (event) => [toRootNumber(event[2])],
    // TODO: But perhaps sequences should recusively pass back its current scale ???
    //sequence: (event) => return event[4],
    default: (event) => []
});
