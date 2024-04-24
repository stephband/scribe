const lengths = {
    /* Length of data following 'type' */
    chord: 3, /* chord duration, not used, chords can be either 2 or 3 long */
    note:  3, /* pitch gain duration */
    key:   1, /* A-G */
    meter: 2, /* duration division */
    rate:  1, /* rate */
    lyric: 2, /* string, duration */
};

const rnote = /^[ABCDEFG][b♭#♯]{0,1}-?\d$/;
const rroot = /^[ABCDEFG][b♭#♯]{0,1}/;


export default function parseSequenceText(source) {
    const data   = source.trim().split(/\s+/);
    const events = [];

    let n = -1;
    while (data[++n] !== undefined) {
        let time  = Number(data[n]);
        let type  = data[++n];

        // Automatically detect type. If type has been omitted, it will match
        // a value for note pitch or chord. Set type, rewind n.
        if (rnote.test(type)) {
            type = 'note';
            --n;
        }
        else if (rroot.test(type)) {
            type = 'chord';
            --n;
        }

        let event = [time, type];
        let m = lengths[type];
        if (m === undefined) {
            throw new TypeError('Unrecognised type "' + type + '" in sequence data')
        }

        if (type === 'chord') {
            // Detect and parse chord root/extension written as one
            // parameter "C7" or as two "C", "7"
            let root      = rroot.exec(data[++n])[0];
            let extension = data[n].slice(root.length) || data[++n];
            let duration  = Number(data[++n]);
            event.push(root, extension, duration);
        }
        else {
            // Push values into event, converting to number where possible
            while (m--) {
                let value = Number(data[++n]);
                event.push(Number.isNaN(value) ? data[n] : value);
            }
        }

        events.push(event);
    }

    return events;
}
