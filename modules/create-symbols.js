
import by       from '../../fn/modules/by.js';
import get      from '../../fn/modules/get.js';
import overload from '../../fn/modules/overload.js';
import { toNoteNumber, toNoteName, normaliseNoteName } from '../../midi/modules/note.js';
import * as staves from './staves.js';

const assign = Object.assign;
const { abs, ceil, floor } = Math;
const rflat  = /b|♭/;
const rsharp = /#|♯/;

const defaultMeter = {
    duration: 4,
    division: 1,
    breaks: [2],
    label: '4/4'
};

const defaults = {
    cursor:  0,
    key:     'C',
    timesig: '4/4',
    stave:   'treble'
};


function getStemDirection(note, head) {
    return head && head.stemDirection || (
        toNoteNumber(note) < toNoteNumber(head.pitch) ?
            'down' :
            'up' );
}

function isAfterBreak(breaks, b1, b2) {
    let n = -1;
    while (breaks[++n] && breaks[n] <= b1);
    // If breaks[n] is undefined, returns false, which is what we want
    return b2 >= breaks[n];
}

function getDuration(event) {
    return event[1] === 'chord' ? event[3] :
        event[4] ;
}

function insertTail(symbols, stemNote, i) {
    const head = symbols[i];
    const stemDirection = getStemDirection(stemNote, head) ;

    // Splice stem and tail in before head
    // TODO put tail before accidentals for CSS reasons
    symbols.splice(i, 0, assign({}, head, {
        type: 'stem',
        stemDirection
    }), assign({}, head, {
        type: 'tail',
        stemDirection
    }));

    // We just spliced two symbols in before index n
    return 2;
}

