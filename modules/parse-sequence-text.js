const lengths = {
    /* Length of data following 'type' */
    chord: 2, /* chord duration */
    note:  3, /* pitch gain duration */
    key:   1, /* A-G */
    meter: 2, /* duration division */
    rate:  1, /* rate */
};

const rnote  = /^[ABCDEFG][b♭#♯]{0,1}-?\d$/;
const rchord = /^[ABCDEFG][b♭#♯]{0,1}/;


export default function parseSequenceText(source) {
    const data   = source.split(/\s+/);
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
        else if (rchord.test(type)) {
            type = 'chord';
            --n;
        }

        let event = [time, type];
        let m = lengths[type];
        if (m === undefined) {
            throw new TypeError('Unrecognised type "' + type + '" in sequence data')
        }

        while (m--) {
            let value = Number(data[++n]);
            event.push(Number.isNaN(value) ? data[n] : value);
        }

        events.push(event);
    }

    return events;
}
