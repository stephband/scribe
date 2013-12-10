(function(Scribe) {
	var debug = Scribe.debug;
	var eventsMixin = Scribe.mixin.events;
	
	// Map functions
	
	function toArray(event) {
		return Array.prototype.slice.call(event, 0);
	}

	// Reduce functions
	
	function setIndex(object, value, i) {
		object[i] = value;
		return object;
	}
	
	function addListener(sub, pub) {
		sub
		.on('change', pub.trigger)
		.on('destroy', pub.remove);
	}

	// Sort functions
	
	function byBeat(a, b) {
		return a.beat() > b.beat() ? 1 : -1 ;
	}
	
	// Object functions
	
	function findById(collection, id) {
		var l = collection.length;
		
		while (l--) {
			if (collection[l].id === id) {
				return collection[l];
			}
		}
	}

	function add(collection, item) {
		// Add an item, keeping the collection sorted by beat.
		var beat = item.beat();
		var l = collection.length;
		
		while (collection[--l] && collection[l].beat() > beat) {}
		
		collection.splice(l + 1, 0, item);
	}

	function remove(collection, item) {
		var i = collection.indexOf(item);
		
		if (i === -1) {
			console.log('Scribe: data.remove - item doesnt exist.');
			return;
		}
		
		collection.splice(i, 1);
	}

	function toJSON(data) {
		return data.map(toArray);
	}
	
	// Object contructor
	
	var prototype = {
		add: function(item) {
			add(this, item);
			return this;
		},
		
		remove: function(item) {
			if (typeof item === 'string') {
				return this.find(item).destroy();
			}
			
			remove(this, item);
			return this;
		},
		
		filter: Array.prototype.filter,
		
		find: function(id) {
			return findById(this, id);
		},
		
		map: Array.prototype.map,
		reduce: Array.prototype.reduce,
		splice: Array.prototype.map,
		
		toJSON: function() {
			return toJSON(this);
		}
	};
	
	Scribe.Data = function(data) {
		var collection = Object.create(prototype);
		
		extend(collection, eventsMixin);
		
		if (!(data instanceof Array)) {
			if (debug) console.log('Scribe: data not an array. Scribe cant do that yet.');
			return;
		}
		
		data
		.map(Scribe.Event)
		.sort(byBeat)
		.reduce(setIndex, collection)
		.length = data.length;
		
		collection.reduce(addListener, collection)
		
		return collection;
	};
})(Scribe);