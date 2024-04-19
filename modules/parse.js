import parseABC          from './parse/parse-abc.js';
import parseSequenceText from './parse/parse-sequence-text.js';


/* Parse data
  (TODO: Yeah, API requests need tidied up) */

function fromGist(gist) {
    // Get first file
    const file = gist.files[Object.keys(gist.files)[0]];
    return parseSource(file.type, file.content);
}

function fromTheSession(object) {
    // Get first file
    const song = object.settings.find(matches({ id: 13324 })) || object.settings[0];
    return parseSource('abc', song.abc);
}

export default function parseSource(type, source) {
    // source is an object
    if (typeof source === 'object') {
        // source is json from api.github.com/gists/
        return source.files ? fromGist(source) :
        // source is from thesession.org
        source.settings ? fromTheSession() :
        // source is an events array
        Array.isArray(source) ? { id: 0, events: source } :
        // source is a sequence object
        source ;
    }
    // Data is ABC
    else if (type === 'abc' || type === 'text/x-abc') {
        // Strip space following line breaks
        const music = parseABC(source.replace(/\n\s+/g, '\n'));
        return music.sequences[0];
    }
    // Data is step sequence text
    else if (type === 'sequence' || type === 'text/plain') {
        return { events: parseSequenceText(source) };
    }
    // Data is JSON
    else {
        const events = JSON.parse(source);
        return Array.isArray(events) ?
            { id: 0, events } :
            events ;
    }
}
