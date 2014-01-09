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
	
	function testDegree(n) {
		if (n < 0 || n > 11) {
			throw new Error(n + 'is out of range [0-11].');
		}
	}
	
	Scribe.mixin.note = {
		number: createProperty('number',
			function(n) { this[3] = n; },
			function()  { return this[3]; }
		),
		
		octave: createProperty('octave',
			function(n) { this.number = n * 12 + this.degree; },
			function()  { return Math.floor(this.number / 12); }
		),
		
		degree: createProperty('degree',
			function(n) {
				testDegree(n);
				this.number = this.octave + n;
			},
			function()  { return this.number % 12; }
		)
	};
})(Scribe);