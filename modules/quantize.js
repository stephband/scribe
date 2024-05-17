
const assign = Object.assign;

/**
quantize()
Quantize events into triplets and duplets.
**/

function collect(split, events, i) {
    let n = i - 1;
    while(events[++n] && events[n][0] < split);
    return n > i ?
        events.slice(i, n) :
        undefined ;
}

function toBeat0(output, event) {
    const e = Array.from(event);
    e[0] = 0;
    output.push(e);
    return output;
}

function quantizeScale(events, scale = 1, output) {
    let i = 0;

    const events00 = collect(scale * 0.0972222222, events, i);
    if (events00) {
        i += events00.length;
        events00.reduce(toBeat0, output);
    }

    const events25 = collect(scale * 0.2916666667, events, i);
    if (events25) i += events25.length;
    const events33 = collect(scale * 0.4305555556, events, i);
    if (events33) i += events33.length;
    const events50 = collect(scale * 0.5694444444, events, i);
    if (events50) i += events50.length;
    const events67 = collect(scale * 0.7083333333, events, i);
    if (events67) i += events67.length;
    const events75 = collect(scale * 0.9027777778, events, i);

    // Quadruplets
    if (events25 && events50
        || events25 && events75
        || events50 && events75
        || events25 && events33
        || events33 && events50
        || events50 && events67
        || events67 && events75
    ) {
        console.log('Quadruplets');
        return;
    }

    if (events33) {
        console.log('Triplets');
        return events33.map((event) => assign([], event, { 0: 0.333333333 }));
    }

    // We already checked (events50 && events67) so this is exclusive OR. In
    // english, that means there is only one event beat at 50% or 67% in this
    // beat, and we want to fall through to looking at these events at 2x zoom
    if (events50 || events67) {
        console.log('Recurse at 2x');
        return;
    }

    // Quadruplets
    if (events25) {
        return events25.map((event) => assign([], event, { 0: 0.25 }));
    }

    if (events75) {
        return events75.map((event) => assign([], event, { 0: 0.75 }));
    }

    return output;
}

export default function quantize(events) {
    const output = [];
    return quantizeScale(events, 1, output);
}
