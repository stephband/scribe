
import cache          from 'fn/cache-by-key.js';
import overload       from 'fn/overload.js';
import { requestGet } from 'dom/request.js';
import parse          from './parse.js';

const requestData = cache(requestGet);
const rpath       = /^\.*\/|^https?:\/\//;

/**
requestData(type, url)
**/

export default overload((type, value) => typeof value, {
    string: function(type, url) {
        if (window.DEBUG && !rpath.test(url)) {
            throw new TypeError('URL not supported "' + url + '"');
        }

        return requestData(url)
        .then((source) => parse(type, source))
        .catch((error) => console.error(error));
    },

    default: function(name, internals, type, value) {
        internals[name] = value;
    }
});
