// When dealing with rounding errors we only really need beat grid-level
// precision, our display grid has 24 slots but we only need to compare the
// smallest possible note values, 32nd notes, or ±1/16 precision
export const P16 = 1/16;
export const P24 = 1/24;
