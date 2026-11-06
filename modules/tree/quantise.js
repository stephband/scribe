
import detect   from '../rhythm-eplmq.js';
import getVoice from './get-voice.js';


const { isInteger } = Number;
const { max, round } = Math;


/**
straighten(tuplet)
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

// Export for testing
export function quantiseBar(settings, bar, buffer, minDivision, primes, drift = 0) {
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

export default function quantise(settings, parts, tree) {
    const drifts = {};

    let n = -1;
    let bar;
    while (bar = tree[++n]) {
        let p = -1;
        let part;
        while (part = bar[++p]) {
            const partInfo = parts[p];
            let voiceName;
            for (voiceName in partInfo.buffers) {
                const buffer = partInfo.buffers[voiceName];
                const driftKey = part.name + '.' + voiceName;

                if (!buffer.length) {
                    drifts[driftKey] = 0;
                    continue;
                }

                const drift = drifts[driftKey] || 0;

                const tuplets = voiceName === 'chord' ?
                    quantiseBar(settings, bar, buffer, 1/3, [2, 3], drift) :
                    quantiseBar(settings, bar, buffer, undefined, undefined, drift);

                if (!tuplets) continue;

                const voice = getVoice(part, voiceName);
                voice.tuplets = tuplets;

                if (tuplets.length) {
                    drifts[driftKey] = tuplets[tuplets.length - 1].driftOut;
                }
            }
        }
    }

    return tree;
}
