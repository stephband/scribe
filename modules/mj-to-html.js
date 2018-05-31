import { by, compose, get, is, last, limit, isDefined, overload } from '../../fn/fn.js';
import { append, clone, create } from '../../dom/dom.js';
// Todo: modularise music repo and publish and use that
import { numberToNote } from './music.js';
import makeRests from './make-rests.js';
//import makeHeads from './make-heads.js';
import symbols from './symbols.js';

const floor = Math.floor;
const round = Math.round;

// Number of CSS grid divisions per beat
const ticks = 24;

// HTML element creators
/*
const abbr   = create('abbr');
const div    = create('div');
const h1     = create('h1');
const header = create('header');
const span   = create('span');
const svg    = create('svg');
*/

// <svg class="stave-svg" viewbox="0 0 1 4" preserveAspectRatio="none"><use x="0" y="0" href="#stave"/></svg>
// <svg class="bar-svg bar-svg-0" viewbox="0 0 0.4 4"><use x="0" y="0" href="#bar"/></svg>
// <svg class="head-svg" style="grid-column: beat-3      / span 8; grid-row: D2;"   viewbox="0 0 1 1"><use x="0" y="0" href="#note-head"/></svg>
// <svg class="head-svg" style="grid-column: beat-0  / span 24; grid-row: F3;" viewbox="0 0 1 1"><use x="0" y="0" href="#cross-head"/></svg>
// <abbr  class="chord-abbr" style="grid-column: beat-0 / span 96;">Symbol</abbr>

function createNode(type, column, row, span) {
    const node = clone(symbols[type]);

    if (column) {
        node.style.gridColumn = column + '/span ' + span;
    }

    if (row) {
        node.style.gridRow = row + '/span 1';
    }

    return node;
}

function beatToBar(meterStart, meterBeats, beat) {
    const elapsedBeats = beat - meterStart;
    return Math.floor(elapsedBeats / meterBeats);
}

function beatToBarBeat(meterStart, meterDuration, beat) {
    const elapsedBeats = beat - meterStart;
    return elapsedBeats % meterDuration;
}

function beatReplacer($0,$1,$2) {
    return $1 + ($2 ? '-' + $2 : '');
}

function beatToColumnName(beat) {
    beat = round(beat * ticks) / ticks;
    return 'beat-' + (beat + '').replace(/^(\d+)(?:\.(\d{1,5}))?/, beatReplacer);
}

function numberToRow(number) {
    return (typeof number === 'number' ? numberToNote(number) : number)
    .replace('♯', '#')
    .replace('♭', 'b')
}

function durationToSpan(duration) {
    return floor(duration * ticks);
}

function getEventType(data, events) {
    return events[1];
}

function beatToEventRest(noteStarts, beat) {
    const l = noteStarts.length;
    let i = -1;
    while (++i < l && noteStarts[i] < beat);
    return i >= l ? 0 : noteStarts[i] - beat ;
}


