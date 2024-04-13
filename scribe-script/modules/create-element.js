import get      from '../../../fn/modules/get.js';
import overload from '../../../fn/modules/overload.js';
import create   from '../../../dom/modules/create.js';

const abs = Math.abs;

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
    // Create chord symbol
    chord: (symbol) => create('p', {
        class:   "chord",
        data: { beat: symbol.beat + 1, duration: symbol.duration },
        html: symbol.value.replace('(♯11)', '<sup class="chord-brackets">(♯11)</sup>')
    }),

    // Create accidental
    acci: (symbol) => create('svg', {
        class:   "acci",
        viewBox: symbol.value === 1 ? "0 -4 2.3 4" :
            symbol.value === -1 ? "0 -4 2 4" :
            "0 -4 1.8 4" ,
        preserveAspectRatio: "xMidYMid slice",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch },
        html: '<use href="#acci-'
            + (symbol.value === 1 ? 'sharp' : symbol.value === -1 ? 'flat' : 'natural')
            + '"></use>'
    }),

    // Create note head
    head: (symbol) => create('svg', {
        class:   "head",
        viewBox: "0 -1 2.7 2",
        preserveAspectRatio: "xMidYMid slice",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration/*, tie: symbol.tie*/ },
        html: '<use href="#head[' + symbol.duration + ']"></use>'
    }),

    // Create note stem
    stem: (symbol) => create('svg', {
        class:   `${ symbol.value }-stem stem`,
        viewBox: "0 0 2.7 7",
        // Stretch stems by height
        preserveAspectRatio: "none",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration },
        style: `--beam-y: ${ symbol.beamY === undefined ? 0 : symbol.beamY };`,
        html: '<use href="#stem' + symbol.value + '"></use>'
    }),

    // Create note beam
    beam: (symbol) => create('svg', {
        // Beam is sloped down
        class:   `${ symbol.updown }-beam beam`,
        viewBox: `0 ${ (symbol.range > 0 ? -symbol.range : 0) - 0.5 } ${ symbol.stems.length -1 } ${ abs(symbol.range) + 1 }`,
        preserveAspectRatio: "none",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration },
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
        data:    { beat: symbol.beat + 1 + (1/ 24), pitch: symbol.pitch, duration: symbol.duration },
        /*style: 'grid-row-end: span ' + symbol.duration / 24 + ';' */
        style:   `height: calc(6 * var(--y-size)); align-self: ${ symbol.updown === 'up' ? 'end' : 'start' };`,
        html:    `<use href="#tie"></use>`
    }),

    // Create note tail
    tail: (symbol) => create('svg', {
        class:   "tail",
        viewBox: "0 -1 2.7 2",
        preserveAspectRatio: "xMidYMid",
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration },
        html: '<use href="#tail' + symbol.value + '[' + symbol.duration + ']"></use>'
    }),

    // Create rest
    rest: (symbol) => create('svg', {
        class:   "rest",
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
        data: { beat: symbol.beat + 1, pitch: symbol.pitch, duration: symbol.duration },
        html: '<use href="#rest[' + symbol.duration + ']"></use>'
    }),

    default: function(symbol) {
        console.log(symbol);
        console.error('Scribe: symbol type "' + symbol.type + '" not rendered');
    }
});
