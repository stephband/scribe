# Scribe

Scribe makes it easy to write music on the web.

Scribe turns an array of notes and chords into music notation that is rendered in SVG.
Writing a tune is as simple as 


## Scribe(svg, data, options)


### svg

Either an id (string) of an SVG node, or an SVG node.


### data

An array of notes. For example:

    [
        { beat: 2,   number: 76,  duration: 0.5 },
        { beat: 2.5, number: 77,  duration: 0.5 },
        { beat: 3,   number: 79,  duration: 0.5 },
        { beat: 3.5, number: 74,  duration: 3.5 }
    ]

Renders as:

![Dum-de-de-duuum](example.png)

That's right. You only need to give it the notes.
Scribe interprets the notes and writes out the notation.

It's early days, and the required format of this note data will change.
One possibility is to loosely follow the OSC data spec.


### options

Scribe's rendered output can be modified with these optionally optional options:

    {
        clef: 'treble',
        clefOnEveryStave: false,
        barsPerStave: 4,
        
        paddingTop: 12,
        paddingLeft: 3,
        paddingRight: 3,
        paddingBottom: 6,
        
        staveSpacing: 24,
        
        start: 0,
        end: undefined,
        
        key: 'C',
        transpose: 0

        beamBreaksAtRest: true,
        beamGradientMax: 0.25,
        beamGradientFactor: 0.25,
    }


## Features

Scribe is new.
These are features I intend to implement.

* Key centre analysis, for identifying the key centre of individual phrases (very difficult).
* Multi-stave rendering, for piano or multi-part scores (moderately challenging).
* Live data binding, so that Scribe will automatically show changes in data (piece of piss).

If you like scribe and are interested in helping, please fork and let me know what you might work on.


## Contributions

Rich Sigler of Sigler Music Fonts (http://www.jazzfont.com/) has very kindly granted permission to use JazzFont shapes as SVG paths.
If you use Scribe a lot, please consider buying a JazzFont license (http://www.jazzfont.com/order.html).
