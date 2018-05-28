import { by, compose, get, is, limit, isDefined, overload } from '../../fn/fn.js';
import { clone } from '../../dom/dom.js';
// Todo: modularise music repo and publish and use that
import { numberToNote } from './music.js';
import symbols from './symbols.js';

const isNote = compose(is('note'), get(1));

// Avoid float imprecision by comparing rough values

const floatPrecision    = 4;

function roughlyEquals(a, b) {
    return a.toFixed(floatPrecision) === b.toFixed(floatPrecision);
}

function roughlyContains(a, array) {
    return array.find(function(b) {
        return roughlyEquals(a, b);
    }) !== undefined;
}


//const tripletRestValues = [1/6, 1/3, 2/3, 4/3];
const restValues        = [1/8, 1/4, 1/2, 1, 1.5, 2, 3, 4, 6].sort();

function createRest(pos, duration) {
    const l = restValues.length;

    let i     = -1;
    let rest  = 0;
    let value = restValues[++i];

    while (value <= 1 && value <= duration) {
        rest = pos % value;

        if (rest && roughlyContains(rest, restValues)) { return rest; }
        if (roughlyEquals(value, duration)) { return value; }
        value = restValues[++i];
    }

    i = restValues.length;
    value = restValues[--i];

    while (i--) {
        if (value <= duration) { return value; }
        value = restValues[i];
    }

    throw new Error('Cant fit rests of duration ' + duration + ' to position ' + pos + '. Bummer, eh?');
}

function createGroupRests(pos, duration, rests) {
    const rest = createRest(pos, duration);
    rests.push(rest);
    return roughlyEquals(rest, duration) ? rests :
        createGroupRests(pos + rest, duration - rest, rests);
}

function beatToEventRest(noteStarts, beat) {
    const l = noteStarts.length;
    let i = -1;
    while (++i < l && noteStarts[i] < beat);
    return i >= l ? 0 : noteStarts[i] - beat ;
}

function beatToBarBeat(meterStart, meterDuration, beat) {
    const elapsedBeats = beat - meterStart;
    return elapsedBeats % meterDuration;
}

function barBeatToGroupBeat(meterBreaks, barBeat) {
    let i = meterBreaks.length;
    while (i-- && meterBreaks[i] > barBeat);
    return i < 0 ? barBeat : barBeat - meterBreaks[i];
}

function barBeatToGroupRest(meterBreaks, meterDuration, barBeat) {
    const l = meterBreaks.length;
    let i = -1;
    while (++i < l && meterBreaks[i] <= barBeat);
    return i >= l ? meterDuration - barBeat : meterBreaks[i] - barBeat ;
}

function createRests(meterStart, meterBreaks, meterDuration, noteStarts, eventRest, beat, values) {
    // Position relative to the start of the bar
    const barBeat   = beatToBarBeat(meterStart, meterDuration, beat);

    // If we are at the start of the bar and there is more than a bar of resting
    // to fill, just push a bar's rest value
    if (barBeat === 0 && eventRest >= meterDuration) {
        values.push(meterDuration);
        return eventRest === meterDuration ?
            values :
            createRests(meterStart, meterBreaks, meterDuration, noteStarts, eventRest - meterDuration, beat + meterDuration, values);
    }

    // Duration to the end of the group
    const groupRest = barBeatToGroupRest(meterBreaks, meterDuration, barBeat);

    // Position relative to the start of the group or bar
    const groupBeat = barBeatToGroupBeat(meterBreaks, barBeat);

    // Duration of rests to be filled
    const duration  = Math.min(eventRest, groupRest);

    // Push group rest values
    values = createGroupRests(groupBeat, duration, values);

    // If there is rest left to fill, recurse
    return eventRest === duration ?
        values :
        createRests(meterStart, meterBreaks, meterDuration, noteStarts, eventRest - duration, beat + duration, values);
}

function createRestSymbols(meterStart, meterBreaks, meterDuration, events, beat) {
    const notes      = events.filter(isNote);
    const noteStarts = notes.map(get(0));

    // Duration until the next event
    const eventRest = beatToEventRest(noteStarts, beat);

    return createRests(meterStart, meterBreaks, meterDuration, noteStarts, eventRest, beat, []);
}

window.rests = createRestSymbols;


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
        var restLength;

        if (data.lastNoteStop < event[0]) {
            console.log('Insert rests!');
            var restValues = createRestSymbols(data.meterStart, data.meterBreaks, data.meter, [event], data.lastNoteStop);
            console.log(restValues);
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
        meterBreaks: [2],
        lastNoteStop: 0,
        nodes: []
    })
    .nodes;
};
