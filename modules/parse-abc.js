
import matches   from '../../fn/modules/matches.js';
import ABCParser from '../../abcjs/modules/parse/abc_parse.js';

const parser = new ABCParser();

function TODO(message) {
    throw new Error('Todo: ' + message);
}

function getSequence(id, data) {
    let sequence = data.sequences.find(matches({ id }));
    if (sequence) return sequence;

    sequence = { id, events: [], cursor: 0 };
    data.sequences.push(sequence);
    data.events.push([0, "sequence", id]);
    return sequence;
}

function findLastOfType(type, events) {
    let n = events.length;
    while (n--) {
        if (events[n][1] === type) return events[n];
    }
}

function getAbsoluteFromDiatonicPitch(root, degree) {
    // Not entirely sure how ABC decides where the 'root' of the melody is.
    // We just add 60, but its arbitrary.
    return [0,
        0,  2,  4,  5,  7,  9,  11,
        12, 14, 16, 17, 19, 21, 23,
        24, 26, 28, 29, 31, 33, 35,
        36, 38, 40, 41, 43, 45, 47,
        48
    ][degree] + root + 60
}

export default function parseABC(abc) {
    parser.parse(abc);

    const tune = parser.getTune();
    console.log(tune);
    const data = tune.lines.reduce((data, line) => {
        line.staff.reduce((sequences, staff, i) => {
            const sequence    = getSequence(i, data);
            const events      = sequence.events;
//console.log(staff);
            // If clef has changed push in a clef event
            if (staff.clef) {
                const clef      = staff.clef.type;
                const clefEvent = findLastOfType('clef', events);
                if (!clefEvent || clefEvent[2] !== clef) {
                    events.push([0, 'clef', clef]);
                }
            }

            // If key has changed push in a key event
            let keyEvent = findLastOfType('key', events);
            if (staff.key) {
                const root = staff.key.mode === '' ?
                    staff.key.root :
                    TODO('What happens when ABC decides key.mode is not an empty string?') ;

                const roots = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

                if (!roots[root]) {
                    TODO('ABC says root is "' + root + '", we have not implemented support for that')
                }

                const rootN = roots[root];

                if (!keyEvent || keyEvent[2] !== root) {
                    keyEvent = [sequence.cursor, 'key', rootN];
                    events.push(keyEvent);
                }
            }

            // If meter has changed push in a meter event
            if (staff.meter) {
                // Not sure why staff.meter.value is an array? Either way it
                // contains strings for num/den so we need to convert...
                const denominator = 1 / (+staff.meter.value[0].den / 4);
                const numerator   = +staff.meter.value[0].num * denominator;
                const meterEvent = findLastOfType('meter', events);
                if (!meterEvent || meterEvent[2] !== numerator || meterEvent[3] !== denominator) {
                    events.push([0, 'meter', numerator, denominator]);
                }
            }

            // Push in notes
            if (staff.voices) {
                const noteEvent = findLastOfType('note', events);
                // I am not currently sure why voices is an array
                staff.voices[0].reduce((events, voice) => {
                    if (voice.el_type === 'note') {
                        voice.pitches.reduce((events, abcPitch) => {
                            // abcPitch numbers are relative to the key root and
                            // describe diatonic steps, not semitones

                            events.push([sequence.cursor, "note", getAbsoluteFromDiatonicPitch(keyEvent[2], abcPitch.pitch), 0.25, voice.duration * 4])
                            return events;
                        }, events);

                        sequence.cursor += voice.duration * 4;
                    }
                    else {
console.log('ABC voice ignored:', voice);
                    }

                    return events;
                }, events);

                if (staff.voices[1]) {
                    TODO('What do we do with a second array of voices?')
                }
            }

            return sequences;
        }, data.sequences);

        return data;
    }, {
        name:      tune.metaText.title,
        events:    [],
        sequences: [],
        meta:      tune.metaText
    });

    // Remove cursor property which was just for tracking start beats
    data.sequences.forEach((sequence) => delete sequence.cursor);
console.log(data);
    return data;
}
