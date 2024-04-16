/**
requestData(url)
**/

import cache            from '../../fn/modules/cache-by-key.js';
import overload         from '../../fn/modules/overload.js';
import { requestGet }   from '../../dom/modules/request.js';

const requestData = cache(requestGet);
const rpath       = /^\.*\/|^https?:\/\//;

export default overload((name, internals, value) => typeof value, {
    string: function(name, internals, value) {
        if (rpath.test(value)) {
            requestData(value)
            .then((data) => internals[name].value = data)
            .catch((error) => console.error(error));
            return;
        }

        //internals[name].value = JSON.parse(value);
    },

    default: function(name, internals, value) {
        internals[name] = value;
    }
});
