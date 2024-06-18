
export const trebleClef      = '&#xE050;';
export const trebleDownClef  = '&#xE052;';
export const trebleUpClef    = '&#xE053;';
export const altoClef        = '&#xE05C;';
export const bassClef        = '&#xE062;';
export const drumClef        = '&#xE069;';
export const percussionClef  = '&#xE069;';

export const timeSig0         = '&#xE080;';
export const timeSig1         = '&#xE081;';
export const timeSig2         = '&#xE082;';
export const timeSig3         = '&#xE083;';
export const timeSig4         = '&#xE084;';
export const timeSig5         = '&#xE085;';
export const timeSig6         = '&#xE086;';
export const timeSig7         = '&#xE087;';
export const timeSig8         = '&#xE088;';
export const timeSig9         = '&#xE089;';
export const timeSigCommon    = '&#xE08A;';
export const timeSigCutCommon = '&#xE08B;';

export const acciDoubleFlat  = '&#xE264;';
export const acciFlat        = '&#xE260;';
export const acciNatural     = '&#xE261;';
export const acciSharp       = '&#xE262;';
export const acciDoubleSharp = '&#xE263;';
export const acciParensLeft  = '&#xE26A;';
export const acciParensRight = '&#xE26B;';

// https://w3c.github.io/smufl/latest/tables/noteheads.html
export const head1                   = '&#xE0A4;';
export const head2                   = '&#xE0A3;';
export const head4                   = '&#xE0A2;';
export const headBracketLeft         = '&#xE0F5;';
export const headBracketRight        = '&#xE0F6;';
export const headSlashed2            = '&#xE0D0;';
export const headDiamond             = '&#xE0DB;';
export const headDiamondWide         = '&#xE0DC;';
export const headX                   = '&#xE0A9;';
export const headPlus                = '&#xE0AF;';
export const headCircle              = '&#xE0E8;';
export const headCircleX             = '&#xE0B3;';
export const headTriangleUp          = '&#xE0BE;';
export const headSlashVerticalEnds   = '&#xE100;';
export const headSlashHorizontalEnds = '&#xE101;';

export const graceNoteStemUp   = '&#xE560;';
export const graceNoteStemDown = '&#xE561;';

export const tailUp05     = '&#xE240;'
export const tailDown05   = '&#xE241;'
export const tailUp025    = '&#xE242;'
export const tailDown025  = '&#xE243;'
export const tailUp0125   = '&#xE244;'
export const tailDown0125 = '&#xE245;'

// 200A is a unicode HAIR SPACE, it's needed to seperate rest from dot in Jazz.
// TODO: do other fonts need it tho?
export const rest0125  = '&#xE4E8;';
export const rest01875 = '&#xE4E8;&#xE1E7;';
export const rest025   = '&#xE4E7;';
export const rest0375  = '&#xE4E7;&#xE1E7;';
export const rest05    = '&#xE4E6;';
export const rest075   = '&#xE4E6;&#xE1E7;';
export const rest1     = '&#xE4E5;';
export const rest15    = '&#xE4E5;&#x200A;&#xE1E7;';
export const rest2     = '&#xE4E4;';
export const rest3     = '&#xE4E4;&#x200A;&#xE1E7;';
export const rest4     = '&#xE4E3;';
export const rest6     = '&#xE4E3;&#x200A;&#xE1E7;';

export const chordDiminished      = '&#xE870;';
export const chordHalfDiminished  = '&#xE871;';
export const chordAugmented       = '&#xE872;';
export const chordMajorSeventh    = '&#xE873;';
export const chordMinor           = '&#xE874;';
export const chordParensLeftTall  = '&#xE875;';
export const chordParensRightTall = '&#xE876;';
export const chordBracketLeft     = '(';
export const chordBracketRight    = ')';
export const chordBassSlash       = '&#xE87B;';

export const chordGlyphs = {
    "∆♯11": "\uE873\uED6211",
    "∆": "\uE873",
    "7": "7",
    "-7": "\uE8747",
    "-♭6": "\uE874\uED606",
    "7sus♭9": "7sus\uED62",
    "ø": "\uE871",
    "7♯11": "7\uED6211",
    "-∆": "\uE874\uE873",
    "∆♭6": "\uE873\uED606",
    "-♭9": "\uE874\uED609",
    "ø7": "\uE8717",
    "∆♯5": "\uE873\uED625",
    "7alt": "7alt",
    "°": "\uE870",
    "7♭9": "7\uED60",
    "+7": "\uE8727",
};
