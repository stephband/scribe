
import by       from '../lib/fn/modules/by.js';
import get      from '../lib/fn/modules/get.js';
import overload from '../lib/fn/modules/overload.js';
import { toNoteNumber, toRootName, toRootNumber } from '../lib/midi/modules/note.js';
import toKeys from './sequence/to-keys.js';
import eventsAtBeat from './sequence/events-at-beat.js';
import { keysAtBeats, keyFromBeatKeys } from './sequence/key-at-beat.js';
import { transposeChord } from './event/chord.js';
import { transposeScale } from './scale.js';
import Stave from './stave.js';
import { toKeyScale, toKeyNumber } from './keys.js';
import { mod12, byGreater } from './maths.js';
import { rflat, rsharp, rdoubleflat, rdoublesharp } from './regexp.js';


const assign = Object.assign;
const { abs, ceil, floor } = Math;
const cScale = [0, 2, 4, 5, 7, 9, 11];

const fathercharles = [
    // Father Charles Goes Down And Ends Battle,
    'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯',
    // Battle Ends And Down Goes Charles' Father
    'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'
];

function byFatherCharlesPitch(a, b) {
    const ai = fathercharles.indexOf(a.pitch);
    const bi = fathercharles.indexOf(b.pitch);
    return ai > bi ? 1 : ai < bi ? -1 : 0;
}

function getStemDirection(centerPitch, head) {
    return head && head.stemDirection || (
        toNoteNumber(centerPitch) < toNoteNumber(head.pitch) ?
            'down' :
            'up');
}

function isAfterBreak(breaks, b1, b2) {
    let n = -1;
    while (breaks[++n] && breaks[n] <= b1);
    // If breaks[n] is undefined, returns false, which is what we want
    return b2 >= breaks[n];
}

function toDuration(event) {
    return event[1] === 'lyric' ?
        event[3] :
        event[4];
}

const lines = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function addStaveRows(n, row) {
    if (n < 0) {
        while (n++) {
            const line = row[0];
            const octave = parseInt(row[row.length - 1], 10);

            // Are we switching octave down the way ?
            if (line === lines[0]) {
                row = lines[lines.length - 1] + (octave - 1);
            }
            else {
                const l = lines.indexOf(line);
                row = lines[l - 1] + octave;
            }
        }

        return row;
    }

    while (n--) {
        const line = row[0];
        const octave = parseInt(row[row.length - 1], 10);

        // Are we switching octave up the way ?
        if (line === lines[lines.length - 1]) {
            row = lines[0] + (octave + 1);
        }
        else {
            const l = lines.indexOf(line);
            row = lines[l + 1] + octave;
        }
    }

    return row;
}

function createBeam(symbols, stave, beam, n) {
    const part = symbols[0].part;

    // Not enough stems for a beam, give it a tail
    if (beam.length === 1) {
        if (beam[0] >= n) {
            throw new Error('Last beam index (' + beam[0] + ') cant be greater than n (' + n + ')');
        }

        return 0;
    }

    // Render stems and beam
    const stemDirection = symbols[beam[0]] && symbols[beam[0]].stemDirection ?
        symbols[beam[0]].stemDirection :
        (beam
            .map((i) => stave.getRowDiff(stave.midLinePitch, symbols[i].pitch))
            .reduce((t, u) => t + u, 0) / beam.length) < 0 ?
            'up' :
            'down';

    const heads  = [];
    const buffer = [];

    // Loop backwards through beam splicing in stem symbols before
    // the heads, all with the winning stem direction
    let b = -1;
    let avgBeginLine = 0;
    let avgEndLine = 0;
    let i, head, line;
    while (beam[++b] !== undefined) {
        i = beam[b];
        head = symbols[i];
        line = stave.getRowDiff(stave.midLinePitch, head.pitch);

        head.stemDirection = stemDirection;
        head.tieDirection = stemDirection === 'up' ? 'down' : 'up';

        heads.push(head);

        if (b < (beam.length - 1) / 2) {
            avgBeginLine += line / Math.floor(beam.length / 2);
        }

        else if (b > (beam.length - 1) / 2) {
            avgEndLine += line / Math.floor(beam.length / 2);
        }

        // TODO: group stems from notes of same part on same beat

        if (head.tie === 'begin') {
            buffer.push(assign({}, head, {
                type:   'tie',
                beat:   head.beat,
                updown: head.tieDirection,
                event:  head.event
            }));
        }
    }

    // Calculate where to put beam exactly
    let begin    = heads[0];
    let end      = heads[heads.length - 1];
    let endRange = stave.getRowDiff(begin.pitch, end.pitch);
    let avgRange = avgEndLine - avgBeginLine;
    let range = abs(avgRange) > abs(0.75 * endRange) ?
        0.75 * endRange :
        avgRange;

    heads.forEach((head, i) => {
        head.stemHeight = stemDirection === 'down' ?
            1 + 0.125 * (-range * i / (heads.length - 1) + stave.getRowDiff(begin.pitch, head.pitch)) :
            1 + 0.125 * (range * i  / (heads.length - 1) - stave.getRowDiff(begin.pitch, head.pitch)) ;
    });

    // Update heads with info about the beam
    const headEvents = heads.map(get('event'));
    heads.forEach((head) => head.beam = headEvents);


    // Put the beam in front of the first head (??)
    symbols.splice(i, 0, {
        type:      'beam',
        beat:      begin.beat,
        pitch:     begin.pitch,
        part:      begin.part,
        duration:  end.beat - begin.beat,
        range:     range,
        direction: stemDirection,
        notes:     heads,
        events:    begin.beam
    });

    symbols.splice(i, 0, ...buffer);

    // We just spliced a bunch of symbols in before index n
    return buffer.length;
}

