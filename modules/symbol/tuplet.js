import { toNoteName, toNoteNumber } from 'midi/note.js';
import { stemupFromSymbols } from './stem.js';
import { P16 } from '../constants.js';
import lengthOf    from '../object/length-of.js';


const { sqrt } = Math;


export function closeTuplet(stave, part, tuplet) {
    const { beat, duration, divisor } = tuplet;

    // Stem direction
    const stemup = part.stemup === undefined ?
        stemupFromSymbols(stave, part, tuplet) :
        part.stemup ;

    // Apply stem direction to notes
    let n = -1, symbol;
    while (symbol = tuplet[++n]) {
        if (symbol.type === 'note' && !symbol.beam) symbol.stemup = stemup;
    }

    // Decide on tuplet pitch, effectively vertical row position
    const centreBeat = beat + 0.5 * duration;

    // Encourage lowest pitch to be 1 octave below top line, ensuring
    // triplet (with appropriate styling) always sits above the top line
    const lowestPitchNumber = toNoteNumber(stave.topPitch) - 12;

    let centreNumber;
    let h = lengthOf(tuplet);
    // Scan backwards through tuplet until last symbol before centre beat
    while ((symbol = tuplet[--h]) && symbol.beat > centreBeat);
    ++h;

    // Scan backwards through tuplet that cross centre beat, get highest pitch
    while ((symbol = tuplet[--h]) && symbol.beat + symbol.duration > centreBeat) {
        const number = toNoteNumber(symbol.pitch);
        if (!centreNumber || number > centreNumber) centreNumber = number;
    }

    // Scan forwards from first symbol finding highest pitch beginning head
    let firstNumber = lowestPitchNumber;
    h = -1;
    while ((symbol = tuplet[++h]) && symbol.beat < beat + P16) {
        const number = toNoteNumber(symbol.pitch);
        if (!firstNumber || number > firstNumber) firstNumber = number;
    }

    // Scan backwards from last symbol finding highest pitch ending symbol
    let lastNumber = lowestPitchNumber;
    h = lengthOf(tuplet);
    while ((symbol = tuplet[--h]) && symbol.beat > beat + duration - (duration / divisor) - P16) {
        const number = toNoteNumber(symbol.pitch);
        if (!lastNumber || number > lastNumber) lastNumber = number;
    }

    const avgNumber = Math.ceil((firstNumber + lastNumber) / 2);
    const avgPitch  = toNoteName(avgNumber);
    if (avgNumber > centreNumber) centreNumber = avgNumber;

    if (stave.pitched) tuplet.pitch = toNoteName(centreNumber);
    tuplet.stemup = stemup;

    const diff = lastNumber - firstNumber;
    tuplet.angle = diff < 0 ?
        4 * sqrt(-diff) :
        -4 * sqrt(diff) ;
}
