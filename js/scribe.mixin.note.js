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
	
	Scribe.mixin.note = {
		number: createProperty('number',
			function(n) {
				// Set logic
			},
			
			function() {
				return this[3];
			}
		)
	};
})(Scribe);