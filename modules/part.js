
import slugify from 'fn/slugify.js';
import Stave   from './stave.js';

const defaultRouting = { 0: 0 };

export default class Part {
    constructor(name, stave, transpose = 0, routing = defaultRouting) {
        if (typeof name !== 'string') throw new TypeError(`Part() requires a name`);
        if (!stave || typeof stave !== 'object') throw new TypeError(`Part() requires a Stave object ${ stave }`);

        this.stave     = stave;
        this.staff     = stave.type;
        this.name      = name;
        this.transpose = transpose;
        this.routing   = routing;
    }

    static from(data) {
        const name     = data.name || '';
        const slug     = slugify(name);
        const template = Part[slug];
        const stave    = typeof data.stave === 'object' && data.stave
            || Stave[data.stave || data.staff]
            || template?.stave
            || Stave.treble;

        const transpose = data.transpose || template?.transpose;

        return new Part(name, stave, transpose, data.routing);
    }

    toJSON() {
        const { stave, staff, ...data } = this;
        data.stave = stave.type;
        return data;
    }
}

Part['soprano']      = new Part('Soprano',      Stave.treble,      0 );
Part['alto']         = new Part('Alto',         Stave.treble,      0 );
Part['tenor']        = new Part('Tenor',        Stave['treble-down'], 0 );
Part['soprano-sax']  = new Part('Soprano sax',  Stave.treble,      2 );
Part['trumpet']      = new Part('Trumpet',      Stave.treble,      2 );
Part['alto-sax']     = new Part('Alto Sax',     Stave.treble,      9 );
Part['french-horn']  = new Part('French horn',  Stave.treble,      7 );
Part['tenor-sax']    = new Part('Tenor sax',    Stave.treble,      14);
Part['trombone']     = new Part('Trombone',     Stave.bass,        0 );
Part['baritone-sax'] = new Part('Baritone sax', Stave.treble,      21);
Part['violin']       = new Part('Violin',       Stave.treble,      0 );
Part['viola']        = new Part('Viola',        Stave.alto,        0 );
Part['cello']        = new Part('Cello',        Stave.bass,        0 );
Part['double-bass']  = new Part('Double bass',  Stave.bass,        12);
Part['contrabass']   = new Part('Contrabass',   Stave.bass,        12);
Part['piano']        = new Part('Piano',        Stave.grand,       0 );
Part['bass']         = new Part('Bass',         Stave.bass,        12);
Part['cowbell']      = new Part('Cowbell',      Stave.percussion);
Part['drums']        = new Part('Drums',        Stave.drum);
