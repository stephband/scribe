
import Data          from 'fn/data.js';
import Event         from 'sequence/modules/event/event.js';
import ChordEvent    from 'sequence/modules/event/chord.js';
import KeyEvent      from 'sequence/modules/event/key.js';
import MeterEvent    from 'sequence/modules/event/meter.js';
import NoteEvent     from 'sequence/modules/event/note.js';
import ControlEvent  from 'sequence/modules/event/control.js';
import RateEvent     from 'sequence/modules/event/rate.js';
import SequenceEvent from 'sequence/modules/event/sequence.js';
import TextEvent     from 'sequence/modules/event/text.js';

// Define reactive options for Data proxies of events
Data.define(Event,               { enumerables: true, computed: ['beat', 'type'] });
Data.define(ChordEvent,    { enumerables: true, computed: ['beat', 'root', 'extension', 'duration'] });
Data.define(KeyEvent,      { enumerables: true, computed: ['beat', 'name', 'root'] });
Data.define(MeterEvent,    { enumerables: true, computed: ['beat', 'rsid', 'divisor', 'divisions', 'beats', 'numerator', 'denominator', 'timesig'] });
Data.define(NoteEvent,     { enumerables: true, computed: ['beat', 'pitch', 'number', 'gain', 'duration'] });
Data.define(ControlEvent,  { enumerables: true, computed: ['beat', 'address', 'name', 'curve', 'value', 'duration'] });
Data.define(RateEvent,     { enumerables: true, computed: ['beat', 'curve', 'value', 'duration'] });
Data.define(SequenceEvent, { enumerables: true, computed: ['beat', 'identifier', 'TARGET', 'duration', 'transform', 'transforms'] });
Data.define(TextEvent,     { enumerables: true, computed: ['beat', 'duration', 'text'] });
