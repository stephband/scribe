
import * as HSID from 'sequence/modules/hsid.js';
import grainOfBeat from '../bar/grain-of-beat.js';


/*
Batches events and reads their notes into slice objects.
*/

export default function batch(events) {
    const head = {
        beat: 0,
        grain: 0,
        key: 0,
        count: 1,
        index: 0,
        size: 0,
        length: 0
    };

    let meter;
    let slice = head;
    let n = -1, event;
    while (event = events[++n]) switch (event.type) {
        case 'key':
            slice.key = event[2];
            continue;
        case 'meter':
            meter = event;
            if (event[0] === slice.beat) {
                slice.grain = grainOfBeat(meter.divisions, (event[0] - meter[0]) % meter.beats);
            }
            continue;
        case 'chord':
        case 'note': {
            // Update current slice
            if (event[0] > slice.beat + 1/24) {
                // If slice has no events repurpose it to current beat...
                if (slice.length === 0) {
                    slice.beat  = event[0];
                    slice.grain = meter ?
                        grainOfBeat(meter.divisions, (event[0] - meter[0]) % meter.beats) :
                        0 ;
                }
                // otherwise create new slice
                else {
                    ++head.count;
                    slice = slice.next = {
                        prev:   slice,
                        beat:   event[0],
                        grain:  meter ?
                            grainOfBeat(meter.divisions, (event[0] - meter[0]) % meter.beats) :
                            0 ,
                        key:    slice.key,
                        index:  slice.index + 1,
                        size:   0,
                        length: 0
                    }
                }
            }

            // Collect notes in slice TODO dissassemble chords
            slice[slice.length++] = event[2];
            // Keep a reference to original event
            slice[--slice.size] = event;
            // If it's a note that's all folks
            if (event.type === 'note') continue;

            // Collect note numbers from chord event
            const root    = event[2];
            const numbers = HSID.toArray(event[3]);
            let n = 0, number;
            while (number = numbers[++n]) {
                slice[slice.length++] = root + number;
            }

            //
            continue;
        }
    }

    return head;
}
