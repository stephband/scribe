
import slugify from 'fn/slugify.js';

const { keys } = Object;

export const displays = {
    // Displays are written here in normal score render order, top to bottom
    // TODO transpose not implemented
    'soprano':      { staff: 'treble',      transpose: 0,  },
    'alto':         { staff: 'treble',      transpose: 0,  },
    'tenor':        { staff: 'treble-down', transpose: 0,  },
    'soprano-sax':  { staff: 'treble',      transpose: 2,  },
    'trumpet':      { staff: 'treble',      transpose: 2,  },
    'alto-sax':     { staff: 'treble',      transpose: 9,  },
    'french-horn':  { staff: 'treble',      transpose: 7,  },
    'tenor-sax':    { staff: 'treble',      transpose: 14, },
    'trombone':     { staff: 'bass',        transpose: 0,  },
    'baritone-sax': { staff: 'treble',      transpose: 21, },
    'violin':       { staff: 'treble',      transpose: 0,  },
    'viola':        { staff: 'alto',        transpose: 0,  },
    'cello':        { staff: 'bass',        transpose: 0,  },
    'double-bass':  { staff: 'bass',        transpose: 12, },
    'contrabass':   { staff: 'bass',        transpose: 12, },
    'piano':        { staff: 'grand',       transpose: 0,  },
    'bass':         { staff: 'bass',        transpose: 12, },
    'default':      { staff: 'treble',      transpose: 0,  },
};

const slugs = keys(displays);

export function toDisplay(name) {
    const slug = slugify(name);
    return displays[slug] || displays.default;
}

export function byDisplayOrder(b, a) {
    const aIndex = slugs.indexOf(slugify(a.name));
    const bIndex = slugs.indexOf(slugify(b.name));
        // a is before b
    return aIndex < bIndex ? 1 :
        // a is after b
        aIndex > bIndex ? -1 :
        // a and b are at the same time, prioritise by event type
        0 ;
}
