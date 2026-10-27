
import slugify from 'fn/slugify.js';

export const displays = {
    // Vocals
    'soprano':      { staff: 'treble',      transpose: 0 },
    'alto':         { staff: 'treble',      transpose: 0 },
    'tenor':        { staff: 'treble-down', transpose: 0 },
    // Brass and Saxes
    'soprano-sax':  { staff: 'treble',      transpose: 2 },
    'trumpet':      { staff: 'treble',      transpose: 2 },
    'alto-sax':     { staff: 'treble',      transpose: 9 },
    'french-horn':  { staff: 'treble',      transpose: 7 },
    'tenor-sax':    { staff: 'treble',      transpose: 14 },
    'trombone':     { staff: 'bass',        transpose: 0 },
    'baritone-sax': { staff: 'treble',      transpose: 21 },
    // Strings
    'violin':       { staff: 'treble',      transpose: 0 },
    'viola':        { staff: 'alto',        transpose: 0 },
    'cello':        { staff: 'bass',        transpose: 0 },
    'double-bass':  { staff: 'bass',        transpose: 12 },
    'contrabass':   { staff: 'bass',        transpose: 12 },
    // Keys
    'piano':        { staff: 'grand',       transpose: 0 },
    // Bass
    'bass':         { staff: 'bass',        transpose: 12 },
    // Default
    'default':      { staff: 'treble',      transpose: 0 },
};

export function toDisplay(name) {
    const slug = slugify(name);
    return displays[slug] || displays.default;
}
