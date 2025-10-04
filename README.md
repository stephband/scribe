
<img src="https://stephen.band/scribe/logo.png" style="float: right;" />

# Scribe

Responsive music notation for the web.

Scribe takes a sequence of events – notes, chords, meter changes and so on – and
interprets and renders notation in HTML and CSS.


## `<scribe-music>`

To use the `<scribe-music>` custom element, import the CSS and JS from the CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/stephband/scribe@0.4.0/build/scribe-music/element.css" />
<script type="module" src="https://cdn.jsdelivr.net/gh/stephband/scribe@0.4.0/build/scribe-music/element.js"></script>
```

The `<scribe-music>` element is now registered. It renders music notation from
JSON data imported via its `src` attribute:

```html
<scribe-music src="/path/to/json"></scribe-music>
```

Alternatively the `src` attribute may reference JSON already in the document:

```html
<!-- Head -->
<script type="application/json" id="music">{
    "events": [...]
}</script>

<!-- Body -->
<scribe-music src="#music" swing></scribe-music>
```


## Scribe data

Scribe consumes <a href="https://github.com/soundio/music-json/">Sequence JSON</a>.
Here's an example of the horn part for So What as a sequence document:

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

<img src="https://stephen.band/scribe/assets/images/so-what.png" alt="Scribe rendered music for So What" />

The only property a sequence document actually requires is an `"events"` array.

### Events

Events are described in the `"events"` array. Each event is an array that starts
with `[beat, type, ...]`. Each event type carries some data. Scribe supports
these event types:

| beat   | type         | 2 | 3 | 4 | 5 |
| :----- | :----------- | :--- | :--- | :--- |
| `beat` | `"chord"`    | `root` | `mode` | `duration` | `bass` |
| `beat` | `"lyric"`    | `text` | `duration` |  |  |
| `beat` | `"note"`     | `pitch` | `dynamic` | `duration` |  |
| `beat` | `"meter"`    | `duration` | `divisor` |  |  |
| `beat` | `"rate"`     | `number` |  |  |  |
| `beat` | `"sequence"` | `id` | `-` | `duration` | `transforms...` |
| `beat` | `"key"`      | `notename` |  |  |  |

Unrecognised event types are ignored.

### Sequences

Sequences are described in the `"sequences"` array, and `"sequence"` events refer
to them by id. Child sequences have the same structure as parent sequences. Events
may refer to sequences in the same sequence or to any sequence found in their parent
chain. Sequences are arbitrarily nestable.

Scribe considers the top-level sequence to describe musical structure by
convention. In the example above the top-level sequence contains the key, meter
and musical sections as `"sequence"` events. Scribe renders double bar lines at
the end of each of these.


<!--
Scribe also parses a shorthand version of this format intended for quick hand
authoring, basically Sequence JSON structure with all the JSON syntax removed.

```html
<scribe-music type="sequence" clef="treble" meter="4/4">
    0 chord Dmaj    4
    0 F#5 0.2 1
    0 A4  0.2 1
    0 D4  0.2 1
</scribe-music>
```

<!--Scribe 0.3 also parses ABC (thanks to the parser from [ABCjs](https://github.com/paulrosen/abcjs)).-->


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


### `clef="treble"`

Both an attribute and a property.
The name of the clef, one of `"treble"`, `"treble-up"`, `"treble-down"`, `"alto"`,
`"bass"`, `"piano"`, `"drum"` or `"percussion"`. Defaults to `"treble"`.

```html
<scribe-music clef="bass">...</scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
console.log(scribe.clef) // "bass";
```


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

The key is the key signature pre-transposition. If `scribe.transpose` is something
other than `0`, the key signature is transposed.


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

A boolean attribute. Displays swung and triplet 8ths as straight 8ths.

### `.data`

Set a `.data` object, structured as a <a href="https://github.com/soundio/music-json/#sequence">Sequence</a>.

```js
let scribe = document.body.querySelector('scribe-music');
scribe.data = {
    name:      'My Song',
    events:    [...]
};
```

Get Scribe's internal data object, whose structure is a <a href="https://github.com/soundio/music-json/#sequence">Sequence</a>.
To export Sequence JSON, simply stringify `scribe.data`:

```js
let scribe = document.body.querySelector('scribe-music');
let mySong = JSON.stringify(scribe.data);
```


---

## Sequence format

The `"sequence"` format is intended for quick hand-authoring, and not as an export format.
The format is basically Sequence JSON events but with all the JSON syntax – commas, quotes, brackets – removed.
Values are delineated by whitespace.
Any value that does not parse as a number becomes a string.

```
0 meter 4 1
0 chord D maj 4
0 note F#5 0.2 2
1 note A4  0.2 1
4 note D4  0.2 1
```

If notes have named pitches (as opposed to numbered pitches), declaring the `note` type is optional.

```
0 meter 4 1
0 chord D maj 4
0 F#5 0.2 2
1 A4  0.2 1
4 D4  0.2 1
```

The same is true for chords.

```
0 meter 4 1
0 D maj 4
0 F#5 0.2 2
1 A4  0.2 1
4 D4  0.2 1
```

## Develop

### Clone

To install Scribe locally clone the repo and update the submodules:

```
git clone https://github.com/stephband/scribe.git scribe
cd scribe
git submodule update --init
```

To check things are working serve this directory and navigate to
`http://localhost/scribe-music/index.html` (obviously `localhost` needs to be
replaced depending on what you are using as a server).

### Build

```cli
make modules
```

## Research

There is a discussion of using CSS grid layout for rendering music notation
in the blog post <a href="https://cruncher.ch/blog/printing-music-with-css-grid/">Printing Music with CSS Grid</a>.
Scribe's internals have changed since that post was written but the principal
layout technique remains the same.


## Changes

### 0.4.x – The Lead Sheet

Version 0.4 is capable of rendering a reasonable lead sheet. Features:

- Supports multiple concurrent notes
- Supports multiple parts per stave
- Supports sequence events, top-level sequence events denote musical structure
- Supports arbitrary nesting of sequences and transforms
- Tuplet detection up to nonuplets
- Automatic bar repeat symbols for repeated identical bars
- Adds config object
- Setting `settings.swingAsStraight8ths` makes 8th tuplets display as straight 8ths
- Setting `settings.swingAsStraight16ths` makes 16th tuplets display as straight 16ths
- `<scribe-music>` `swing` attribute corresponds to `.swingAsStraight8ths`

Regressions

- Broken spelling

### 0.3.x – Experimental features

- Triplet detection and rendering
- Supports nested sequences to level 2 nesting
- Bar divisions, note, beam and rest splitting on divisions
- In-bar and cross-bar ties

### 0.3.1 – SMuFL

- Adds support for <a href="https://www.smufl.org/fonts/">SMuFL fonts</a>
- Proof of concept

## Credits

Developed at [Cruncher](https://cruncher.ch) by [Stephen Band](https://stephen.band).

Rich Sigler of Sigler Music Fonts [jazzfont.com](http://www.jazzfont.com/) very
kindly granted permission to use JazzFont shapes as SVG paths in this project.
Scribe now renders SMuFL fonts so SVG shapes are no longer used.

Scribe logo/mascot by [Mariana Alt](https://www.mariana.lt/).

Gavin Band dreamt up probabalistic key centre analysis.

ABC parser borrowed from [ABCjs](https://github.com/paulrosen/abcjs).

Code contributions: Halit Celik.
