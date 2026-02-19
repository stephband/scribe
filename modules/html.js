
import * as glyphs from "./glyphs.js";

const raccidental = /♮|(bb|𝄫)|(##|𝄪)|(b|♭)|(#|♯)|(∆)|(-)|(ø)|(°)|(\+)|(\d+)/g;
const htmls = {
    0: `<span class="glyph glyph-natural">${ glyphs.acciNatural }</span>`,
    1: `<span class="glyph glyph-doubleflat">${ glyphs.acciDoubleFlat }</span>`,
    2: `<span class="glyph glyph-doublesharp">${ glyphs.acciDoubleSharp }</span>`,
    3: `<span class="glyph glyph-flat">${ glyphs.acciFlat }</span>`,
    4: `<span class="glyph glyph-sharp">${ glyphs.acciSharp }</span>`,
    5: `<span class="glyph glyph-major">∆</span>`,
    6: `<span class="glyph glyph-minor">-</span>`,
    7: `<span class="glyph glyph-halfdim">ø</span>`,
    8: `<span class="glyph glyph-dim">°</span>`,
    9: `<span class="glyph glyph-aug">+</span>`
};

function replacer() {
    let n = arguments.length - 2;
    // Numbers
    if (arguments[--n]) return `<span class="glyph glyph-number">${ arguments[n] }</span>`;
    // Symbols
    while (n--) if (arguments[n]) return htmls[n];
    // Unmatched
    return '';
}

export function toHTML(string) {
    return string.replace(raccidental, replacer);
}
