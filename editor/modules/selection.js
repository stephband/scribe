
function is(a) {
    return (b) => (a === b);
}

export const selection = [];

export function clear(object, point) {
    selection.length = 0;
}

export function select(event) {
    // Check if selected
    if (selection.find(is(event))) { return; }

    // Push new selection object
    selection.push(event);
}

export function deselect(event) {
    // Find index of selected
    const i = selection.indexOf(event);

    // Check if selected
    if (i < 0) { return; }

    // Remove it
    selection.splice(i, 1);
}
