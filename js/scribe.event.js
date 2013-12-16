(function(Scribe) {
	"use strict";
	
	var debug = Scribe.debug;
	var extend = Scribe.extend;
	var n = 0;
	
	// Create ids
	function createId() {
		return n++;
	}
	
	// Reduce functions
	
	function setIndex(object, value, i) {
		object[i] = value;
		return object;
	}
	
	// Object functions
	
	
	// Object constructor
	
	var prototype = Object.defineProperties({}, {
		beat: {
			get: function() {
				return this[0];
			},
			set: function(n) {
				this.trigger('beat');
				return this;
			},
			enumerable: true
		},
	
		duration: {
			get: function() {
				return this[1];
			},
			set: function(n) {
				this.trigger('beat');
				return this;
			},
			enumerable: true
		},
		
		type: {
			get: function() {
				return this[2];
			},
			set: function(n) {
				this.trigger('type');
				return this;
			},
			enumerable: true
		},

		destroy: {
			value: function() {
				this.trigger('destroy');
				this.off();
			}
		}
	});

	var prototypes = {
		chord: Object.defineProperties(Object.create(prototype), Scribe.mixin.chord),
		note:  Object.defineProperties(Object.create(prototype), Scribe.mixin.note)
	};

	extend(prototype, Scribe.mixin.events);

	Scribe.Event = function(data) {
		var model = Object.create(prototypes[data[2]]);

		data.reduce(setIndex, model);

		model.length = data.length;
		model.id = createId();

		return model;
	};
})(Scribe);