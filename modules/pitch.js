

export const rrootname    = /^([A-G])([b#♭♯𝄫𝄪])?/;
export const rpitch       = /^([A-G])([b#♭♯𝄫𝄪])?(-?\d)?$/;
export const rflat        = /b|♭/;
export const rsharp       = /#|♯/;
export const rdoubleflat  = /bb|𝄫/;
export const rdoublesharp = /##|𝄪/;
export const rflatsharp   = /b|♭|#|♯/g;
export const raccidental  = /(♮)|(bb|𝄫)|(##|𝄪)|(b|♭)|(#|♯)/g;

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
