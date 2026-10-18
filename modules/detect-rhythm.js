
/*
each a nameable musical principle rather than a magic exponent:

┌────────────────┬─────────────────────────────┬───────────────────────────────────────────────┬──────────────┐
│     Factor     │            Form             │                Guards against                 │     Knob     │
├────────────────┼─────────────────────────────┼───────────────────────────────────────────────┼──────────────┤
│ alignment      │ geomean(½+½cos…)            │ off-grid ties; is the cos-crossing boundaries │ —            │
│                │                             │  you wanted                                   │              │
├────────────────┼─────────────────────────────┼───────────────────────────────────────────────┼──────────────┤
│ drift          │ geomean(gauss(σ,            │ coarse grids over-accepting far notes         │ σ = 0.125    │
│                │ offset_beats))              │                                               │ beats        │
├────────────────┼─────────────────────────────┼───────────────────────────────────────────────┼──────────────┤
│ coverage       │ pow(duration, …)            │ shrinking to a clean subset                   │ 0.15         │
│ (span)         │                             │                                               │              │
├────────────────┼─────────────────────────────┼───────────────────────────────────────────────┼──────────────┤
│ coverage       │ pow(count, …)               │ splitting off the one cleanly-timed note      │ 0.1          │
│ (events)       │                             │                                               │              │
├────────────────┼─────────────────────────────┼───────────────────────────────────────────────┼──────────────┤
│ metric         │ pow(w, snaps)               │ grids floating to weak beats                  │ 0.9          │
│ salience       │                             │                                               │              │
└────────────────┴─────────────────────────────┴───────────────────────────────────────────────┴──────────────┘
*/



import { floorPow2 } from './number/power-of-2.js';


const DEBUG  = globalThis.DEBUG;
const { cos, sin, round, PI } = Math;
const primes = [2, 3, 5, 7, 9];

function count1s(n) {
    let count = 0;
    while (n) { n &= n - 1; ++count; }
    return count;
}



const minDuration = 1/8;
const minDivision = 1/12;

function test(beat, duration, divisor, events, index, rhythmIndex, rhythmCount) {
    let score  = 0;
    let phase  = 0;
    // Where rhythmIndex lags index there is rhythm in the first slot. It does
    // not count towards score, as it was counted in the previous analysis window.
    if (DEBUG && rhythmIndex > index) throw new Error('rhythmIndex should never be > index');
    let rhythm = rhythmCount > 0 ? 1 : 0 ;

    // Run the analysis
    let n = index - 1;
    while (events[++n] !== undefined && events[n][0] < beat + duration) {
        const b = events[n][0] - beat;
        const x = b * divisor / duration;
        score += cos(x * 2 * PI);
        phase += sin(x * 2 * PI);

        // Build rhythm bitmap, where each bit represents a division
        // bit 0 = first division
        // bit 1 = second division
        // and so on
        const slot = round(x);
        if (slot < divisor) {
            rhythm |= (1 << slot);
            rhythmCount += 1;
        }
    }

    // Downgrade 1_1_0 and 0_1_0 triplets
    // To prefer 101   and 001   triplets
    if (duration > 1/4 && divisor === 3 && (rhythm === 2 || rhythm === 3)) score = 0;

    // Downgrade anything with more than 2 holes
    if (count1s(rhythm) < divisor - 2) score = 0;

    return {
        beat,
        duration,
        divisor,
        index,
        count: n - index,
        rhythm,
        rhythmIndex,
        rhythmCount,
        // --- internal only?
        score,
        phase
    };
}

