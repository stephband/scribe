import { by, compose, get, is, last, limit, isDefined, overload } from '../../fn/fn.js';
import { append, clone } from '../../dom/dom.js';
// Todo: modularise music repo and publish and use that
import { numberToNote } from './music.js';
import symbols from './symbols.js';

function isNoteOrStop(e) {
    return e[1] === 'note' || e[1] === 'stop';
}

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

function beatToBar(meterStart, meterBeats, beat) {
    const elapsedBeats = beat - meterStart;
    return Math.floor(elapsedBeats / meterBeats);
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

export default function createRestSymbols(meterStart, meterBreaks, meterDuration, events, beat) {
    const notes      = events.filter(isNoteOrStop);
    const noteStarts = notes.map(get(0));

    // Duration until the next event
    const eventRest = beatToEventRest(noteStarts, beat);

    return createRests(meterStart, meterBreaks, meterDuration, noteStarts, eventRest, beat, []);
};
