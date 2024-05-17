
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

function toBeat(data, event) {
    const { output, props } = data;
    output.push(assign({}, event, props));
    return data;
}

function quantizeScale(output, events, scale = 1) {
    const props = {};
    const data  = { output, props };
    let i = 0;

    const events00 = collect(scale * 0.0972222222, events, i);
    if (events00) {
        i += events00.length;
        data.props[0] = 0;
        events00.reduce(toBeat, data);
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
        data.props[0] = 0.333333333;
        events33.reduce(toBeat, data);
        return output;
    }

    // We already checked (events50 && events67) so this is exclusive OR. In
    // english, that means there is only one event beat at 50% or 67% in this
    // beat, and we want to fall through to looking at these events at 2x zoom
    if (events50 || events67) {
        quantizeScale(output, events, 2);
        console.log('Recurse at 2x');
        return;
    }

    // Quadruplets
    if (events25) {
        data.props[0] = 0.25;
        events25.reduce(toBeat, data);
        return output;
    }

    if (events75) {
        data.props[0] = 0.75;
        events75.reduce(toBeat, data);
        return output;
    }

    return output;
}

export default function quantize(events) {
    return quantizeScale([], events, 1);
}
