
/* An imperfect tuplet detector based on a score derived from a cosine. */

import { floorPowerOf2 } from './maths/power-of-2.js';


const assign  = Object.assign;
const tuplets = [2, 3, 5, 7, 9, 11, 13, 15];
const minTupletDuration = 1/12;

// The importance of stop beats as compared to start beats
const stopFactor = 0.1;

function score(wavelength, beat) {
    return 0.5 * (1 + Math.cos(2 * Math.PI * beat / wavelength));
}


const outA = {};

function detect(divisor, duration, heads, beat) {
    outA.score = 0;
    outA.count = 0;

    const tupletDuration = duration / divisor;

    let n = -1;
    let s = 0;
    let m = 0;
    // Ignore events at beat 0 up to quarter tuplet duration, they would count
    // toward all tuplets
    while (heads[++n] !== undefined && heads[n].beat - beat < tupletDuration / 4);
    --n;
    // Scan through events up to duration beat less half of tuplet duration
    while (heads[++n] !== undefined && heads[n].beat - beat < duration - tupletDuration / 4) {
        s += score(tupletDuration, heads[n].beat - beat);
        s += stopFactor * score(tupletDuration, heads[n].beat + heads[n].duration - beat);
        m += 1;
    }

    // Disallow any large group with more than 1 hole in it. This is arbitrary,
    // and simply based on the observation that you never see quintuplet runs or
    // higher with holes in. If they do appear they should probably be
    // interpreted as something else - but we are not pretending to do full
    // interpretation here.
    outA.count = n;
    outA.score = divisor > 4 && m < divisor - 1 ? 0 :
        m ? s / (m + m * stopFactor) :
        0 ;

    return outA;
}


const outB = {};

function detectTuplet(duration, heads, beat) {
    outB.score    = 0;
    outB.duration = 0;
    outB.divisor  = 0;
    outB.beat     = 0;

    let t = tuplets.length;
    let divisor;
    while (divisor = tuplets[--t]) {
        // Reject detection of tuplets that are shorter than min tuplet duration
        if (duration / divisor < minTupletDuration) continue;
        // Score events against this tuplet division
        const { score, count } = detect(divisor, duration, heads, beat);
        // Store highest scoring tuplet data
        if (score >= outB.score) {
            outB.score    = score;
            outB.duration = duration;
            outB.divisor  = divisor;
            outB.beat     = beat;
            outB.count    = count;
        }
    }

    return outB.score ? outB : undefined ;
}


const outC = {};

export default function detectTuplets(duration, heads, beat) {
    // Reset accumulator
    outC.score    = 0;
    outC.duration = 0;
    outC.divisor  = 0;
    outC.beat     = 0;

    duration = floorPowerOf2(duration);

    let d = 1/8;
    let score = 0;
    duration: while ((d *= 2) && d <= duration) {
        let position = -d;
        position: while ((position += d) < duration) {
            const data = detectTuplet(d, heads, beat + position);
            if (data && data.count) {
                if (data.score >= score) {
                    score = data.score;
                    outC.duration = data.duration;
                    outC.divisor  = data.divisor;
                    outC.beat     = beat + position;
                }

                // We found at least one event starting at this position, move
                // on to analyse bigger duration
                continue duration;
            }
        }
    }

    return score ? outC : undefined ;
}
