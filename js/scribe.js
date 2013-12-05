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
		'x1': setAttr,
		'y1': setAttr,
		'x2': setAttr,
		'y2': setAttr,
		'd': setAttr,
		'href': setAttrBaseVal,
		'translate': setTransform,
		'scale': setTransform,
		'rotate': setTransform
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
	    	
	    	clefOnEveryStave: false,
	    	keyOnEveryStave: false,
	    	barsPerStave: 4,

	    	paddingTop: 12,
	    	paddingLeft: 3,
	    	paddingRight: 3,
	    	paddingBottom: 6,
	    	
	    	staveSpacing: 24,
	    	
	    	start: 0,
	    	end: 48,
	    	transpose: 0
	    };


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
		return a.beat > b.beat ? 1 : -1 ;
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
	
	function createData(type, number, beat, duration) {
		return {
			type: type,
			number: number,
			beat: beat,
			duration: duration
		};
	}
	
	var noteNameMap = [
		'C',
		'C♯',
		'D',
		'E♭',
		'E',
		'F',
		'F♯',
		'G',
		'A♭',
		'A',
		'B♭',
		'B'
	];

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
	var staveMap = [0,0,1,2,2,3,3,4,5,5,6,6];
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
		return noteNameMap[numberToNote(n)];
	}

	function numberToOctave(n) {
		return Math.floor(n / 12);
	}
	
	function numberToNote(n) {
		return n % 12;
	}
	
	function numberToOffset(n) {
		return staveMap[numberToNote(n)];
	}
	
	function numberToPosition(n) {
		return 7 * numberToOctave(n) + numberToOffset(n);
	}
	
	function numberToAccidental(n) {
		var note = numberToNote(n);
		var pos = staveMap[note];
		
		return note - scaleMap[pos];
	}
	
	function mapToStave(symbols, symbol, keyMap, accMap, staveY, transpose) {
		var number = symbol.number + transpose;
		var offset = numberToOffset(number);
		var position = numberToPosition(number);
		var accidental = numberToAccidental(number);
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
				'class': 'scribe-bar',
				'translate': [symbol.x, 0]
			});
		},

		clef: function clef(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#treble',
				'class': 'scribe-clef',
				'translate': [symbol.x, 0]
			});
		},

		rest: function rest(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#rest[' + symbol.duration + ']',
				'class': 'scribe-rest',
				'translate': [symbol.x, 0]
			});
		},

		tie: function tie(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#tie',
				'class': 'scribe-tie',
				'translate': [symbol.x, symbol.y],
				'scale': [symbol.width, symbol.height]
			});
		},

		accidental: function accidental(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#accidental[' + symbol.value + ']',
				'class': 'scribe-accidental',
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
				'href': '#head[' + symbol.duration + ']',
				'class': 'scribe-note'
			});
			
			node.appendChild(head);
			
			return node;
		},
		
		stalkup: function stalkup(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#stalkup',
				'class': 'scribe-stalk'
			});
		},
	
		stalkdown: function stalkdown(svg, symbol) {
			return createNode(svg, 'use', {
				'href': '#stalkdown',
				'class': 'scribe-stalk'
			});
		},
		
		tailup: function tail(svg, symbol) {
			return createNode(svg, 'use', {
				'class': 'scribe-tail',
				'href': '#tailup[' + symbol.duration +']'
			});
		},
		
		taildown: function tail(svg, symbol) {
			return createNode(svg, 'use', {
				'class': 'scribe-tail',
				'href': '#taildown[' + symbol.duration +']'
			});
		},
		
		stave: function stave(svg, x, y, w) {
			var node = createNode(svg, 'g', {
				'translate': [x, y]
			});

			var lines = createNode(svg, 'use', {
				'href': '#stave',
				'class': 'scribe-stave',
				'scale': [w, 1]
			});

			var bar = createNode(svg, 'use', {
				'href': '#bar',
				'class': 'scribe-bar'
			});
			
			node.appendChild(lines);
			node.appendChild(bar);
			
			return node;
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

		clef: function clef(beat, duration) {
			return {
				type: 'clef',
				minwidth: 8,
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
				minwidth: 2.8,
				width: 4 + 3 * duration,
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
		}
	};
	
	function beatOfBar(beat, beatsPerBar) {
		// Placeholder function for when beatsPerBar becomes a map
		return beat % beatsPerBar;
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

	function pushKeySig(symbols, key) {
		var n = 0;
		
		if (key === 0) { return; }
		
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
	}
	
	function createSymbols(scribe, data, start, end, options) {
		var symbols = [];
		var n = 0;
		var beam = newBeam();
		var accMap = {};
		var beat, duration, bar, symbol, note, breakpoint, nextBeat;
		
		data.sort(byBeat);
		
		if (!options.clefOnEveryStave || start === 0) {
			symbols.push(symbolType.clef());
		}

		if (!options.keyOnEveryStave || start === 0) {
			pushKeySig(symbols, scribe.key);
		}
		
		while ((symbol = last(symbols)).beat < end) {
			console.groupEnd();
			
			bar = scribe.barOfBeat(symbol.beat);
			note = data[n];
			nextBeat = note && note.beat || end;
			breakpoint = nextBreakpoint(bar, symbol.beat);
			beat = symbol.beat;
			duration = symbol.duration;
			
			console.groupCollapsed('Scribe: symbol', symbol.type, symbol.beat, symbol.duration);
			
			// Where the last symbol overlaps the next note, shorten it.
			if (note && symbol.beat + symbol.duration > nextBeat) {
				console.log('shorten');
				symbol.duration = nextBeat - symbol.beat;
			}
			
			if (symbol.type === 'bar') {
				beam = newBeam(beam);
			}
			
			if (symbol.type === 'rest' && options.beamBreaksAtRest) {
				beam = newBeam(beam);
			}
			
			if (symbol.type === 'note') {
				// Where the last symbol is less than 1 beat duration, add it to
				// beam.
				if (symbol.duration < 1) {
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
					
					symbols.push(symbolType.note(bar.beat + bar.duration, symbol.beat + symbol.duration - bar.beat - bar.duration, symbol.number))
					symbol.duration = bar.beat + bar.duration - symbol.beat;
					
					symbol.to = last(symbols);
					last(symbols).from = symbol;
					
					continue;
				}
	
				// Where the last symbol is a note of less than 2 beats duration
				// that overlaps a breakpoint, shorten it and push a new symbol with
				// a link to the existing one.
				if (symbol.duration < 2 && symbol.beat + symbol.duration > breakpoint) {
					console.log('shorten to breakpoint');
					symbols.push(symbolType.note(breakpoint, symbol.beat + symbol.duration - breakpoint, symbol.number, symbol))
					symbol.duration = breakpoint - symbol.beat;
					
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
				console.log('insert bar');
				symbols.push(symbolType.bar(bar.beat + bar.duration));
				deleteProperties(accMap);
				continue;
			}

			// Where the last symbol doesn't make it as far as the next note,
			// insert a rest.
			if (symbol.beat + symbol.duration < nextBeat) {
				console.log('insert rest');
				symbols.push(fitRestSymbol(bar, symbol.beat + symbol.duration, nextBeat - symbol.beat - symbol.duration));
				continue;
			}
			
			if (!note) { break; }
			
			// Insert a note and increment n
			symbol = symbolType.note(note.beat, note.duration, note.number);
			
			// Handle y positioning
			
			mapToStave(symbols, symbol, bar.keyMap, accMap, bar.center, options.transpose);
			
			symbols.push(symbol);
			n++;
		}
		
		console.groupEnd();
		
		return symbols;
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

	function updateSymbolsX(symbols, width, options) {
		var n = -1,
		    x = 0,
		    symbol, width, diff;
		
		var length = symbols.length;
		var lastSymbol = last(symbols);
		var symbolsMin   = symbols.map(getMinWidth).reduce(sum) - lastSymbol.minwidth / 2;
		var symbolsWidth = symbols.map(getWidth).reduce(sum) - lastSymbol.width / 2;
		var diffWidth    = width - symbolsWidth;
		var diffRatio    = diffWidth / (symbolsWidth - symbolsMin);
		
		if (symbolsMin > width) {
			console.log('Scribe: too many symbols for the stave.');
		}
		
		console.log('Width', width, 'ideal width', symbolsWidth, 'min width', symbolsMin);
		
		while (++n < length) {
			symbol = symbols[n];
			diff = symbol.width - symbol.minwidth;
			width = limit(symbol.width + diffRatio * diff, symbol.minwidth, symbol.width * symbol.width / symbol.minwidth);
			
			// Handle x positioning
			symbol.x = x + width / 2;
			x += width;
		}
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
			x: symbol.x + 1,
			y: symbol.y + 1.25,
			width: symbol.to.x - symbol.x - 2.25,
			height: 0.375 * (symbol.to.x - symbol.x - 2.25)
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
	
	function renderStave(svg, symbols, y, options) {
		var width = options.width - options.paddingLeft - options.paddingRight;
		var node = nodeType.stave(svg, options.paddingLeft, options.paddingTop + y, width);
		var layers = [svg, svg].map(createGroupNode);

		// Add a bar line at the end of the stave.
		symbols.push(symbolType.bar());

		updateSymbolsX(symbols, width, options);
		append(node, layers);
		renderSymbols(svg, symbols, layers, options);
		svg.appendChild(node);
	}

	function renderScribe(scribe, svg, options) {
		var start = options.start;
		var end = options.end;
		var beat = start;
		var symbols = createSymbols(scribe, scribe.data, start, end, options);
		var lastSymbol = last(symbols);
		var n = 0, y;
		
		while (beat < lastSymbol.beat) {
			console.groupCollapsed('Scribe: rendering stave. Beats:', beat, '–', beat + 16);
			y = options.paddingTop + 4 + options.staveSpacing * n++;
			renderStave(svg, sliceByBeat(symbols, beat, beat + 16), y, options);
			beat = beat + 16;
			console.groupEnd();
		}
	}
	
	function Scribe(id, options) {
		// Make 'new' keyword optional.
		if (!(this instanceof Scribe)) {
			return new Scribe(id, options);
		}
		
		var svg = find(id);
		var scribe = this;
		var settings = extend({
			width: svg.viewBox.baseVal.width,
			height: svg.viewBox.baseVal.height
		}, defaults, options);
		
		var flag;
		
		function update() {
			flag = false;
			renderScribe(scribe, svg, settings);
		}
		
		function queueRender() {
			if (flag) { return; }
			flag = true;
			window.requestAnimationFrame(update);
		}
		
		this.render = queueRender;
		// 71 is B, the mid-note of the treble clef
		this.staveNoteY = numberToPosition(71);
		this._bar = {};
		this.data = [];
		this.beatsPerBar = 4;
		
		this.key = toKey(settings.key || 'D');
		
		console.log('key:', this.key, createKeyMap(this.key, this.staveNoteY));
		
		this.keyMap = {
			0: createKeyMap(this.key)
		};
		
		this.find = svg.querySelectorAll.bind(svg);
		
		if (debug) { console.log('Scribe: ready to write on svg#' + svg.id); }
	}
	
	Scribe.prototype = {
		barOfBeat: function(beat) {
			var beatStart;
			
			if (this._bar[beat]) {
				return this._bar[beat];
			}
			
			beatStart = beat - (beat % this.beatsPerBar);
			
			if (this._bar[beatStart]) {
				return (this._bar[beat] = this._bar[beatStart]);
			}
			
			return (this._bar[beat] = this._bar[beatStart] = {
				beat:     beatStart,
				duration: durationOfBar(beat, this.beatsPerBar),
				breaks:   breaksOfBar(beat, this.beatsPerBar),
				keyMap:   this.keyMap[0],
				center:   this.staveNoteY
			});
		},
		
		note: function(number, beat, duration) {
			var svg = this.svg;
			var data = createData('note', number, beat, duration);
			
			this.data.push(data);
			this.render();
			
			return this;
		},
		
		createNode: createNode
	}
	
	Scribe.defaults = defaults;
	
	window.Scribe = Scribe;
})();



// -------------- TEST

var scribe = Scribe('sheet');

scribe.note(69, 0, 0.125);
scribe.note(61, 0.125,0.375);
scribe.note(72, 0.5, 0.5);

scribe.note(86, 2, 0.5);
scribe.note(84, 2.5, 0.25);
scribe.note(72, 2.75, 0.25);

//scribe.note(93, 4, 0.5);
//scribe.note(83, 4.5, 0.25);
//scribe.note(83, 4.75, 0.25);
//scribe.note(81, 5, 0.5);
//
scribe.note(50, 6, 0.75);
scribe.note(54, 6.75, 0.25);

scribe.note(60, 8, 0.25);
scribe.note(64, 8.25, 0.75);

scribe.note(64, 18, 2);
scribe.note(64, 20, 2);
