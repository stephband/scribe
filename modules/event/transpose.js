
import id       from '../../../fn/modules/id.js';
import get      from '../../../fn/modules/get.js';
import overload from '../../../fn/modules/overload.js';
import { toNoteNumber } from '../../../midi/modules/note.js';

/**
transposeEvent(event)
**/

const rroot = /^[A-G][b#♭♯𝄫𝄪]?/;

export default overload(get(1), {
    note:  (event, n) => {
        event[2] = toNoteNumber(event[2]) + n;
        return event;
    },

    chord: (event, n) => {
        const root = (rroot.exec(note) || nothing)[0];
        const r    = toRootNumber(root);
        event[2] = toRootName(toRootNumber(root) + n) + note.slice(root.length);
        return event;
    },

    default: id
});
