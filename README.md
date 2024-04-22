
<img src="https://stephen.band/scribe/logo.png" style="float: right;" />

# Scribe

Scribe renders music notation in HTML.

Scribe takes a sequence of events – notes, chords, meter changes and so on – and
renders notation as symbols in a CSS grid.


## Download

Scribe 0.3 is a recent rewrite, and does not yet have a build.


## `<scribe-script>`

Scribe 0.3 is a rewrite, and this custom element is the test bed. To try out the
development version of the element, import the css, register the element and
set the path to the shadow DOM stylesheet:

```html
<link rel="stylesheet" href="https://stephen.band/scribe/scribe-script/module.css" />
<script type="module">
    import ScribeScript from 'https://stephen.band/scribe/scribe-script/module.js';
    ScribeScript.stylesheet = 'https://stephen.band/scribe/scribe-script/shadow.css';
</script>
```

Now the `<scribe-script>` element renders music notation from data found in
it's content:

```html
<scribe-script type="sequence" clef="treble" meter="4/4">
    0 chord Dmaj    4
    0 note  F#5 0.2 1
    0 note  A4  0.2 1
    0 note  D4  0.2 1
</scribe-script>
```

Or imported from a file in its `src` attribute, like this gist:

```html
<scribe-script type="json" src="https://api.github.com/gists/739fa16055debb7972737835e4fa4623"></scribe-script>
```

Or set on it's data property:

```js
let scribe = document.body.querySelector('scribe-script');

scribe.data = {
    name:      'My Song',
    events:    [...],
    sequences: [...]
};
```

Scribe consumes <a href="https://github.com/soundio/music-json/">Sequence JSON</a>
(and data objects of the same structure).

---

### Attributes

#### `type="json"`

Scribe supports 3 types of data:

- "application/json", or just "json"
- "text/x-abc", or just "abc"
- "text/x-sequence", or just "sequence"

#### `src="url"`

A URL of some sequence data in JSON, ABC or Scribe's own sequence text format.

#### `clef="treble"`

Sets the stave. One of `"treble"`, `"bass"`, `"piano"`, `"drums"`, `"percussion"` or
`"chords"`.

#### `key="C"`

Gets and sets the key signature of the stave. Accepts any chromatic note name,
spelled with unicode sharps `♯` and flats `♭` or with hash `#` and small case `b`.

#### `meter="4/4"`

Sets the default meter. May be overridden by any `"meter"` events in data.

#### `transpose="0"`

Sets scribe to render notation transposed by `transpose` semitones. Transposition
is applied to key signature, notes and chords.

---

### Properties

#### `.clef`

The name of the clef, one of `"treble"`, `"bass"`, `"piano"`, `"drums"`, `"percussion"` or
`"chords"`.

```js
let scribe = document.body.querySelector('scribe-script');
scribe.clef = "bass";
```

#### `.key`

The key signature of the stave. This is the key signature pre-transpose, if
`scribe.transpose` is something other than `0`, the key signature is transposed
before render.

```js
let scribe = document.body.querySelector('scribe-script');
scribe.key = "Bb";
```

#### `.meter`

The meter, expressed as a standard time signature. This setting is overridden
by any meter event found in the data at beat `0`.

```js
let scribe = document.body.querySelector('scribe-script');
scribe.meter = "4/4";
```

#### `.transpose`

A transpose value in semitones, an integer, applied to both key, notes and
chords before rendering.

```js
let scribe = document.body.querySelector('scribe-script');
scribe.transpose = 2;
```

Transposing a `scribe` does not change `scribe.data`, only the rendered output.

#### `.src`

URL of data to be parsed and rendered.

#### `.type`

Mimetype or type of data to fetch from `src` or to parse from text content.

- "application/json", or just "json"
- "text/x-abc", or just "abc"
- "text/x-sequence", or just "sequence"

#### `.data`

Gets Scribe's internal data object, whose structure is a <a href="https://github.com/soundio/music-json/#sequence">Sequence</a>.
To export Sequence JSON, simply stringify it:

```js
let scribe = document.body.querySelector('scribe-script');
let mySong = JSON.stringify(scribe.data);
```

Set a `.data` object, structured as a <a href="https://github.com/soundio/music-json/#sequence">Sequence</a>,
to render it.

```js
let scribe = document.body.querySelector('scribe-script');
scribe.data = {
    name:      'My Song',
    events:    [...],
    sequences: [...]
};
```

---

## Develop

To install Scribe locally you need several repos served from one directory, as
Scribe's modules import modules from these other repos using relative paths.

Assuming you are inside a project repo, add the submodules:

```
git submodule add git@github.com:stephband/fn path/to/fn
git submodule add git@github.com:stephband/dom path/to/dom
git submodule add git@github.com:stephband/abcjs path/to/abcjs
git submodule add git@github.com:stephband/midi path/to/midi
git submodule add git@github.com:stephband/scribe path/to/scribe
```

To check things are working launch your server and navigate to
`path/to/scribe/scribe-script/index.html`.


## Contributions

Rich Sigler of Sigler Music Fonts (http://www.jazzfont.com/) very kindly granted
permission to use JazzFont shapes as SVG paths in this project. If you use
Scribe a lot consider buying a JazzFont license.

Gavin Band implemented probabalistic key centre analysis.

Scribe logo/mascot by Mariana Alt.
