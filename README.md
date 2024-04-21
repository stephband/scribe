
<img src="https://stephen.band/scribe/logo.png" style="float: right;" />

# Scribe

Scribe notates music in HTML.

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

Or imported from a file in its `src` attribute:

```html
<scribe-script type="json" src="https://api.github.com/gists/739fa16055debb7972737835e4fa4623"></scribe-script>
```

### Attributes

#### `type="json"`

Scribe supports 3 types of data:

- "application/json", or just "json"
- "text/x-abc", or just "abc"
- "text/x-sequence", or just "sequence"

#### `src="url"`

A URL of some sequence data in JSON, ABC or Scribe's own sequence text format.

#### `clef="treble"`

Sets the default stave. May be overridden by `"clef"` events in data.

#### `meter="4/4"`

Sets the default meter. May be overridden by `"meter"` events in data.

### Properties
#### `.type`
#### `.src`
#### `.data`

Returns an observable proxy of Scribe's internal data object. Changes to this
data are observed and cause Scribe to update.


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
