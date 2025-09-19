
//import by       from 'fn/by.js';
import get      from 'fn/get.js';
import overload from 'fn/overload.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import toKeys from './sequence/to-keys.js';
import eventsAtBeat from './sequence/events-at-beat.js';
import { keysAtBeats, keyFromBeatKeys } from './sequence/key-at-beat.js';
import { transposeChord } from './event/chord.js';
import { transposeScale } from './scale.js';
import Stave from './stave.js';
import { toKeyScale, toKeyNumber, cScale } from './keys.js';
import { mod12, byGreater } from './maths.js';
import quantise from './quantise.js';
import { rflat, rsharp, rdoubleflat, rdoublesharp } from './regexp.js';
import { getBarDivisions, getDivision, getLastDivision } from './bar.js';
import config from './config.js';

const assign = Object.assign;
const { abs, ceil, floor } = Math;

const fathercharles = [
    // Father Charles Goes Down And Ends Battle,
    'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯',
    // Battle Ends And Down Goes Charles' Father
    'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'
];

/* When dealing with rounding errors we only really need beat grid-level
   precision, our display grid has 24 slots so slot beat ± 1/48 is plenty */
const beatPrecision = 1/48;

/* There are 24 slots in our display grid which allows for even spacing of
   symbols down to 32nd-note triplet level, or twelve things per beat, as well
   as 32nd-note level, or 8 things per beat. So some slots, like 1/24, go unused
   (although they are used by accidentals, which are placed in slots preceding
   note heads). */
const quantiseBeats = [0, 2/24, 3/24, 4/24, 6/24, 8/24, 9/24, 10/24, 12/24, 14/24, 15/24, 16/24, 18/24, 20/24, 21/24, 22/24, 1];

/* Allowable rest durations. Do we really want to allow double-dotted rests? */
const restDurations = [
         1/12,
    1/8, 1/6,  6/32, // 7/32,
    1/4, 1/3,  6/16, // 7/16,
    1/2, 2/3,  6/8,  // 7/8,
    1,   4/3,  6/4,  // 7/4,
    2,   8/3,  3,    // 7/2
    4,         6,
    8
];

function round(d, n) {
    return Math.round(n / d) * d;
}

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

function toDuration(event) {
    return event[1] === 'lyric' ?
        event[3] :
        event[4];
}

