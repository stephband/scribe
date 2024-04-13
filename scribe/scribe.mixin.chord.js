(function(Scribe) {
	"use strict";
	
	var debug = Scribe.debug;
	var mod12 = Scribe.mod12;
	var notes = Scribe.notes;
	
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

	var scales = {
		'∆':		[0, 2, 4, 7, 9, 11],
		'∆7':		[0, 2, 4, 7, 9, 11],
		'-':		[0, 3, 7],
		'-7':		[0, 2, 3, 5, 7, 9, 10],
		'sus♭9':	[0, 1, 5, 7, 10],
		'7sus♭9':	[0, 1, 5, 7, 10],
		'∆♯11':		[0, 2, 4, 6, 7, 9, 11],
		'∆(♯11)':	[0, 2, 4, 6, 7, 9, 11],
		'7':		[0, 4, 7, 10],
		'13':		[0, 4, 7, 9, 10],
		'sus':		[0, 2, 5, 7, 10],
		'7sus':		[0, 2, 5, 7, 10],
		'-♭6':		[0, 2, 3, 5, 7, 8],
		'ø':		[0, 3, 6, 10],

		// Melodic minor
		'-∆':		[0, 2, 3, 5, 7, 9, 11],
		'13sus♭9':	[0, 1, 5, 7, 9, 10],
		'∆+':		[0, 2, 4, 6, 8, 9, 11],
		'∆♯5':		[0, 2, 4, 6, 8, 9, 11],
		'7♯11':		[0, 2, 4, 6, 7, 9, 10],
		'7♭13':		[0, 2, 4, 7, 8, 10],
		'ø(9)':		[0, 2, 3, 6, 10],
		'7alt':		[0, 1, 3, 4, 6, 8, 10],
		
		'∆♭6':		[0, 4, 7, 8, 11]
	};
	
	var rchord = /([ABCDEFG][♭♯]?)([^\/]*)(?:\/([ABCDEFG]))?/,
	    empty = [];


	// Sort functions
	
	function byGreater(a, b) {
		return a > b ? 1 : -1 ;
	}


	// Map functions

	function toRoot(str) {
		var name = (rchord.exec(str) || empty)[1];
		return Scribe.number(name);
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

	function toKey(str) {
		return mod12(toRoot(str) - toMode(str));
	}
	
	function createProperty(name, set, get) {
		return {
			set: function(n) {
				if (n === this[name]) { return this; }
				if (debug) console.log('set:', name, n);
				set(n);
				this.trigger(name);
				return this;
			},
			
			get: get,
			
			enumerable: true
		};
	}
	
	Scribe.mixin.chord = {
		root: createProperty('root',
			function(n) {
				
			},
			
			function() { return toRoot(this[3]); }
		),
		
		extension: createProperty('extension',
			function(n) {
				
			},
			
			function() { return toExtension(this[3]); }
		),
		
		bass: createProperty('bass',
			function(n) {
				
			},
			
			function() { return toBass(this[3]); }
		),
		
		key: createProperty('key',
			function(n) {
				
			},
			
			function() { return toKey(this[3]); }
		),

		scale: createProperty('scale',
			function(n) {},
			function() {
				var scale = scales[this.extension];
				var root = this.root;
				
				return scale ?
					scale
					.map(function(n) { return (n + root) % 12; })
					.sort(byGreater) :
					[] ;
			}
		)
	};
	
	Scribe.modes = modes;
})(Scribe);