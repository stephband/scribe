

export const rrootname    = /^([A-G])(bb|𝄫|##|𝄪|[b#♭♯])?/u;
export const rpitch       = /^([A-G])(bb|𝄫|##|𝄪|[b#♭♯])?(-?\d)?$/u;
export const rflat        = /b|♭/u;
export const rsharp       = /#|♯/u;
export const rdoubleflat  = /bb|𝄫/u;
export const rdoublesharp = /##|𝄪/u;
export const rflatsharp   = /bb|𝄫|##|𝄪|b|♭|#|♯/gu;
export const raccidental  = /(♮)|(bb|𝄫)|(##|𝄪)|(b|♭)|(#|♯)/gu;

export const accidentalChars = {
    '-2': '𝄫',
    '-1': '♭',
    '0':  '',
    '1':  '♯',
    '2':  '𝄪'
};

const fathercharles = [
    // Father Charles Goes Down And Ends Battle,
    'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯', 'B♯',
    // Battle Ends And Down Goes Charles Father
    'B♭', 'E♭', 'A♭', 'D♭', 'G♭', 'C♭', 'F♭'
];

export function byFatherCharlesPitch(a, b) {
    const ai = fathercharles.indexOf(a.pitch);
    const bi = fathercharles.indexOf(b.pitch);
    return ai > bi ? 1 : ai < bi ? -1 : 0;
}
