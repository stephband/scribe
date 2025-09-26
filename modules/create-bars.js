
import get        from 'fn/get.js';
import overload   from 'fn/overload.js';
import { toNoteName, toNoteNumber, toRootName, toRootNumber } from 'midi/note.js';
import join       from './object/join.js';
import toStopBeat from './event/to-stop-beat.js';
import { getDivisions }  from './bar.js';
import { toKeyScale, toKeyNumber, cScale } from './keys.js';
import { createBarSymbols, createPartSymbols } from './symbolise.js';


const min = Math.min;


/*const ignoreTypes = [];

const process = overload(get(1), {
    key: (event, bar) => {
        if (event[0] !== bar.beat) {
            throw new TypeError('Scribe: "key" event must occur at bar start – event [' + event.join(', ') + '] is on beat ' + (event[0] - bar.beat) + ' of bar');
        }

        // Get the key scale from keyname. This scale is not a true
        // 'scale' in an internal-data sense as it may not begin with a 0, but it
        // maps naturals to accidentals when compared against the C scale. Remember
        // keynumber is on a continuous scale of fourths, so multiply by 7 semitones
        // to get chromatic number relative to C.
        const keynumber = toKeyNumber(event[2]);
        const keyscale  = toKeyScale(keynumber * 7);

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
    },

    meter: (event, bar) => {
        if (event[0] !== bar.beat) {
            throw new TypeError('Scribe: "meter" event must occur at bar start – event [' + event.join(', ') + '] is on beat ' + (event[0] - bar.beat) + ' of bar');
        }

        bar.symbols.push({
            type:        'timesig',
            beat:        0,
            numerator:   event[2] / event[3],
            denominator: 4 / event[3],
            event:       event,
            stave
        });

        bar.duration  = event[2];
        bar.divisor   = event[3];
        bar.divisions = getBarDivisions(event);
    },

    sequence: (event, bar) => {
        // TODO: replace this nonsense
        sequenceEndBeat = event[0] + event[4];

        if (event[0] > 0) {
            // Insert double bar line
            firstFullBarOfSequence = event.sequence;
        }
    },

    symbol: (event, bar) => {
        bar.symbols.push({
            type: 'symbol' + event[2]
        });
    },

    note: () => {
        const pitch = stave.getSpelling(key, event, transpose);
        const part  = stave.getPart(pitch);

        let beat  = startBeat;
        let division, tie;

        // If note does not start on a meter multiple and crosses a
        // bar division...
        if (startBeat !== 0
            && !equal(0, startBeat % bar.divisor)
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
            && !equal(0, stopBeat % bar.divisor)
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
    },

    chord: () => {
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
    },

    lyric: () => {
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
    },

    default: (event) => {
        if (ignoreTypes.includes(event[1])) return;
        console.log('Scribe: ignoring event type "' + event[1] + '"');
    }
});


function openBar(beat, stave, key, events, duration, divisor, divisions) {
    // Create tied heads. TODO: There's a potential problem here, stave
    // and part may change based on incoming clef event maybe?
    /*let m = -1;
    let head, event;
    while (ties[++m] && (event = symbol.event)) {
        const duration = event[0] + event[4] - bar.beat;
        const head = assign({}, symbol, {
            type: 'head',
            beat: 0,
            duration: min(duration, bar.duration),
            tie: duration > bar.duration ? 'middle' : 'end',
            stave
        }, stave.getPart(symbol.pitch));

        // If tie has ended remove event from ties
        if (head.tie === 'end') ties.splice(m--, 1);

        bar.symbols.push(head);
    }

    // Return bar symbol
    return {
        type: 'bar',
        beat,
        //stave,
        key,
        duration,
        divisor,
        divisions,
        events
    };
}
*/

function pushEventToPart(stave, parts, event) {
    const partIndex  = stave.getPartIndex(event[2]);
    const partEvents = parts[partIndex] || (parts[partIndex] = []);
    parts[partIndex].push(event);
}

function createBar(beat, duration, divisor, stave, key, events, parts) {
    const symbols = [];

    // Populate accidentals with key signature sharps and flats
    const accidentals = key.reduce((accidentals, n, i) => {
        const acci = n - cScale[i];
        if (acci !== 0) {
            const name = toRootName(cScale[i]);
            let n = 10;
            while (n--) accidentals[name + n] = acci;
        }
        return accidentals;
    }, {});

    const bar = {
        type: 'bar',
        beat,
        duration,
        //stave,
        //key,
        divisor,
        divisions: getDivisions(duration, divisor),
        //events,
        //parts,
        symbols
    };

    // Symbolise parts
    let name;
    for (name in parts) {
        symbols.push.apply(symbols, createPartSymbols(bar, stave, key, accidentals, name, parts[name]/*, state.clef.stemDirectionNote*/));
    }

    return bar;
}

export default function createBars(sequence, stave, config) {
    const bars = [];

    let beat   = 0;
    let events = [];
    let ties   = [];
    let parts  = {};
    let duration, divisor, event, key;

    for (event of sequence) {
        // If event is beyond bar create bars until event is in bar
        while (event[0] >= beat + duration) {
            // Close current bar, push to bars
            bars.push(createBar(beat, duration, divisor, stave, key, events, parts));

            // Update beat, start new arrays
            beat = beat + duration;
            events = [];
            parts  = {};

            let t = -1;
            while (ties[++t]) {
                pushEventToPart(stave, parts, ties[t]);
                // If event does not extend beyond bar remove it from ties
                if (toStopBeat(ties[t]) < beat + duration) ties.splice(t--, 1);
            }
        }

        switch (event[1]) {
            case "note":
                pushEventToPart(stave, parts, event);
                // If event extends beyond bar push it into ties
                if (toStopBeat(event) > beat + duration) ties.push(event);
                break;

            case "key":
                if (event[0] !== beat) {
                    new TypeError('Scribe: "key" event must occur at bar start – event [' + event.join(', ') + '] is on beat ' + (event[0] - beat) + ' of bar');
                }

                // Get the key scale from keyname. This scale is not a true
                // 'scale' in an internal-data sense as it may not begin with a 0, but it
                // maps naturals to accidentals when compared against the C scale. Remember
                // keynumber is on a continuous scale of fourths, so multiply by 7 semitones
                // to get chromatic number relative to C.
                const keynumber = toKeyNumber(event[2]);
                key = toKeyScale(keynumber * 7);

            case "meter":
                duration  = event[2];
                divisor   = event[3];

                // If meter event does not land on current bar beat
                if (event[0] !== beat) {
                    // Create bar prematurely and start a new one, or error out?
                    console.log('TODO');
                }

            default:
                events.push(event);
        }
    }

    // There are still events with long durations to symbolise into bars
    while (ties.length) {
        // Close current bar, push to bars
        bars.push(createBar(beat, duration, divisor, stave, key, events, parts));

        // Update beat, start new arrays
        beat = beat + duration;
        events = [];
        parts  = {};

        let t = -1;
        while (event = ties[++t]) {
            pushEventToPart(stave, parts, event);
            // If event does not extend beyond bar remove it from ties
            if (toStopBeat(event) < beat + duration) ties.splice(t--, 1);
        }
    }

    // Close final bar, push to bars
    bars.push(createBar(beat, duration, divisor, stave, key, events, parts));

    // Return bars
    return bars;
}
