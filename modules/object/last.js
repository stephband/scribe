import lengthOf from './length-of.js';

export default function join(object) {
    return object[lengthOf(object) - 1];
}