const populateNodes = overload(getEventType, {
    meter: function(data, event) {
        // beat, type, num, den [, breaks]
        data.meterStart = event[0];
        data.meter = event[2];
        // Todo: lookup table for common num/den breaks
        data.meterBreaks = event[4] || [2];
        return data;
    },

    note: function(data, event) {
        var column = beatToColumnName(event[0]);
        var row    = numberToRow(event[2]);
        var start  = (event[0] - data.meterStart) % data.meter;
        var end    = start + event[4];
        var beat, lastColumn, lastSpan;
        var restLength;

        if (data.lastNoteStop < event[0]) {
            var rests = makeRests(data.meterBreaks, data.meter, data.meterStart, data.lastNoteStop, event[0] - data.lastNoteStop);

            data.symbols.push.apply(data.symbols, rests.map(function(symbol) {
                var row    = 'line-middle';
                var column = beatToColumnName(symbol.beat);
                var span   = durationToSpan(symbol.duration);

                symbol.node = createNode('rest-' + symbol.duration, column, row, span);
                data.lastNoteStop = symbol.beat + symbol.duration;

                return symbol;
            }));
        }

        // Check whether symbol crosses a bar line
        var duration = end > data.meter ?
            data.meter - start :
            end - start ;

        var span = durationToSpan(duration);

        var symbol = {
            type:  'head',
            event: event,
            node:  createNode('head-' + duration, column, row, span),
            beat:  event[0],
            duration: duration
        };

        data.symbols.push(symbol);

        var eventStop = event[0] + event[4];

        if (data.lastNoteStop < eventStop) {
            data.lastNoteStop = eventStop;
        }

/*
        while (end > data.meter) {
            lastColumn = column;
            lastSpan   = span;

            // Create note head
            node   = createNode('note-head');
            // First beat of next bar
            beat   = data.meterStart + (floor((event[0] - data.meterStart) / data.meter) + 1) * data.meter;
            column = beatToColumnName(beat);
            duration = limit(0, data.meter, end);
            span   = durationToSpan(duration);

            node.style.gridArea = row + '/' + column + '/span 1/span ' + span;
            data.symbols.push(symbol);
    data.nodes.push(node);

            // Create tie mark
            console.log('Insert tie!');
            node   = createNode('up-tie');

            node.style.gridArea = row + '/' + lastColumn + '/span 1/span ' + (lastSpan + 2);
            data.symbols.push(symbol);
    data.nodes.push(node);

            end -= data.meter;
        }
*/
        return data;
    },

    mode: function(data, event) {
        var column = beatToColumnName(event[0]);
        var span   = durationToSpan(event[3]);

        const symbol = {
            type: 'chord',
            node: createNode('chord', column, 'chords', span),
            beat: event[0],
            duration: event[3]
        };

        symbol.node.innerHTML = event[2];
        data.symbols.push(symbol);

        return data;
    },

    stop: function(data, event) {
        if (data.lastNoteStop < event[0]) {
            var rests = makeRests(data.meterBreaks, data.meter, data.meterStart, data.lastNoteStop, event[0] - data.lastNoteStop);

            data.symbols.push.apply(data.symbols, rests.map(function(symbol) {
                var column = beatToColumnName(symbol.beat);
                var row    = 'line-middle';
                var span   = durationToSpan(symbol.duration);
                symbol.node = createNode('rest-' + symbol.duration, column, row, span);

                data.lastNoteStop = symbol.beat + symbol.duration;

                return symbol;
            }));
        }

        return data;
    }
});

function createBar(events) {

}

function splitBars(data, event) {
    const bar = beatToBar(data.meterStart, data.meter, event[0]);

    if (data.bar < bar) {
        const barNode = last(data.barNodes);
        data.symbols  = [];

console.log('BAR ', data.bar);

        // Populate and append the previous bar
        const events = data.events
        .map(function(event) {
            var e = event.slice();
            e[0] = beatToBarBeat(data.meterStart, data.meter, event[0]);
            return e;
        });

        events.push([data.meter, 'stop']);

        events
        .reduce(populateNodes, data)
        .symbols
        .map(get('node'))
        .forEach(append(barNode));

        if (event[1] === 'stop') {
            return data;
        }

        data.lastNoteStop = 0;
        data.events = [];

        // Create new bars
        while (data.bar < bar) {
            data.bar++;
            data.barNodes.push(createNode('4/4-treble-bar'));

            if (data.bar < bar) {
                console.log('REST', row + '/beat-' + data.lastNoteStop + '/span 1/span ' + durationToSpan(data.meterDuration))
                const barRest = createNode('rest-' + data.meterDuration, beatToColumnName(data.lastNoteStop), row, durationToSpan(data.meterDuration));
                append(last(data.barNodes), barRest);
            }
        }
    }

    data.events.push(event);
    return data;
}

export default function mjToHTML(json) {
    var data = typeof json === 'string' ? JSON.parse(json) : json ;
    var events = data.events;

    events
    .sort(by(get(0)))
    .push([16, "stop"]);

    return events
    .reduce(splitBars, {
        meterStart: 0,
        meter: 4,
        meterBreaks: [2],
        bar: 0,
        barNodes: [createNode('4/4-treble-bar')],
        lastNoteStop: 0,
        symbols: [],
        events: []
    })
    .barNodes;

    var bar = 0;
    while (++bar <= 60) {

    }

    events.reduce(function(array, event) {
        const bar = beatToBar(data.meterStart, data.meter, event[0]);

        var previousBar = array.length && array[array.length - 1].bar;

        if (bar === previousBar) {
            array[array.length - 1].push(event);
        }
    }, [])
};
