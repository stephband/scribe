// bolt
//
// bolt(name, obj)
// 
// name: the name of the class
// obj: a list of event types defining default handlers for the class
// 
// bolt.identify(node)
// Returns the node's id. If the node does not have an id, bolt
// generates a new and unused id, sets it on the node and returns it.
// 
// bolt.classify(node)
// Gets the first bolt registered class in the node's classList and
// returns it, or undefined.
// 
// bolt.has(class, [type])
// Query bolt to see if it has a handlers for the given class, and
// optionally for the given event type.


(function (module) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], module);
	} else {
		// Browser globals
		module(jQuery);
	}
})(function(jQuery, undefined){
	var debug = false,//true,
	    
	    // Keep a log of event types that have been bolted.
	    types = {},
	    
	    // Keep a log of classes.
	    classes = {};

	function identify(node) {
		var id = node.id;

		if (!id) {
			do { id = Math.ceil(Math.random() * 100000); }
			while (document.getElementById(id));
			node.id = id;
		}

		return id;
	}

	function classify(node) {
		var classList = node.className.split(/\s+/),
		    l = classList.length,
		    i = -1;

		while (i++ < l) {
			if (classes[classList[i]]) {
				return classList[i];
			}
		}
	}

	function hasClass(className, type) {
		return !!(classes[className] && (type === undefined || classes[className][type]));
	}

	function cacheData(target) {
		var data = jQuery.data(target, 'bolt');
		
		if (!data) {
			data = {
				'elem': jQuery(target),
				'class': classify(target)
			};
			
			jQuery.data(target, 'bolt', data);
		}
		
		return data;
	}


	function boltEvent(event, classes) {
		var _default = event._default;

		// Replace the event's default handler with bolt's.
		event._default = function(e) {
			var self = this,
			    args = arguments,
			    data = cacheData(e.target),
			    fn = classes[ data['class'] ],
			    handler = _default ?
			    	_default.bind(this, e) :
			    	jQuery.noop ;

			if (fn) {
				// Call bolt's default handler for this class and event.
				return fn(e, data, handler);
			}

			// Call the original default handler.
			return handler();
		};
	}

	function bolt(className, obj) {
		var type, event;
		
		classes[className] = obj;
		
		for (type in obj) {
			event = jQuery.event.special[type];
			
			if (debug) console.log('[bolt] register class:', className, type, event);
			
			// If the event is not defined, create a placholder for it.
			if (!event) {
				event = jQuery.event.special[type] = {};
			}
			
			// If this event type is not already bolted, do it now.
			if (!types[type]) {
				types[type] = {};
				boltEvent(event, types[type]);
			}
			
			// Finally, add our class handler to the event type object.
			types[type][className] = obj[type];
		}
	}
	
	bolt.identify = identify;
	bolt.classify = classify;
	bolt.has = hasClass;
	
	jQuery.bolt = bolt;
	
	return bolt;
});