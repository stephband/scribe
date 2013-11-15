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
		5: [4],
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
	
	function greaterBeat(a, b) {
		return a.data.beat > b.data.beat ? 1 : -1 ;
	}

	function lesser(total, n) {
		return n < total ? n : total ;
	}
	
	function greater(total, n) {
		return n > total ? n : total ;
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
	
	function noteToY(noteY, staveNoteY, staveY, key) {
		return staveY + (staveNoteY - noteY);
	}
	
	function createClefSymbol(svg, data) {
		var node = createNode(svg, 'use', {
			'href': '#treble',
			'class': 'black'
		});
		
		return {
			type: 'clef',
			minwidth: 8,
			width: 10,
			node: node,
			beat: 0,
			duration: 0
		}
	}
	
	function createNoteSymbol(svg, data) {
		var node = createNode(svg, 'g');
		var minwidth = 0;
		var width = 0;
		
		var head = createNode(svg, 'use', {
			'href': '#head[' + (data.duration < 1 ? 1 : data.duration > 2 ? 2 : data.duration) + ']',
			'class': 'black'
		});
		
		minwidth += 2.8;
		width += 4.3 + (data.duration > 1 ? data.duration : 0);
		
		node.appendChild(head);
		
		var accidentalType = numberToAccidental(data.number);
		var accidental;
		
		if (accidentalType) {
			accidental = createNode(svg, 'use', {
				'href': '#' + accidentalType,
				'class': 'black',
				'translate': [-3, 0]
			});
			
			minwidth += 1.6;
			width += 3.2;
			
			node.appendChild(accidental);
		}
		
		return {
			type: 'note',
			minwidth: minwidth,
			width: width,
			node: node,
			data: data,
			beat: data.beat,
			duration: data.duration
		};
	}
	
	function createBarSymbol(svg, data) {
		var node = createNode(svg, 'use', {
			'href': '#bar',
			'class': 'lines'
		});
		
		return {
			type: 'bar',
			minwidth: 1,
			width: 2,
			node: node,
			beat: data.beat,
			duration: 0
		}
	}

	function createRestSymbol(svg, data) {
		var node = createNode(svg, 'use', {
			'href': '#rest[' + data.duration + ']',
			'class': 'black'
		});
		
		return {
			type: 'rest',
			minwidth: 2.5 + data.duration,
			width: 3 + data.duration * 3,
			y: 0,
			node: node,
			beat: data.beat,
			duration: data.duration
		}
	}
	
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
	
	function fitRestSymbol(svg, scribe, beat, duration) {
		var barBeat = beatOfBar(beat, scribe.beatsPerBar);
		var barDuration = durationOfBar(beat, scribe.beatsPerBar);
		var barBreaks = breaksOfBar(beat, scribe.beatsPerBar);
		var barBreak;
		var b = -1;
		var d = 2;
		
		// Any whole bar of longer than two beat's rest gets a 4 beat rest symbol.
		if (barBeat === 0 && barDuration > 2 && duration >= barDuration) {
			return createRestSymbol(svg, {
				beat: beat,
				duration: 4
			});
		}
		
		// Reduce duration to the nearest bar breakpoint
		while (++b < barBreaks.length) {
			barBreak = barBreaks[b];
			if (barBeat >= barBreak) { continue; }
			if (barBeat + duration > barBreak) {
				duration = barBreak - barBeat;
				break;
			}
		}
		
		// Handle rests of 2 – 4 beats duration.
		if (barBeat % 1 === 0 && duration >=2) {
			return createRestSymbol(svg, {
				beat: beat,
				duration: duration > 4 ? 4 : Math.floor(duration)
			});
		}
		
		// Handle rests of a beat or less. No sane person wants to read rests
		// any shorter than an 1/32th note.
		while ((d /= 2) >= 0.125) {
			if (barBeat % d === 0 && duration >= d) {
				return createRestSymbol(svg, {
					beat: beat,
					duration: d
				});
			}
		}

		if (debug) console.log('Scribe: not able to make rest for beat:', beat, 'duration:', duration);
		
		return;
	}
	
	function insertClefSymbol(svg, scribe, symbols) {
		symbols.splice(0, 0, createClefSymbol(svg, {
			beat: 0
		}));
	}
	
	function insertBarSymbols(svg, scribe, symbols) {
		var length = symbols.length,
		    n = -1,
		    b = 1,
		    symbol;

		while (++n < symbols.length) {
			symbol = symbols[n];
			if (symbol.beat / scribe.beatsPerBar >= b) {
				symbols.splice(n, 0, createBarSymbol(svg, {
					beat: b * scribe.beatsPerBar
				}));
				b++;
			}
		}
		
		symbols.push(createBarSymbol(svg, {
			beat: b * scribe.beatsPerBar
		}));
	}
	
	function insertRestSymbols(svg, scribe, symbols) {
		var n = -1,
		    d = 0,
		    beat = 0,
		    next = 0,
		    xGroup = [],
		    symbol;
		
		while (++n < symbols.length) {
			symbol = symbols[n];
				
			if (!symbols[n + 1]) {
				return;
			}
			
			xGroup.push(symbol);
			
			if (!symbols[n + 1] || symbols[n + 1].type !== 'note' || symbol.beat !== symbols[n + 1].beat) {
				d = xGroup.map(getDuration).reduce(greater, 0);
				beat = xGroup[0].beat;
				next = symbols[n + 1].beat;
				if (beat + d > next) {
					// Reduce duration of all notes
					xGroup.reduce(setDuration, beat + d);
				}
				else if (beat + d < next) {
					// Insert rest
					symbols.splice(n + 1, 0, fitRestSymbol(svg, scribe, beat + d, next - (beat + d)));
				}
				
				xGroup.length = 0;
			}
		}
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
				noteY = numberToNote(symbol.data.number + scribe.transpose);
				symbol.y = noteToY(noteY, scribe.staveNoteY, scribe.staveY);
				
				// Handle x positioning
				xGroup.push(symbol);
				
				if (!symbols[n + 1] || symbols[n + 1].type !== 'note' || symbol.data.beat !== symbols[n + 1].data.beat) {
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
		    symbol;
		
		scribe.staveNode1.removeChild(scribe.staveNode2);
		scribe.staveNode2 = createNode(svg, 'g', {});
		scribe.staveNode1.appendChild(scribe.staveNode2);
		
		while (++n < length) {
			symbol = symbols[n];
			
			if (symbol.type !== 'note') {
				setTransform(svg, symbol.node, 'translate', [symbol.x, 0]);
				scribe.staveNode2.appendChild(symbol.node);
				continue;
			}
			
			setTransform(svg, symbol.node, 'translate', [
				scribe.paddingLeft + symbol.x,
				scribe.paddingTop + symbol.y
			]);
			
			svg.appendChild(symbol.node);
			
			if (symbol.y > scribe.staveY + 5) {
				y = symbol.y - scribe.staveY + 1;
				
				while (--y > 5) {
					if (y % 2) { continue; }
					
					scribe.staveNode2.appendChild(
						createNode(svg, 'use', {
							'href': '#line',
							'class': 'lines',
							'translate': [symbol.x - 2, y],
							'scale': [4, 1]
						})
					);
				}
			}

			if (symbol.y < scribe.staveY - 5) {
				y = symbol.y - scribe.staveY - 1;
				
				while (++y < -5) {
					if (y % 2) { continue; }
					
					scribe.staveNode2.appendChild(
						createNode(svg, 'use', {
							'href': '#line',
							'class': 'lines',
							'translate': [symbol.x - 2, y],
							'scale': [4, 1]
						})
					);
				}
			}
		}
	}
	
	function createSymbol(data) {
		var svg = this;
		return createNoteSymbol(svg, data);
	}
	
	function renderScribe(scribe, svg) {
		var symbols = scribe.data.map(createSymbol, svg);
		symbols.sort(greaterBeat);
		
		insertClefSymbol(svg, scribe, symbols);
		insertBarSymbols(svg, scribe, symbols);
		insertRestSymbols(svg, scribe, symbols);
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

		this.data = [];
		this.beatsPerBar = 5;
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
				'class': 'lines',
				'scale': [
					w || this.width - this.paddingLeft - this.paddingRight,
					1
				]
			});

			var bar = createNode(svg, 'use', {
				'href': '#bar',
				'class': 'lines'
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

scribe.note(60, 3, 1);

scribe.note(60, 9.75, 0.25);

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

