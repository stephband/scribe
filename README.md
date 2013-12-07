# Scribe

Scribe turns JSON into SVG music notation.


## Scribe(svg, data, options)


### svg

Either an id (a string) of an SVG node, or an SVG node.


### data

An array of notes. For example:

    [
        { beat: 2,   number: 76,  duration: 0.5 },
        { beat: 2.5, number: 77,  duration: 0.5 },
        { beat: 3,   number: 79,  duration: 0.5 },
        { beat: 3.5, number: 74,  duration: 3.5 }
    ]

will render as:

<img src="http://labs.cruncher.ch/scribe/example.png" />

That's right. You only need to give it the notes. Scribe does the rest.


### options

Scribe's rendered output can be modified with these optional options:

    {
        beamBreaksAtRest: true,
        beamGradientMax: 0.25,
        beamGradientFactor: 0.25,
        
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
    }


## History

It's early days, and Scribe will change.