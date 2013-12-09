(function() {
	"use strict";

	var debug = window.console && window.console.log;
	var xmlns = "http://www.w3.org/2000/svg";
	var find = document.getElementById.bind(document);

	// ♯ ♭ ♮
	var SHARP = 'sharp',
	    FLAT = 'flat',
	    NATURAL = 'natural';

	var attributes = {
		'class': setAttr,
		'x': setAttr,
		'y': setAttr,
		'x1': setAttr,
		'y1': setAttr,
		'x2': setAttr,
		'y2': setAttr,
		'd': setAttr,
		'href': setAttrBaseVal,
		'translate': setTransform,
		'scale': setTransform,
		'rotate': setTransform,
		'text': textContent
	};

	var transforms = {
		'translate': 'setTranslate',
		'scale': 'setScale',
		'rotate': 'setRotate'
	};

	var transformTypes = {
		'translate': 'SVG_TRANSFORM_TRANSLATE',
		'scale': 'SVG_TRANSFORM_SCALE',
		'rotate': 'SVG_TRANSFORM_ROTATE'
	};

	var test = {
		equals: function(a, b) {
			if (a !== b)
				throw new Error(a + ' is not equal to ' + b);
		},
		
		number: function(n, name) {
			if (typeof n !== 'number')
				throw new Error(name + ' is not a number (it\'s a ' + (typeof n) + ')');
		},
		
		notNaN: (function(){
			var isNaN = Number.isNaN || window.isNaN;
			
			return function(n, name) {
				if (isNaN(n))
					throw new Error(name + ' is NaN');
			}
		})()
	};

	var barBreaks = {
		3: [1,2],
		4: [2],
		5: [3],
		6: [3]
	};

	var clefs = {
	    	// Centre notes for the stave depend on the clef.
	    	treble: 71,
	    	bass: 50
	    };

	var defaults = {
	    	stalkUp: {
	    		x1: 1.25,
	    		y1: -0.5,
	    		x2: 1.25,
	    		y2: -6.75
	    	},
	    	
	    	stalkDown: {
	    		x1: -1.125,
	    		y1: 0.5,
	    		x2: -1.125,
	    		y2: 6.75
	    	},
	    	
	    	beam: {
	    		width: 1,
	    		spacing: 1.4
	    	},

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
	    	//end: 48,
	    	
	    	key: 'D',
	    	transpose: 0
	    };

	var names = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
	var lines = ['C','D','E','F','G','A','B'];
	var accidentals = {
		'-1': '♭',
		'0': '',
		'1': '♯'
	};

	var modes = {
		'∆': 0,
		'∆7': 0,
		'-7': 2,
		'sus♭9': 4,
		'7sus♭9': 4,
		'∆♯11': 5,
		'∆(♯11)': 5,
		'7': 7,
		'13': 7,
		'sus': 7,
		'7sus': 7,
		'-♭6': 9,
		'ø': 11,
		
		// Here we treat melodic minor as though it were the fourth degree of a
		// major scale, making the spellings work out nicely, or so it is hoped,
		// but also because it is strongly related. Think E7alt -> Am.
		'-∆': 5,
		'13sus♭9': 7,
		'∆+': 8,
		'∆♯5': 8,
		'7♯11': 10,
		'7♭13': 0,
		'ø(9)': 2,
		'7alt': 4
	};
	
	var spellingsMap = [
		//C              D               E       F               G               A               B      
		[[0, 0], [0, 1], [1, 0], [2,-1], [2, 0], [3, 0], [3, 1], [4, 0], [5,-1], [5, 0], [6,-1], [6, 0], 'C'],   // C
		[[0, 0], [1,-1], [1, 0], [2,-1], [3,-1], [3, 0], [4,-1], [4, 0], [5,-1], [5, 0], [6,-1], [7,-1], 'D♭'], // D♭
		[[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [6,-1], [6, 0], 'D'],   // D
		[[0, 0], [1,-1], [1, 0], [2,-1], [2, 0], [3, 0], [4,-1], [4, 0], [5,-1], [5, 0], [6,-1], [7,-1], 'E♭'], // E♭
		[[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0], 'E'],   // E
		[[0, 0], [1,-1], [1, 0], [2,-1], [2, 0], [3, 0], [3, 1], [4, 0], [5,-1], [5, 0], [6,-1], [6, 0], 'F'],   // F
		[[-1,1], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0], 'F♯'], // F♯ (Should have G##. Nobody wants to read that kind of bollocks.)
		//[[0, 0], [1,-1], [1, 0], [2,-1], [3,-1], [3, 0], [4,-1], [4, 0], [5,-1], [5, 0], [6,-1], [7,-1], 'G♭'], // G♭ (Should have Ebb. Nobody wants to read that kind of bollocks.)
		[[0, 0], [0, 1], [1, 0], [2,-1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [6,-1], [6, 0], 'G'],   // G
		[[0, 0], [1,-1], [1, 0], [2,-1], [3,-1], [3, 0], [4,-1], [4, 0], [5,-1], [5, 0], [6,-1], [7,-1], 'A♭'], // A♭
		[[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0], 'A'],   // A
		[[0, 0], [1,-1], [1, 0], [2,-1], [2, 0], [3, 0], [4,-1], [4, 0], [5,-1], [5, 0], [6,-1], [6, 0], 'B♭'], // B♭
		[[-1,1], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0], 'B']    // B
	];

	var rchord = /([ABCDEFG][♭♯]?)([^\/]*)(?:\/([ABCDEFG]))?/,
	    empty = [];

	function toRoot(str) {
		var name = (rchord.exec(str) || empty)[1];
		return nameNoteMap[name];
	}

	function toExtension(str) {
		return (rchord.exec(str) || empty)[2];
	}

	function toMode(str) {
		var name = toExtension(str);
		return modes[name];
	}

	function toBass(str) {
		var result = rchord.exec(str) || empty;
		return result[3] || result[1];
	}

	// Pure functions

	function mod(n, m) {
		// Return the modulus while handling negative numbers sensibly.
		return ((n % m) + m) % m ;
	}
	
	function mag(n) {
		// Return the magnitude.
		return n < 0 ? -n : n ;
	}

	function limit(n, min, max) {
		// Return n limited to min and max values.
		return n < min ? min : n > max ? max : n ;
	}
	
	function wrap(n, max, offset) {
		return ((n + offset) % max) - offset;
	}

	// Sort functions

	function byBeat(a, b) {
		return a[1] > b[1] ? 1 : -1 ;
	}

	// Reduce functions

	function sum(total, n) {
		return total + n;
	}

	function max(total, n) {
		return total > n ? total : n;
	}

	function min(total, n) {
		return total < n ? total : n;
	}

	function lesser(total, n) {
		return n < total ? n : total ;
	}

	function greater(total, n) {
		return n > total ? n : total ;
	}

	function add(value, n, i, array) {
		array[i] += value;
		return value;
	}

	function setX(x, obj) {
		obj.x = x;
		return x;
	}

	function setXFromWidth(x, symbol, i) {
		if (!i) {
			symbol.x = 0;
			return x + symbol.width / 2;
		}
		
		symbol.x = x + symbol.width / 2;
		return x + symbol.width;
	}

	function setDuration(x, obj) {
		obj.duration = x;
		return x;
	}

	// Map functions

	function getWidth(obj) {
		return obj.width;
	}

	function getMinWidth(obj) {
		return obj.minwidth;
	}

	function getDuration(obj) {
		return obj.duration;
	}

	function getY(obj) {
		return obj.y;
	}
	
	function mod7(n) {
		return mod(n, 7);
	}

	function mod12(n) {
		return mod(n, 12);
	}
	
	function toFloat(str) {
		return parseFloat(str, 10);
	}
	
	function toChordSymbol(data) {
		return symbolType.chord(data);
	}
	
	// filter functions
	
	function isNote(obj) {
		return obj[0] === 'note';
	}
	
	function isChord(obj) {
		return obj[0] === 'chord';
	}
	
	function isStaveSymbol(obj) {
		return obj.type !== 'chord';
	}
	
	function isChordSymbol(obj) {
		return obj.type === 'chord';
	}
	
	// Object functions
	
	function isDefined(val) {
		return val !== undefined && val !== null;
	}

	function clone(obj) {
		var key;
		var target = {};
		
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				target[key] = obj[key];
			}
		}
		
		return target;
	}

	function deleteProperties(obj) {
		var key;
		
		for (key in obj) {
			if (obj.hasOwnProperty(key)) {
				delete obj[key];
			}
		}
	}

	function first(array) {
		return array[0];
	}

	function last(array) {
		return array[array.length - 1];
	}
	
	function extend(obj) {
		var i = 0,
		    length = arguments.length,
		    obj2, key;
		
		while (++i < length) {
			obj2 = arguments[i];
			
			for (key in obj2) {
				if (obj2.hasOwnProperty(key)) {
					obj[key] = obj2[key];
				}
			}
		}
		
		return obj;
	}

	// SVG DOM functions
	
	function setAttrBaseVal(svg, node, attr, value) {
		node[attr].baseVal = value;
	}
	
	function setAttr(svg, node, attr, value) {
		node.setAttributeNS(null, attr, value);
	}
	
	function textContent(svg, node, attr, value) {
		node.textContent = value;
	}
	
	function getTransform(node, attr) {
		var l = node.transform.baseVal.numberOfItems;
		var transform;
		
		while (l--) {
			transform = node.transform.baseVal.getItem(l);
			
			if (transform.type === transform[transformTypes[attr]]) {
				return transform;
			}
		}
	}
	
	function setTransform(svg, node, attr, value) {
		var transform = getTransform(node, attr);
		
		if (!transform) {
			transform = svg.createSVGTransform();
			node.transform.baseVal.appendItem(transform);
		}
		
		transform[transforms[attr]].apply(transform, value);
	}
	
	function createNode(svg, tag, obj) {
		var node = document.createElementNS(xmlns, tag);
		var attr;
		
		for (attr in obj) {
			attributes[attr](svg, node, attr, obj[attr]);
		}
		
		return node;
	}
	
	function createGroupNode(svg) {
		return createNode(svg, 'g', {});
	}
	
	function append(parent, children) {
		if (typeof children !== 'object') {
			parent.appendChild(children);
			return;
		}
		
		var length = children.length;
		var n = -1;
		
		while (++n < length) {
			parent.appendChild(children[n]);
		}
		
		return parent;
	}
	
	// Scribe logic
	
	function createData(beat, number, duration) {
		return {
			beat: beat,
			number: number,
			duration: duration
		};
	}

	var nameNoteMap = {
		'C':   0,
		'C#':  1,
		'C♯': 1,
		'Db':  1,
		'D♭': 1,
		'D':   2,
		'D#':  3,
		'D♯': 3,
		'Eb':  3,
		'E♭': 3,
		'E':   4,
		'F':   5,
		'F#':  6,
		'F♯': 6,
		'Gb':  6,
		'G♭': 6,
		'G':   7,
		'G#':  8,
		'G♯': 8,
		'Ab':  8,
		'A♭': 8,
		'A':   9,
		'A#':  10,
		'A♯': 10,
		'Bb':  10,
		'B♭': 10,
		'B':   11
	};
	
	var noteKeyMap = [0,-5, 2,-3, 4,-1, 6, 1,-4, 3,-2, 5];

	var scaleMap = [0,2,4,5,7,9,11];
