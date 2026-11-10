

<!--Here's another example: <a href="https://stephen.band/scribe/dolphin-dance">Dolphin Dance</a>.-->

## Scribe data

Scribe consumes <a href="https://github.com/soundio/sequence/">Sequence data</a>.
Here's an example of the horn part for <a href="https://www.youtube.com/watch?v=ylXk1LBvIqU&list=RDylXk1LBvIqU">So What</a>
as a sequence document:

```json
{
    "name": "So What",
    "author": { "name": "Miles Davis" },
    "events": [
        [0,  "key", "C"],
        [0,  "meter", 4, 1],
        [0,  "sequence", 1, 0, 32],
        [32, "sequence", 1, 0, 32],
        [64, "sequence", 1, 0, 32, "transpose", 1],
        [96, "sequence", 1, 0, 32]
    ],

    "sequences": [{
        "id": 1,
        "name": "Section",
        "events": [
            [0,  "sequence", 2, 0, 8],
            [8,  "sequence", 2, 0, 8],
            [16, "sequence", 2, 0, 8],
            [24, "sequence", 2, 0, 8]
        ]
    }, {
        "id": 2,
        "name": "Horns",
        "events": [
            [0, "chord", "D", "-7", 32],
            [2,    "note", "B4", 0.1, 1.6],
            [2,    "note", "G4", 0.1, 1.6],
            [2,    "note", "D4", 0.1, 1.6],
            [2,    "note", "A3", 0.1, 1.6],
            [3.6,  "note", "A4", 0.1, 0.4],
            [3.6,  "note", "F4", 0.1, 0.4],
            [3.6,  "note", "C4", 0.1, 0.4],
            [3.6,  "note", "G3", 0.1, 0.4]
        ]
    }]
}
```

The main sequence plays the "Section" sequence four times, 32 beats (or 8 bars) per
section, with the third section transposed up 1 semitone. The "Section" sequence
plays the "Horns" phrase four times, 8 beats (or 2 bars) per phrase. That renders as:

<img src="https://stephen.band/scribe/assets/images/so-what.png" alt="Scribe rendered music for So What" style="width: 100%; height: auto;" />

Scribe detects when bars are repeated and automatically inserts bar repeat
symbols.

The only property actually required by a sequence is an `"events"` array.

### Events

Events are described in the `"events"` array. Each event is an array that starts
with `[beat, type, ...]` and each type carries some data. Scribe supports
these event types:

| beat   | type         | 2 | 3 | 4 | 5 |
| :----- | :----------- | :--- | :--- | :--- | :--- |
| `beat` | `"chord"`    | `root` | `extension` | `duration` | |
| `beat` | `"text"`     | `duration` | `text` | | |
| `beat` | `"note"`     | `pitch` | `dynamic` | `duration` | |
| `beat` | `"meter"`    | `duration` | `divisor` | | |
| `beat` | `"rate"`     | `number` | | | |
| `beat` | `"sequence"` | `id` | `target` | `duration` | `transforms...` |
| `beat` | `"key"`      | `notename` | | | |

Unrecognised event types are ignored.

### Objects and Parts (Multi-Stave Scoring)

Scribe supports multi-part and multi-stave scores by separating musical sound sources (`"objects"`) from stave presentation (`"parts"`).

#### `"objects"`
An array defining named musical sources or instruments referenced by `"sequence"` events:

```json
"objects": [
    { "id": 1, "name": "Melody" },
    { "id": 2, "name": "Accompaniment" }
]
```

#### `"parts"`
An array defining the staves to be rendered and how voices/objects route into them:

```json
"parts": [{
    "staff": "grand",
    "name": "Piano",
    "routing": {
        "1": 1,
        "2": 2
    }
}]
```

- **Open scores**: Multiple entries in `"parts"` generate stacked staves within each measure.
- **Voice routing**: Maps source IDs to numeric voice keys (e.g. `{"1": 1, "2": 2}`). Grand staves support `1` (`rh`), `2` (`lh`), or SATB voices `3` (`soprano`), `4` (`alto`), `5` (`tenor`), `6` (`bass`). Destination `0` automatically splits across treble and bass.
- **Single parts**: If `"parts"` is omitted, Scribe defaults to a single stave (treble, or as determined by the `<scribe-music staff="...">` attribute).

### Sequences

