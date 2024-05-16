
const rtimesig = /^(\d+)\/(\d+)$/;

export function timesigToMeter(string) {
    const groups = rtimesig.exec(string);
    const num = parseInt(groups[1], 10);
    const div = 4 / parseInt(groups[2], 10);
    // Returns an object that can be assigned to a meter event
    return { 1: 'meter', 2: num * div, 3: div };
}

export function meterToTimesig(meter) {
    const dur = meter[2];
    const div = meter[3];
    const num = dur / div;
    const den = 4 / div;
    return num + '/' + den;
}
