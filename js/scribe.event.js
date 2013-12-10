(function(Scribe) {
	var debug = Scribe.debug;
	var n = 0;
	var extend = Scribe.extend;
	var eventsMixin = Scribe.mixin.events;
	
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
	
	var prototype = {
		type: function() { return this[0]; },
		
		beat: function() { return this[1]; },
		
		destroy: function() {
			this.off();
		}
	};
	
	var mixins = {
		note: {
			
		},
		
		chord: {
			
		}
	};
	
	Scribe.Event = function(data) {
		var model = Object.create(prototype);
		
		data.reduce(setIndex, model);
		
		model.length = data.length;
		model.id = createId();
		
		extend(model, eventsMixin);
		extend(model, mixins[model.type()]);
		
		return model;
	};
})(Scribe);