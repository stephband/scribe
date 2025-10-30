
import noop from 'fn/noop.js';

const global = globalThis || window;
const colors = {
    'pink':   '#FE267E',
    'grey':   '#81868f'
};

const log = (global.DEBUG && glabel.DEBUG.scribe !== false) ?
    function log($1, $2, $3 = '', $4 = '') {
        console.log('%cScribe %c' + $1 + ' %c' + $2 + ' %c' + $3 + ' %c' + $4,
            'color: ' + (colors.pink) + '; font-weight: 300;',
            'color: ' + (colors.grey) + '; font-weight: 300;',
            'color: ' + (colors.pink) + '; font-weight: 300;',
            'color: ' + (colors.grey) + '; font-weight: 300;',
            'color: ' + (colors.pink) + '; font-weight: 300;'
        );
    } :
    noop ;

export default log;
