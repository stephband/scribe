(function(context) {
	"use strict";

	var debug = window.console && window.console.log;
	var find = document.getElementById.bind(document);

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

	// Pure functions

	function mod(n, m) {
		// Return the modulus while handling negative numbers sensibly.
		return ((n % m) + m) % m ;
	}

	function mod7(n)  { return mod(n, 7); }
	function mod12(n) { return mod(n, 12); }
	function mag(n)   { return n < 0 ? -n : n ; }
	function limit(n, min, max) { return n < min ? min : n > max ? max : n ; }
	function return0() { return 0; }

	// Reduce functions

	function sum(total, n)    { return total + n; }
	function max(total, n)    { return total > n ? total : n; }
	function min(total, n)    { return total < n ? total : n; }

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
			return x + symbol.r;
		}
		
		symbol.x = x + symbol.l;
		return x + symbol.l + symbol.r;
	}

	function setDuration(x, obj) {
		obj.duration = x;
		return x;
	}

	// Map functions

	function getNumber(obj)   { return obj.number; }
	function getDuration(obj) { return obj.duration; }
	function getY(obj)        { return obj.y; }
	function getType(obj)     { return obj.type; }
	function getLength(obj)   { return obj.length; }
	
	function toFloat(str)     { return parseFloat(str, 10); }
	function toMin(array)     { return typeof array === 'number' ? array : array.reduce(min); }
	function toMax(array)     { return array.reduce(max); }
	function toAvg(array)     { return array.reduce(sum) / array.length; }
	
	// filter functions
	
	function isNote(obj)      { return obj.type === 'note'; }
	function isChord(obj)     { return obj.type === 'chord'; }
	
	// Object functions
	
	function isDefined(val) {
		// Test for undefined, null and NaN values (NaN !== NaN)
		return val !== undefined && val !== null && val === val;
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
	
	function createGroupNode(svg) {
		return Scribe.Node(svg, 'g');
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
	
	function numberToLine(n, key) {
		return 7 * Scribe.octave(n) + Scribe.spelling(n, key)[0];
	}

	function noteToAccidental(symbols, symbol, keyMap, accMap, staveY, transpose) {
		var scribe = this;
		var key = scribe.keyAtBeat(note.beat);
		var number = note.number + scribe.transpose;
		var spelling = Scribe.spelling(number, key);
		
		var octave = Scribe.octave(number);
		var degree = mod12(number);
		var offset = spelling[0];
		var accidental = spelling[1];
		var position = 7 * octave + offset;
		var staveAcc = isDefined(accMap[position]) ?
		    	accMap[position] :
		    	keyMap[offset] ;
		
		if (accidental !== staveAcc) {
			// We need an accidental.
			console.log('insert accidental', Scribe.spell(number) + Scribe.octave(number), accidental, staveAcc);
			accMap[position] = accidental;
			symbols.push(symbolType.accidental(symbol.beat, accidental, symbol.y));
		}
	}

	function noteToY(note) {
		var scribe = this;
		var key = scribe.keyAtBeat(note.beat);
		var number = note.number + scribe.transpose;
		var octave = Scribe.octave(number);
		var spelling = Scribe.spelling(number, key);
		var offset = spelling[0];
		var position = 7 * octave + offset;
		
		return position;
	}

	function yToPosition(y) {
		return this.center - y;
	}

	function arrayToY(obj, i) {
		obj.y = this[i];
	}
	
	function push(obj) {
		this.push(obj);
	}

	var nodeType = {
		bar: function bar(svg, symbol) {
			return Scribe.Node(svg, 'use', {
				'href': '#bar',
				'translate': [symbol.x, 0]
			});
		},

		endline: function endline(svg, symbol) {
			return Scribe.Node(svg, 'use', {
				'href': '#endline',
				'translate': [symbol.x, 0]
			});
		},

		clef: function clef(svg, symbol) {
			return Scribe.Node(svg, 'use', {
				'href': '#clef[' + symbol.value + ']',
				'translate': [symbol.x, 0]
			});
		},

		rest: function rest(svg, symbol) {
			return Scribe.Node(svg, 'use', {
				'href': '#rest[' + symbol.duration + ']',
				'translate': [symbol.x, 0]
			});
		},

		tie: function tie(svg, symbol) {
			return Scribe.Node(svg, 'use', {
				'href': '#tie',
				'translate': [symbol.x, symbol.y],
				'scale': [symbol.width, (symbol.y > 0 ? 1 : -1) * (1 + 0.08 * symbol.width)]
			});
		},

		accidental: function accidental(svg, symbol) {
			return Scribe.Node(svg, 'use', {
				'href': '#accidental[' + symbol.value + ']',
				'translate': [symbol.x, symbol.y]
			});
		},

		note: function note(svg, symbol, x, y, event) {
			var node = Scribe.Node(svg, 'g', {
				'translate': [x, y]
			});
			
			var head = Scribe.Node(svg, 'use', {
				'href': '#head[' + symbol.duration + ']'
			});
			
			node.appendChild(head);
			
			return node;
		},
		
		stalkup: function stalkup(svg, x, y) {
			return Scribe.Node(svg, 'use', {
				'href': '#stalkup',
				'translate': [x, y]
			});
		},
	
		stalkdown: function stalkdown(svg, x, y) {
			return Scribe.Node(svg, 'use', {
				'href': '#stalkdown',
				'translate': [x, y]
			});
		},
		
		tailup: function tail(svg, symbol, x, y) {
			return Scribe.Node(svg, 'use', {
				'href': '#tailup[' + symbol.duration +']',
				'translate': [x, y]
			});
		},
		
		taildown: function tail(svg, symbol, x, y) {
			return Scribe.Node(svg, 'use', {
				'href': '#taildown[' + symbol.duration +']',
				'translate': [x, y]
			});
		},
		
		stave: function stave(svg, x, y, w) {
			var node = Scribe.Node(svg, 'g', {
				'translate': [x, y]
			});

			var lines = Scribe.Node(svg, 'use', {
				'href': '#stave',
				'scale': [w, 1]
			});
			
			node.appendChild(lines);
			
			return node;
		},
		
		chord: function chord(svg, symbol) {
			return Scribe.Node(svg, 'text', {
				'class': 'scribe-chord',
				'x': symbol.x,
				'y': symbol.y,
				'text': symbol.text
			});
		}
	};
	
	var symbolType = {
		bar: (function() {
			var prototype = {
				type: 'bar',
				lmin: 0.5,
				rmin: 0.5,
				l: 1,
				r: 1,
				duration: 0,
				y: 0
			};
			
			return function bar(beat) {
				var symbol = Object.create(prototype);
				
				//symbol.beat = beat;
				
				return symbol;
			};
		})(),

		endline: function endline() {
			return {
				type: 'endline',
				lmin: 1.8,
				rmin: 0,
				l: 2.6,
				r: 0,
				duration: 0,
				y: 0
			};
		},

		clef: function clef(value) {
			return {
				type: 'clef',
				lmin: 5,
				rmin: 5,
				l: 5,
				r: 5,
				value: value,
				duration: 0,
				y: 0
			};
		},
		
		rest: function rest(beat, duration) {
			return {
				type: 'rest',
				lmin: 2 + duration,
				rmin: 2 + duration,
				l: 2 + duration * 1.5,
				r: 2 + duration * 1.5,
				y: 0,
				beat: beat,
				duration: duration
			};
		},

		note: (function() {
			var prototype = Object.defineProperties({
					type: 'note',
					lmin: 1.5,
					l: 2
				}, {
					rmin: {
						get: function() {
							var duration = this.duration;
							var dotted = !(duration % (1.5 / 16));
							return dotted ? 4 : 2 ;
						}
					},
					
					r: {
						get: function() {
							var duration = this.duration;
							var dotted = !(duration % (1.5 / 16));
							return (dotted ? 4 : 2) + 2.25 * duration;
						}
					}
				}
			);
			
			return function note(beat, duration, number, from, y) {
				var symbol = Object.create(prototype);
				
				symbol.beat = beat;
				symbol.duration = duration;
				symbol.number = number;
				symbol.from = from;
				symbol.y = y;
				
				return symbol;
			};
		})(),
		
		accidental: function accidental(beat, value, y) {
			return {
				type: 'accidental',
				lmin: 1,
				rmin: 1,
				l: 1,
				r: 1,
				value: value,
				beat: beat,
				duration: 0,
				y: y
			};
		},
		
		space: function space(beat, width) {
			return {
				type: 'space',
				lmin: 1.5,
				rmin: 1.5,
				l: width ? width / 2 : 2,
				r: width ? width / 2 : 2,
				beat: beat,
				y: 0
			}
		},
		
		chord: function chord(scribe, event, options) {
			var root = mod12(event.root + options.transpose);
			var key = mod12(scribe.keyAtBeat(event.beat) + options.transpose);

			return {
				type: 'chord',
				data: event,
				beat: event.beat,
				text: Scribe.spell(root, key) + event.extension,
				l: 0,
				r: 0,
				lmin: 0,
				rmin: 0
			};
		}
	};

	function beatOfBarN(scribe, beat, n) {
		// Find the beat of the nth bar in the future.
		beat = scribe.barAtBeat(beat).beat;
		
		while (n--) {
			beat += scribe.barAtBeat(beat).duration;
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
	
	function createChordSymbols(scribe, data, start, end, options) {
		var chords = data.filter(isChord);
		var l = chords.length;
		var n = -1;
		var output = [];
		
		if (debug) { console.log('createChordSymbols() start:', start, 'end:', end); }
		
		while (++n < l) {
			output.push(symbolType.chord(scribe, chords[n], options));
		}
		
		return output;
	}
	
	function createMusicSymbols(scribe, data, start, end, options) {
		var noteData = data.filter(isNote);
		var symbols = [];
		var n = 0;
		var i = 0;
		var beam = newBeam();
		var group = [];
		var accMap = {};
		var beat = start; 
		var duration, bar, symbol, note, breakpoint, nextBeat, key, spelling;

		if (debug) { console.log('createMusicSymbols() start:', start, 'end:', end); }

		symbols.push(symbolType.bar(start));

		while (beat < end) {
			// Guard against infinite loops for debugging
			if (debug && i++ > 1200) { 
				console.log('Uh-oh. Infinite loop.');
				break;
			}
			
			console.groupEnd();

			symbol = last(symbols);
			beat = symbol && isDefined(symbol.beat) ? symbol.beat : beat ;
			bar = scribe.barAtBeat(beat);
			note = noteData[n];
			nextBeat = isDefined(note) ? note.beat : end;
			breakpoint = nextBreakpoint(bar, beat);

			console.group('Scribe: symbol', symbol.type, symbol.beat, symbol.duration);

			if (symbol.type === 'bar') {
				beam = newBeam(beam);
			}

			if (symbol.type === 'rest' && options.beamBreaksAtRest) {
				beam = newBeam(beam);
			}

			// Where the last symbol overlaps the next note, shorten it.
			if (note && symbol.beat + symbol.duration > nextBeat) {
				console.log('Shorten' + symbol.type, 'beat:', symbol.beat, 'duration:', nextBeat - symbol.beat);
				symbol.duration = nextBeat - symbol.beat;
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
				console.log('Insert bar', bar.beat + bar.duration);
				symbols.push(symbolType.bar(bar.beat + bar.duration));
				// Manually update beat, as bar does not have beat or duration.
				beat = bar.beat + bar.duration;
				deleteProperties(accMap);
				continue;
			}

			// Where the last symbol doesn't make it as far as the next note,
			// insert a rest.
			if (isDefined(symbol.beat)) {
				if (symbol.beat + symbol.duration < nextBeat) {
					console.log('Insert rest. beat:', symbol.beat, 'duration:', nextBeat - symbol.beat - symbol.duration);
					symbols.push(fitRestSymbol(bar, symbol.beat + symbol.duration, nextBeat - symbol.beat - symbol.duration));
					continue;
				}
			}
			else {
				if (beat < nextBeat) {
					console.log('Insert rest. beat:', beat, 'duration:', nextBeat - beat);
					symbols.push(fitRestSymbol(bar, beat, nextBeat - beat));
					continue;
				}
			}
			
			if (!note) { break; }
			
			// Insert a note and increment n
			group.push(note);
			
			while (noteData[++n] && noteData[n].beat === note.beat) {
				console.log(noteData[n].beat);
				group.push(noteData[n]);
			}
			
			symbol = symbolType.note(note.beat);
			symbol.duration = group.map(getDuration).reduce(max);
			symbol.number   = group.map(getNumber);
			symbol.y        = group.map(noteToY, scribe).map(yToPosition, bar);
			
			var l = group.length;
			
			while (l--) {
				var keyMap = bar.keyMap;
				var key = scribe.keyAtBeat(note.beat);
				var number = group[l].number + scribe.transpose;
				var spelling = Scribe.spelling(number, key);
				var octave = Scribe.octave(number);
				var offset = spelling[0];
				var accidental = spelling[1];
				var position = 7 * octave + offset;
				var staveAcc = isDefined(accMap[position]) ?
				    	accMap[position] :
				    	keyMap[offset] ;
				
				if (accidental !== staveAcc) {
					// We need an accidental.
					console.log('insert accidental', Scribe.spell(number) + Scribe.octave(number), accidental, staveAcc);
					accMap[position] = accidental;
					symbols.push(symbolType.accidental(symbol.beat, accidental, symbol.y));
				}
			}
			
			console.log(symbol);
			
			symbols.push(symbol);
			group.length = 0;
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
		
		while (++n < length) {
			// Start when we come across our first symbol on or later than
			// start beat. 
			if (isDefined(array[n].beat) && array[n].beat >= start) {
				break;
			}
		}
		
		--n;
		
		// We'll assume the array is already sorted.
		while (++n < length) {
			if (isDefined(array[n].beat)) {
				if (array[n].beat < end) {
					output.push(array[n]);
				}
				
				if (array[n].beat + array[n].duration >= end) {
					console.log('start:', start, 'end:', end, 'symbols:', output.length);
					return output;
				}
			}
			else {
				output.push(array[n]);
			}
		}
		
		console.log('start:', start, 'end:', end, 'symbols:', output.length);
		
		return output;
	}

	// Renderer

	function renderLedgers(svg, layer, symbol) {
		var y = 0;

		// Render ledger lines
		y = symbol.y.reduce(max) + 1;
		
		if (y > 6) {
			while (--y > 5) {
				if (y % 2) { continue; }
				
				layer.appendChild(
					Scribe.Node(svg, 'use', {
						'href': '#line',
						'class': 'scribe-stave',
						'translate': [symbol.x - 2.2, y],
						'scale': [4.4, 1]
					})
				);
			}
		}

		y = symbol.y.reduce(min) - 1;

		if (y < -6) {
			while (++y < -5) {
				if (y % 2) { continue; }
				
				layer.appendChild(
					Scribe.Node(svg, 'use', {
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
		
		var n = symbol.y.length;
		
		while (n--) {
			layer.appendChild(nodeType.tie(svg, {
				x: symbol.x + 1.75,
				y: symbol.y[n],
				width: symbol.to.x - symbol.x - 3.5
			}));
		}
	}

	function renderNote(svg, layer, symbol) {
		var nodes = [];
		var minY = symbol.y.reduce(min);
		var maxY = symbol.y.reduce(max);
		var centerY = minY + (maxY - minY) / 2;
		var offsets, startY, endY, tail, n;
		
		if (centerY < 0) {
			offsets = defaults.stalkDown;
			startY = minY;
			endY = maxY;
			tail = 'taildown';
		}
		else {
			offsets = defaults.stalkUp;
			startY = maxY;
			endY = minY;
			tail = 'tailup'
		}
		
		n = symbol.y.length;
		
		while (n--) {
			nodes.push(nodeType[symbol.type](svg, symbol, symbol.x, symbol.y[n]));
		}
		
		if (!symbol.beam && symbol.duration && symbol.duration < 4) {
			// Stalks down
			nodes.push(Scribe.Node(svg, 'line', {
				'class': 'scribe-stalk',
				x1: offsets.x1 + symbol.x,
				y1: offsets.y1 + startY,
				x2: offsets.x2 + symbol.x,
				y2: offsets.y2 + endY
			}));

			if (symbol.duration < 1) {
				nodes.push(nodeType[tail](svg, symbol, symbol.x, endY));
			}
		}
		
		n = nodes.length;
		
		while (n--) {
			layer.appendChild(nodes[n]);
		}
	}

	function createBeamY(symbols, options, symbolsY, direction) {
		// direction true: stalks down, false: stalks up
		var firstX    = first(symbols).x;
		var lastX     = last(symbols).x;
		var firstY    = first(symbolsY);
		var lastY     = last(symbolsY);
		var factorG   = options.beamGradientFactor || 0.75;
		var maxG      = isDefined(options.beamGradientMax) ? options.beamGradientMax : 1 ;
		var gradient  = limit(factorG * (lastY - firstY) / (lastX - firstX), -maxG, maxG);
		var offsetY   = direction ? symbolsY.reduce(max) : symbolsY.reduce(min);
		var index     = symbolsY.indexOf(offsetY);
		var xOffsetY  = firstX + ((index + 1) / symbolsY.length) * (lastX - firstX);
		
		return function beamY(x) {
			return (x - xOffsetY) * gradient + offsetY;
		}
	}

	function renderGroup(svg, layer, symbols, options) {
		var length  = symbols.length;
		var minY    = symbols.map(getY).map(toMin);
		var maxY    = symbols.map(getY).map(toMax);
		var avgY    = symbols.map(getY).map(toAvg).reduce(sum) / length;
		var beamY   = createBeamY(symbols, options, avgY < 0 ? maxY : minY, avgY < 0);
		var stalk   = avgY < 0 ? defaults.stalkDown : defaults.stalkUp ;
		var node    = Scribe.Node(svg, 'g');

		renderStalks(svg, node, symbols, stalk, beamY, avgY < 0 ? minY : maxY);
		renderBeams(svg, node, symbols, stalk.x2, stalk.y2, beamY, 1);
		
		layer.appendChild(node);
	}

	function renderStalks(svg, node, symbols, offsets, beamY, symbolsY) {
		var length = symbols.length;
		var n = -1;
		var symbol, symbolY;
		
		// Render the stalks
		while (++n < length) {
			symbol = symbols[n];
			symbolY = symbolsY[n];
			
			node.appendChild(Scribe.Node(svg, 'line', {
				'class': 'scribe-stalk',
				x1: offsets.x1 + symbol.x,
				y1: offsets.y1 + symbolY,
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
		node.appendChild(Scribe.Node(svg, 'path', {
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
		    symbol, node, beam, l;

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

	function prepareStaveSymbols(symbols, start, end, options) {
		var clefSymbols, keySymbols;
		
		if (options.clefOnEveryStave || start === options.start) {
			clefSymbols = [symbolType.clef(options.clef)];
			keySymbols = createKeySymbols(options.key);
		}
		else {
			clefSymbols = keySymbols = [];
		}
		
		return [symbolType.bar(start)]
			.concat(clefSymbols)
			.concat(keySymbols)
			.concat(symbols)
			.concat([end >= options.end ? symbolType.endline(end) : symbolType.bar(end)]);
	}

	function prepareChordSymbols(symbols, start, end, options) {
		return symbols;
	}

	function renderChords(svg, symbols, x, y, width, options) {
		var node = Scribe.Node(svg, 'g', {
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

	function stretch(normal, min, factor) {
		return normal + (normal - min) * factor;
	}

	function distributeX(tracks, factor) {
		var length = tracks.map(getLength).reduce(sum);
		var indexes = tracks.map(return0);
		var x = 0, x1, x2, x3, beat, beat1, beat2, n, symbol;
		
		factor = factor || 0;
		
		console.log('distributeX() factor:', factor);
		
		while (indexes.reduce(sum) < length) {
			// Find the next beat in any of the tracks.
			beat = Infinity;
			n = tracks.length;
			x2 = x;
		
			while (n--) {
				symbol = tracks[n][indexes[n]];
				x1 = x;
				
				// No more symbols in this track?
				if (!symbol) { continue; }
				
				// Where symbol does not have a beat, jump ahead to the first
				// symbol that does, setting x on the unbeated symbols as we go.
				while (symbol && symbol.beat === undefined) {
					// If it's the first bar line on the stave, ignore the
					// left margin.
					if (indexes[n] === 0 && symbol.type === 'bar') {
						symbol.x = x1;
						x1 += stretch(symbol.r, symbol.rmin, factor);
					}
					
					// If it's the last bar line on the stave, ignore the
					// right margin.
					else if (indexes[n] === tracks[n].length - 1 && symbol.type === 'bar') {
						symbol.x = x1 + stretch(symbol.l, symbol.lmin, factor);
						x1 += stretch(symbol.l, symbol.lmin, factor);
					}
					
					// Anything else, count both margins.
					else {
						symbol.x = x1 + stretch(symbol.l, symbol.lmin, factor);
						x1 += stretch(symbol.l, symbol.lmin, factor) +
						      stretch(symbol.r, symbol.rmin, factor) ;
					}
					
					console.log('beat: - ', 'x:', x, 'type:', symbol.type);
					
					symbol = tracks[n][++indexes[n]];
				}
				
				x2 = x1 > x2 ? x1 : x2;
				
				if (symbol && symbol.beat < beat) {
					beat = symbol.beat;
				}
			}
			
			// Push x forward to accomodate unbeated symbols.
			x = x2;
			
			// Push symbols into symbols array.
			n = tracks.length;
	
			while (n--) {
				symbol = tracks[n][indexes[n]];
				x1 = x;
	
				// No more symbols in this track?
				if (!symbol) { continue; }
				
				if (symbol.beat === beat) {
					if (beat < beat2) {
						// Where x has already gone passed this symbol, because
						// the previous symbol we applied x to had a long
						// duration, divide the space that previous symbol
						// occupies to position this symbol.
						// TODO: This is a little crude, and will break.
						symbol.x = x3 + (x1 - x3) * (beat - beat1) / (beat2 - beat1);
					}
					else {
						x1 += stretch(symbol.l, symbol.lmin, factor);
						symbol.x = x1;
						x1 += stretch(symbol.r, symbol.rmin, factor);
						
						if (x1 > x2) {
							x2 = x1;
							x3 = x;
							beat1 = symbol.beat;
							beat2 = symbol.beat + symbol.duration;
						}
					}
					
					console.log('beat:', beat, 'x:', x, 'type:', symbol.type);
					
					indexes[n]++;
				}
			}
	
			// Push x forward to accomodate biggest right margin.
			x = x2;
		}
		
		return x;
	}

	function renderStaves(scribe, svg, tracks, start, end, width, bars, cursor, options) {
		var symbols1 = prepareStaveSymbols(tracks[0], start, end, options);
		var symbols2 = prepareChordSymbols(tracks[1], start, end, options);
		
		// Find the minwidth of all the symbols, and if it's too wide render a
		// stave with fewer bars.
		var minwidth = distributeX([symbols1, symbols2], -1);
		
		if (minwidth > width) {
			bars--;
			cursor.bars++;
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
		var idealwidth = distributeX([symbols1, symbols2], 0);

		if (end >= options.end && idealwidth <= width) {
			symbols1.reduce(setXFromWidth, 0);
			width = idealwidth;
		}
		else {
			distributeX([symbols1, symbols2], (width - idealwidth) / (idealwidth - minwidth));
		}

		renderChords(svg, symbols2, options.paddingLeft, cursor.y + options.chordsOffset, width, options);

		// Find the offset of the highest symbol
		var minY = symbols1.map(getY).map(toMin).reduce(min);

		cursor.y += minY > -5 ? 0 : -(minY + 5) ;
		
		renderStave(svg, symbols1, options.paddingLeft, cursor.y, width, options);
		
		cursor.beat = end;
	}

	function renderScribe(scribe, svg, data, options) {
		var tracks = createSymbols(scribe, data, options.start, options.end, options);
		var width = options.width - options.paddingLeft - options.paddingRight;
		var start = options.start;
		var end;
		var i = 0;
		var cursor = {
			beat: start,
			y: options.paddingTop + 4,
			bars: 0
		};
		var bars = 0;
		
		function slice(symbols) {
			return sliceByBeat(symbols, start, end);
		}
		
		while (start < options.end) {
			// Catch infinite loops
			if (debug && i++ > 48) { break; }

			bars = scribe.staveBarsAtBeat(start) + cursor.bars;
			end = beatOfBarN(scribe, start, bars);
			
			cursor.bars = 0;
			
			if (end > options.end) {
				end = options.end;
			}
			
			if (end === start) {
				throw new Error('No. That cant be.');
			}
			
			console.groupCollapsed('Scribe: rendering stave. Beats:', start, '–', end, '(', bars, 'bars ).');
			renderStaves(scribe, svg, tracks.map(slice), start, end, width, bars, cursor, options);
			start = cursor.beat;
			console.groupEnd();
			
			cursor.y += options.staveSpacing;
		}
		
		// Automatically adjust the height of the SVG to accomodate the length of the music
		options.height = Math.ceil(cursor.y);
		svg.setAttribute('viewBox', '0 0 ' + options.width + ' ' + options.height);
		svg.setAttribute('height', Math.ceil(svg.clientWidth * options.height / options.width));
	}

	function clearSVG(svg) {
		var groups = svg.querySelectorAll('svg > g');
		var l = groups.length;
		
		// A quick n dirty means of clearing out the svg.
		while (l--) {
			svg.removeChild(groups[l]);
		}
	}

	// Define Scribe

	var prototype = {
		
	};

	function Scribe(svg, data, user) {
		var scribe = Object.create(prototype);

		svg = typeof svg === 'string' ? find(svg) : svg ;
		data = Scribe.Sequence(data);

		var options = extend({}, defaults, user, {
			width: svg.viewBox.baseVal.width,
			height: svg.viewBox.baseVal.height,
			key: Scribe.number(user && user.key || defaults.key || 'C')
		});

		var flag;
		var _bars = {};
		var _keys = {};

		function update() {
			var barEnd;
			var beatEnd;
			
			flag = false;

			if (!isDefined(options.end)) {
				beatEnd = last(data).beat + last(data).duration;
				barEnd = scribe.barAtBeat(beatEnd);
				options.end = beatEnd === barEnd.beat ?
					beatEnd :
					barEnd.beat + barEnd.duration ;
				
				if (debug) { console.log('Scribe: end set automatically:', options.end); }
			}
			
			clearSVG(svg);
			renderScribe(scribe, svg, data, options);
		}

		function queueRender() {
			if (flag) { return; }
			flag = true;
			window.requestAnimationFrame(update);
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
		
		scribe.sequence = data;

		scribe.keyAtBeat = function(beat) {
			return isDefined(_keys[beat]) && _keys[beat] || (_keys[beat] = data.keyAtBeat(beat));
		};
		
		scribe.staveAtBeat = function(beat) {
			
		};
		
		scribe.linesAtBeat = function(beat) {
			
		};
		
		scribe.barAtBeat = function(beat) {
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
		};
		
		Object.defineProperties(scribe, {
			transpose: {
				set: function(n) {
					options.transpose = n;
					deleteProperties(_keys);

					this.keyMap = {
						0: createKeyMap(options.key + options.transpose)
					};

					this.render();
				},
				
				get: function() {
					return options.transpose;
				}
			}
		});
		
		scribe.staveBarsAtBeat = staveBarsAtBeat;
		scribe.render = queueRender;
		scribe.staveNoteY = numberToLine(clefs[options.clef], 0);
		scribe.beatsPerBar = 4;
		
		console.log('Scribe: key:', options.key, createKeyMap(options.key, scribe.staveNoteY));
		console.log('Scribe: transpose:', options.transpose);
		
		scribe.keyMap = {
			0: createKeyMap(options.key + options.transpose)
		};
		
		if (debug) { console.log('Scribe: ready to write on svg#' + svg.id); }
		
		if (data) {
			queueRender();
		}
		
		return scribe;
	}

	Scribe.debug = debug;
	Scribe.defaults = defaults;
	Scribe.extend = extend;
	Scribe.mixin = {};

	Scribe.isNote = isNote;
	Scribe.isChord = isChord;
	Scribe.isDefined = isDefined;
	Scribe.mod12 = mod12;
	Scribe.sum = sum;

	context.Scribe = Scribe;
})((window || module.exports));