Sequences are described in the `"sequences"` array, and `"sequence"` events refer
to them by id. Child sequences have the same structure as parent sequences. Events
may refer to sequences in the same sequence or to any sequence found in their parent
chain. Sequences are arbitrarily nestable.

Scribe considers the top-level sequence to describe musical structure by
convention. In the example above the top-level sequence contains the key, meter
and musical sections as `"sequence"` events. Scribe renders double bar lines at
the end of each of these.

### Sequence Shorthand (`text/sequence`)

Scribe also parses a whitespace-delimited shorthand format designed for quick hand-authoring:

```html
<script type="text/sequence" id="tune">
    0 key D
    0 meter 4/4
    0 D4 1
    1 F#4 1
    2 A4 1
</script>
<scribe-music src="#tune"></scribe-music>
```

Values are delineated by whitespace. Bare note names (e.g. `D4`, `F#4`) and chord symbols automatically infer their event types without explicit `"note"` or `"chord"` keywords.

<!-- Legacy ABC note:
Scribe previously included experimental parsing for ABC format; this is currently inactive.
-->


### `type="json"`

Both an attribute and a property.
Mimetype or type of data to fetch from `src` or to parse from text content.
Scribe supports 3 types of data:

- "application/json", or just "json"
<!-- - "text/x-abc", or just "abc" -->
- "sequence"


### `src="url"`

Both an attribute and a property.
The URL of a JSON file, or a hash reference to a script element in the document.


### `staff="treble"`

Both an attribute and a property.
The name of the clef, one of `"treble"`, `"treble-up"`, `"treble-down"`, `"alto"`,
`"tenor"`, `"bass"`, `"grand"`, `"drum"` or `"percussion"`. Defaults to `"treble"`.

```html
<scribe-music staff="bass">...</scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
console.log(scribe.staff) // "bass";
```

### `layout="compact"`

Both an attribute and a property.
Controls the horizontal bar distribution across flex lines:
- `"compact"` (default): measures wrap with content-driven shrink-to-fit widths.
- `"regular"`: uses container queries to align bars to regular, predictable measure counts per system (e.g. 4 bars per system on larger viewports).

<!-- `"spaced"` layout is deprecated/no longer supported in CSS -->

### `beat="0"`

Both an attribute and a property.
Sets the start beat from which notation rendering begins. Defaults to `0`.

### `duration="Infinity"`

Both an attribute and a property.
Sets the total duration (in beats) to render from the sequence. Defaults to `Infinity`.

### `key="C"`

Both an attribute and a property.
Gets and sets the key signature of the stave. Accepts any chromatic note name,
spelled with unicode sharps `♯` and flats `♭` or with hash `#` and small case `b`.
This is the name of the tonic of a major scale. Defaults to `"C"`.

```html
<scribe-music key="F#">...</scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
scribe.key = "B♭";
```

There is no provision for choosing a 'minor' key. Declare its relative major.

The key is the key signature pre-transposition. If `transpose` is something
other than `0`, the key signature is also transposed.


### `meter="4/4"`

Both an attribute and a property.
The meter, expressed as a standard time signature.
This setting is overridden by any meter event found in the data at beat `0`.
If this attribute is omitted (or the property not set in JS), no time signature is displayed (unless the data contains a `"meter"` event at beat `0`).
Defaults to `"4/4"`.

```html
<scribe-music meter="3/4">...</scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
scribe.meter = "3/4";
```

### `transpose="0"`

Both an attribute and a property.
Sets scribe to render notation transposed by `transpose` semitones. Transposition
is applied to key signature, notes and chords before render, and not to the underlying data.

```html
<scribe-music transpose="2">...</scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
scribe.transpose = 2;
```

### `swing`

A boolean attribute (corresponding to the `swingAsStraight8ths` setting). Displays swung and triplet 8ths as straight 8ths without rendered tuplet brackets.

### `showAtConcertPitch`

Configuration setting. When `true`, preserves concert pitch across all parts regardless of per-part instrument transposition.

### CSS Styling & System Spacing

Scribe components use Shadow DOM. Key styling behaviors:
- **System row gaps**: Multi-part scores automatically receive a `3em` gap between wrapped flex systems; single-part scores collapse the gap to `0` so standard stave padding and ledger margins govern spacing.
- **Custom gap override**: Set `--row-gap` on the element (e.g. `style="--row-gap: 1.5em;"`) to override default system spacing.