function createSymbols(symbols, bar) {
    // All events in symbols have the same part
    const part = symbols[0] && symbols[0].part;
    const stave = bar.stave;

    // Populate accidentals with key signature sharps and flats
    const accidentals = bar.key.reduce((accidentals, n, i) => {
        const acci = n - cScale[i];
        if (acci !== 0) {
            const name = toRootName(cScale[i]);
            let n = 10;
            while (n--) accidentals[name + n] = acci;
        }
        return accidentals;
    }, {});

    let beat = 0;
    let n = -1;
    let head;
    let beam;
    let endBeat;

    while (head = symbols[++n]) {
        endBeat = head.beat + head.duration;

        // We are only interested in notes
        if (head.type !== 'note') continue;

        // Rest
        // Insert rest if head beat is greater than beat
        if (head.beat > beat) {
            // [beat, 'rest', pitch (currently unused), duration]
            symbols.splice(n++, 0, {
                beat,
                type: 'rest',
                pitch: '',
                part: part,
                duration: head.beat - beat
            });
        }

        // Update beat
        if (endBeat > beat) beat = endBeat;

        // Accidental
        // Determine accidental
        const acci = rsharp.test(head.pitch) ? 1 :
            rflat.test(head.pitch) ? -1 :
                undefined;

        // Line name is note name + octave (no # or b)
        const line = head.pitch[0] + head.pitch.slice(-1);

        if (
            // If head is not a tied head from a previous bar - they
            // don't require accidentals,
            !(head.beat === 0 && head.tie && head.tie !== 'begin')
            // and if it has changed from the bars current accidentals
            && acci !== accidentals[line]
        ) {
            accidentals[line] = acci;
            symbols.splice(n++, 0, assign({}, head, {
                type: 'acci',
                value: acci || 0
            }));
        }

        // Up ledger lines
        let ledgerrows = stave.getRowDiff(stave.maxLinePitch, head.pitch) - 1;

        if (ledgerrows > 0) {
            symbols.splice(n++, 0, assign({}, head, {
                type: 'upledger',
                rows: ledgerrows
            }));
        }

        // Down ledger lines
        else {
            ledgerrows = stave.getRowDiff(head.pitch, stave.minLinePitch) - 1;
            if (ledgerrows > 0) {
                symbols.splice(n++, 0, assign({}, head, {
                    type: 'downledger',
                    rows: ledgerrows
                }));
            }
        }

        // Beam
        if (beam && beam.length) {
            // If head is a quarter note or longer
            if (head.duration >= 1
                // or head is a triplet quarter note
                || head.duration.toFixed(2) === '0.67'
                // or head crosses a bar break
                || isAfterBreak(bar.breaks, symbols[beam[beam.length - 1]].beat, head.beat)
            ) {
                // Close the current beam
                n += createBeam(symbols, bar.stave, beam, n);
                beam = undefined;
            }
        }

        // Stem and tieheads. We must wait for stems to be decided before rendering
        // tieheads as their up/down direction is dependent.
        if (head.duration < 4) {
            // Is this head less than 1 beat, and not 1 triplet beat, long?
            // Wait for it to be beamed.
            if (head.duration < 1 && head.duration.toFixed(2) !== '0.67') {
                if (beam) {
                    // Keep index of head
                    beam.push(n);
                }
                else {
                    // Create new beam
                    beam = [n];
                }
            }
            else {
                if (head.tie === 'begin') {
                    let stemDirection = getStemDirection(stave.centerPitch, head);
                    symbols.splice(n++, 0, assign({}, head, {
                        type:   'tie',
                        beat:   head.beat,
                        updown: stemDirection === 'up' ? 'down' : 'up',
                        event:  head.event
                    }));
                }
            }
        }
        else {
            if (head.tie === 'begin' || head.tie === 'middle') {
                let stemDirection = getStemDirection(stave.centerPitch, head);
                symbols.splice(n++, 0, assign({}, head, {
                    type:   'tie',
                    beat:   head.beat,
                    updown: stemDirection === 'up' ? 'down' : 'up',
                    event:  head.event
                }));
            }
        }
    }

    // Close the current beam
    if (beam && beam.length) {
        n += createBeam(symbols, bar.stave, beam, n);
        beam = undefined;
    }

    // If last event has not taken us to the end of the bar, insert rest
    if (beat < bar.duration) {
        symbols.push({
            type:     'rest',
            beat,
            duration: bar.duration - beat,
            pitch:    '',
            part:     part,
            stave
        });
    }

    return symbols;
}

