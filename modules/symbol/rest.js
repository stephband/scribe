
import { floorPow2 } from '../number/power-of-2.js';
import grainPow2   from '../number/grain-pow-2.js';
import { getDivisionBefore, getDivisionAfter } from '../bar/divisions.js';


function getDuration(durations, divisions, b1, b2) {
    const v1    = getDivisionBefore(divisions, b1);
    const v2    = getDivisionAfter(divisions, b1);
    const v3    = getDivisionBefore(divisions, b2) ;
    const grain = grainPow2(0.125, 8, b1 - v1);

    // If b1 is on a division and b1 to v3 is a valid duration
    if (b1 === v1 && v1 !== v3 && durations.includes(v3 - b1)) {
        return v3 - v1;
    }

    let d = durations.length;

    // Reject durations greater than grain
    while (durations[--d] > grain);
    ++d;

    // Reject durations greater than available space up to b2 or bar
    // division, whichever is first
    const b3 = v1 === v3 ? b2 : v2 ;
    while (durations[--d] > b3 - b1);

    // If that duration does not span exactly to b2 or bar division
    return b1 + durations[d] !== b3 ?
        // ...reject dotted durations
        floorPow2(durations[d]) :
        // ...use duration as-is
        durations[d] ;
}

export function createRests(symbols, durations, divisions, stave, voice, startBeat, stopBeat) {
    let beat = startBeat;

    // Insert rests beat - stopBeat
    while (beat < stopBeat) {
        const duration = getDuration(durations, divisions, beat, stopBeat);
        symbols.push({
            type: 'rest',
            beat,
            duration,
            stave,
            voice
        });
        beat += duration;
    }

    return stopBeat;
}
