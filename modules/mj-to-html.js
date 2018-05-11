import { by, get, limit, isDefined, overload } from '../../fn/fn.js';
import { clone } from '../../dom/dom.js';
// Todo: modularise music repo and publish and use that
import { numberToNote } from './music.js';
import symbols from './symbols.js';

// <svg class="stave-svg" viewbox="0 0 1 4" preserveAspectRatio="none"><use x="0" y="0" href="#stave"/></svg>
// <svg class="bar-svg bar-svg-0" viewbox="0 0 0.4 4"><use x="0" y="0" href="#bar"/></svg>
// <svg class="head-svg" style="grid-column: beat-3      / span 8; grid-row: D2;"   viewbox="0 0 1 1"><use x="0" y="0" href="#note-head"/></svg>
// <svg class="head-svg" style="grid-column: beat-0  / span 24; grid-row: F3;" viewbox="0 0 1 1"><use x="0" y="0" href="#cross-head"/></svg>
// <abbr  class="chord-abbr" style="grid-column: beat-0 / span 96;">Symbol</abbr>

function symbol(type) {
    return clone(symbols[type]);
}

const floor = Math.floor;
const round = Math.round;
const ticks = 24;

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

function eventToSpan(duration) {
    return floor(duration * ticks);
}

function getEventType(data, events) {
    return events[1];
}

const populateNodes = overload(getEventType, {
    note: function(data, event) {
        var node   = symbol('note-head');
        var column = beatToColumnName(event[0]);
        var row    = numberToRow(event[2]);
        var start = (event[0] - data.meterStart) % data.meter;
        var end   = start + event[4];
        var beat, lastColumn, lastSpan;

        if (data.lastNoteStop < event[0]) {
            console.log('Insert rests!');
        }

        // Check whether symbol crosses a bar line
        var duration = end > data.meter ?
            data.meter - start :
            end - start ;

        var span = eventToSpan(duration);

        node.style.gridArea = row + '/' + column + '/span 1/span ' + span;
        data.nodes.push(node);
        data.lastNoteStop = event[0] + event[4];

        while (end > data.meter) {
            lastColumn = column;
            lastSpan   = span;

            // Create note head
            node   = symbol('note-head');
            // First beat of next bar
            beat   = data.meterStart + (floor((event[0] - data.meterStart) / data.meter) + 1) * data.meter;
            column = beatToColumnName(beat);
            duration = limit(0, data.meter, end);
            span   = eventToSpan(duration);

            node.style.gridArea = row + '/' + column + '/span 1/span ' + span;
            data.nodes.push(node);

            // Create tie mark
            console.log('Insert tie!');
            node   = symbol('up-tie');

            node.style.gridArea = row + '/' + lastColumn + '/span 1/span ' + (lastSpan + 2);
            data.nodes.push(node);

            end -= data.meter;
        }

        return data;
    },

    mode: function(data, event) {
        var node   = symbol('chord');
        var column = beatToColumnName(event[0]);
        var row    = 'chords';
        var span   = eventToSpan(event[3]);

        node.style.gridArea = row + '/' + column + '/span 1/span ' + span;
        node.innerHTML = event[2];

        data.nodes.push(node);
        return data;
    }
});

export default function mjToHTML(json) {
    var data = typeof json === 'string' ? JSON.parse(json) : json ;
    var events = data.events;

    return events
    .sort(by(get(0)))
    .reduce(populateNodes, {
        meterStart: 0,
        meter: 4,
        lastNoteStop: 0,
        nodes: []
    })
    .nodes;
};
