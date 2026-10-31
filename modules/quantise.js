import detect from './rhythm-eplmq.js';


const { isInteger } = Number;
const { max, round } = Math;


/**
straighten(data)
Straightens out swing rhythms - any `4` or `5` rhythms with divisor `3`.
**/

function straighten(tuplet) {
    if (tuplet.divisor === 3) switch (tuplet.rhythm) {
        case 4:
            tuplet.divisor = 2;
            tuplet.rhythm  = 2;
            // TEMP flag it so it don't get rendered
            tuplet.straightened = true;
            break;
        case 5:
            tuplet.divisor = 2;
            tuplet.rhythm  = 3;
            // TEMP
            tuplet.straightened = true;
            break;
    }
}

function quantiseTupletEvents(tuplet, buffer) {
    const { beat, divisor, duration, drift } = tuplet;
    let n = -1;

    while (buffer.length) {
        const event = buffer[0];
        const time  = event[0];
        const b     = time - beat - drift;
        const x     = b * divisor / duration;
        const slot  = round(x);

        // Event belongs to the next tuplet, we are done
        if (slot >= divisor) break;

        // Quantise event
        const s     = max(0, slot);
        event.slot  = s;
        event[0]    = beat + s * duration / divisor;
        tuplet[++n] = buffer.shift();
        // Are we doing something about duration ??
    }
}

export default function quantise(settings, bar, buffer, minDivision, primes, drift = 0) {
    const { beat, duration, divisor } = bar;

    const tuplets = detect(beat, duration, buffer, minDivision, primes, drift);
    if (!tuplets) return;

    const swing   = settings.swingAsStraight8ths  && isInteger(divisor);
    const shuffle = settings.swingAsStraight16ths && isInteger(divisor * 2);

    let n = -1;
    let tuplet;
    while (tuplet = tuplets[++n]) {
        if (swing && tuplet.duration === 1 && tuplet.divisor === 3) straighten(tuplet);
        if (shuffle && tuplet.duration === 0.5 && tuplet.divisor === 3) straighten(tuplet);
        quantiseTupletEvents(tuplet, buffer);
    }

    return tuplets;
}
