export function link(a, b) {
    b.prev = a;
    return a.next = b;
}

export function unlink(b) {
    const a = b.prev;
    const c = b.next;
    b.prev = null;
    a.next = c;
    // If b[next] is not null it now should be
    if (c) {
        b.next = null;
        c.prev = a;
    }
    // And if it is it must have been the tail of the list.
    //else {
    //    b.constructor[tail] = a;
    //}
}