const lines = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function addStaveRows(n, row) {
    if (n < 0) {
        while (n++) {
            const line   = row[0];
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

function subtractStaveRows(stave, r1, r2) {
    if (stave.getRowDiff) {
        return stave.getRowDiff(r1, r2);
    }

    // Calculate diff for diatonic stave
    const degree1 = r1[0];
    // TODO Support -ve octave (and double figure octave?) numbers
    const octave1 = parseInt(r1[r1.length - 1], 10);
    const degree2 = r2[0];
    const octave2 = parseInt(r2[r2.length - 1], 10);

    let i1 = lines.indexOf(degree1);
    let i2 = lines.indexOf(degree2);
    let n  = i2 - i1;

    return n + (octave2 - octave1) * 7;
}

function insertBeam(symbols, stave, beam, stemNote, n) {
    const part = symbols[0].part;

    // Not enough stems for a beam, give it a tail
    if (beam.length === 1) {
        if (beam[0] >= n) {
            throw new Error('Last beam index (' + i + ') cant be greater than n (' + n + ')');
        }

        return insertTail(symbols, stemNote, beam[0]);
    }

    // Render stems and beam
    const stemDirection = symbols[beam[0]] && symbols[beam[0]].stemDirection ?
            symbols[beam[0]].stemDirection :
        (beam
        .map((i) => subtractStaveRows(stave, stemNote, symbols[i].pitch))
        .reduce((t, u) => t + u, 0) / beam.length) < 0 ?
            'up' :
            'down' ;

    const stems = [];
    const ties  = [];

    // Loop backwards through beam splicing in stem symbols before
    // the heads, all with the winning stem direction
    let b = -1;
    let avgBeginLine = 0;
    let avgEndLine   = 0;
    let i, head, line, stem;
    while (beam[++b] !== undefined) {
        i    = beam[b];
        head = symbols[i];
        line = subtractStaveRows(stave, stemNote, head.pitch);

        head.stemDirection = stemDirection;
        head.tieDirection  = stemDirection === 'up' ? 'down' : 'up' ;

        if (b < (beam.length - 1) / 2) {
            avgBeginLine += line / Math.floor(beam.length / 2);
        }

        else if (b > (beam.length - 1) / 2) {
            avgEndLine += line / Math.floor(beam.length / 2);
        }

        if (stem && stem.beat === head.beat) {
            //let stemLine = subtractStaveRows('B4', head.pitch)
            //let range =
            stem.range = subtractStaveRows(stave, stem.pitch, head.pitch);
            stem.pitch = stem.range < 0 ?
                stem.stemDirection === 'up' ? stem.pitch : head.pitch :
                stem.stemDirection === 'up' ? head.pitch : stem.pitch ;
        }
        else {
            stem = assign({}, head, {
                type: 'stem'
            });
            stems.push(stem);
        }

        if (head.tie === 'begin') {
            ties.push(assign({}, head, {
                type: 'tie',
                beat:   head.beat,
                updown: head.tieDirection,
                event:  head.event
            }));
        }
    }

    // Calculate where to put beam exactly
    let begin    = stems[0];
    let end      = stems[stems.length - 1];
    let endRange = subtractStaveRows(stave, begin.pitch, end.pitch);
    let avgRange = avgEndLine - avgBeginLine;
    let range    = abs(avgRange) > abs(0.75 * endRange) ?
        0.75 * endRange :
        avgRange ;

    stems.forEach((stem, i) => {
        stem.beamY = stemDirection === 'down' ?
            -range * i / (stems.length - 1) + subtractStaveRows(stave, begin.pitch, stem.pitch) :
            range * i / (stems.length - 1) - subtractStaveRows(stave, begin.pitch, stem.pitch) ;
    });

    symbols.splice(i, 0, ...stems);

    // Put the beam in front of the first head (??)
    symbols.splice(i, 0, assign({}, begin, {
        type:   'beam',
        // Push beam start into next grid column
        beat:   begin.beat,
        duration: end.beat - begin.beat,
        //pitch:  begin.pitch,
        range:  range,
        updown: stemDirection,
        stems:  stems
    }));

    symbols.splice(i, 0, ...ties);

    // We just spliced a bunch of symbols in before index n
    return stems.length + ties.length + 1;
}

function insertSymbols(symbols, bar, stemNote) {
    // All events in symbols have the same part
    const part  = symbols[0].part;
    const accidentals = {};
    let beat = 0;
    let n = -1;
    let head;
    let beam;
    let endBeat;

    while (head = symbols[++n]) {
        endBeat = head.beat + head.duration;

        // We are only interested in notes
        if (head.type !== 'head') {
            continue;
        }

        // Rest

        // Insert rest if head beat is greater than beat
        if (head.beat > beat) {
            // [beat, 'rest', pitch (currently unused), duration]
            symbols.splice(n++, 0, {
                beat,
                type:     'rest',
                pitch:    '',
                part:     part,
                duration: head.beat - beat
            });
        }

        // Update beat
        if (endBeat > beat) {
            beat = endBeat;
        }

        // Accidental

        // Determine accidental
        const acci = rsharp.test(head.pitch) ? 1 :
            rflat.test(head.pitch) ? -1 :
            undefined ;

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
        let ledgerrows = subtractStaveRows(bar.stave, 'G5', head.pitch);

        if (ledgerrows > 0) {
            symbols.splice(n++, 0, assign({}, head, {
                type: 'upledger',
                rows: ledgerrows
            }));
        }

        // Down ledger lines
        else {
            ledgerrows = subtractStaveRows(bar.stave, head.pitch, 'D4');
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
                n += insertBeam(symbols, bar.stave, beam, stemNote, n);
                beam = undefined;
            }
        }



        // Stem and ties. We must wait for stems to be decided before rendering
        // ties as their up/down direction is dependent.
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
            // Otherwise render the stem immediately
            else {
                let stemDirection = getStemDirection(stemNote, head);
                symbols.splice(n++, 0, assign({}, head, {
                    type: 'stem',
                    stemDirection
                }));

                if (head.tie === 'begin') {
                    symbols.splice(n++, 0, assign({}, head, {
                        type: 'tie',
                        // Move tie into following grid column
                        beat:   head.beat,
                        updown: stemDirection === 'up' ? 'down' : 'up',
                        event:  head.event
                    }));
                }
            }
        }
        else {
            if (head.tie === 'begin' || head.tie === 'middle') {
                let stemDirection = getStemDirection(stemNote, head);
                symbols.splice(n++, 0, assign({}, head, {
                    type: 'tie',
                    // Move tie into following grid column
                    beat:   head.beat,
                    updown: stemDirection === 'up' ? 'down' : 'up',
                    event:  head.event
                }));
            }
        }
    }

    // Close the current beam
    if (beam && beam.length) {
        n += insertBeam(symbols, bar.stave, beam, stemNote, n);
        beam = undefined;
    }

    // If last event has not taken us to the end of the bar, insert rest
    if (beat < bar.duration) {
        symbols.push({
            beat,
            type:     'rest',
            pitch:    '',
            duration: bar.duration - beat,
            part:     part
        });
    }

    return symbols;
}

function toSymbols(bar) {
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

    // Fill each parts with accidentals, rests, beams, ties
    parts.forEach((part) => insertSymbols(part, bar, state.clef.stemDirectionNote));

    // Empty out bar.symbols and push in symbols from parts
    bar.symbols.length = 0;
    parts.reduce((symbols, part) => {
        symbols.push.apply(symbols, part);
        return symbols;
    }, bar.symbols);

    return bar;
}

function createBarFromBuffer(barBeat, barDuration, buffer, stave) {
    const bar = {
        beat: barBeat,
        duration: barDuration,
        breaks: [2],
        symbols: [],
        stave: stave
    };

    let m = -1;
    let tied, pitch;
    while (buffer[++m] && buffer[m][0] < barBeat + barDuration) {
        tied = buffer[m];
        pitch = typeof tied[2] === 'number' ?
            toNoteName(tied[2]) :
            normaliseNoteName(tied[2]);

        // Event ends after this bar
        if (barBeat + barDuration < tied[0] + tied[4]) {
            bar.symbols.push(assign({
                type: 'head',
                beat: 0,
                pitch,
                duration: barDuration,
                head: stave.getHead && stave.getHead(pitch, barDuration),
                tie: 'middle',
                event: tied
            }, stave.getPart && stave.getPart(pitch)));
        }

        // Event ends in this bar
        else {
            let duration = tied[0] + tied[4] - barBeat;
            bar.symbols.push(assign({
                type: 'head',
                beat: 0,
                pitch,
                duration,
                head: stave.getHead && stave.getHead(pitch, duration),
                tie: 'end',
                event: tied
            }, stave.getPart && stave.getPart(pitch)));

            // Remove event from buffer, as it has ended
            buffer.splice(m, 1);
            --m;
        }
    }

    return bar;
}

function splitByBar(events, barDuration, stave) {
    const bars   = [];
    const buffer = [];


    // TODO: perform split by clef somewhere in here
    /*if (stave.getSplit) {
        const { uppper, lower } = stave.getSplit(events);
    }*/


    let barBeat = 0;
    let bar = createBarFromBuffer(barBeat, barDuration, buffer, stave);
    bars.push(bar);

    bar.symbols.push({
        type: 'clef',
        beat: 0,
        clef: stave.clef
    });

    let n = -1;
    let event;
    while (event = events[++n]) {
        if (event[1] === 'meter') {
            if (event[0] !== barBeat) {
                new TypeError('A "meter" event may only occur at the start of a bar')
            }

            bar.duration = barDuration = event[2];
            bar.breaks   = bar.duration === 4 ? [2] :
                bar.duration === 3 ? [1,2] :
                [] ;
            bar.symbols.push({
                type:        'timesig',
                beat:        0,
                numerator:   event[2] / event[3],
                denominator: 4 / event[3],
                event:       event
            });

            continue;
        }

        if (event[1] !== 'note' && event[1] !== 'chord' && event[1] !== 'lyric') {
            console.log('Scribe: event type "' + event[1] + '" not rendered');
            continue;
        }

        // Event is in a future bar
        while (event[0] >= barBeat + barDuration) {
            // Create the next bar
            barBeat = barBeat + barDuration;
            bar = createBarFromBuffer(barBeat, barDuration, buffer, stave);
            bars.push(bar);
        }

        // Event ends after this bar
        if (event[0] + getDuration(event) > barBeat + barDuration) {
            let beat  = event[0] - barBeat;

            if (event[1] === 'note') {
                let pitch = typeof event[2] === 'number' ?
                    toNoteName(event[2]) :
                    normaliseNoteName(event[2]) ;

                let duration = barBeat + barDuration - event[0];

                bar.symbols.push(assign({
                    type: 'head',
                    beat: beat,
                    pitch,
                    duration,
                    head: stave.getHead && stave.getHead(pitch, duration),
                    tie: 'begin',
                    event: event
                }, stave.getPart && stave.getPart(pitch)));

                // Stick it in the ties buffer
                buffer.push(event);
            }

            else {
                // Truncate 'chord' or 'lyric' to bar end
                bar.symbols.push({
                    type:  event[1],
                    beat:  beat,
                    value: event[2],
                    duration: barBeat + barDuration - event[0],
                    event: event
                });
            }
        }

        // Event ends inside this bar
        else {
            if (event[1] === 'note') {
                let pitch = typeof event[2] === 'number' ?
                    toNoteName(event[2]) :
                    normaliseNoteName(event[2]) ;

                bar.symbols.push(assign({
                    type: 'head',
                    beat: event[0] - barBeat,
                    pitch,
                    duration: event[4],
                    head: stave.getHead && stave.getHead(pitch, event[4]),
                    event: event
                }, stave.getPart && stave.getPart(pitch)));
            }

            else {
                // Type 'chord' or 'lyric'
                bar.symbols.push({
                    type: event[1],
                    beat: event[0] - barBeat,
                    value: event[2],
                    duration: event[3],
                    event: event
                });
            }
        }
    }

    // There are still hanging notes to render
    while (buffer.length) {
        // Create the next bar
        barBeat = barBeat + barDuration;
        bar = createBarFromBuffer(barBeat, barDuration, buffer, stave);
        bars.push(bar);
    }

    return bars;
}

export default function createSymbols(events, clef) {
    events.sort(by(get(0)));

    const stave = clef ?
        staves[clef] :
        staves.treble ;

    return splitByBar(events, defaultMeter.duration, stave).map(toSymbols);
}