function createBeam(symbols, stave, beam, n) {
    const part = symbols[0].part;

    // Not enough stems for a beam, give it a tail
    if (beam.length === 1) {
        const i = beam[0];

        if (i >= n) throw new Error('Last beam index (' + beam[0] + ') cant be greater than n (' + n + ')');

        const head = symbols[i];

        // If head starts a tie insert the tie now, in front of the head
        if (head.tie === 'begin' || head.tie === 'middle') {
            symbols.splice(i, 0, assign({}, head, {
                type:   'tie',
                beat:   head.beat,
                updown: head.stemDirection === 'up' ? 'down' : 'up',
                event:  head.event
            }));

            // We inserted a symbol, advance n by 1
            return 1;
        }

        // We didn't do anything
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
        head.tieDirection  = stemDirection === 'up' ? 'down' : 'up';

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
                //updown: stemDirection === 'up' ? 'down' : 'up',
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
    return 1 + buffer.length;
}

function createRest(durations, divisions, endbeat, part, tobeat, beat) {
    // [beat, 'rest', pitch (currently unused), duration]
    let duration = tobeat - beat;

    // If the beat and tobeat don't both fall on start, end or a division...
    if (!(beat === 0 || divisions.includes(beat)) || !(tobeat === endbeat || divisions.includes(tobeat))) {
        // Find bar division that rest crosses
        let division = getDivision(divisions, beat, beat + duration);
        // Truncate rest up to division
        if (division) duration = division - beat;
    }

    // Clamp rest duration to permissable rest symbol durations
    let r = restDurations.length;
    // Employ beatPrecision to work around rounding errors
    while (restDurations[--r] + beatPrecision > duration);
    duration = restDurations[r + 1];

    // Where beat does not fall on a 2^n division clamp it to next
    // smallest. This is what stops [0, note, 0.5], [1.5, note, 0.5]
    // from rendering with a single quarter rest between them, but
    // rather two eighth rests.
    let p = 8;
    while ((p *= 0.5) && beat % p);
    // TODO: Something not quite right about this logic
    if (p < duration) duration = p;

    // Create rest symbol
    return {
        beat,
        type: 'rest',
        pitch: '',
        part,
        duration
    };
}

function closeTuplet(stave, tuplet) {
    const { beat, duration, number, heads } = tuplet;

    // Decide on tuplet pitch, effectively vertical row position
    const centreBeat = beat + 0.5 * duration;

    // Encourage lowest pitch to be 1 octave below top line, ensuring
    // triplet (with appropriate styling) always sits above the top line
    const lowestPitchNumber = toNoteNumber(stave.maxLinePitch) - 12;

    let h = heads.length;
    let head, centreNumber;

    // Scan backwards through heads until last head before centre beat
    while ((head = heads[--h]) && head.beat > centreBeat);
    ++h;

    // Scan backwards through heads that cross centre beat, get highest pitch
    while ((head = heads[--h]) && head.beat + head.duration > centreBeat) {
        const number = toNoteNumber(head.pitch);
        if (!centreNumber || number > centreNumber) centreNumber = number;
    }

    // Scan forwards from first head finding highest pitch beginning head
    let firstNumber = lowestPitchNumber;
    h = -1;
    while ((head = heads[++h]) && head.beat < beatPrecision) {
        const number = toNoteNumber(head.pitch);
        if (!firstNumber || number > firstNumber) firstNumber = number;
    }

    // Scan backwards from last head finding highest pitch ending head
    let lastNumber = lowestPitchNumber;
    h = heads.length;
    while ((head = heads[--h]) && head.beat > beat + duration - (duration / number) - beatPrecision) {
        const pitch = toNoteNumber(head.pitch);
        if (!lastNumber || pitch > lastNumber) lastNumber = pitch;
    }

    const avgNumber   = Math.ceil((firstNumber + lastNumber) / 2);
    const avgPitch    = toNoteName(avgNumber);
    if (avgNumber > centreNumber) centreNumber = avgNumber;

    tuplet.pitch = toNoteName(centreNumber);
    tuplet.angle = -3 * Math.sqrt(lastNumber - firstNumber);
    tuplet.down  = tuplet.heads.every(isStemDown);
}

function isStemDown(symbol) {
    return symbol.stemDirection === 'down';
}

function createSymbols(symbols, bar) {
    // All events in symbols have the same part
    const part  = symbols[0] && symbols[0].part;
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

    const divisions = getBarDivisions(bar.meter);

    let beat = 0;
    let n = -1;
    let head;
    let beam;
    let tuplet;

    while (head = symbols[++n]) {
        // We are only interested in notes
        if (head.type !== 'note') continue;

        // Insert rest if head beat is greater than beat
        if (head.beat > beat) {
            // Create rest symbol
            const rest = createRest(restDurations, divisions, bar.duration, part, head.beat, beat);
            symbols.splice(n, 0, rest);

            // Is it a triplet rest?
            if (rest.duration.toFixed(2) === '0.67'
                || rest.duration.toFixed(2) === '0.33') {

                tuplet = {
                    beat: rest.beat,
                    type: 'tuplet',
                    number: 3,
                    duration: 3 * rest.duration,
                    heads: [],
                    part
                };

                symbols.splice(++n, 0, tuplet);
            }

            // Update beat to end of rest
            beat += rest.duration;
            continue;
        }

        // Are we in tuplet state
        if (tuplet) {
            // If this head is within tuplet duration add it to tuplet heads
            if (head.beat < tuplet.beat + tuplet.duration) {
                tuplet.heads.push(head);
            }
            // Otherwise close the tuplet
            else {
                // TODO: decide on stem direction for all tuplet notes
                closeTuplet(stave, tuplet);

                // End tuplet state
                tuplet = undefined;
            }
        }

        // Update beat
        if (head.beat + head.duration > beat) beat = head.beat + head.duration;

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
                // or head starts at a division
                || bar.divisions.includes(head.beat)
                // or head starts after a new division
                || getDivision(bar.divisions, symbols[beam[beam.length - 1]].beat, head.beat)
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

    // Are we in tuplet state
    if (tuplet) {
        // TODO: decide on stem direction for all tuplet notes
        closeTuplet(stave, tuplet);

        // End tuplet state
        tuplet = undefined;
    }

// If last event has not taken us to the end of the bar, insert rests
    while (beat < bar.duration) {
        // Create rest symbol
        const rest = createRest(restDurations, divisions, bar.duration, part, bar.duration, beat);
        symbols.splice(n++, 0, rest);
        // Update beat to end of rest
        beat += rest.duration;
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
        divisions: getBarDivisions(meter),
        symbols: [],
        stave: stave,
        key: key,
        meter: meter
    };

    // If meter change is on this beat push a timesig into symbols
    /*if (meter[0] === beat) {
        bar.symbols.push({
            type:        'timesig',
            beat:        0,
            numerator:   meter[2] / meter[3],
            denominator: 4 / meter[3],
            event:       meter,
            stave
        });
    }*/

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
                tie: 'end',
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

function createBars(events, beatkeys, stave, meter, transpose, config) {
    // A buffer of head symbols to be tied to symbols in the next bar
    const tieheads = [];
    // An array of bar objects
    const bars = [];

    const events0 = eventsAtBeat(events, 0);
    meter = events0.find((event) => event[1] === 'meter') || meter;

    // First bar. Where meter is at beat 0, also inserts a time signature.
    let bar = createBar(0, stave, cScale, meter, tieheads);
    bars.push(bar);

    // Add clef in front of keysig
    bar.symbols.unshift({
        type: 'clef',
        beat: 0,
        stave
    });

    let n = -1;
    let event;
    while (event = events[++n]) {
        if (event[1] === 'key') {
            if (event[0] !== bar.beat) {
                new TypeError('Scribe: "key" event must occur at bar start – event [' + event.join(', ') + '] is on beat ' + (event[0] - bar.beat) + ' of bar');
            }

            // Get the key scale from keyname. This scale is not a true
            // 'scale' in an internal-data sense as it may not begin with a 0, but it
            // maps naturals to accidentals when compared against the C scale. Remember
            // keynumber is on a continuous scale of fourths, so multiply by 7 semitones
            // to get chromatic number relative to C.
            const keynumber = toKeyNumber(event[2]);
            const keyscale  = toKeyScale(keynumber * 7 + transpose);

            // Update the bar's key
            bar.key = keyscale;

            // Add key signature, TODO! Must go in front of any time signature
            bar.symbols.push.apply(bar.symbols, keyscale
                .map((n, i) => (n - cScale[i] && {
                    // No beat for key signature accidentals
                    type: 'acci',
                    pitch: toRootName(cScale[i]) + accidentals[n - cScale[i]],
                    value: n - cScale[i]
                }))
                .filter((o) => !!o)
                .sort(byFatherCharlesPitch)
            );

            continue;
        }

        if (event[1] === 'meter') {
            if (event[0] !== bar.beat) {
                new TypeError('Scribe: "meter" event must occur at bar start – event [' + event.join(', ') + '] is on beat ' + (event[0] - bar.beat) + ' of bar');
            }

            if (event[0] === bar.beat) {
                bar.symbols.push({
                    type:        'timesig',
                    beat:        0,
                    numerator:   event[2] / event[3],
                    denominator: 4 / event[3],
                    event:       event,
                    stave
                });
            }

            // TODO! INSERT TIME SIG.
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
            bar = createBar(bar.beat + bar.duration, stave, bar.key, meter, tieheads);
            bars.push(bar);
        }

        const key       = beatkeys && keyFromBeatKeys(beatkeys, event[0]);
        const startBeat = quantise(quantiseBeats, 1, event[0] - bar.beat);
        const stopBeat  = quantise(quantiseBeats, 1, event[0] + toDuration(event) - bar.beat);

        if (event[1] === 'note') {
            const pitch = stave.getSpelling(key, event, transpose);
            const part  = stave.getPart(pitch);

            let beat  = startBeat;
            let division, tie;

            // If note does not start on a meter multiple and crosses a
            // bar division...
            if (startBeat !== 0
                && startBeat % bar.meter[3] !== 0
                && (division = getDivision(bar.divisions, beat, stopBeat))
            ) {
                const duration = division - beat;

                // Stick it in symbols
                bar.symbols.push(assign({
                    type: 'note',
                    beat,
                    duration,
                    dynamic: event[3],
                    pitch,
                    transpose,
                    event,
                    stave,
                    tie: tie ? 'middle' : 'begin'
                }, part));

                // Update state of note
                beat += duration;
                tie = true;
            }

            // If rest of note does not stop on a meter multiple and crosses a
            // bar division...
            if (stopBeat < bar.duration
                && stopBeat % bar.meter[3] !== 0
                && (division = getLastDivision(bar.divisions, beat, stopBeat))
            ) {
                const duration = division - beat;

                // Stick it in symbols
                bar.symbols.push(assign({
                    type: 'note',
                    beat,
                    duration,
                    dynamic: event[3],
                    pitch,
                    transpose,
                    event,
                    stave,
                    tie: tie ? 'middle' : 'begin'
                }, part));

                // Update state of note
                beat += duration;
                tie = true;
            }

            // Does note cross into next bar?
            const duration = stopBeat > bar.duration ?
                bar.duration - beat :
                stopBeat - beat ;

            const head = assign({
                type: 'note',
                beat,
                duration,
                dynamic: event[3],
                pitch,
                transpose,
                event,
                stave
            }, part);

            // Stick it in symbols
            bar.symbols.push(head);

            // If it's longer than the bar stick it in tieheads buffer
            if (stopBeat > bar.duration) {
                head.tie = tie ? 'middle' : 'begin';
                tieheads.push(head);
            }
        }
        else if (event[1] === 'chord') {
            // Does chord cross into next bar? The symbol should not
            const duration = stopBeat > bar.duration ?
                bar.duration - startBeat :
                stopBeat - startBeat ;

            let root = stave.getSpelling(key, event, transpose);
            if (root === 'C♭' && config.spellChordRootCFlatAsB)  root = 'B';
            if (root === 'E♯' && config.spellChordRootESharpAsF) root = 'F';
            if (root === 'B♯' && config.spellChordRootBSharpAsC) root = 'C';
            if (root === 'F♭' && config.spellChordRootFFlatAsE)  root = 'E';

            bar.symbols.push({
                type: 'chord',
                beat: startBeat,
                duration,
                transpose,
                root,
                extension: event[3],
                event,
                stave
            });
        }
        else {
            // Does chord cross into next bar? The symbol should not
            const duration = stopBeat > bar.duration ?
                bar.duration - startBeat :
                stopBeat - startBeat ;

            bar.symbols.push({
                type: 'lyric',
                beat: startBeat,
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
        bar = createBar(bar.beat + bar.duration, stave, bar.key, meter, tieheads);
        bars.push(bar);
    }

    return bars;
}

function isInitialMeterEvent(event) {
    return event[0] <= 0 && event[1] === 'meter';
}

function isInitialKeyEvent(event) {
    return event[0] <= 0 && event[1] === 'key';
}

const priorities = {
    // The higher the priority, the earlier the event is ordered when
    // sorting events
    key: 2,
    meter: 1,
    default: 0
};

function getPriority(event) {
    return priorities[event[1]] || priorities.default;
}

function byRenderOrder(b, a) {
        // a is before b
    return a[0] < b[0] ? 1 :
        // a is after b
        a[0] > b[0] ? -1 :
        // a and b are at the same time, prioritise by event type
        getPriority(a) - getPriority(b) ;
}

export default function eventsToSymbols(events, clef, keyname, meter, transpose) {
    // TODO, WARNING! This mutates events! We probably oughta clone events first.

    // If events contains no initial meter and meter is set, insert a meter event
    const meterEvent = events.find(isInitialMeterEvent);
    if (!meterEvent && meter) events.unshift([0, 'meter', meter[2], meter[3]]);

    // If events contains no initial key and keyname is set, insert a key event
    const keyEvent = events.find(isInitialKeyEvent);
    if (!keyEvent && keyname) events.unshift([0, 'key', keyname]);

    // Sort into the proper order for rendering
    events.sort(byRenderOrder);

    // Get the stave controller
    const stave = Stave.create(clef || 'treble');

    // Create a map of keys at beats. Doing this here is an optimisation so we
    // don't end up running the keys matrix calculations on every note, which
    // causes measurable delay.
    // TEMP: don't get keys for unpitched
    const beatkeys = stave.pitched ?
        keysAtBeats(events) :
        null ;

    // TODO: this is a two-pass symbol generation, I wonder if we can get
    // it down to one?
    return createBars(events, beatkeys, stave, meter, transpose, config)
        .map(createBarSymbols);
}
