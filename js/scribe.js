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
		'href': setAttrBaseVal,
		'translate': setTransform,
		'scale': setTransform
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
		
		notNaN: function(n, name) {
			if (Number.isNaN(n))
				throw new Error(name + ' is NaN');
		}
	};
	
	var barBreaks = {
		3: [1,2],
		4: [2],
		5: [3],
		6: [3]
	};
	
	// Pure functions
	
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
	
	function byBeat(a, b) {
		return a.beat > b.beat ? 1 : -1 ;
	}

	function lesser(total, n) {
		return n < total ? n : total ;
	}
	
	function greater(total, n) {
		return n > total ? n : total ;
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
		{ y: 0, accidental: SHARP },
		{ y: 1 },
		{ y: 2, accidental: FLAT },
		{ y: 2 },
		{ y: 3 },
		{ y: 3, accidental: SHARP },
		{ y: 4 },
		{ y: 5, accidental: FLAT },
		{ y: 5 },
		{ y: 6, accidental: FLAT },
		{ y: 6 }
	];
	
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
		
		note: function note(svg, symbol) {
			var minwidth = 0;
			var width = 0;
			var node = createNode(svg, 'g', {
				'translate': [symbol.x, symbol.y]
			});
			var head = createNode(svg, 'use', {
				'href': '#head[' + (symbol.duration < 1 ? 1 : symbol.duration > 2 ? 2 : symbol.duration) + ']',
				'class': 'scribe-note'
			});
			
			node.appendChild(head);
			
			var accidentalType = numberToAccidental(symbol.number);
			var accidental;
			
			if (accidentalType) {
				accidental = createNode(svg, 'use', {
					'href': '#' + accidentalType,
					'class': 'scribe-accidental',
					'translate': [-3, 0]
				});
				
				minwidth += 1.6;
				width += 3.2;
				
				node.appendChild(accidental);
			}
			
			return node;
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
				width: 3 + duration * 3,
				y: 0,
				beat: beat,
				duration: duration
			};
		},
		
		note: function note(beat, duration, number, from) {
			return {
				type: 'note',
				minwidth: 2.8,
				width: 4.3 + (duration > 1 ? duration : 0),
				beat: beat,
				duration: duration,
				number: number,
				from: from
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
	
	function fitNoteSymbol(svg, scribe, symbol) {
		var beat = symbol.beat;
		var duration = symbol.duration;
		var barBeat = beatOfBar(beat, scribe.beatsPerBar);
		var barDuration = durationOfBar(beat, scribe.beatsPerBar);
		var barBreaks = breaksOfBar(beat, scribe.beatsPerBar);
		var symbols = [];
		var d;
		
		// Any note of two beats or longer, starting on a beat, gets to display
		// as is.
		if (barBeat % 1 === 0 && duration >= 2) {
			return symbols;
		}

		// Reduce duration to the nearest bar breakpoint, creating a new symbol
		// to continue the note.
		while (++b < barBreaks.length) {
			barBreak = barBreaks[b];
			if (barBeat >= barBreak) { continue; }
			if (barBeat + duration > barBreak) {
				d = barBreak - barBeat;
				
				symbol.duration = d;
				symbol.tied = true;
				
				//symbols.push(createTieSymbol(svg, symbol));
				symbols.push(symbolType.note(beat + d, duration - d, symbol.number));
				
				break;
			}
		}

		d = 2;

		// Handle notes of a beat or less. 
		while ((d /= 2) >= 0.125) {
			if (barBeat % d === 0 && duration >= d) {
				symbol.duration = d;
				symbol.tied = true;
				
				//symbols.push(createTieSymbol(svg, symbol));
				symbols.push(symbolType.note(beat + d, duration - d, symbol.number));
			}
		}
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
	
	function renderSymbols(svg, scribe, symbols) {
		var length = symbols.length,
		    n = -1,
		    x = 0,
		    y = 0,
		    symbol, node;
		
		scribe.staveNode1.removeChild(scribe.staveNode2);
		scribe.staveNode2 = createNode(svg, 'g', {});
		scribe.staveNode3 = createNode(svg, 'g', {});
		append(scribe.staveNode1, [scribe.staveNode2, scribe.staveNode3]);
		
		while (++n < length) {
			symbol = symbols[n];
			
			if (debug) console.log('Scribe: write symbol', symbol);
			
			if (symbol.type !== 'note') {
				node = nodeType[symbol.type](svg, symbol);
				scribe.staveNode2.appendChild(node);
				continue;
			}
			
			node = nodeType[symbol.type](svg, symbol);
			scribe.staveNode3.appendChild(node);
			
			if (symbol.y > 5) {
				y = symbol.y + 1;
				
				while (--y > 5) {
					if (y % 2) { continue; }
					
					scribe.staveNode2.appendChild(
						createNode(svg, 'use', {
							'href': '#line',
							'class': 'scribe-stave',
							'translate': [symbol.x - 2, y],
							'scale': [4, 1]
						})
					);
				}
			}

			if (symbol.y < -5) {
				y = symbol.y - 1;
				
				while (++y < -5) {
					if (y % 2) { continue; }
					
					scribe.staveNode2.appendChild(
						createNode(svg, 'use', {
							'href': '#line',
							'class': 'scribe-stave',
							'translate': [symbol.x - 2, y],
							'scale': [4, 1]
						})
					);
				}
			}
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
	
	function createSymbols(data) {
		var symbols = [];
		var n = 0;
		var beat, duration, bar, symbol, note, breakpoint;
		
		data.sort(byBeat);
		symbols.push(symbolType.clef());
		
		console.group('Scribe: createSymbols');
		
		while(n < data.length) {
			symbol = last(symbols);
			bar = scribe.barOfBeat(symbol.beat);
			note = data[n];
			breakpoint = nextBreakpoint(bar, symbol.beat);
			beat = symbol.beat;
			duration = symbol.duration;
			
			console.groupEnd();
			console.group('Scribe: last symbol', symbol.type, symbol.beat, symbol.duration, note.beat);
			
			// Where the last symbol overlaps the next note, shorten it.
			if (symbol.beat + symbol.duration > note.beat) {
				console.log('shorten');
				symbol.duration = note.beat - symbol.beat;
			}
			
			if (symbol.type === 'note') {
				// Where the last symbol overlaps a bar, shorten it, insert a
				// bar, and push a new symbol with a link to the existing one.
				if (symbol.beat + symbol.duration > bar.beat + bar.duration) {
					console.log('shorten to bar');
					symbols.push(symbolType.bar(bar.beat + bar.duration));
					symbols.push(symbolType.note(bar.beat + bar.duration, symbol.beat + symbol.duration - bar.beat - bar.duration, symbol.number))
					symbol.duration = bar.beat + bar.duration - symbol.beat;
					
					symbol.to = last(symbols);
					last(symbols).from = symbol;
					continue;
				}
	
				// Where the last symbol is a note of less than 2 beats duration
				// that overlaps a breakpoint, shorten it and push a new symbol with
				// a link to the existing one.
				if (symbol.type === 'note' && symbol.duration < 2 && symbol.beat + symbol.duration > breakpoint) {
					console.log('shorten to breakpoint');
					symbols.push(symbolType.note(breakpoint, symbol.beat + symbol.duration - breakpoint, symbol.number, symbol))
					symbol.duration = breakpoint - symbol.beat;
					
					symbol.to = last(symbols);
					last(symbols).from = symbol;
					continue;
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
			if (symbol.beat + symbol.duration < note.beat) {
				console.log('insert rest');
				symbols.push(fitRestSymbol(bar, symbol.beat + symbol.duration, note.beat - symbol.beat - symbol.duration));
				continue;
			}
			
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
			
			svg.appendChild(node1);
			
			this.staveNode1 = node1; 
			this.staveNode2 = node2; 
			
			return this;
		},
		
		createNode: createNode
	}
	
	window.Scribe = Scribe;
})();



// -------------- TEST

var scribe = Scribe('sheet');

scribe.note(60, 0, 3);
scribe.note(87, 4.5, 1);
scribe.note(65, 5.5, 1.5);
scribe.note(60, 9.875, 0.125);
scribe.note(60, 10, 0.125);

//scribe.note(60, 0, 2);
//scribe.note(63, 0, 2);
//scribe.note(67, 0, 2);
//
//scribe.note(59, 4, 0.5);
//scribe.note(65, 4, 1);
//scribe.note(71, 4, 1);
//scribe.note(62, 4.5, 0.5);
//
//scribe.note(63, 5, 1);
//scribe.note(67, 5, 1);
//scribe.note(74, 5, 1);
//
//scribe.note(78, 7, 0.5);
//scribe.note(81, 7.5, 0.5);
//
//scribe.note(79, 8, 4);
//
//scribe.note(59, 12, 0.5);
//scribe.note(60, 13, 2)

