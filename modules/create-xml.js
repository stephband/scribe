
import get              from 'fn/get.js';
import overload         from 'fn/overload.js';
import { toNoteNumber, toDrumName } from 'midi/note.js';
import { toRootName, toRootNumber } from 'midi/note.js';


/**
Constants
**/

const rpitch = /^([A-G])([♯♭#b]*)(-?\d+)$/;

const clefData = {
    'treble':      { sign: 'G', line: 2 },
    'treble-up':   { sign: 'G', line: 2 },
    'treble-down': { sign: 'G', line: 2 },
    'alto':        { sign: 'C', line: 3 },
    'bass':        { sign: 'F', line: 4 },
    'percussion':  { sign: 'percussion' },
    'drum':        { sign: 'percussion' }
};

const noteTypeMap = {
    4:    'whole',       // 4 beats = whole note
    3:    'half',        // dotted half = 3 beats
    2:    'half',        // 2 beats = half note
    1.5:  'quarter',     // dotted quarter = 1.5 beats
    1:    'quarter',     // 1 beat = quarter note
    0.75: 'eighth',      // dotted eighth = 0.75 beats
    0.5:  'eighth',      // 0.5 beats = eighth note
    0.375: '16th',       // dotted 16th = 0.375 beats
    0.25: '16th',        // 0.25 beats = 16th note
    0.125: '32nd',       // 0.125 beats = 32nd note
    0.0625: '64th'       // 0.0625 beats = 64th note
};


/**
Helpers
**/

function parsePitch(pitch) {
    const match = rpitch.exec(pitch);
    if (!match) {
        console.warn('create-xml: Could not parse pitch "' + pitch + '"');
        return { step: 'C', alter: 0, octave: 4 };
    }

    const step = match[1];
    const accidentals = match[2];
    const octave = match[3];

    // Count sharps and flats
    let alter = 0;
    if (accidentals) {
        alter += (accidentals.match(/[♯#]/g) || []).length;
        alter -= (accidentals.match(/[♭b]/g) || []).length;
    }

    return { step, alter, octave };
}

function getNoteType(duration) {
    // Find closest match
    return noteTypeMap[duration] || 'quarter';
}

function isDotted(duration) {
    // Check if duration is 1.5x a power of 2 (dotted note)
    // Dotted notes: 3 (1.5*2), 1.5 (1.5*1), 0.75 (1.5*0.5), 0.375 (1.5*0.25), etc.
    const base = duration / 1.5;
    // Check if base is a power of 2: 1, 2, 4, 0.5, 0.25, 0.125, etc.
    if (base <= 0) return false;
    // For powers of 2, log2(base) should be an integer
    const log2 = Math.log2(base);
    return Math.abs(log2 - Math.round(log2)) < 0.0001;
}

function keyNumberToFifths(keyNumber) {
    // Key number in Scribe is on circle of fifths where C=0
    // MusicXML fifths: -7 to 7 (flats negative, sharps positive)
    return keyNumber;
}

function escapeXML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}


/**
createXML(symbol, divisions)
Creates MusicXML element string from a symbol object. The `divisions` parameter
specifies divisions per quarter note for duration calculations.
**/

export default overload(get('type'), {
    clef: (symbol, divisions, staveType) => {
        const clef = clefData[symbol.clef] || { sign: 'G', line: 2 };
        return clef.sign === 'percussion' ?
            `    <clef>
      <sign>percussion</sign>
    </clef>
` :
            `    <clef>
      <sign>${ clef.sign }</sign>
      <line>${ clef.line }</line>
    </clef>
`;
    },

    timesig: (symbol, divisions) => {
        return `    <time>
      <beats>${ symbol.numerator }</beats>
      <beat-type>${ symbol.denominator }</beat-type>
    </time>
`;
    },

    chord: (symbol, divisions) => {
        // Chord symbols become <harmony> elements
        const root = symbol.root.replace(/[♯#]/g, '').replace(/[♭b]/g, '');
        const alter = (symbol.root.match(/[♯#]/g) || []).length - (symbol.root.match(/[♭b]/g) || []).length;

        // Map extension to kind
        let kind = 'major';
        const ext = symbol.extension || '';
        if (ext.includes('-7') || ext.includes('m7')) kind = 'minor-seventh';
        else if (ext.includes('-') || ext.includes('m')) kind = 'minor';
        else if (ext.includes('7')) kind = 'dominant';
        else if (ext.includes('∆') || ext.includes('maj7')) kind = 'major-seventh';
        else if (ext.includes('dim')) kind = 'diminished';
        else if (ext.includes('aug') || ext.includes('+')) kind = 'augmented';
        else if (ext.includes('ø')) kind = 'half-diminished';

        const bassXML = symbol.bass ? `    <bass>
      <bass-step>${ symbol.bass.replace(/[♯#♭b]/g, '') }</bass-step>${
        ((symbol.bass.match(/[♯#]/g) || []).length - (symbol.bass.match(/[♭b]/g) || []).length) !== 0 ?
        `\n      <bass-alter>${ (symbol.bass.match(/[♯#]/g) || []).length - (symbol.bass.match(/[♭b]/g) || []).length }</bass-alter>` : ''
      }
    </bass>
` : '';

        return `  <harmony>
    <root>
      <root-step>${ root }</root-step>${ alter !== 0 ? `\n      <root-alter>${ alter }</root-alter>` : '' }
    </root>
    <kind>${ kind }</kind>
${ bassXML }  </harmony>
`;
    },

    note: (symbol, divisions, staveType) => {
        const { step, alter, octave } = parsePitch(symbol.pitch);
        const duration = Math.round(symbol.duration * divisions);
        const quarterNotes = symbol.duration;
        const type = getNoteType(quarterNotes);
        const dotted = isDotted(quarterNotes);

        // For drum staves, use unpitched notation with display-step/octave
        if (staveType === 'drum' || staveType === 'percussion') {
            const drumName = toDrumName(symbol.pitch);
            return `  <note${drumName ? ` print-object="no"` : '' }>
    <unpitched>
      <display-step>${ step }</display-step>
      <display-octave>${ octave }</display-octave>
    </unpitched>
    <duration>${ duration }</duration>
    <type>${ type }</type>${ dotted ? '\n    <dot/>' : '' }
    <stem>${ symbol.stemup ? 'up' : 'down' }</stem>${drumName ? `\n    <notehead>${ drumName }</notehead>` : '' }
  </note>
`;
        }

        return `  <note>
    <pitch>
      <step>${ step }</step>${ alter !== 0 ? `\n      <alter>${ alter }</alter>` : '' }
      <octave>${ octave }</octave>
    </pitch>
    <duration>${ duration }</duration>
    <type>${ type }</type>${ dotted ? '\n    <dot/>' : '' }
    <stem>${ symbol.stemup ? 'up' : 'down' }</stem>
  </note>
`;
    },

    rest: (symbol, divisions) => {
        const duration = Math.round(symbol.duration * divisions);
        const quarterNotes = symbol.duration;
        const type = getNoteType(quarterNotes);
        const dotted = isDotted(quarterNotes);

        return `  <note>
    <rest/>
    <duration>${ duration }</duration>
    <type>${ type }</type>${ dotted ? '\n    <dot/>' : '' }
  </note>
`;
    },

    barrepeat: (symbol, divisions) => {
        // MusicXML measure-repeat for bar repeat symbols
        const duration = Math.round(symbol.duration * divisions);
        return `  <note>
    <rest measure="yes"/>
    <duration>${ duration }</duration>
  </note>
  <direction placement="above">
    <direction-type>
      <measure-repeat type="start" slashes="${ symbol.count || 1 }"/>
    </direction-type>
  </direction>
`;
    },

    text: (symbol, divisions) => {
        // Lyrics or text annotations
        return `  <!-- text: ${ escapeXML(symbol.value) } -->
`;
    },

    // Symbols we skip for now
    acci: () => '',
    accent: () => '',
    ledge: () => '',
    beam: () => '',
    tie: () => '',
    tuplet: () => '',
    symbolcoda: () => '',
    barcount: () => '',

    default: (function (types) {
        return function (symbol) {
            if (types[symbol.type]) return '';
            types[symbol.type] = true;
            console.warn('create-xml: symbol type "' + symbol.type + '" not rendered');
            return '';
        };
    })({})
});
