
/** toScale(event)
Returns an array of octave 0 note numbers that `event` represents.

```js
toScale([0, 'note', 3, 1, 1])      // [3]
toScale([0, 'note', 16, 1, 1])     // [4]
toScale([0, 'chord', 'Gm7', 1, 1]) // [0, 2, 4, 5, 7, 9, 10]
```
**/

import get              from '../../lib/fn/modules/get.js';
import overload         from '../../lib/fn/modules/overload.js';
import { toNoteNumber } from '../../lib/midi/modules/note.js';
import { toChordNotes } from './chord.js';


export default overload(get(1), {
    // Only chords and notes have scale
    chord:   (event) => toChordNotes(event[2]),
    note:    (event) => [toNoteNumber(event[2]) % 12],
    // TODO: But perhaps sequences should recusively pass back its current scale ???
    //sequence: (event) => return event[4],
    default: (event) => []
});
