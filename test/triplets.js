console.log('TRIPLETS');

import round from '../modules/maths/round.js';

const tests = [
    [[0.75]],

    [[0.7083333333333334]],
    [[0.7083333333333333]],
    [[0.7083333333333332]],

    [[0.666666666666666667]],

    [[0.5833333333333334]],
    [[0.5833333333333333]],
    [[0.5833333333333332]],

    [[0.5]],

    [[0.4166666666666668]],
    [[0.4166666666666667]],
    [[0.4166666666666666]],

    [[0.333333333333333333]],

    [[0.2916666666666668]],
    [[0.2916666666666667]],
    [[0.2916666666666666]],

    [[0.25]]

    /*[[0],[0.666666666666666667], [1.333333333333333333]],
    [[0.666666666666666667]],
    [[0.666666666666666667], [1.333333333333333333]],
    [[1.333333333333333333]],
    /*[[0]],
    [[0],[2]],
    [[0],[2],[4]],
    // minim
    [[2]],
    [[1.5]],
    [[1.33333333333333333333333]],
    [[1], [1.33333333333333333333333]],
    // quarter
    [[1]],
    [[0.75]],
    [[0.66]],
    [[0.66], [1.33]],
    [[0.5], [1.33333333333333333]],
    // 8th
    /*[[0.5]],
    [[0.375]],
    [[0.333]],
    [[0.333], [0.667]],
    // 16th
    [[0.25]],
    [[0.1875]],
    [[0.1666]],
    // 32nd
    [[0.125]],
    [[0.09375]],
    [[0.08333]],
    // 64th
    [[0.0625]],
    [[0.046875]],
    [[0.041666]]*/
];

const abs = Math.abs;

const quantisations = new Set();

tests.forEach((events, i) => {
    console.log('events ' + events.length + ' – times ' + events.join(' ') + ' –––––––––––––––––––');
let driftAvg
    // Loop through durations dividing by 2 down to 32nd-note triplets
    let duration = 8;
    while ((duration /= 2) > 1/64) {
        // Inspect all events up to 17/24ths of duration, assuming that anything
        // beyond was quantised in a previous loop
        let t = duration * 17/24;

        // Cycle through divisions of duration (/2, /3)
        let d = 1, division;
        while (++d < 4) {
            // Division is the duration of the quantise value
            division = duration / d;
            // Empty quantisation set
            quantisations.clear();
//console.log(duration.toFixed(2) + ' ' + division.toFixed(2));
            let p, q;
            let drift, driftMin = 0.5, driftMax = -0.5;
            let f = 0;
            let n = -1;
            while (events[++n] && events[n][0] < t) {
                // Event time
                p = events[n][0];
                // Event time quantised to division
                q = round(division, p);
                // Calculate drift factor from quantised value
                drift    = (p - q) / division;
                driftMin = drift < driftMin ? drift : driftMin;
                driftMax = drift > driftMax ? drift : driftMax;
                // Drift total
                f += abs(drift);
                // Add quantized time to set
                quantisations.add(q);
            }

            // If no events have been scanned don't scan any shorter durations
            if (!n) {
                // Do some work to determine quantise level ?
                // Or no, move forward by 5/6ths duration...?
                // Or no, just move forward by duration ?
console.log('    ' + division.toFixed(2) + ' FAST OUT', duration, driftAvg, quantisations.size);
                return duration;
            }

            let driftSpr = driftMax - driftMin;
            driftAvg = f / n;
//console.log(n, quantisations.size, driftAvg);

            // Where avgDiff is 0 we have hit the nail right on the head, fast
            // out. Where avgDiff is very small we are close enough... but how
            // close is close enough? That depends.
            //             0.12500000000000007
            if (driftAvg < 0.125) {
            //if (driftAvg < 0.0625) {
//console.log(n, quantisations.size, driftAvg);
console.log('    ' + division.toFixed(2) + ' PROB OUT', division, driftAvg, quantisations.size);
                return division;
            }

            // Should we ask about other heuristics?
        }
    }
});




