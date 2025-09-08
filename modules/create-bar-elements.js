
/**
createBarElements(symbols)
Returns an array of bar elements each populated with symbol elements.
**/


import create              from 'dom/create.js';
import createSymbolElement from './create-symbol-element.js';


function toElements(nodes, symbol) {
    const element = createSymbolElement(symbol);
    if (element) { nodes.push(element); }
    return nodes;
}

function toBarElements(elements, bar) {
    elements.push(create('div', {
        class: `${ bar.stave.type }-stave stave bar`,
        data: { beat: bar.beat, duration: bar.duration },
        children: bar.symbols.reduce(toElements, [])
    }));

    return elements;
}

export default function createBarElements(symbols) {
    return symbols.reduce(toBarElements, []);
}
