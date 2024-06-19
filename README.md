
<img src="https://stephen.band/scribe/logo.png" style="float: right;" />

# Scribe

Scribe renders music notation in HTML.

Scribe takes a sequence of events – notes, chords, meter changes and so on – and
renders notation as symbols in a CSS grid that displays as a bar and stave.

There is a description of the CSS grid system in the blog post
<a href="https://cruncher.ch/blog/printing-music-with-css-grid/">Printing Music with CSS Grid</a>.
Many detials have changed since that post was written but the principal layout
technique remains the same.


## Download

Scribe 0.3 is a rewrite, and does not yet have a release build.
Development builds are kept in the `build/` folder.


## `<scribe-music>`

Scribe 0.3 is a rewrite, and this custom element is the test bed. To try out the
development version of the element, import the css and register the element:

```html
<link rel="stylesheet" href="https://stephen.band/scribe/build/scribe-music/module.css" />
<script type="module" src="https://stephen.band/scribe/build/scribe-music/module.js"></script>
```

Now the `<scribe-music>` element renders music notation from data found in
it's content:

```html
<scribe-music type="sequence" clef="treble" meter="4/4">
    0 chord Dmaj    4
    0 F#5 0.2 1
    0 A4  0.2 1
    0 D4  0.2 1
</scribe-music>
```

Or imported from a file in its `src` attribute:

```html
<scribe-music type="application/json" src="/path/to/json"></scribe-music>
```

Or set on it's data property:

```js
let scribe = document.body.querySelector('scribe-music');

scribe.data = {
    name:      'My Song',
    events:    [...]
};
```

Scribe consumes <a href="https://github.com/soundio/music-json/">Sequence JSON</a>
(and data objects of the same structure). Events are described by arrays of data in
the `.events` array:

```js
scribe.data = {
    events: [
        [0, "note", "G4", 0.2, 3]
    ]
};
```

Each event type has its own structure. Scribe 0.3 supports these event types:

| beat   | type         | 2 | 3 | 4 |
| :----- | :----------- | :--- | :--- | :--- |
| `beat` | `"chord"`    | `root` | `mode` | `duration` |
| `beat` | `"note"`     | `pitch` | `dynamic` | `duration` |
| `beat` | `"meter"`    | `duration` | `divisor` |  |
| `beat` | `"rate"`     | `number` |  |  |
| `beat` | `"key"`      | `notename` |  |  |
| `beat` | `"clef"`     | `clefname` |  |  |

Scribe 0.3 also parses a shorthand version of this format intended for quick hand authoring,
as in the first example above, which is basically Sequence JSON structure with all the JSON
syntax – commas and brackets and quotemarks – removed.

Scribe 0.3 also parses ABC (thanks to the parser from [ABCjs](https://github.com/paulrosen/abcjs)).


### `type="json"`

Both an attribute and a property.
Mimetype or type of data to fetch from `src` or to parse from text content.
Scribe supports 3 types of data:

- "application/json", or just "json"
- "text/x-abc", or just "abc"
- "sequence"


### `src="url"`

Both an attribute and a property.
The URL of a file containing sequence data in JSON or ABC.


### `clef="treble"`

Both an attribute and a property.
The name of the clef, one of `"treble"`, `"treble-up"`, `"treble-down"`, `"alto"`,
`"bass"`, `"piano"`, `"drum"` or `"percussion"`. Defaults to `"treble"`.

```html
<scribe-music clef="bass">...</scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
scribe.clef = "bass";
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

The key is the key signature pre-transpose. If `scribe.transpose` is something other
than `0`, the key signature is transposed.


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


### `.data`

Property only.
Set a `.data` object, structured as a <a href="https://github.com/soundio/music-json/#sequence">Sequence</a>, to render it.

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

To install Scribe locally clone the repo and update the submodules:

```
git clone https://github.com/stephband/scribe.git scribe
cd scribe
git submodule update --init
```

To check things are working serve this directory and navigate to
`host://scribe-music/index.html` (obviously `host://` needs to be replaced
depending on what you are using as a server).


## Changes

### 0.3.1

- Adds support for <a href="https://www.smufl.org/fonts/">SMuFL fonts</a>


## Roadmap

Asides from some immediate improvements I can make to Scribe 0.3, like
tuning the autospeller and fixing the 1/16th-note beams and detecting and
displaying tuplets, here are some longer-term features I would like to investigate:

- <strong>Support for nested sequences</strong> – enabling multi-part tunes.
- <strong>Split-stave rendering</strong> – placing multiple parts on one stave. The mechanics for this are already half in place – the drums stave and piano stave currently auto-split by pitch.
- <strong>Multi-stave rendering</strong> – placing multiple parts on multiple, aligned, staves.


## Credits

Developed at [Cruncher](https://cruncher.ch) by [Stephen Band](https://stephen.band).

Rich Sigler of Sigler Music Fonts [jazzfont.com](http://www.jazzfont.com/) very
kindly granted permission to use JazzFont shapes as SVG paths in this project
(although Scribe now renders SMuFL fonts so SVG shapes are no longer used).

Scribe logo/mascot by [Mariana Alt](https://www.mariana.lt/).

Gavin Band dreamt up probabalistic key centre analysis.

ABC parser borrowed from [ABCjs](https://github.com/paulrosen/abcjs).

Code contributions: Halit Celik.
