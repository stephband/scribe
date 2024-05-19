
const assign   = Object.assign;
const round32  = Math.fround;
const buffer00 = [];
const buffer33 = [];
const buffer50 = [];
const buffer67 = [];


/**
quantize()
Quantize events into triplets and duplets. TODO: This is probably
overcomplicated for what it does. It was originally intended to recurse at
different durations.
**/

function collect(buffer, split, events, i) {
    let n = i - 1;
    while(events[++n] && events[n][0] < split) {
        buffer.push(events[n]);
    }
}

function toBeat(data, event) {
    const { output, props } = data;
    output.push(assign({}, event, props));
    return data;
}

function quantizeDuplet(output, events, scale, i, beat) {
    const props = {};
    const data  = { output, props };

    buffer00.length = 0;
    buffer50.length = 0;

    let n = i;

    collect(buffer00, beat + scale * 0.25, events, n);
    if (buffer00.length) {
        n += buffer00.length;
        data.props[0] = round32(beat);
        buffer00.reduce(toBeat, data);
    }

    collect(buffer50, beat + scale * 0.75, events, n);
    if (buffer50.length) {
        n += buffer50.length;
        data.props[0] = round32(beat + scale * 0.5);
        buffer50.reduce(toBeat, data);
    }

    return output;
}

function quantizeDupletTriplet(output, events, scale, i, beat, stopbeat) {
    const props   = {};
    const data    = { output, props };

    buffer00.length = 0;
    buffer33.length = 0;
    buffer50.length = 0;
    buffer67.length = 0;

    let n = i;

    collect(buffer00, beat + scale * 0.1666666667, events, n);
    if (buffer00.length) n += buffer00.length;

    collect(buffer33, beat + scale * 0.4166666667, events, n);
    if (buffer33.length) n += buffer33.length;

    collect(buffer50, beat + scale * 0.5833333333, events, n);
    if (buffer50.length) n += buffer50.length;

    collect(buffer67, beat + scale * 0.8611111111, events, n);
    if (buffer67.length) n += buffer67.length;

    // If there is one at 50% it's definitely a duplet. Pass over the data
    // again, force quantizing to duplets.
    if (buffer50.length) {
        quantizeDuplet(output, events, scale, i);
    }
    // Otherwise it may (or may not) be a triplet.
    else {
        if (buffer00.length) {
            data.props[0] = round32(beat);
            buffer00.reduce(toBeat, data);
        }

        if (buffer33.length) {
            data.props[0] = round32(beat + scale * 0.3333333333);
            buffer33.reduce(toBeat, data);
        }

        if (buffer67.length) {
            data.props[0] = round32(beat + scale * 0.6666666667);
            buffer67.reduce(toBeat, data);
        }
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