//	var staveMap = [0,0,1,2,2,3,3,4,5,5,6,6];
	var keyCache = {};

	function keyToMap(n) {
		var m = n > 0 ? -1 : 1 ;
		var i;
		var map = [0,0,0,0,0,0,0];

		while (n) {
			i = mod(((n < 0 ? n + 1 : n) * 4 - 1), 7);
			map[i] = map[i] - m;
			n = n + m;
		}

		return map;
	}
	
	function createKeyMap(key, offset) {
		var keyMap = keyToMap(key);
		
		return !offset ? 
			keyMap :
			keyMap.map(function(n, i, array) {
				return array[(i + offset) % 7];
			}) ;
	}
	
	function noteToKey(n) {
		return noteKeyMap[n];
	}
	
	function nameToKey(name) {
		return noteToKey(nameNoteMap[name]);
	}
	
	function toKey(n) {
		return typeof n === 'string' ?
			nameToKey(n) :
			noteToKey(n) ;
	}

	function numberToName(n) {
		return names[numberToNote(n)];
	}

	function numberToOctave(n) {
		return Math.floor(n / 12);
	}
	
	function numberToNote(n) {
		return n % 12;
	}
	
	function numberToOffset(n, spellings) {
		return spellings[numberToNote(n)][0];
	}
	
	function numberToPosition(n, spellings) {
		return 7 * numberToOctave(n) + numberToOffset(n, spellings);
	}

	function mapToStave(symbols, symbol, keyMap, accMap, staveY, transpose, spellings) {
		var number = symbol.number + transpose;
		var octave = numberToOctave(number);
		var note = numberToNote(number);
		var spelling = spellings[note];
		var offset = spelling[0];
		var accidental = spelling[1];
		var position = 7 * octave + offset;
		var staveAcc = isDefined(accMap[position]) ?
		    	accMap[position] :
		    	keyMap[offset] ;
		
		symbol.y = staveY - position;
		
		if (accidental !== staveAcc) {
			// We need an accidental.
			console.log('insert accidental', numberToName(number) + numberToOctave(number), accidental, staveAcc);
			accMap[position] = accidental;
			symbols.push(symbolType.accidental(symbol.beat, accidental, symbol.y));
		}
	}

	var nodeType = {
		bar: function bar(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#bar',
				'translate': [symbol.x, 0]
			});
		},

		endline: function endline(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#endline',
				'translate': [symbol.x, 0]
			});
		},

		clef: function clef(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#clef[' + symbol.value + ']',
				'translate': [symbol.x, 0]
			});
		},

		rest: function rest(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#rest[' + symbol.duration + ']',
				'translate': [symbol.x, 0]
			});
		},

		tie: function tie(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#tie',
				'translate': [symbol.x, symbol.y],
				'scale': [symbol.width, (symbol.y > 0 ? 1 : -1) * (1 + 0.08 * symbol.width)]
			});
		},

		accidental: function accidental(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#accidental[' + symbol.value + ']',
				'translate': [symbol.x, symbol.y]
			});
		},

		note: function note(svg, symbol) {
			var minwidth = 0;
			var width = 0;
			var node = createNode(svg, 'g', {
				'translate': [symbol.x, symbol.y]
			});
			var head = createNode(svg, 'use', {
				'href': '#head[' + symbol.duration + ']'
			});
			
			node.appendChild(head);
			
			return node;
		},
		
		stalkup: function stalkup(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#stalkup'
			});
		},
	
		stalkdown: function stalkdown(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#stalkdown'
			});
		},
		
		tailup: function tail(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#tailup[' + symbol.duration +']'
			});
		},
		
		taildown: function tail(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#taildown[' + symbol.duration +']'
			});
		},
		
		stave: function stave(svg, x, y, w) {
			var node = createNode(svg, 'g', {
				'translate': [x, y]
			});

			var lines = createNode(svg, 'use', {
				'href': '#stave',
				'scale': [w, 1]
			});
			
			node.appendChild(lines);
			
			return node;
		},
		
		chord: function chord(svg, symbol) {
			console.log(symbol);
			return createNode(svg, 'text', {
				'class': 'scribe-chord',
				'x': symbol.x,
				'y': symbol.y,
				'text': symbol.text
			});
		}
	};
	
	var symbolType = {
		bar: function bar(beat) {
			return {
				type: 'bar',
				minwidth: 1,
				width: 2,
				beat: beat,
				duration: 0,
				y: 0
			};
		},

		endline: function endline() {
			return {
				type: 'endline',
				minwidth: 3.6,
				width: 5.2,
				duration: 0,
				y: 0
			};
		},

		clef: function clef(value) {
			return {
				type: 'clef',
				value: value,
				minwidth: 10,
				width: 10,
				beat: 0,
				duration: 0,
				y: 0
			};
		},
		
		rest: function rest(beat, duration) {
			return {
				type: 'rest',
				minwidth: 2.5 + duration,
				width: 3 + duration * 4,
				y: 0,
				beat: beat,
				duration: duration
			};
		},

		note: function note(beat, duration, number, from, y) {
			return {
				type: 'note',
				minwidth: 3,
				width: 4 + 3 * limit(duration, 0.25, 4),
				beat: beat,
				duration: duration,
				number: number,
				from: from,
				y: y
			};
		},
		
		accidental: function accidental(beat, value, y) {
			return {
				type: 'accidental',
				value: value,
				minwidth: 2,
				width: 2.5,
				beat: beat,
				duration: 0,
				y: y
			};
		},
		
		space: function space(beat, width) {
			return {
				type: 'space',
				beat: beat,
				minwidth: 3,
				width: width || 4
			}
		},
		
		chord: function chord(beat, text) {
			return {
				type: 'chord',
				beat: beat,
				text: text
			};
		}
	};
	
	function beatOfBar(beat, beatsPerBar) {
		// Placeholder function for when beatsPerBar becomes a map
		return beat % beatsPerBar;
	}

	function beatOfBarN(scribe, beat, n) {
		// Find the beat of the nth bar in the future.
		beat = scribe.barOfBeat(beat).beat;
		
		while (n--) {
			beat += scribe.barOfBeat(beat).duration;
		}
		
		return beat;
	}
	
	function durationOfBar(beat, beatsPerBar) {
		// Placeholder function for when beatsPerBar becomes a map
		return beatsPerBar;
	}
	
	function breaksOfBar(beat, beatsPerBar) {
		// Placeholder function for when beatsPerBar becomes a map
		return barBreaks[beatsPerBar];
	}
	
	function nextBreakpoint(bar, beat) {
		var b = -1;
		var breakpoint;
		
		while (++b < bar.breaks.length) {
			breakpoint = bar.beat + bar.breaks[b];
			
			if (beat < breakpoint) {
				return breakpoint;
			}
		}
		
		return bar.beat + bar.duration;
	}
	
	function fitRestSymbol(bar, beat, duration) {
		var barBreak;
		var b = -1;
		var d = 2;
		var breakpoint;
		
		// Any whole bar of longer than two beat's rest gets a 4 beat rest symbol.
		if (beat - bar.beat === 0 && bar.duration > 2 && duration >= bar.duration) {
			return symbolType.rest(beat, 4);
		}
		
		// Reduce duration to the nearest bar breakpoint
		breakpoint = nextBreakpoint(bar, beat);
		
		if (beat + duration > breakpoint) {
			duration = breakpoint - beat;
		}
		
		// Handle rests of 2 – 4 beats duration.
		if ((beat - bar.beat) % 1 === 0 && duration >=2) {
			return symbolType.rest(beat, duration > 4 ? 4 : Math.floor(duration));
		}
		
		// Handle rests of a beat or less. No sane person wants to read rests
		// any shorter than an 1/32th note.
		while ((d /= 2) >= 0.125) {
			if ((beat - bar.beat) % d === 0 && duration >= d) {
				return symbolType.rest(beat, d);
			}
		}

		if (debug) console.log('Scribe: not able to make rest for beat:', beat, 'duration:', duration);
		
		return;
	}

	function createKeySymbols(key) {
		var n = 0,
		    symbols = [];
		
		if (key === 0) { return symbols; }
		
		if (key > 0) {
			while(n++ < key) {
				symbols.push(symbolType.accidental(0, 1, mod7(n * 3 + 5) - 5));
			}
		}
		else {
			while(n-- > key) {
				symbols.push(symbolType.accidental(0, -1, mod7(n * 3) - 4));
			}
		}
		
		symbols.push(symbolType.space(0));
		
		return symbols;
	}
	
	function spellingToName(spelling) {
		return lines[spelling[0]] + accidentals[spelling[1]];
	}
	
	function createChordSymbols(scribe, data, start, end, options) {
		console.log('createChordSymbols');
		var chordsData = data.filter(isChord);
		var l = chordsData.length;
		var n = -1;
		var output = [];
		var chord, beat, root, extension, spelling, name;
		
		while (++n < l) {
			chord = chordsData[n];
			beat = chord[1];
			root = mod12(toRoot(chord[2]) + options.transpose);
			extension = toExtension(chord[2]);
			spelling = scribe.spellingsOfBeat(chord[1])[root];
			name = spellingToName(spelling) + extension;
			output.push(symbolType.chord(beat, name));
		}
		
		return output;
	}
	
	function createMusicSymbols(scribe, data, start, end, options) {
		var noteData = data.filter(isNote);
		var symbols = [];
		var n = 0;
		var beam = newBeam();
		var accMap = {};
		var beat, duration, bar, symbol, note, breakpoint, nextBeat, spellings;

		console.log('createMusicSymbols', start, end);

		symbols.push(symbolType.bar(start));

		while ((symbol = last(symbols)).beat < end) {
			console.groupEnd();

			bar = scribe.barOfBeat(symbol.beat);
			note = noteData[n];
			nextBeat = isDefined(note) ? note[1] : end;
			breakpoint = nextBreakpoint(bar, symbol.beat);
			beat = symbol.beat;
			duration = symbol.duration;

			console.groupCollapsed('Scribe: symbol', symbol.type, symbol.beat, symbol.duration);

			// Where the last symbol overlaps the next note, shorten it.
			if (note && symbol.beat + symbol.duration > nextBeat) {
				console.log('shorten');
				symbol.duration = nextBeat - symbol.beat;

				if (symbol.type === 'note') {
					symbol.width = 4 + 3 * limit(symbol.duration, 0.25, 4);
				}
			}

			if (symbol.type === 'bar') {
				beam = newBeam(beam);
			}

			if (symbol.type === 'rest' && options.beamBreaksAtRest) {
				beam = newBeam(beam);
			}

			if (symbol.type === 'note') {
				// Where the last symbol is less than 1 beat duration, or within
				// 1 beat of a breakpoint, add it to the beam.
				if (symbol.duration < 1 || breakpoint - symbol.beat < 1) {
					beam.push(symbol);
					symbol.beam = beam;
				}
				else if (beam.length) {
					beam = newBeam(beam);
				}
				
				// Where the last symbol overlaps a bar, shorten it, insert a
				// bar, and push a new symbol with a link to the existing one.
				if (symbol.beat + symbol.duration > bar.beat + bar.duration) {
					console.log('shorten to bar');
					symbols.push(symbolType.bar(bar.beat + bar.duration));
					deleteProperties(accMap);
					beam = newBeam(beam);
					
					symbols.push(symbolType.note(bar.beat + bar.duration, symbol.beat + symbol.duration - bar.beat - bar.duration, symbol.number, symbol, symbol.y));
					symbol.duration = bar.beat + bar.duration - symbol.beat;
					symbol.width = 4 + 3 * limit(symbol.duration, 0.25, 4);
					
					symbol.to = last(symbols);
					last(symbols).from = symbol;
					
					continue;
				}
	
				// Where the last symbol is a note of less than 2 beats duration
				// that overlaps a breakpoint, shorten it and push a new symbol with
				// a link to the existing one.
				if ((symbol.duration < 2 || symbol.duration % 1) && symbol.beat + symbol.duration > breakpoint) {
					console.log('shorten to breakpoint');
					symbols.push(symbolType.note(breakpoint, symbol.beat + symbol.duration - breakpoint, symbol.number, symbol, symbol.y));
					symbol.duration = breakpoint - symbol.beat;
					symbol.width = 4 + 3 * limit(symbol.duration, 0.25, 4);
					
					symbol.to = last(symbols);
					last(symbols).from = symbol;
					
					beam = newBeam(beam);
					continue;
				}

				// Where the symbol arrives at a breakpoint, start a new beam.
				if (symbol.beat + symbol.duration === breakpoint) {
					beam = newBeam(beam);
				}
			}
			
			// Where the symbol arrives at a bar end, insert a bar line.
			if (symbol.beat + symbol.duration === bar.beat + bar.duration) {
				console.log('insert bar', bar.beat + bar.duration);
				symbols.push(symbolType.bar(bar.beat + bar.duration));
				deleteProperties(accMap);
				continue;
			}

			// Where the last symbol doesn't make it as far as the next note,
			// insert a rest.
			if (symbol.beat + symbol.duration < nextBeat) {
				console.log('insert rest', nextBeat);
				symbols.push(fitRestSymbol(bar, symbol.beat + symbol.duration, nextBeat - symbol.beat - symbol.duration));
				continue;
			}
			
			if (!note) { break; }
			
			// Insert a note and increment n
			symbol = symbolType.note(note[1], note[3], note[2]);
			console.log(symbol);
			spellings = scribe.spellingsOfBeat(note[1]);
			
			// Handle y positioning
			mapToStave(symbols, symbol, bar.keyMap, accMap, bar.center, options.transpose, spellings);
			
			symbols.push(symbol);
			n++;
		}
		
		console.groupEnd();
		
		return symbols;
	}
	
	function createSymbols(scribe, data, start, end, options) {
		var musicSymbols = createMusicSymbols(scribe, data, start, end, options);
		var chordSymbols = createChordSymbols(scribe, data, start, end, options);
		
		return [musicSymbols, chordSymbols];
	}

	function sliceByBeat(array, start, end) {
		var output = [],
		    length = array.length,
		    n = -1;
		
		// We'll assume the array is already sorted.
		while (++n < length) {
			if (array[n].beat >= end) {
				return output;
			}
			
			if (array[n].beat < start) {
				continue;
			}
			
			if (array[n].beat === start && array[n].type === 'bar') {
				continue;
			}
			
			output.push(array[n]);
		}
		
		return output;
	}
	
	// Renderer
	
	function renderLedgers(svg, layer, symbol) {
		var y = 0;

		// Render ledger lines
		if (symbol.y > 5) {
			y = symbol.y + 1;
			
			while (--y > 5) {
				if (y % 2) { continue; }
				
				layer.appendChild(
					createNode(svg, 'use', {
						'href': '#line',
						'class': 'scribe-stave',
						'translate': [symbol.x - 2.2, y],
						'scale': [4.4, 1]
					})
				);
			}
		}

		if (symbol.y < -5) {
			y = symbol.y - 1;
			
			while (++y < -5) {
				if (y % 2) { continue; }
				
				layer.appendChild(
					createNode(svg, 'use', {
						'href': '#line',
						'class': 'scribe-stave',
						'translate': [symbol.x - 2.2, y],
						'scale': [4.4, 1]
					})
				);
			}
		}
	}
	
	function renderTie(svg, layer, symbol) {
		if (!symbol.to) { return; }
		
		layer.appendChild(nodeType.tie(svg, {
			x: symbol.x + 1.25,
			y: symbol.y,
			width: symbol.to.x - symbol.x - 2.75
		}));
	}
	
	function renderNote(svg, layer, symbol) {
		var node = nodeType[symbol.type](svg, symbol);
		
		if (!symbol.beam && symbol.duration && symbol.duration < 4) {
			if (symbol.y > 0) {
				// Stalks down
				node.appendChild(nodeType.stalkup(svg, symbol));
				if (symbol.duration < 1) {
					node.appendChild(nodeType.tailup(svg, symbol));
				}
			}
			else {
				// Stalks up
				node.appendChild(nodeType.stalkdown(svg, symbol));
				if (symbol.duration < 1) {
					node.appendChild(nodeType.taildown(svg, symbol));
				}
			}
		}
		
		layer.appendChild(node);
	}
	
	function createBeamY(symbols, options) {
		var symbol1   = first(symbols);
		var symbol2   = last(symbols);
		var symbolsY  = symbols.map(getY);
		var avgY      = symbolsY.reduce(sum) / symbols.length;
		var factorG   = options.beamGradientFactor || 0.75;
		var maxG      = isDefined(options.beamGradientMax) ? options.beamGradientMax : 1 ;
		var gradient  = limit(factorG * (symbol2.y - symbol1.y) / (symbol2.x - symbol1.x), -maxG, maxG);
		var xMid      = symbol1.x + 0.5 * (symbol2.x - symbol1.x);
		var offsetY   = avgY > 0 ? symbolsY.reduce(min) : symbolsY.reduce(max);
		
		return function beamY(x) {
			return (x - xMid) * gradient + offsetY;
		}
	}
	
	function renderGroup(svg, layer, symbols, options) {
		var length = symbols.length;
		var avgY   = symbols.map(getY).reduce(sum) / length;
		var beamY  = createBeamY(symbols, options);
		var stalk  = avgY < 0 ? defaults.stalkDown : defaults.stalkUp ;
		var node   = createNode(svg, 'g');

		renderStalks(svg, node, symbols, stalk, beamY);
		renderBeams(svg, node, symbols, stalk.x2, stalk.y2, beamY, 1);
		
		layer.appendChild(node);
	}

	function renderStalks(svg, node, symbols, offsets, beamY) {
		var length = symbols.length;
		var n = -1;
		var symbol;
		
		// Render the stalks
		while (++n < length) {
			symbol = symbols[n];
			
			node.appendChild(createNode(svg, 'line', {
				'class': 'scribe-stalk',
				x1: offsets.x1 + symbol.x,
				y1: offsets.y1 + symbol.y,
				x2: offsets.x2 + symbol.x,
				y2: offsets.y2 + beamY(symbol.x)
			}));
		}
	}

	function newBeam(beam) {
		if (!beam) { return []; }
		if (beam.length === 0) { return beam; }
		if (beam.length === 1) {
			// Remove the beam from the only symbol that carries it.
			delete beam[0].beam;
		}
		return [];
	}

	function renderBeam(svg, node, xStart, xEnd, xOffset, yOffset, beamY) {
		var beamWidth = (yOffset < 0 ? 1 : -1) * defaults.beam.width;
		
		// Render the beam
		node.appendChild(createNode(svg, 'path', {
			'class': 'scribe-beam',
			'd': [
				'M', xOffset + xStart, ' ', yOffset + beamY(xStart) + beamWidth,
				'L', xOffset + xEnd,   ' ', yOffset + beamY(xEnd) + beamWidth,
				'L', xOffset + xEnd,   ' ', yOffset + beamY(xEnd),
				'L', xOffset + xStart, ' ', yOffset + beamY(xStart),
				'Z'
			].join('')
		}));
	}

	function renderBeams(svg, node, symbols, xOffset, yOffset, beamY, duration) {
		var length = symbols.length;
		var n = -1;
		var beam = [];
		var symbol, xStart, xEnd;
		
		// Render the stalks
		while (++n < length) {
			symbol = symbols[n];
			
			if (symbol.duration <= duration * 0.75) {
				beam.push(symbol);
				if (n < length - 1) {
					continue;
				}
			}
			
			if (beam.length) {
				xStart = first(beam).x;
				xEnd = beam.length === 1 ?
					first(beam) === first(symbols) ? xStart + 2.5 :
					first(beam) === last(symbols) ? xStart - 2.5 :
					first(beam).beat % duration === 0 ? xStart - 2.5 :
					xStart + 2.5 : last(beam).x ;
				
				renderBeam(svg, node, xStart, xEnd, xOffset, yOffset, beamY);
				renderBeams(svg, node, beam, xOffset, yOffset + (yOffset < 0 ? 1 : -1) * defaults.beam.spacing, beamY, duration * 0.5);
			}
			
			beam.length = 0;
		}
	}

	function renderSymbols(svg, symbols, layers, options) {
		var length = symbols.length,
		    n = -1,
		    x = 0,
		    symbol, node, beam;

		while (++n < length) {
			symbol = symbols[n];

			//if (debug) console.log('Scribe: write symbol', symbol);

			if (symbol.type === 'space') { continue; }

			if (symbol.type !== 'note') {
				node = nodeType[symbol.type](svg, symbol);
				layers[0].appendChild(node);
				continue;
			}

			if (symbol.beam && symbol.beam !== beam) {
				beam = symbol.beam;
				renderGroup(svg, layers[1], symbol.beam, options);
			}

			renderNote(svg, layers[1], symbol);
			renderTie(svg, layers[1], symbol);
			renderLedgers(svg, layers[0], symbol);
		}
	}

	function symbolsXFromRatio(symbols, ratio) {
		var length = symbols.length;
		var n = -1;
		var x = 0;
		var symbol, renderwidth;
		
		while (++n < length) {
			symbol = symbols[n];
			renderwidth = symbol.width + ratio * (symbol.width - symbol.minwidth);

			if (n) { x += renderwidth / 2; }
			symbol.x = x;
			symbol.renderwidth = renderwidth;
			x += renderwidth / 2;
		}
	}
	
	function symbolsXFromRefSymbols(symbols, refSymbols) {
		// This is a bit nasty but it's a stop-gap measure until we work out how to reliably
		// render multi-staves with events that still line up.
		var length = symbols.length;
		var n = -1;
		var m = -1;
		var x = 0;
		var symbol, refSymbol, prevSymbol, xRatio, xMin, xMax, xDistance;
		
		while (++n < length) {
			symbol = symbols[n];
			
			while (refSymbol = refSymbols[++m], refSymbol && refSymbol.beat < symbol.beat) {
				prevSymbol = refSymbol;
			}
			
			if (refSymbol.beat === symbol.beat) {
				symbol.x = refSymbol.x;// - refSymbol.renderwidth / 2 ;
			}
			else {
				xRatio = (symbol.beat - prevSymbol.beat) / (refSymbol.beat - prevSymbol.beat);
				xMin = prevSymbol.x - prevSymbol.renderwidth / 2;
				xMax = refSymbol.x - refSymbol.renderwidth / 2;
				symbol.x = xMin + xRatio * (xMax - xMin);
			}
		}
	}

	function prepareStaveSymbols(symbols, start, end, options) {
		var clef, key;
		
		if (options.clefOnEveryStave || start === options.start) {
			clef = [symbolType.clef(options.clef)];
			key  = createKeySymbols(scribe.key);
		}
		else {
			clef = key = [];
		}
		
		return [symbolType.bar(start)]
			.concat(clef)
			.concat(key)
			.concat(symbols)
			.concat([end >= options.end ? symbolType.endline(end) : symbolType.bar(end)]);
	}

	function prepareChordSymbols(symbols, start, end, options) {
		return symbols;
	}

	function renderChords(svg, symbols, x, y, width, options) {
		var node = createNode(svg, 'g', {
			translate: [x, y]
		});
		
		renderSymbols(svg, symbols, [node], options);
		
		svg.appendChild(node);
	}

	function renderStave(svg, symbols, x, y, width, options) {
		console.log('Rendering symbols to stave width:', width);
		
		// Create the nodes and plonk them in the DOM.
		var node = nodeType.stave(svg, x, y, width);
		var layers = [svg, svg].map(createGroupNode);
		
		renderSymbols(svg, symbols, layers, options);
		append(node, layers);
		svg.appendChild(node);
	}

	function renderStaves(scribe, svg, tracks, start, end, width, bars, cursor, options) {
		var symbols1 = prepareStaveSymbols(tracks[0], start, end, options);
		var symbols2 = prepareChordSymbols(tracks[1], start, end, options);
		
		// Find the minwidth of all the symbols, and if it's too wide render a
		// stave with fewer bars.
		var minwidth = symbols1.map(getMinWidth).reduce(sum) - first(symbols1).minwidth / 2 - last(symbols1).minwidth / 2;
		
		if (minwidth > width) {
			bars--;
			end = beatOfBarN(scribe, start, bars);
			tracks = tracks.map(function(symbols) {
				return sliceByBeat(symbols, start, end);
			});
			
			console.log('Too many symbols for stave. Trying beats', start, '–', end, '(', bars, 'bars ).');
			
			return renderStaves(scribe, svg, tracks, start, end, width, bars, cursor, options);
		}
		
		// If we are at the end and there is enough width, set the x positions
		// to their ideals, creating a shorter last stave, otherwise fit the
		// symbols to the width of the stave.
		var idealwidth = symbols1.map(getWidth).reduce(sum) - first(symbols1).width / 2 - last(symbols1).width / 2;

		if (end >= options.end && idealwidth <= width) {
			symbols1.reduce(setXFromWidth, 0);
			width = idealwidth;
		}
		else {
			symbolsXFromRatio(symbols1, (width - idealwidth) / (idealwidth - minwidth));
		}
		
		// A bit of a fudge, but it'll do for now.
		symbolsXFromRefSymbols(symbols2, symbols1);

		// Find the offset of the highest symbol
		var minY = symbols1.map(getY).reduce(min);

		renderChords(svg, symbols2, options.paddingLeft, cursor.y + options.chordsOffset, width, options);
		
		cursor.y += minY > -5 ? 0 : -(minY + 5) ;
		
		renderStave(svg, symbols1, options.paddingLeft, cursor.y, width, options);
		
		cursor.beat = end;
	}

	function renderScribe(scribe, svg, data, options) {
		var tracks = createSymbols(scribe, data, options.start, options.end, options);
		var width = options.width - options.paddingLeft - options.paddingRight;
		var start = options.start;
		var end;
		var cursor = {
			beat: start,
			y: options.paddingTop + 4
		};
		
		function slice(symbols) {
			return sliceByBeat(symbols, start, end);
		}
		
		while (start < options.end) {
			end = beatOfBarN(scribe, start, scribe.staveBarsAtBeat(start));
			
			if (end > options.end) {
				end = options.end;
			}
			
			if (end === start) {
				throw new Error('No. That cant be.');
			}
			
			console.groupCollapsed('Scribe: rendering stave. Beats:', start, '–', end, '(', options.barsPerStave, 'bars ).');
			renderStaves(scribe, svg, tracks.map(slice), start, end, width, options.barsPerStave, cursor, options);
			start = cursor.beat;
			console.groupEnd();
			
			cursor.y += options.staveSpacing;
		}
	}
	
	function clearScribe(scribe, svg) {
		var groups = svg.querySelectorAll('svg > g');
		var l = groups.length;
		
		// A quick n dirty means of clearing out the svg.
		while (l--) {
			svg.removeChild(groups[l]);
		}
	}
	
	function Scribe(svg, data, user) {
		// Make 'new' keyword optional.
		if (!(this instanceof Scribe)) {
			return new Scribe(svg, data, user);
		}

		var scribe = this;

		svg = typeof svg === 'string' ? find(svg) : svg ;

		var settings = extend({}, defaults, user);

		var options = extend({
			width: svg.viewBox.baseVal.width,
			height: svg.viewBox.baseVal.height
		}, settings);

		var flag;
		var _spellings = {};
		var _bars = {};

		function update() {
			flag = false;
			
			data.sort(byBeat);

			if (!isDefined(settings.end)) {
				options.end = beatOfBarN(scribe, last(data)[1] + last(data)[3], 1);
			}
			
			clearScribe(scribe, svg);
			renderScribe(scribe, svg, data, options);
		}

		function queueRender() {
			if (flag) { return; }
			flag = true;
			window.requestAnimationFrame(update);
		}

		function spellingsOfBeat(beat) {
			var chords, chord, mode, root, l;
			
			if (_spellings[beat]) {
				return _spellings[beat];
			}
			
			chords = this.data.filter(isChord).filter(function(chord) {
				return chord[1] <= beat;
			});
			
			// Find the latest chord that has some useful information about
			// the key centre.
			l = chords.length;
			
			while ((!isDefined(root) || !isDefined(mode)) && l--) {
				chord = chords[l];
				root  = mod12(toRoot(chord[2]) + options.transpose);
				mode  = toMode(chord[2]);
			}
			
			if (l === -1) {
				console.log('Chord not found. Using C spelling.');
				return spellingsMap[0];
			}
			
			return (_spellings[beat] = spellingsMap[mod12(root - mode)]);
		}

		function barOfBeat(beat) {
			var beatStart;
			
			if (_bars[beat]) {
				return _bars[beat];
			}
			
			beatStart = beat - (beat % this.beatsPerBar);
			
			if (_bars[beatStart]) {
				return (_bars[beat] = _bars[beatStart]);
			}
			
			return (_bars[beat] = _bars[beatStart] = {
				beat:     beatStart,
				duration: durationOfBar(beat, this.beatsPerBar),
				breaks:   breaksOfBar(beat, this.beatsPerBar),
				keyMap:   this.keyMap[0],
				center:   this.staveNoteY
			});
		}
		
		function staveBarsAtBeat(beat) {
			if (typeof options.barsPerStave === 'number') {
				return options.barsPerStave;
			}
			
			var keys = Object.keys(options.barsPerStave).map(toFloat).filter(function(n) {
				return n <= beat;
			});
			
			return options.barsPerStave[last(keys)];
		}
		
		function transpose(n) {
			options.transpose = n;
			this.render();
		}

		this.spellingsOfBeat = spellingsOfBeat;
		this.barOfBeat = barOfBeat;
		this.staveBarsAtBeat = staveBarsAtBeat;
		
		this.render = queueRender;
		this.transpose = transpose;
		this.staveNoteY = numberToPosition(clefs[options.clef], spellingsMap[0]);

		this.data = data = data || [];
		this.beatsPerBar = 4;
		
		this.key = toKey(options.key || 'C');
		
		console.log('key:', this.key, createKeyMap(this.key, this.staveNoteY));
		
		this.keyMap = {
			0: createKeyMap(this.key)
		};
		
		if (debug) { console.log('Scribe: ready to write on svg#' + svg.id); }
		
		if (data) {
			queueRender();
		}
	}
	
	Scribe.prototype = {
		note: function(beat, number, duration) {
			var svg = this.svg;
			var data = createData(beat, number, duration);
			
			this.data.push(data);
			this.render();
			
			return this;
		},
		
		createNode: createNode
	}
	
	Scribe.defaults = defaults;
	
	window.Scribe = Scribe;
})();
