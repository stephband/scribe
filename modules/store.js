
const map = new WeakMap();

export function store(key, data) {
    return map.set(key, data);
}

export function retrieve(key) {
    return map.get(key);
}

export default map;
