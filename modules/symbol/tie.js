import toStopBeat from '../event/to-stop-beat.js';
import config from '../config.js';

const DEBUG = globalThis.DEBUG;
const { tenutoThreshold } = config;

function toTenutoThreshold(duration) {
    return duration > 1 ?
        duration - 1 + tenutoThreshold :
        duration * tenutoThreshold ;
}

export function createTies(symbols, bar, voice, notes, noteSymbols, tolerance = 0.125) {
    // No notes to tie
    if (!notes.length) return;

    let hasTenuto = false;
    let hasTie    = false;

    let n = -1;
    while (noteSymbols[++n]) {
        const { beat, event, pitch, duration, stemup } = noteSymbols[n];
        const b4 = toStopBeat(event) - bar.beat;

        // If note was tied from an earlier note
        if (event[0] < bar.beat + beat) {
            hasTie = true;
        }

        // If there is less than a 32nd tolerance of this note left
        if (b4 < beat + duration + tolerance) {
            // Splice it out of notes
            const i = notes.indexOf(event);
            notes.splice(i, 1);

            // But if there is nonetheless some overlap beyond quantised
            // duration, and note is not tied from an earlier note...
            if (b4 > beat + toTenutoThreshold(duration) && event[0] === bar.beat + beat) {
                // Sanity check
                if (DEBUG && noteSymbols[i].staccato) throw new Error('Note symbol cannot be tenuto and staccato');
                hasTenuto = true;
            }
        }
        // Otherwise leave it in and create a tie symbol
        else {
            hasTie = true;
            symbols.push({
                type: 'tie',
                beat,
                pitch,
                duration,
                // TODO: We now handle this in CSS with .note + .tie selector
                stemup,
                voice,
                event
            });
        }
    }

    // When one note is found to be tenuto then they must all be marked tenuto,
    // and when one note is found to be tied then none of them can be marked tenuto
    if (hasTenuto && !hasTie) {
        let i = -1;
        while (noteSymbols[++i]) {
            // Flag symbol as tenuto
            noteSymbols[i].tenuto = true;
        }
    }
}
