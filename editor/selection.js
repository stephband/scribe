
export const selection = [];

function is(a) {
    return (b) => (a === b);
}

export function clear(object, point) {
    selection.length = 0;
    document.body.classList.remove('selection');
}

export function select(object) {
    if (!object) throw new Error('Cant select nothing');

    // Check if selected
    if (selection.includes(object)) { return; }

    if (selection.length === 0) document.body.classList.add('selection');

    // Push new selection object
    selection.push(object);
}

export function deselect(object) {
    // Find index of selected
    const i = selection.indexOf(object);

    // Check if selected
    if (i < 0) return;

    // Remove it
    selection.splice(i, 1);

    if (selection.length === 0) document.body.classList.remove('selection');
}
