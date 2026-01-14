
import * as glyphs from "./glyphs.js";

const raccidental = /♮|(bb|𝄫)|(##|𝄪)|(b|♭)|(#|♯)/g;
const htmls = {
    0: `<span class="glyph glyph-natural">${ glyphs.acciNatural }</span>`,
    1: `<span class="glyph glyph-doubleflat">${ glyphs.acciDoubleFlat }</span>`,
    2: `<span class="glyph glyph-doublesharp">${ glyphs.acciDoubleSharp }</span>`,
    3: `<span class="glyph glyph-flat">${ glyphs.acciFlat }</span>`,
    4: `<span class="glyph glyph-sharp">${ glyphs.acciSharp }</span>`
};

function replacer() {
    let n = arguments.length - 2;
    while (n--) if (arguments[n]) return htmls[n];
    return '';
}

export function toHTML(string) {
    return string.replace(raccidental, replacer);
}
