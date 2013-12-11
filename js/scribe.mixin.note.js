(function(Scribe) {
	"use strict";
	
	var debug = Scribe.debug;
	
	Scribe.mixin.note = {
		number: {
			set: function(v) {
				this.trigger('number');
				return this;
			},
			
			get: function() {
				return toRoot(this[2]);
			},
			
			enumerable: true
		}
	};
})(Scribe);