function detectRhythmPrime(beat, duration, events, index, rhythmIndex) {
    // Where rhythmIndex lags index there is rhythm in the first slot. It does
    // not count towards score, as it was counted in the previous analysis window.
    if (DEBUG && rhythmIndex > index) throw new Error('rhythmIndex should never be > index');
    // Number of events already in the first rhythm slot
    let rhythmCount = index - rhythmIndex;
    let rhythm = rhythmCount === 0 ? 0 : 1 ;
    let result = rhythm ? {
        beat,
        duration,
        divisor: 1,
        rhythm,
        index,
        count: 0,
        rhythmIndex,
        rhythmCount,
        score: 0,
        phase: 0
    } : undefined ;
    let score  = 0;
    //let result;

    // Find highest prime that allows division greater than minDivision
    let p = primes.length;
    while (duration / primes[--p] < minDivision);
    ++p;

    // Descend through remaining primes, keep highest scoring rhythm
    while (primes[--p]) {
        const data = test(beat, duration, primes[p], events, index, rhythmIndex, rhythmCount);
        if (data.score / data.count >= score) {
            score = data.score / data.count;
            result = data;
        }
    }

    return result;
}

function sumScore(n, object) {
    return n + object.score;
}

function sumAverages(n, object) {
    return n + object.score / object.count;
}



function detectBestFit(beat, duration, events, index, rhythmIndex = index, rhythms = [], indent = '') {
    let i = index;
    let r = rhythmIndex;

    const d    = floorPow2(duration);
    const a    = detectRhythmPrime(beat, d, events, i, r, indent);
    const afit = a && a.count ? a.score / a.count : 0 ;

/*console.log(indent + beat.toFixed(3),
    'index', index,
    'count', a ? a.count : 0,
    'rhythm', a ? a.rhythm : 0,
    'fit', afit,
    a ? '[' + events.slice(a.index, a.index + a.count).map((object) => object[0].toFixed(3)).join(',') + ']' : '[]'
);/**/

    // Count is 0 if no new events have been read but there may be rhythm in
    // the first slot left over from the previous analysis window
    if (a && a.count === 0) {
        if (a.rhythm) {
            rhythms.push(a);
            if (index !== a.rhythmIndex + a.rhythmCount) throw new Error('rhythmIndex shouls have caught up with index')
            r = a.rhythmIndex + a.rhythmCount;
        }
    }
    // We just tested the smallest testable duration
    else if (duration <= minDuration * 2) {
        if (a) {
            rhythms.push(a);
            i = a.index + a.count ;
            r = a.rhythmIndex + a.rhythmCount;
        }
    }
    // A fit of 1 cannot be beaten: fast accept a
    else if (afit === 1) {
        rhythms.push(a);
        i = a.index + a.count ;
        r = a.rhythmIndex + a.rhythmCount;
    }
    // Bifurcation is the name of the game, compare against two half durations
    else {
        const array = [];
        let last;

        detectBestFit(beat, d / 2, events, i, r, array, indent + '| ');
        last = array[array.length - 1];
        if (last) {
            i = last.index + last.count;
            r = last.rhythmIndex + last.rhythmCount;
        }

        detectBestFit(beat + d / 2, d / 2, events, i, r, array, indent + '| ');
        last = array[array.length - 1];
        if (last) {
            i = last.index + last.count;
            r = last.rhythmIndex + last.rhythmCount;
        }

        // Fit by overall average score of all events
        const count = i - index;
        const bfit  = count && array.reduce(sumScore, 0) / count;
        // Fit by average of fit of all rhythms
        //const count = i - index;
        //const bfit = count && array.reduce(sumAverages, 0) / array.length;

        if (bfit > afit) {
//console.log(indent + '↙', bfit);
            rhythms.push.apply(rhythms, array);
        }
        else if (a) {
//console.log(indent + '↓');
            rhythms.push(a);
            i = a.index + a.count ;
            r = a.rhythmIndex + a.rhythmCount;
        }
    }

    // Continue consuming duration
    return beat + d < duration ?
        detectBestFit(beat + d, duration - d, events, i, r, rhythms, indent) :
        rhythms ;
}

export default function detect(beat, duration, events, index = 0) {
    // Find first event after index in analysis window
    let n = index - 1;
    while (events[++n] !== undefined && events[n][0] < beat);

    // If no event in window, quick out
    if (!events[n] || events[n][0] >= beat + duration) return undefined;

    // Collect best fit rhythms
    return detectBestFit(beat, duration, events, n, index);
}


