
/* Returns number as string truncated to at most n decimal places with
   no trailing zeros. */

export default function truncate(n, number) {
    return number.toFixed(n).replace(/\.?0+$/, '');
}
