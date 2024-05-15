import get      from '../lib/fn/modules/get.js';
import overload from '../lib/fn/modules/overload.js';
import create   from '../lib/dom/modules/create.js';

const abs = Math.abs;


/* Event ids */

const $id = Symbol('scribe-id');

//const eventMap = {};
let id = 0;

export function identify(event) {
    if (event[$id]) return event[$id];
    event[$id] = (++id + '');
    //eventMap[id] = event;
    return event[$id];
}

export function findEvent(events, id) {
    return events.find((event) => (event[$id] === id));
}


/* Beams */

const beamThickness = 1.1;

function renderBeam(range, stems, beam) {
    return `<path class="beam-path-16th beam-path" d="
        M${ beam[0] },              ${ (-range * beam[0] / (stems.length - 1)) - 0.5 * beamThickness }
        L${ beam[beam.length - 1] },${ (-range * beam[beam.length - 1] / (stems.length - 1)) - 0.5 * beamThickness }
        L${ beam[beam.length - 1] },${ (-range * beam[beam.length - 1] / (stems.length - 1)) + 0.5 * beamThickness }
        L${ beam[0] },              ${ (-range * beam[0] / (stems.length - 1)) + 0.5 * beamThickness }
    Z"></path>`;
}

function create16thNoteBeams(stems, range) {
    const durations = stems.map(get('duration'));
    let html = '';
    let n = -1;
    let beam;

    while (durations[++n]) {
        if (durations[n] < 0.5 && durations[n].toFixed(2) !== '0.33') {
            // Push to existing beam
            if (beam) { beam.push(n); }
            // Or start new beam
            else { beam = [n]; }
        }
        // Render beam
        else if (beam) {
            html += renderBeam(range, stems, beam);
            beam = undefined;
        }
    }

    // Render beam
    if (beam) {
        html += renderBeam(range, stems, beam);
    }

    return html;
}

