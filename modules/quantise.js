import detect from './rhythm-eplmq.js';

const { max, round } = Math;

function quantiseTupletEvents(tuplet, buffer) {
    const { beat, divisor, duration, delta } = tuplet;
    let n = -1;

    while (buffer.length) {
        const event = buffer[0];
        const time  = event[0];
        const b     = time - beat - delta;
        const x     = b * divisor / duration;
        const slot  = round(x);

        if (slot < divisor) {
            event[0] = beat + max(0, slot) * duration / divisor;
            tuplet[++n] = buffer.shift();
            // Are we doing something about duration ??
        } else {
            break;
        }
    }
}

export default function quantise(beat, duration, buffer, minDivision, primes) {
    const tuplets = detect(beat, duration, buffer, minDivision, primes);
    if (!tuplets) return;

    let n = -1;
    let tuplet;
    while (tuplet = tuplets[++n]) {
        quantiseTupletEvents(tuplet, buffer);
    }

    return tuplets;
}
