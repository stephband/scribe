(function(Scribe) {
	var debug = Scribe.debug;
	var extend = Scribe.extend;
	var isDefined = Scribe.isDefined;
	
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
		
		return sub;
	}

	// Sort functions
	
	function byBeat(a, b) {
		return a.beat > b.beat ? 1 : -1 ;
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
			console.log('Scribe: Data.remove - item doesnt exist.');
			return;
		}
		
		collection.splice(i, 1);
	}

	function toJSON(data) {
		return data.map(toArray);
	}
	
	// Object constructor
	
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
		
		find: function(id) {
			return findById(this, id);
		},
		
		keyAtBeat: function(beat) {
			// Get the key at the given beat by looking at the latest chord
			// to see what key it has. Crude and only semi-effective. We
			// really need a proper key centre analyser.
			var chords = this.filter(Scribe.isChord);
			var l = chords.length;

			while (l-- && chords[l].beat > beat || !isDefined(chords[l].key));

			return chords[l].key;
		},
		
		toJSON: function() {
			return toJSON(this);
		}
	};
	
	extend(prototype, Scribe.mixin.array);
	extend(prototype, Scribe.mixin.events);
	
	Scribe.Data = function(data) {
		var collection = Object.create(prototype);
		
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