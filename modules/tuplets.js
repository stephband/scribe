
const tuplets = [2, 3, 5, 7, 9, 11, 13, 15];
const minTupletDuration = 1/12;
const data = {};

function score(wavelength, beat) {
    return 0.5 * (1 + Math.cos(2 * Math.PI * beat / wavelength));
}

function detect(tuplet, duration, events) {
    const tupletDuration = duration / tuplet;

    let n = -1, event;
    let s = 0;
    let m = 0;
    // Ignore events at beat 0 up to half of tuplet duration, as they will count
    // toward all tuplets
    while ((event = events[++n]) && event[0] < tupletDuration / 4);
    --n;
    // Scan through events up to duration beat less half of tuplet duration
    while ((event = events[++n]) && event[0] < duration - tupletDuration / 4) {
        s += score(tupletDuration, event[0]);
        m += 1;
    }

    // Disallow any large group with more than 1 hole in it. This is arbitrary,
    // and simply based on the observation that you basically never see
    // quintuplet runs or higher with holes in. If they do appear they should
    // probably be interpreted as something else.
    return tuplet > 4 && m < tuplet - 2 ? 0 :
        m ? s / m :
        0 ;
}

function detectTuplet(duration, events) {
    let t = tuplets.length;
    let score, tuplet;
    while (tuplet = tuplets[--t]) {
        // Reject detection of tuplets that are shorter than min tuplet duration
        if (duration / tuplet < minTupletDuration) continue;
        // Score events against this tuplet division
        score = detect(tuplet, duration, events);
        // Store highest scoring tuplet data
//console.log(duration / tuplet, score);
        if (score >= data.score) {
//console.log('Y');
            data.score    = score;
            data.duration = duration;
            data.tuplet   = tuplet;
        }
    }
    return data;
}

export default function detectTupletData(duration = 4, events) {
    // Reset accumulator
    data.score    = 0;
    data.duration = 0;
    data.tuplet   = 0;

    let d = 1/8;
    while ((d *= 2) && d <= duration) detectTuplet(d, events);
    return data
    return data.score === 0 ?
        duration :
        data.duration / data.tuplet ;
}
