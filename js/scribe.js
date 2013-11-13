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
	
	function getWidth(obj) {
		return obj.width;
	}
	
	function getY(obj) {
		return obj.y;
	}
	
	function setX(x, obj) {
		obj.x = x;
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
	
	var symbolCreators = {
		note: function(svg, data) {
			var node = createNode(svg, 'g');
			var minwidth = 0;
			var width = 0;
			
			var head = createNode(svg, 'use', {
				'href': '#head',
				'class': 'black'
			});
			
			minwidth += 2.8;
			width += 4.2;
			
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
				width += 2;
				
				node.appendChild(accidental);
			}
			
			return {
				minwidth: minwidth,
				width: width,
				node: node,
				data: data
			};
		}
	};
	
	function updateSymbolsX(svg, scribe, symbols) {
		var length = symbols.length,
		    n = -1,
		    x = 0,
		    w = 0,
		    xGroup = [],
		    yGroup = [],
		    noteY, symbol;
		
		symbols.sort(greaterBeat);
		
		while (++n < length) {
			symbol = symbols[n];
			
			// Handle y positioning
			noteY = numberToNote(symbol.data.number + scribe.transpose);
			symbol.y = noteToY(noteY, scribe.staveNoteY, scribe.staveY);
			
			// Handle x positioning
			xGroup.push(symbol);
			
			if (!symbols[n + 1] || symbol.data.beat !== symbols[n + 1].data.beat) {
				w = xGroup.map(getWidth).reduce(greater, 0);
				xGroup.reduce(setX, x + w / 2);
				xGroup.length = 0;
				x += w;
			}
		}
	}
	
	function updateSymbolsY() {
		console.log(data.number);
		var noteY = numberToNote(data.number + this.transpose);
		symbol.y = noteToY(noteY, this.staveNoteY, this.staveY);
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
		return symbolCreators[data.type](svg, data);
	}
	
	function renderScribe(scribe, svg) {
		var symbols = scribe.data.map(createSymbol, svg);
		
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
		this.symbols = [];
		this.data = [];

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

scribe.note(60, 0, 1);
scribe.note(63, 0, 1);
scribe.note(67, 0, 1);

scribe.note(59, 1, 1);

scribe.note(62, 2, 1);

scribe.note(65, 3, 1);
scribe.note(70, 4, 1);
scribe.note(75, 5, 1);

scribe.note(78, 6, 1);
scribe.note(83, 7, 1);
scribe.note(82, 8, 1);
scribe.note(85, 9, 1);

