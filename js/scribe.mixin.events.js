(function(Scribe) {
	"use strict";
	
	Scribe.mixin.events = {
		// Events
		on: function(types, fn) {
			var type, events, args;
			
			if (!fn) { return this; }
	
			types = types.split(/\s+/);
			events = this.events || (this.events = {});
			args = Array.prototype.slice.call(arguments, 1);
			args[0] = this;
	
			while (type = types.shift()) {
				if (events[type]) {
					events[type].push([fn, args]);
				}
				else {
					events[type] = [[fn, args]];
				}
			}
	
			return this;
		},
	
		// Remove one or many callbacks. If `context` is null, removes all callbacks
		// with that function. If `callback` is null, removes all callbacks for the
		// event. If `events` is null, removes all bound callbacks for all events.
		off: function(types, fn) {
			var type, calls, list, i;
	
			// No events, or removing *all* events.
			if (!this.events) { return this; }
		
			if (!(types || fn)) {
				for (type in this.events) {
					this.events[type].length = 0;
				}
				
				delete this.events;
				return this;
			}
	
			types = types ?
				types.split(/\s+/) :
				Object.keys(this.events) ;
	
			while (type = types.shift()) {
				listeners = this.events[type];
				
				if (!listeners) {
					continue;
				}
				
				if (!fn) {
					delete this.events[type];
					continue;
				}
				
				listeners.forEach(function(v, i) {
					if (v[0] === fn) {
						listeners.splice(i, i+1);
					}
				});
			}
	
			return this;
		},
	
		trigger: function(type) {
			var listeners, i, l, args;

			if (!this.events || !this.events[type]) { return this; }
	
			// Use a copy of the event list in case it gets mutated while we're
			// triggering the callbacks.
			listeners = this.events[type].slice();
	
			// Execute event callbacks.
			i = -1;
			l = listeners.length;
			
			while (++i < l) {
				listeners[i][0].apply(this, listeners[i][1]);
			}
	
			return this;
		}
	};
})(Scribe);