
const assign  = Object.assign;
const round32 = Math.fround;



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

function quantizeDuplet(output, events, scale, i, beat) {
    const props = {};
    const data  = { output, props };
    let n = i;

    const events00 = collect(beat + scale * 0.25, events, n);
    if (events00) n += events00.length;

    const events50 = collect(beat + scale * 0.75, events, n);
    if (events50) n += events50.length;

    if (events00) {
        data.props[0] = round32(beat);
        events00.reduce(toBeat, data);
    }

    if (events50) {
        data.props[0] = round32(beat + scale * 0.5);
        events50.reduce(toBeat, data);
    }

    return output;
}

function quantizeDupletTriplet(output, events, scale, i, beat, stopbeat) {
    const props = {};
    const data  = { output, props };
    let n = i;

    const events00 = collect(beat + scale * 0.1666666667, events, n);
    if (events00) n += events00.length;

    const events33 = collect(beat + scale * 0.4166666667, events, n);
    if (events33) n += events33.length;

    const events50 = collect(beat + scale * 0.5833333333, events, n);
    if (events50) n += events50.length;

    const events67 = collect(beat + scale * 0.8611111111, events, n);
    if (events67) n += events67.length;

    // If there is one at 50% it's definitely a duplet. Pass over the data
    // again, force quantizing to duplets.
    if (events50) {
        quantizeDuplet(output, events, scale, i);
        return beat + scale < stopbeat ?
            quantizeDupletTriplet(output, events, scale, n, beat + scale, stopbeat) :
            output ;
    }

    if (events00) {
        data.props[0] = round32(beat);
        events00.reduce(toBeat, data);
    }

    if (events33) {
        data.props[0] = round32(beat + scale * 0.3333333333);
        events33.reduce(toBeat, data);
    }

    if (events67) {
        data.props[0] = round32(beat + scale * 0.6666666667);
        events67.reduce(toBeat, data);
    }

    return beat + scale < stopbeat ?
        quantizeDupletTriplet(output, events, scale, n, beat + scale, stopbeat) :
        output ;
}


export default function quantize(events, beat = 0, duration = 4) {
    // Limit scale if duration is short
    const scale     = 0.25;
    const startbeat = beat - scale * 0.1666666667;

    // Scan events until we get to event index on or after beat
    let i = -1;
    while (events[++i] && events[i][0] < startbeat);

    return quantizeDupletTriplet([], events, scale, i, beat, beat + duration);
}
