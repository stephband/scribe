import { children, get } from '../../dom/module.js';

var template = get('scribe-symbols');
var symbols = children(template.content).reduce(function(symbols, node) {
    symbols[node.id.replace('scribe-', '')] = node;
    node.removeAttribute('id');
    return symbols;
}, {});

export default symbols;
