(function() {
	var debug = window.console && window.console.log;
	var xmlns = "http://www.w3.org/2000/svg";
	var find = document.getElementById.bind(document);
	
	var attributes = {
		'class': setAttr,
		'href': setAttrBaseVal,
		'translate': setTranslate,
		'scale': setTranslate
	};
	
	var transforms = {
		'translate': 'setTranslate',
		'scale': 'setScale',
		'rotate': 'setRotate'
	};
	
	function setAttrBaseVal(svg, node, attr, value) {
		node[attr].baseVal = value;
	}
	
	function setAttr(svg, node, attr, value) {
		node.setAttributeNS(null, attr, value);
	}
	
	function setTranslate(svg, node, attr, value) {
		var transform = svg.createSVGTransform();
		transform[transforms[attr]].apply(transform, value);
		node.transform.baseVal.appendItem(transform);
	}
	
	function createNode(svg, tag, obj) {
		var node = document.createElementNS(xmlns, tag);
		var attr;
		
		for (attr in obj) {
			attributes[attr](svg, node, attr, obj[attr]);
		}
		
		return node;
	}
	
	var noteMap = [
		// Key of C
		{ y: 0 },
		{ y: 0, accidental: 'sharp' },
		{ y: 1 },
		{ y: 2, accidental: 'flat' },
		{ y: 2 },
		{ y: 3 },
		{ y: 3, accidental: 'sharp' },
		{ y: 4 },
		{ y: 5, accidental: 'flat' },
		{ y: 5 },
		{ y: 6, accidental: 'flat' },
		{ y: 6 }
	];
	
	function numberToAccidental(n) {
		return noteMap[n % 12].accidental;
	}
	
	function numberToNote(n) {
		return noteMap[n % 12].y + Math.floor(n / 12) * 7;
	}
	
	function noteToY(noteY, staveNoteY, staveY, key) {
		return staveY + (staveNoteY - noteY);
	}
	
	function Scribe(id, options) {
		if (!(this instanceof Scribe)) {
			return new Scribe(id);
		}
		
		var svg = find(id);
		
		this.transpose = 0;
		this.staveY = 4;
		// 71 is mid note of treble clef
		this.staveNoteY = numberToNote(71 + this.transpose);
		
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
		note: function(x, n) {
			var svg = this.svg;
			var noteY = numberToNote(n + this.transpose);
			var y = noteToY(noteY, this.staveNoteY, this.staveY);
			var lineY = noteY - this.staveNoteY;
			
			//console.log(lineY);
			
			if (lineY > 5) {
				var l = lineY + 1;
				
				while (--l > 5) {
					if (l % 2) { continue; }
					
					svg.appendChild(
						createNode(svg, 'use', {
							'href': '#line',
							'class': 'lines',
							'translate': [
								this.paddingLeft + x - 2,
								this.paddingTop + this.staveY - l
							],
							'scale': [4, 1]
						})
					);
				}
			}

			if (lineY < 5) {
				var l = lineY - 1;
				
				while (++l < -5) {
					if (l % 2) { continue; }
					
					svg.appendChild(
						createNode(svg, 'use', {
							'href': '#line',
							'class': 'lines',
							'translate': [
								this.paddingLeft + x - 2,
								this.paddingTop + this.staveY - l
							],
							'scale': [4, 1]
						})
					);
				}
			}
			
			
			
			
			var node = createNode(svg, 'use', {
				'href': '#head',
				'class': 'black',
				'translate': [
					this.paddingLeft + x,
					this.paddingTop + y
				]
			});
			var accidental = numberToAccidental(n);
			var nodeAccidental;
			
			n = node;
			svg.appendChild(node)
			
			if (accidental) {
				nodeAccidental = createNode(svg, 'use', {
					'href': '#' + accidental,
					'class': 'black',
					'translate': [
						this.paddingLeft + x - 3,
						this.paddingTop + y
					]
				});
				
				svg.appendChild(nodeAccidental);
			}
			
			return this;
		},

		stave: function(x, y, w) {
			var svg = this.svg;
			var node = createNode(svg, 'use', {
				'href': '#stave',
				'class': 'lines',
				'translate': [
					this.paddingLeft + (x || 0),
					this.paddingTop + (y || 0)
				],
				'scale': [
					w || this.width - this.paddingLeft - this.paddingRight,
					1
				]
			});

			var barNode = createNode(svg, 'use', {
				'href': '#bar',
				'class': 'lines',
				'translate': [
					this.paddingLeft + (x || 0),
					this.paddingTop + (y || 0)
				]
			});
			
			n = node;
			svg.appendChild(node);
			svg.appendChild(barNode)
			
			return this;
		},
		
		createNode: createNode
	}
	
	window.Scribe = Scribe;
})();



// -------------- TEST

var scribe = Scribe('sheet');

scribe.note(6, 60);
scribe.note(6, 67);
scribe.note(6, 70);
scribe.note(6, 74);
scribe.note(6, 78);
scribe.note(6, 84);
