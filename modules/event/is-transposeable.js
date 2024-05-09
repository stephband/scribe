const types = ['note', 'chord', 'key'];

export default function isTransposeable(event) {
    return types.includes(event[1]);
}
