(function(Scribe) {
	"use strict";
	
	var debug = Scribe.debug;

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
	
	function testInteger(n) {
		if (typeof n % 1 !== 0) {
			throw new Error(n + 'is not an integer.')
		}
	}
	
	function testNumber(n) {
		if (typeof n !== 'number') {
			throw new Error(n + 'is not a number.')
		}
	}
	
	function testPositive() {
		if (n < 0) {
			throw new Error(n + 'is negative.');
		}
	}
	
	function testRange(n, min, max) {
		if (n < min || n > max) {
			throw new Error(n + 'is out of range [' + min + '-' + max + '].');
		}
	}
	
	Scribe.mixin.note = {
		number: createProperty('number',
			function(n) {
				if (debug) {
					testNumber(n);
					testInteger(n);
					testPositive(n);
				}
				
				this[3] = n;
			},
			
			function()  { return this[3]; }
		),
		
		octave: createProperty('octave',
			function(n) {
				if (debug) {
					testNumber(n);
					testInteger(n);
					testRange(n, 0, 16);
				}
				
				this.number = n * 12 + this.degree;
			},
			
			function()  { return Math.floor(this.number / 12); }
		),
		
		degree: createProperty('degree',
			function(n) {
				if (debug) {
					testNumber(n);
					testInteger(n);
					testRange(n, 0, 11);
				}
				
				this.number = this.octave + n;
			},
			
			function()  { return this.number % 12; }
		),
		
		scale: createProperty('number',
			function(n) {},
			function()  { return [this.degree]; }
		)
	};
})(Scribe);