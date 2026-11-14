
<img src="https://stephen.band/scribe/logo.png" style="float: right;" />

# Scribe

Scribe takes a *sequence of musical events* – notes, chords, meter changes and
so on – interprets them, and renders *responsive music notation* in HTML and CSS.

- *Responsive* and ready for the web
- *Rhythmic interpreter* rhythms are metrically quantised from performance data
- *Spelling engine* notes and chords are analysed in context for local key and spelling
- *Customisable in CSS* make a part red, change the font, hide the chords, it's up to you
- *Swappable fonts* uses W3C standard [SMuFL music fonts](https://smufl.formats.music/latest/)
- *Social* sequence data has an AT Protocol lexicon, [io.sound.sequence](https://atproto.at/lexicon/io.sound.sequence)

Music HTML can be rendered:

- *in HTML* declaratively using the `<scribe-music>` custom element
- *as HTML* using the `renderHTML()` function
- *as a DOM fragment* using the `renderDOM()` function
- *by hand* but you have to be really really keen


## Documentation

Documentation is at [stephen.band/scribe/](https://stephen.band/scribe).

For CSS developers, there is a discussion about using CSS grid layout for laying
out music notation in an old blog post – <a href="https://cruncher.ch/blog/printing-music-with-css-grid/">Printing Music with CSS Grid</a>.
The CSS library has changed since, but that's still a good introduction to the
technique.


## Get started

### Install the `<scribe-music>` custom element

Import the `<scribe-music>` custom element and accompanying CSS from the CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/stephband/scribe@0.6.0/build/scribe-music/element.css" />
<script type="module" src="https://cdn.jsdelivr.net/gh/stephband/scribe@0.6.0/build/scribe-music/element.js"></script>
```

The `<scribe-music>` element is now registered. It renders music notation from
data imported via its `src` attribute:

```html
<scribe-music src="/path/to/json"></scribe-music>
```

Or from data the `src` attribute references in the document:

```html
<script type="application/json" id="so-what">{
    "events": [...]
}</script>

<scribe-music src="#so-what" swing></scribe-music>
```

Get `<scribe-music>`'s sequence data.

```js
const scribe   = document.body.querySelector('scribe-music');
const sequence = scribe.data;
```

This sequence is a reactive object. Mutating it causes `<scribe-music>` to re-render:

```js
// Adds a Dm7 chord for 4 beats at beat 12
sequence.createEvent(12, "chord", "D", "-7", 4);
```

> [!NOTE]
> This enables you to employ `<scribe-music>` as a live visualiser!


### Render music in JS

```js
// Import the API from the CDN
import { Sequence, renderHTML, renderDOM } from 'https://cdn.jsdelivr.net/gh/stephband/scribe@0.6.0/build/module.js';

// Create a Sequence object
const sequence = Sequence.from(data);

// Render a string of HTML
const html = renderHTML(sequence);

// Render a DOM fragment
const fragment = renderDOM(sequence);
```


## Sequence data

Sequence data is high resolution performance data (and not just notation data)
designed to align with requirements of WebAudio. It is (almost) a superset of
MIDI 2.0 (and therefore also MIDI 1.0). This library extends pure Sequence data
with some configuration and events for rendering notation.

Data may be:

- Sequence JSON (`file.json`, `type="application/json"`)
- Sequence text (`file.sequence`, `type="text/sequence"`)
- An [io.sound.sequence](https://atproto.at/lexicon/io.sound.sequence) AT Protocol record (`record.json`, `type="application/json"`)
<!--- a MIDI 1.0 file (`.mid`, `.midi`, `type="audio/midi"`)
- a MIDI 2.0 clip file (`.midi2`, `type="audio/midi-clip"`)-->

> [!NOTE]
> MusicXML and its offspring MNX can, theoretically, be transformed to and from
> Sequence data, but not all information carried by MusicXML is yet supported by
> Scribe. And there is no MusicXML parser yet. Please contribute!

Scribe processes sequences through a transformation pipeline:

1. **`read`**: Uses a `SequenceIterator` to create bars based on meter events and route events into buffers
2. **`quantise`**: An Elastic Phase-Locked Metrical Quantiser interprets performance timings to notation timings
3. **`spell`**: A neural network running on the GPU predicts local key and pitch spellings
4. **`symbolise`**: Generates a tree of bars, parts, accidentals, notes, beams, tuplets, rests, ties and so on
5. **`render`**: Converts the tree to custom elements (`<music-bar>`, `<music-stave>`, `<music-note>`, `<music-rest>`, etc.)


### Export Sequence data

Convert a sequence to JSON:

```js
const json = JSON.stringify(sequence);
```

Sequence text is a human readable format for simple sequences with no part routing.
It looks a little like step sequencer data. Sequence text does not support multi-part
sequences. Get sequence text of a sequence:

```js
const text = sequence.toString();
```

Get the sequence serialised and validated as an [AT Protocol](https://atproto.com/)
record:

```js
const text = sequence.toATProtoRecord();
```

The AT Protocol lexicon for Sequence records is [io.sound.sequence](https://atproto.at/lexicon/io.sound.sequence).

> [!CAUTION]
> An `io.sound.sequence` record has events serialised to base-64, nonetheless large
> sequences may run up against the limits of a PDS. Currently not tested. Contribute!


## SMuFL Fonts

Music HTML requires a standard SMuFL (Standard Music Font Layout) font.
Dedicated stylesheets are found in `fonts/`:

- `fonts/jazz.css` (Finale Jazz, default)
- `fonts/bravura.css` (Bravura)
- `fonts/petaluma.css` (Petaluma)
- `fonts/broadway.css` (Finale Broadway)
- `fonts/ash.css` (Finale Ash)
- `fonts/leipzig.css` (Leipzig)


## Build

```cli
make modules
```

### Test

Run the test suite using Deno:

```cli
deno test
```

### Train Speller

Retrain the Recurrent Neural Network (RNN) pitch spelling model on musical corpora:

```cli
deno task train
```


## Changes

### 0.6 – Multi-stave scoring

Version 0.6 introduces a neural network for note spelling, refines the rhythm
detector and employs subgrids for multi-stave scoring

- HTML now renders as (unregistered) custom elements: `<music-bar>`, `<music-stave>`, `<music-note>`, etc.
- Vertical grid (`<music-stave>`) inherits subgrid from horizontal grid (`<music-bar>`) enabling multi-stave rendering
- Recurrent Neural Network trained for local key and pitch spelling
- Elastic Phase-Locked Metrical Quantiser for better rhythm detection
- Automatic staccato and tenuto accents based on duration
- Automatic ghost, emphasis and marcato accents based on dynamics
- Meter events carry divisions, previously divisions were inferred

### 0.5 – Clean up

Version 0.5 rewrites the rhythm detector to better support drums and percussion.

- Refactors the parts symboliser
- Rewrites rhythm detection to better support drum and percussion notation
- Fixes CSS for minor superimposed symbols such as clustered note dots
- Adds 32nd note tail glyphs to JazzFont
- Renders whole bar rests as semibrieve rests

### 0.4 – The Lead Sheet

Version 0.4 is capable of rendering a reasonable lead sheet. Features:

- Supports multiple concurrent notes
- Supports multiple parts per stave
- Supports sequence events, top-level sequence events denote musical structure
- Supports arbitrary nesting of sequences and transforms
- Tuplet detection up to nonuplets
- Automatic bar repeat symbols for repeated identical bars
- New probablistic key-to-spelling detector
- Adds config object
- Setting `settings.swingAsStraight8ths` makes 8th tuplets display as straight 8ths
- Setting `settings.swingAsStraight16ths` makes 16th tuplets display as straight 16ths
- `<scribe-music>` `swing` attribute corresponds to `.swingAsStraight8ths`

### 0.3 – Proof of concept

- Triplet detection and rendering
- Supports nested sequences to level 2 nesting
- Bar divisions, note, beam and rest splitting on divisions
- In-bar and cross-bar ties

### 0.3.1 – SMuFL

- Adds support for <a href="https://www.smufl.org/fonts/">SMuFL fonts</a>
- Proof of concept


## Credits

Developed by [stephband](https://stephen.band) ([Bluesky](https://bsky.app/profile/stephen.band)).
Scribe mascot by Mariana Alt.
Code contributions: Halit Celik.