export default overload(get('type'), {
    // Create clef
    clef: (symbol) => symbol.clef === 'percussion' ?
        undefined :
        create('svg', {
            class:   `${ symbol.clef }-clef clef`,
            viewBox: "0 0.4 5.2 14.6",
            preserveAspectRatio: "none",
            html: `<use x="3.2" y="1" width="8" href="#${ symbol.clef }-clef"></use>`
        }),

    // Create chord symbol
    chord: (symbol) => create('p', {
        class:   "chord",
        data: { beat: symbol.beat + 1, duration: symbol.duration, eventId: identify(symbol.event) },
        html: (() => {
            return symbol.value
            .replace('(♯11)', '<sup class="chord-brackets">(♯11)</sup>')
            .replace('6',   '<sup class="six">6</sup>')
            .replace('7',   '<sup class="seven">7</sup>')
            .replace('9',   '<sup class="nine">9</sup>')
            .replace('maj', '<sub class="tag">maj</sub>')
            .replace('min', '<sub class="tag">min</sub>')
            .replace('alt', '<sub class="tag">alt</sub>')
            .replace('sus', '<sub class="tag">sus</sub>')
            .replace('ø',   '<sup class="halfdim">ø</sup>')
            .replace('♯', '<span class="sharp">♯</span>')
            .replace('♭', '<span class="flat">♭</span>')
            .replace('♮', '<span class="natural">♮</span>');
        })(symbol)
    }),

    timesig: (symbol) => create('header', {
        class: "timesig",
        html: `<p>${ symbol.numerator }</p>
            <p>${ symbol.denominator }</p>`
    }),

    lyric: (symbol) => create('p', {
        class:   "lyric",
        data: { beat: symbol.beat + 1, duration: symbol.duration, eventId: symbol.event },
        html: symbol.value
    }),

    // Create accidental
    acci: (symbol) => create('svg', {
        class:   "acci",
        viewBox: symbol.value === 1 ? "0 -4 2.3 4" :
            symbol.value === -1 ? "0 -4 2 4" :
            "0 -4 1.8 4" ,
        preserveAspectRatio: "xMidYMid slice",
        data: symbol.beat === undefined ?
            { pitch: symbol.pitch } :
            { beat: symbol.beat + 1, pitch: symbol.pitch, part: symbol.part, eventId: identify(symbol.event) } ,
        html: '<use href="#acci-'
            + (symbol.value === 1 ? 'sharp' : symbol.value === -1 ? 'flat' : 'natural')
            + '"></use>'
    }),

    // Create note head
    upledger: (symbol) => create('svg', {
        class:   "up-ledge ledge",
        viewBox: `0 ${ 0.5 - symbol.rows } 4.4 ${ symbol.rows }`,
        preserveAspectRatio: "xMidYMax",
        data:    { beat: symbol.beat + 1, pitch: symbol.pitch, part: symbol.part },
        style:   `height: calc(${ symbol.rows } * var(--y-size));`,
        html:    '<use x="0" y="-8" href="#ledges"></use>'
    }),

    downledger: (symbol) => create('svg', {
        class:   "down-ledge ledge",
        viewBox: `0 -0.5 4.4 ${ symbol.rows }`,
        preserveAspectRatio: "xMidYMin",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, part: symbol.part },
        style:   `height: calc(${ symbol.rows } * var(--y-size));`,
        html: '<use x="0" y="-8" href="#ledges"></use>'
    }),

    // Create note head
    head: (symbol) => create('svg', {
        class:   "head",
        viewBox: "0 -1 2.7 2",
        preserveAspectRatio: "xMidYMid slice",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration, part: symbol.part, eventId: identify(symbol.event) },
        html: `<use href="#${ symbol.head || `head[${ symbol.duration }]` }"></use>`
    }),

    // Create note stem
    stem: (symbol) => create('svg', {
        class:   `${ symbol.stemDirection }-stem stem`,
        viewBox: "0 0 2.7 7",
        // Stretch stems by height
        preserveAspectRatio: "none",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration, part: symbol.part },
        style: `--beam-y: ${ symbol.beamY === undefined ? 0 : symbol.beamY };`,
        html: '<use href="#stem' + symbol.stemDirection + '"></use>'
    }),

    // Create note beam
    beam: (symbol) => create('svg', {
        // Beam is sloped down
        class:   `${ symbol.updown }-beam beam`,
        viewBox: `0 ${ (symbol.range > 0 ? -symbol.range : 0) - 0.5 } ${ symbol.stems.length -1 } ${ abs(symbol.range) + 1 }`,
        preserveAspectRatio: "none",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration, part: symbol.part },
        /*style: 'grid-row-end: span ' + Math.ceil(1 - symbol.range),*/
        style: `height: calc(${ abs(symbol.range) + 1 } * var(--y-size)); align-self: ${ symbol.range > 0 ? 'end' : 'start' };`,
        html: `
            <path class="beam-path" d="M0,${ -0.5 * beamThickness } L${ symbol.stems.length - 1 },${ -symbol.range - 0.5 * beamThickness } L${ symbol.stems.length - 1 },${ -symbol.range + 0.5 * beamThickness } L0,${ 0.5 * beamThickness } Z"></path>
            ${ create16thNoteBeams(symbol.stems, symbol.range) }
        `
    }),

    // Create note beam
    tie: (symbol) => create('svg', {
        // Beam is sloped down
        class:   `${ symbol.updown }-tie tie`,
        viewBox: `0 0 1 1`,
        preserveAspectRatio: "none",
        data:    { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration, part: symbol.part },
        /*style: 'grid-row-end: span ' + symbol.duration / 24 + ';' */
        style:   `height: calc(6 * var(--y-size)); align-self: ${ symbol.updown === 'up' ? 'end' : 'start' };`,
        html:    `<use href="#tie"></use>`
    }),

    // Create note tail
    tail: (symbol) => create('svg', {
        class: `${ symbol.stemDirection }-tail tail`,
        viewBox: "0 -1 2.7 2",
        preserveAspectRatio: "xMidYMid",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration, part: symbol.part, eventId: identify(symbol.event) },
        html: '<use href="#tail' + symbol.stemDirection + '[' + symbol.duration + ']"></use>'
    }),

    // Create rest
    rest: (symbol) => create('svg', {
        class: "rest",
        viewBox:
            symbol.duration === 0.125 ? "0 -4 3.0 8" :
            symbol.duration === 0.25  ? "0 -4 2.8 8" :
            symbol.duration === 0.375 ? "0 -4 3.8 8" :
            symbol.duration === 0.5   ? "0 -4 2.6 8" :
            symbol.duration === 0.75  ? "-0.2 -4 3.6 8" :
            symbol.duration === 1     ? "0 -4 2.6 8" :
            symbol.duration === 1.5   ? "0 -4 3.5 8" :
            symbol.duration === 2     ? "0 -4 2.6 8" :
            symbol.duration === 3     ? "0 -4 2.6 8" :
            symbol.duration === 4     ? "0 -4 2.6 8" :
            symbol.duration === 6     ? "0 -4 2.6 8" :
            "0 -4 2.6 8" ,
        preserveAspectRatio: "xMidYMid slice",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration, part: symbol.part },
        html: '<use href="#rest[' + symbol.duration + ']"></use>'
    }),

    default: (function(types) {
        return function(symbol) {
            if (types[symbol.type]) return;
            types[symbol.type] = true;
            console.log(symbol);
            console.error('Scribe: symbol type "' + symbol.type + '" not rendered');
        };
    })({})
});
