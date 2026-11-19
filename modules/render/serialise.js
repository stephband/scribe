
import Data                   from 'fn/data.js';
import Event                  from 'sequence/modules/event.js';
import { toKeyNumber }        from 'sequence/modules/event/key.js';
import { identify, original } from '../event.js';


const { TYPES } = Event;
const STRIDE    = 8;

function isRenderable(event) {
    switch (event[1]) {
        case TYPES.note:
        case TYPES.chord:
        case TYPES.meter:
        case TYPES.key:
        case TYPES.text:
        case TYPES.clef:
            return true;
        default:
            return false;
    }
}

/**
serialise(events)
Packs an iterable of events (such as a `SequenceIterator` or ` event[]`) into a
stride-8 `Float64Array` plus a `texts` string lookup array for transfer to the
render worker. Non-notation events (`sequence`, `rate`, `control`) are skipped.
**/

export default function serialise(events) {
    const kept  = [];
    const texts = [];

    for (let event of events) {
        if (!(event instanceof Event)) event = Event.from(event);
        if (isRenderable(event)) kept.push(event);
    }

    const data = new Float64Array(kept.length * STRIDE);

    let n = -1, event, offset = 0;
    while (event = kept[++n]) {
        data[offset]     = event[0];                                       // beat
        data[offset + 1] = event[1];                                       // type

        switch (event[1]) {
            case TYPES.note:
            case TYPES.chord:
                data[offset + 2] = event[2]; // pitch / root
                data[offset + 3] = event[3]; // gain / hsid
                data[offset + 4] = event[4]; // duration
                break;

            case TYPES.meter:
                data[offset + 2] = event[2]; // rsid
                data[offset + 3] = event[3]; // divisor
                break;

            case TYPES.key:
                data[offset + 2] = toKeyNumber(event[2]);
                break;

            case TYPES.text:
                data[offset + 2] = event[2];                 // duration
                data[offset + 3] = texts.push(event[3]) - 1; // index into texts[]
                break;

            case TYPES.clef:
                data[offset + 2] = typeof event[2] === 'number' ? event[2] : 0;
                break;
        }

        data[offset + 5] = event.target !== undefined ? event.target : -1; // target (0+ int)
        data[offset + 6] = event.voice  !== undefined ? event.voice  : -1; // voice
        data[offset + 7] = identify(Data.objectOf(original(event))) || 0;  // id

        offset += STRIDE;
    }

    return { data, texts };
}