function createBarSymbols(bar) {
    const state = {
        clef: { name: 'treble', stemDirectionNote: 'B4' }
    };

    // Split symbols by part
    const parts = Object.values(
        bar.symbols.reduce((parts, symbol) => {
            if (!parts[symbol.part]) parts[symbol.part] = [];
            parts[symbol.part].push(symbol);
            return parts;
        }, {})
    );

    // If there are no parts we must nonetheless render a rest
    // TODO: render rest for each part, even tho there are no parts here?
    if (parts.length === 0) {
        parts[0] = [];
    }

    // Fill each parts with accidentals, rests, beams, tieheads
    parts.forEach((part) => createSymbols(part, bar, state.clef.stemDirectionNote));

    // Empty out bar.symbols and push in symbols from parts
    bar.symbols.length = 0;
    parts.reduce((symbols, part) => {
        symbols.push.apply(symbols, part);
        return symbols;
    }, bar.symbols);

    return bar;
}

function createBar(beat, stave, key, meter, tieheads) {
    const bar = {
        beat: beat,
        duration: meter[2],
        // TODO do something about breaks
        breaks: meter[2] === 4 ? [2] :
            meter[2] === 3 ? [1, 2]
                : [2],
        symbols: [],
        stave: stave,
        key: key,
        meter: meter
    };

    // If meter change is on this beat push a timesig into symbols
    if (meter[0] === beat) {
        bar.symbols.push({
            type:        'timesig',
            beat:        0,
            numerator:   meter[2] / meter[3],
            denominator: 4 / meter[3],
            event:       meter,
            stave
        });
    }

    // Push tied heads into symbols
    let m = -1;
    let head, event;
    while ((head = tieheads[++m])
        && (event = head.event)
        && event[0] < bar.beat + meter[2]
    ) {
        const duration = event[0] + event[4] - bar.beat;

        if (duration > bar.duration) {
            // Event ends after this bar
            bar.symbols.push(assign({}, head, {
                beat: 0,
                duration: bar.duration,
                tie: 'middle',
                stave
            }, stave.getPart(head.pitch)));
        }
        else {
            // Event ends in this bar
            bar.symbols.push(assign({}, head, {
                beat: 0,
                duration,
                tie:  'end',
                stave
            }, stave.getPart(head.pitch)));

            // Remove event from tieheads, as it has ended
            tieheads.splice(m, 1);
            --m;
        }
    }

    return bar;
}

const eventNameLogs = {};
const accidentals = {
    '-2': '𝄫',
    '-1': '♭',
    '0': '',
    '1': '♯',
    '2': '𝄪'
};

