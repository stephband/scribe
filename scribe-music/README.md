
<img src="https://stephen.band/scribe/logo.png" style=" width: 25%; float: right;" />

# `<scribe-music>`

A custom element that imports, interprets and renders music notation from JSON
data.

## Get started

To use the `<scribe-music>` custom element, import the CSS and JS from the CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/stephband/scribe@latest/build/scribe-music/element.css" />
<script type="module" src="https://cdn.jsdelivr.net/gh/stephband/scribe@latest/build/scribe-music/element.js"></script>
```

The `<scribe-music>` element is now registered. It renders music notation from
JSON data imported via its `src` attribute:

```html
<scribe-music src="../data/blue-in-green.json"></scribe-music>
```

<img src="https://stephen.band/scribe/assets/images/blue-in-green.png" />


## Attributes and properties

| Attribute   | Property     | Type      | Description |
| :---------- | :----------- | :-------- | :---------- |
| `src`       | `.src`       | `URL`     | A URL of a JSON file or hashref of a script in the document |
|             | `.data`      | `object`  | Gets and sets sequence data |
| `clef`      | `.clef`      | `string`  | One of `"treble"`, `"bass"`, `"piano"`, `"drum"` or `"percussion"` |
| `key`       | `.key`       | `string`  | The name of a major key, eg. `"Ab"` |
| `meter`     | `.meter`     | `string`  | The time signature, eg. `"4/4"` |
| `transpose` | `.transpose` | `number`  | Transposes notation by a given number of semitones |
| `layout`    |              | `string`  | Either `"compact"` or `"regular"` |
| `shuffle`   |              | `boolean` | Boolean attribute, sets display of swung 16ths as straight 16ths |
| `swing`     |              | `boolean` | Boolean attribute, sets display of swung 8ths as straight 8ths |


### `src="url"`

Both an attribute and a property. The URL of a JSON file containing
<a href="https://github.com/soundio/music-json/#sequence">sequence</a> data.

```html
<scribe-music src="path/to/song.json"></scribe-music>
```

The `src` attribute may alternatively reference a `<script type="application/json">`
tag already in the document:

```html
<!-- Head -->
<script type="application/json" id="so-what">{
    "events": [
        [0,  "key", "C"],
        [0,  "meter", 4, 1],
        [0,  "sequence", 1, 0, 4]
    ],

    "sequences": [{
        "id": 1,
        "name": "Horns",
        "events": [
            [0, "chord", 2, "-7", 32],
            [2,    "note", "B4", 0.1, 1.5],
            [2,    "note", "G4", 0.1, 1.5],
            [2,    "note", "D4", 0.1, 1.5],
            [2,    "note", "A3", 0.1, 1.5],
            [3.5,  "note", "A4", 0.1, 0.5],
            [3.5,  "note", "F4", 0.1, 0.5],
            [3.5,  "note", "C4", 0.1, 0.5],
            [3.5,  "note", "G3", 0.1, 0.5]
        ]
    }]
}</script>

<!-- Body -->
<scribe-music src="#so-what" swing></scribe-music>
```

A few examples of sequence data can be found in the <a href="../data">data/</a>
directory.


### `.data`

Property only.
Set an object with an `events` array, structured as a <a href="https://github.com/soundio/music-json/#sequence">sequence</a> object.

```js
const element = document.body.querySelector('scribe-music');

element.data = {
    name:      'My Song',
    events:    [...],
    sequences: [...]
};
```

Get Scribe's <a href="https://github.com/soundio/music-json/#sequence">sequence</a> object.
To export Sequence JSON, stringify `scribe.data`:

```js
let scribe = document.body.querySelector('scribe-music');
let mySong = JSON.stringify(scribe.data);
```


### `clef="treble"`

Both an attribute and a property.
The name of the clef, one of `"treble"`, `"treble-up"`, `"treble-down"`, `"alto"`,
`"bass"`, `"piano"`, `"drum"` or `"percussion"`. Defaults to `"treble"`.

```html
<scribe-music clef="bass" src="..."></scribe-music>
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
<scribe-music key="F#" src="..."></scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
scribe.key = "B♭";
```

There is no provision for choosing a minor key. Declare its relative major.

The key is the key signature pre-transposition. If `transpose` is set to
something other than `0`, the key signature is also transposed.

The key attribute/property is superceded by a `"key"` event found in the data
at beat `0`.


### `meter="4/4"`

Both an attribute and a property.
The meter, expressed as a standard time signature.

```html
<scribe-music meter="3/4" src="..."></scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
scribe.meter = "3/4";
```

This setting is superceded by a `"meter"` event found in the data at beat `0`.
If this attribute is omitted (or the property not set in JS), no time signature is displayed (unless the data contains a `"meter"` event at beat `0`).
Defaults to `"4/4"`.


### `transpose="0"`

Both an attribute and a property.
Sets scribe to render notation transposed by `transpose` semitones. Transposition
is applied to key signature, notes and chords before render, and not to the underlying data.

```html
<scribe-music transpose="2" src="..."></scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
scribe.transpose = 2;
```

### `layout="compact"`

Both an attribute and a property.
Sets scribe to render notation transposed by `transpose` semitones. Transposition
is applied to key signature, notes and chords before render, and not to the underlying data.

```html
<scribe-music layout="regular"></scribe-music>
```

```js
let scribe = document.body.querySelector('scribe-music');
scribe.transpose = 2;
```


### `shuffle`

A boolean attribute. Displays swung 16ths as straight 16ths.

```html
<scribe-music shuffle src="..."></scribe-music>
```


### `swing`

A boolean attribute. Displays swung 8ths as straight 8ths.

```html
<scribe-music swing src="..."></scribe-music>
```
