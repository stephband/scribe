
export const clefTreble      = '&#xE050;';
export const clefTrebleDown  = '&#xE052;';
export const clefTrebleUp    = '&#xE053;';
export const clefAlto        = '&#xE05C;';
export const clefBass        = '&#xE062;';
export const clefDrum        = '&#xE069;';
export const clefPercussion  = '&#xE069;';

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

// https://w3c.github.io/smufl/latest/tables/individual-notes.html
export const note2Up      = '&#xE1D3;';
export const note1Up      = '&#xE1D5;';
export const note05Up     = '&#xE1D7;';
export const note025Up    = '&#xE1D9;';
export const note0125Up   = '&#xE1DB;';
export const note2Down    = '&#xE1D4;';
export const note1Down    = '&#xE1D6;';
export const note05Down   = '&#xE1D8;';
export const note025Down  = '&#xE1DA;';
export const note0125Down = '&#xE1DC;';
export const augmentationDot = '&#xE1E7;';

// https://w3c.github.io/smufl/latest/tables/metronome-marks.html
export const metNote2Up    = '&#xECA3;';
export const metNote1Up    = '&#xECA5;';
export const metNote05Up   = '&#xECA7;';
export const metNote2Down  = '&#xECA4;';
export const metNote1Down  = '&#xECA6;';
export const metNote05Down = '&#xECA8;';
export const metDot        = '&#xECB7;';

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

// These are only supported in Bravura, Petaluma font...
/*export const braceBegin = '&#xE000';
export const braceEnd   = '&#xE001';
export const bracket    = '&#xE002';
export const bracketTop       = '&#xE003';
export const bracketBottom    = '&#xE004';
export const bracketEndTop    = '&#xE005';
export const bracketEndBottom = '&#xE006';*/

export const barLine    = '&#xE030';
export const barRepeat1 = '&#xE500;';
export const barRepeat2 = '&#xE501;';
export const barRepeat4 = '&#xE502;';
export const barRepeatSlash = '&#xE504;';
export const barRepeatUpperDot = '&#xE503;';
export const barRepeatLowerDot = '&#xE505;';

// These are only supported in Bravura, Leipzig, Petaluma...
/*export const barLineDouble = '&#xE031';
export const barLineEnd    = '&#xE032';
export const barLineBegin  = '&#xE033';
export const barLineHeavy  = '&#xE034';*/
// Not supported by Ash, Broadway, use a fallback font with support
export const barRepeatBegin = '&#xE040';
export const barRepeatEnd   = '&#xE041';
export const barRepeatEndBegin = '&#xE042';
export const barRepeatDots = '&#xE043';

export const coda = '&#xE048';

export const tuplet0   = '&#xE880;';
export const tuplet1   = '&#xE881;';
export const tuplet2   = '&#xE882;';
export const tuplet3   = '&#xE883;';
export const tuplet4   = '&#xE884;';
export const tuplet5   = '&#xE885;';
export const tuplet6   = '&#xE886;';
export const tuplet7   = '&#xE887;';
export const tuplet8   = '&#xE888;';
export const tuplet9   = '&#xE889;';

// Not supported by any font
/*export const beamBegin   = '&#xE8E0;';
export const beamEnd     = '&#xE8E1;';
export const tieBegin    = '&#xE8E2;';
export const tieEnd      = '&#xE8E3;';
export const slurBegin   = '&#xE8E4;';
export const slurEnd     = '&#xE8E5;';
export const phraseBegin = '&#xE8E6;';
export const phraseEnd   = '&#xE8E7;';*/

export const chordDiminished      = '&#xE870;';
// Not supported in Jazz, Ash, Broadway, Leipzig
/*export const chordDiminishedSmall = '&#xF4D8;';*/
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
    "dim": "\uE870",
    "7♭9": "7\uED60",
    "+7": "\uE8727",
};

/* These glyphs are not aligned to centted baseline as other musical symbols
   are - these are intended for use in paragraph text content */

export const textNoteShort        = '&#xE1F0;';
export const textNoteLong         = '&#xE1F1;';
export const textNote8Short       = '&#xE1F2;';
export const textNote8Long        = '&#xE1F3;';
export const textNote16Short      = '&#xE1F4;';
export const textNote16Long       = '&#xE1F5;';
export const textBeam8Short       = '&#xE1F7;';
export const textBeam8Long        = '&#xE1F8;';
export const textBeam16Short      = '&#xE1F9;';
export const textBeam16Long       = '&#xE1FA;';
export const textDot              = '&#xE1FC;';
export const textTie              = '&#xE1FD;';
export const textTupletBeginShort = '&#xE1FE';
export const textTuplet3Short     = '&#xE1FF';
export const textTupletEndShort   = '&#xE200';
export const textTupletBeginLong  = '&#xE201';
export const textTuplet3Long      = '&#xE202';
export const textTupletEndLong    = '&#xE203';



