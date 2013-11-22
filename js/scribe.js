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
	    		spacing: 1.5
	    	}
	    };

	var options = {
		beamBreaksAtRest: true,
		beamGradientMax: 0.25,
		beamGradientFactor: 0.25
	};


	// Pure functions

	function isDefined(val) {
		return val !== undefined && val !== null;
	}

	function mod(n, m) {
		return ((n % m) + m) % m ;
	}

	function mod(n, m) {
		return ((n % m) + m) % m;
	}

	function getWidth(obj) {
		return obj.width;
	}

	function getDuration(obj) {
		return obj.duration;
	}

	function getY(obj) {
		return obj.y;
	}

	function setX(x, obj) {
		obj.x = x;
		return x;
	}

	function setDuration(x, obj) {
		obj.duration = x;
		return x;
	}

	function getMinWidth(obj) {
		return obj.minwidth;
	}
	
	function sum(total, n) {
		return total + n;
	}

	function max(total, n) {
		return total > n ? total : n;
	}

	function min(total, n) {
		return total < n ? total : n;
	}

	function byBeat(a, b) {
		return a.beat > b.beat ? 1 : -1 ;
	}

	function lesser(total, n) {
		return n < total ? n : total ;
	}

	function greater(total, n) {
		return n > total ? n : total ;
	}

	function limit(value, min, max) {
		return value < min ? min : value > max ? max : value ;
	}

	function first(array) {
		return array[0];
	}

	function last(array) {
		return array[array.length - 1];
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
	
	var noteMap = [
		// Key of C
		{ y: 0 },
		{ y: 0, accidental: 1 },
		{ y: 1 },
		{ y: 2, accidental: -1 },
		{ y: 2 },
		{ y: 3 },
		{ y: 3, accidental: 1 },
		{ y: 4 },
		{ y: 5, accidental: -1 },
		{ y: 5 },
		{ y: 6, accidental: -1 },
		{ y: 6 }
	];

	function mod(n, m) {
		return ((n % m) + m) % m ;
	}

	function pushKey(scribe, symbols, beat, n) {
		var map = [0,0,0,0,0,0,0];
		var m = n > 0 ? -1 : 1 ;
		var i;

		while (n) {
			i = mod(((n < 0 ? n + 1 : n) * 4 - 1), 7);
			map[i] = map[i] - m;
			n = n + m;

			symbols.push(symbolType.accidental(beat, i, -m, scribe));
		}

		return map;
	}

	function numberToAccidental(n) {
		return noteMap[n % 12].accidental;
	}

	function numberToNote(n) {
		if (debug) {
			test.number(n, 'n');
			test.notNaN(n, 'n');
		}
		
		return noteMap[n % 12].y + Math.floor(n / 12) * 7;
	}

	function noteToY(noteY, staveNoteY, key) {
		return staveNoteY - noteY;
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
				'href': '#accidental[' + symbol.accidental + ']',
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
			
			var accidentalType = numberToAccidental(symbol.number);
			var accidental;
			
			if (accidentalType) {
				accidental = createNode(svg, 'use', {
					'href': '#accidental[' + accidentalType + ']',
					'class': 'scribe-accidental',
					'translate': [-3, 0]
				});
				
				minwidth += 1.6;
				width += 3.2;
				
				node.appendChild(accidental);
			}
			
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
		}
	};
	
	var symbolType = {
		bar: function bar(beat, duration) {
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
		
		note: function note(beat, duration, number, from) {
			return {
				type: 'note',
				minwidth: 2.8,
				width: 4 + 4 * duration,
				beat: beat,
				duration: duration,
				number: number,
				from: from
			};
		},
		
		accidental: function accidental(beat, number, accidental, scribe) {
			// Handle y positioning
			//var noteY = numberToNote(number + scribe.transpose);
			var y = noteToY(number + 39, scribe.staveNoteY);
			
			return {
				type: 'accidental',
				accidental: accidental,
				minwidth: 1,
				width: 2,
				beat: beat,
				duration: 0,
				number: number,
				y: y
			};
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
	
	function insertClefSymbol(svg, scribe, symbols) {
		symbols.splice(0, 0, symbolType.clef(0));
	}
	
	function updateSymbolsX(svg, scribe, symbols) {
		var length = symbols.length,
		    n = -1,
		    x = 0,
		    w = 0,
		    d = 0,
		    xGroup = [],
		    yGroup = [],
		    noteY, symbol;
		
		while (++n < length) {
			symbol = symbols[n];
			
			if (symbol.type === 'note') {
				// Handle y positioning
				noteY = numberToNote(symbol.number + scribe.transpose);
				symbol.y = noteToY(noteY, scribe.staveNoteY);
				
				// Handle x positioning
				xGroup.push(symbol);
				
				if (!symbols[n + 1] || symbols[n + 1].type !== 'note' || symbol.beat !== symbols[n + 1].beat) {
					w = xGroup.map(getWidth).reduce(greater, 0);
					d = xGroup.map(getDuration).reduce(greater, 0);
					xGroup.reduce(setX, x + w / 2);
					xGroup.length = 0;
					x += w;
				}
			}
			else {
				// Handle x positioning
				symbol.x = x + symbol.width / 2;
				x += symbol.width;
			}
		}
	}
	
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
	
	function renderGroup(svg, layer, symbols) {
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
	
	function renderSymbols(svg, scribe, symbols) {
		var length = symbols.length,
		    n = -1,
		    x = 0,
		    symbol, node, beam;
		
		scribe.staveNode1.removeChild(scribe.staveNode2);
		scribe.staveNode1.removeChild(scribe.staveNode3);
		scribe.staveNode2 = createNode(svg, 'g', {});
		scribe.staveNode3 = createNode(svg, 'g', {});
		append(scribe.staveNode1, [scribe.staveNode2, scribe.staveNode3]);
		
		while (++n < length) {
			symbol = symbols[n];

			//if (debug) console.log('Scribe: write symbol', symbol);
			
			if (symbol.type !== 'note') {
				node = nodeType[symbol.type](svg, symbol);
				scribe.staveNode2.appendChild(node);
				continue;
			}

			if (symbol.beam && symbol.beam !== beam) {
				beam = symbol.beam;
				renderGroup(svg, scribe.staveNode3, symbol.beam);
			}

			renderNote(svg, scribe.staveNode3, symbol);
			renderTie(svg, scribe.staveNode3, symbol);
			renderLedgers(svg, scribe.staveNode2, symbol);
		}
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
	
	function newBeam(beam) {
		if (!beam) { return []; }
		if (beam.length === 0) { return beam; }
		if (beam.length === 1) {
			// Remove the beam from the only symbol that carries it.
			delete beam[0].beam;
		}
		return [];
	}
	
	function createSymbols(data) {
		var symbols = [];
		var n = 0;
		var beam = newBeam();
		var beat, duration, bar, symbol, note, breakpoint;
		
		data.sort(byBeat);
		symbols.push(symbolType.clef());
		pushKey(scribe, symbols, 0, 3);
		
		console.group('Scribe: createSymbols');
		
		while(n <= data.length) {
			symbol = last(symbols);
			bar = scribe.barOfBeat(symbol.beat);
			note = data[n];
			breakpoint = nextBreakpoint(bar, symbol.beat);
			beat = symbol.beat;
			duration = symbol.duration;
			
			console.groupEnd();
			console.group('Scribe: last symbol', symbol.type, symbol.beat, symbol.duration);
			
			// Where the last symbol overlaps the next note, shorten it.
			if (note && symbol.beat + symbol.duration > note.beat) {
				console.log('shorten');
				symbol.duration = note.beat - symbol.beat;
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
					symbols.push(symbolType.note(bar.beat + bar.duration, symbol.beat + symbol.duration - bar.beat - bar.duration, symbol.number))
					symbol.duration = bar.beat + bar.duration - symbol.beat;
					
					symbol.to = last(symbols);
					last(symbols).from = symbol;
					
					beam = newBeam(beam);
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
				continue;
			}

			// Where the last symbol doesn't make it as far as the next note,
			// insert a rest.
			if (note && symbol.beat + symbol.duration < note.beat) {
				console.log('insert rest');
				symbols.push(fitRestSymbol(bar, symbol.beat + symbol.duration, note.beat - symbol.beat - symbol.duration));
				continue;
			}
			
			if (!note) { break; }
			
			// Insert a note and increment n
			symbols.push(symbolType.note(note.beat, note.duration, note.number));
			n++;
		}
		
		console.groupEnd();
		
		return symbols;
	}
	
	function renderScribe(scribe, svg) {
		var symbols = createSymbols(scribe.data);

		updateSymbolsX(svg, scribe, symbols);
		renderSymbols(svg, scribe, symbols);
	}
	
	function Scribe(id, options) {
		if (!(this instanceof Scribe)) {
			return new Scribe(id);
		}
		
		var svg = find(id);
		var scribe = this;
		var flag;
		
		function update() {
			flag = false;
			renderScribe(scribe, svg);
		}
		
		function queueRender() {
			if (flag) { return; }
			flag = true;
			window.requestAnimationFrame(update);
		}
		
		this.render = queueRender;
		
		this.transpose = 0;
		this.staveY = 4;
		// 71 is mid note of treble clef
		this.staveNoteY = numberToNote(71 + this.transpose);
		this._bar = {};
		this.data = [];
		this.beatsPerBar = 4;
		this.barsPerStave = 4;
		
		this.svg = svg;
		
		this.width = svg.viewBox.baseVal.width;
		this.height = svg.viewBox.baseVal.height;
		this.paddingTop = 12;
		this.paddingLeft = 3;
		this.paddingRight = 3;
		this.paddingBottom = 6;
		
		this.stave(0, this.staveY);
		
		this.find = svg.querySelectorAll.bind(svg);
		
		if (debug) { console.log('Scribe: ready to write on svg#' + svg.id); }
	}
	
	Scribe.prototype = {
		barOfBeat: function(beat) {
			return this._bar[beat] || (this._bar[beat] = {
				beat: beat - (beat % this.beatsPerBar),
				duration: durationOfBar(beat, this.beatsPerBar),
				breaks: breaksOfBar(beat, this.beatsPerBar)
			});
		},
		
		note: function(number, beat, duration) {
			var svg = this.svg;
			var data = createData('note', number, beat, duration);
			
			this.data.push(data);
			this.render();
			
			return this;
		},

		stave: function(x, y, w) {
			var svg = this.svg;
			var node1 = createNode(svg, 'g', {
				'translate': [
					this.paddingLeft + (x || 0),
					this.paddingTop + (y || 0)
				]
			});

			var node2 = createNode(svg, 'g', {});
			var node3 = createNode(svg, 'g', {});
			
			var lines = createNode(svg, 'use', {
				'href': '#stave',
				'class': 'scribe-stave',
				'scale': [
					w || this.width - this.paddingLeft - this.paddingRight,
					1
				]
			});

			var bar = createNode(svg, 'use', {
				'href': '#bar',
				'class': 'scribe-bar'
			});
			
			node1.appendChild(lines);
			node1.appendChild(bar);
			node1.appendChild(node2);
			node1.appendChild(node3);
			
			svg.appendChild(node1);
			
			this.staveNode1 = node1; 
			this.staveNode2 = node2;
			this.staveNode3 = node3; 
			
			return this;
		},
		
		createNode: createNode
	}
	
	window.Scribe = Scribe;
})();



// -------------- TEST

var scribe = Scribe('sheet');

scribe.note(69, 0,    0.125);
scribe.note(50, 0.125,0.375);
scribe.note(72, 0.5,  0.5);

scribe.note(86, 2, 0.5);
scribe.note(84, 2.5, 0.25);
scribe.note(72, 2.75, 0.25);

scribe.note(93, 4, 0.5);
scribe.note(83, 4.5, 0.25);
scribe.note(83, 4.75, 0.25);
scribe.note(81, 5, 0.5);

scribe.note(50, 6, 0.75);
scribe.note(54, 6.75, 0.25);

scribe.note(60, 8, 0.25);
scribe.note(64, 8.25, 0.75);
