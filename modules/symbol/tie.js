
import toStopBeat from '../event/to-stop-beat.js';

const DEBUG = globalThis.DEBUG;

function toTenutoThreshold(duration) {
    return duration > 1 ?
        duration - 1 + 0.9375 :
        duration * 0.9375 ;
}

export function createTies(symbols, bar, voice, notes, noteSymbols, tolerance = 0.125) {
    // No notes to tie
    if (!notes.length) return;

    let n = -1;
    while (noteSymbols[++n]) {
        const { beat, event, pitch, duration, stemup } = noteSymbols[n];
        const b4 = toStopBeat(event) - bar.beat;

        // If there is less than a 32nd tolerance of this note left
        if (b4 < beat + duration + tolerance) {
            // Splice it out of notes
            const i = notes.indexOf(event);
            notes.splice(i, 1);

            // But if there is nonetheless some overlap beyond quantised
            // duration, and note is not tied from an earlier note...
            if (b4 > beat + toTenutoThreshold(duration) && event[0] === bar.beat + beat) {
                // Sanity check
                if (DEBUG && noteSymbols[n].staccato) throw new Error('Note symbol cannot be tenuto and staccato');
                // Flag symbol as tenuto
                noteSymbols[n].tenuto = true;
            }
        }
        // Otherwise leave it in and create a tie symbol
        else {
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
}
