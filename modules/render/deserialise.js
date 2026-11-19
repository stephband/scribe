
//import Event      from 'sequence/modules/event.js';
import { TYPES }  from 'sequence/modules/event/event.js';
import ChordEvent from 'sequence/modules/event/chord.js';
import KeyEvent   from 'sequence/modules/event/key.js';
import MeterEvent from 'sequence/modules/event/meter.js';
import NoteEvent  from 'sequence/modules/event/note.js';
import TextEvent  from 'sequence/modules/event/text.js';


const STRIDE = 8;

/**
deserialise(data, texts)
Unpacks a stride-8 `Float64Array` and `texts` string table produced by
`modules/render/serialise.js` back into `Event` instances with `.id`,
`.target`, and `.voice` restored.
**/

export default function deserialise(data, texts) {
    const events = new Array(data.length / STRIDE);

    let i = 0, offset = 0;
    while (offset < data.length) {
        const beat   = data[offset];
        const type   = data[offset + 1];

        let event;
        switch (type) {
            case TYPES.note:
                event = NoteEvent.of(beat, data[offset + 2], data[offset + 3], data[offset + 4]);
                break;

            case TYPES.chord:
                event = ChordEvent.of(beat, data[offset + 2], data[offset + 3], data[offset + 4]);
                break;

            case TYPES.meter:
                event = MeterEvent.of(beat, data[offset + 2], data[offset + 3]);
                break;

            case TYPES.key:
                event = KeyEvent.of(beat, data[offset + 2]);
                break;

            case TYPES.text:
                event = TextEvent.of(beat, data[offset + 2], texts[data[offset + 3]]);
                break;

            default:
                throw new Error(`Cannot deserialise unknown render event type ${ type }`);
        }

        const target = data[offset + 5];
        const voice  = data[offset + 6];
        const id     = data[offset + 7];

        if (id)          event.id     = id;
        if (target >= 0) event.target = target;
        if (voice  >= 0) event.voice  = voice;

        events[i++] = event;
        offset += STRIDE;
    }

    return events;
}