function createBars(events, beatkeys, stave, keyscale, meter, transpose) {
    // A buffer of head symbols to be tied to symbols in the next bar
    const tieheads = [];
    // An array of bar objects
    const bars = [];

    const events0 = eventsAtBeat(events, 0);
    meter = events0.find((event) => event[1] === 'meter') || meter;

    // First bar. Where meter is at beat 0, also inserts a time signature.
    let bar = createBar(0, stave, keyscale, meter, tieheads);
    bars.push(bar);

    // Add key signature, in front of any time signature
    bar.symbols.unshift.apply(bar.symbols, keyscale
        .map((n, i) => (n - cScale[i] && {
            // No beat for key signature accidentals
            type: 'acci',
            pitch: toRootName(cScale[i]) + accidentals[n - cScale[i]],
            value: n - cScale[i]
        }))
        .filter((o) => !!o)
        .sort(byFatherCharlesPitch)
    );

    // Add clef in front of keysig
    bar.symbols.unshift({
        type: 'clef',
        beat: 0,
        stave
    });

    let n = -1;
    let event;
    while (event = events[++n]) {
        if (event[1] === 'meter') {
            if (event[0] !== bar.beat) {
                new TypeError('Scribe: "meter" event must occur at bar start – event [' + event.join(', ') + '] is on beat ' + (event[0] - bar.beat) + ' of bar');
            }
            continue;
        }

        if (event[1] !== 'note' && event[1] !== 'chord' && event[1] !== 'lyric') {
            if (window.DEBUG && !eventNameLogs[event[1]]) {
                eventNameLogs[event[1]] = true;
                console.log('Scribe "' + event[1] + '" events ignored');
            }
            continue;
        }

        // Event is in a future bar
        while (event[0] >= bar.beat + bar.duration) {
            // Pick up meter for next bar
            if (event[0] === bar.beat + bar.duration) {
                let m = n - 1;
                while (events[++m] && events[m][0] === event[0]) {
                    if (events[m][1] === 'meter') {
                        meter = events[m];
                        // TODO: We may want to add an advisory timesig to the
                        // end of the current bar, to be displayed when this bar
                        // is at the end of a line
                    }
                }
            }

            // Create the next bar. Where meter is at the new bar beat, also
            // creates a time signature.
            bar = createBar(bar.beat + bar.duration, stave, keyscale, meter, tieheads);
            bars.push(bar);
        }

        const beat = event[0] - bar.beat;
        const key = beatkeys && keyFromBeatKeys(beatkeys, event[0]);

        // Truncate duration to bar end
        const duration = event[0] + toDuration(event) > bar.beat + bar.duration ?
            bar.beat + bar.duration - event[0] :
            toDuration(event);

        if (event[1] === 'note') {
            let pitch = stave.getSpelling(key, event, transpose);
            let head = assign({
                type: 'note',
                beat,
                duration,
                dynamic: event[3],
                pitch,
                transpose,
                event,
                stave
            }, stave.getPart(pitch));

            // Stick it in symbols
            bar.symbols.push(head);

            // If it's longer than the bar stick it in tieheads buffer
            if (event[4] > duration) {
                head.tie = 'begin';
                tieheads.push(head);
            }
        }
        else if (event[1] === 'chord') {
            bar.symbols.push({
                type: 'chord',
                beat,
                duration,
                transpose,
                // value: stave.getSpelling(key, event, transpose) + event[3],
                root: stave.getSpelling(key, event, transpose),
                extension: event[3],
                event,
                stave
            });
        }
        else {
            bar.symbols.push({
                type: 'lyric',
                beat,
                duration,
                value: event[2],
                event,
                stave
            });
        }
    }

    // There are still tied notes to symbolise
    while (tieheads.length) {
        // Create the next bar
        bar = createBar(bar.beat + bar.duration, stave, keyscale, meter, tieheads);
        bars.push(bar);
    }

    return bars;
}

export default function eventsToSymbols(events, clef, keyname, meter, transpose) {
    //console.log(events, clef, keyname, meter, transpose);

    // Transpose events before generating keys??
    events.sort(by(get(0)));

    // Get the stave controller
    const stave = Stave.create(clef || 'treble');

    // Create a map of keys at beats. Doing this here is an optimisation so we
    // don't end up running the keys matrix calculations on every note which
    // causes measurable delay.
    // TEMP: don't get keys for unpitched
    const beatkeys = stave.pitched ?
        keysAtBeats(events) :
        null ;

    // Get the key scale from keyname. This scale is not a true
    // 'scale' in an internal-data sense as it may not begin with a 0, but it
    // maps naturals to accidentals when compared against the C scale. Remember
    // keynumber is on a continuous scale of fourths, so multiply by 7 semitones
    // to get chromatic number relative to C.
    const keynumber = toKeyNumber(keyname);
    const keyscale  = toKeyScale(keynumber * 7 + transpose);

    // TODO: this is a two-pass symbol generation, I wonder if we can get
    // it down to one?
    return createBars(events, beatkeys, stave, keyscale, meter, transpose)
        .map(createBarSymbols);
}
