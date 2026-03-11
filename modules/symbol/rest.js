
import { eq, gte, lte, lt, gt } from '../number/float.js';
import { floorPow2, ceilPow2, isPowerOf2 } from '../number/power-of-2.js';
import grainPow2   from '../number/grain-pow-2.js';
import { P16, P24 } from '../constants.js';


const { floor } = Math;


function fitDottedDuration(min, duration) {
    let grain = 2 * ceilPow2(duration);
    while ((grain /= 2) > min / 2) {
        if (1.75 * grain === duration) return 1.75 * grain;
        if (1.5  * grain === duration) return 1.5  * grain;
        if (grain <= duration) return grain;
    }
    return min;
}

function fitRoundedUpDuration(min, duration, maxDuration) {
    maxDuration = maxDuration || Infinity;
    let grain = 4 * ceilPow2(duration);
    while ((grain /= 2) > min / 2) {
        if (grain <= duration * 2 && grain <= maxDuration) return grain;
    }
    return min;
}

function fitDuration(durations, divisor, beat, stopBeat, eventBeat) {
    // Some analysis of beats...
    const minGrain = 0.125;
    const maxGrain = floorPow2(divisor);
    const div1     = floor(beat / divisor) * divisor;
    const grain    = grainPow2(minGrain, maxGrain, beat - div1);

    // Duration decision tree

    // If note is truncated by next event render up to next event
    if (eventBeat < stopBeat) {
        // Beat to event beat is a valid head duration
        if (durations.indexOf(eventBeat - beat) !== -1) return eventBeat - beat;

        // Last divisor crossed
        const div2 = floor(eventBeat / divisor) * divisor;

        // Beat is on a divisor
        if (beat === div1) {
            // If beat to last division is a valid duration
            if (durations.indexOf(div2 - beat) !== -1) return div2 - beat;
            // Beat to next divisor
            const division = div1 + divisor < eventBeat && div1 + divisor;
            if (division) return division - beat;
            // Get the power of 2 duration before eventBeat
            return fitDottedDuration(0.125, eventBeat - beat);
        }

        // Event beat is on a divisor
        if (eq(eventBeat, div2, P16)) {
            // Otherwise up to the nearest division
            const division = div1 + divisor < eventBeat && div1 + divisor;
            if (division && durations.indexOf(division - beat) !== -1) return division - beat;
            // Otherwise fill the grain
            // Is this good ??????
            return grain;
        }
    }

    // If beat to last division is a valid duration
    const div2 = floor(stopBeat / divisor) * divisor;

    // Beat is on a divisor
    if (beat === div1) {
        // Beat to stop beat is a valid head duration
        if (durations.indexOf(stopBeat - beat) !== -1) return stopBeat - beat;
        // If beat to last division is a valid duration
        if (durations.indexOf(div2 - beat) !== -1) return div2 - beat;
        // Beat to divisor
        const division = div1 + divisor < stopBeat && div1 + divisor;
        if (division) return division - beat;
        // Get the next power of 2 duration after stopBeat but before eventBeat
        return fitRoundedUpDuration(0.125, stopBeat - beat, eventBeat - beat);
    }
    // Stop beat is on a divisor
    else if (eq(stopBeat, div2, P16)) {
        // If beat to stop beat is a valid duration use it
        if (durations.indexOf(stopBeat - beat) !== -1) return stopBeat - beat;
        // Otherwise up to the nearest division
        const division = div1 + divisor < stopBeat && div1 + divisor;
        if (division && durations.indexOf(division - beat) !== -1) return division - beat;
        // Otherwise fill the grain
        return grain;
    }
    else {
        const quadDuration = 4 * grain;
        const quadIndex    = ((beat - div1) % quadDuration) / grain;

        if (quadIndex === 1) {
            // If this note takes us up to note at 0001 render the duration 0--0
            if (beat + 2 * grain === eventBeat) return 2 * grain;

            // Is event inside the quadruplet?
            if (beat + 3 * grain >= eventBeat) {
                console.log('Next event beat is inside quaduplet');
            }

            // Grain is less than 1
            return grain < 1 ?
                // If stop beat is greater than half of three grains render duration 0---
                stopBeat >= beat + grain * 3/2 ? 3 * grain :
                // Otherwise render duration 0-00
                stopBeat >= beat + grain ? grain :
                // Stop beat is smaller than grain, fit an appropriate duration
                fitDottedDuration(0.125, stopBeat - beat) :
            // Grain is 1 or greater and
                // stop beat is after 3 grains render 0---
                stopBeat >=  beat + grain * 3 ? grain * 3 :
                // Stop beat is after 2 grains render 0--0
                stopBeat >=  beat + grain * 2 ? grain * 2 :
                // Stop beat is after 1 grain render  0-00
                stopBeat > beat + grain ? grain :
                // Stop beat is shorter than a grain
                fitDottedDuration(0.125, stopBeat - beat) ;
        }

            // stop beat is after 4th grain render 000-
        return stopBeat > beat + grain ? grain :
            // Stop beat is shorter than grain
            fitDottedDuration(0.125, stopBeat - beat) ;
    }
}

export function createRests(symbols, durations, divisor, stave, part, beat, stopBeat) {
    // Insert rests beat - stopBeat
    while (lt(stopBeat, beat, P16)) {
        const rest = {
            type: 'rest',
            beat,
            duration: fitDuration(durations, divisor, beat, stopBeat, stopBeat),
            stave,
            part
        };

        symbols.push(rest);
        beat += rest.duration;
    }

    return stopBeat;
}
