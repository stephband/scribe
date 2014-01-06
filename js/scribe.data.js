(function(Scribe) {
	"use strict";
	
	var debug = Scribe.debug;
	var extend = Scribe.extend;
	var isDefined = Scribe.isDefined;
	var isNote = Scribe.isNote;
	var isChord = Scribe.isChord;
	var mod12 = Scribe.mod12;
	var sum = Scribe.sum;
	
	var r1 = 0.1;
	var r2 = (1 - r1) / 11;
	
	console.log('r1, r2:', r1, r2);
	
	var names = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
	
	var transitionMatrix = [
		[r1,r2,r2,r2,r2,r2,r2,r2,r2,r2,r2,r2],
		[r2,r1,r2,r2,r2,r2,r2,r2,r2,r2,r2,r2],
		[r2,r2,r1,r2,r2,r2,r2,r2,r2,r2,r2,r2],
		[r2,r2,r2,r1,r2,r2,r2,r2,r2,r2,r2,r2],
		[r2,r2,r2,r2,r1,r2,r2,r2,r2,r2,r2,r2],
		[r2,r2,r2,r2,r2,r1,r2,r2,r2,r2,r2,r2],
		[r2,r2,r2,r2,r2,r2,r1,r2,r2,r2,r2,r2],
		[r2,r2,r2,r2,r2,r2,r2,r1,r2,r2,r2,r2],
		[r2,r2,r2,r2,r2,r2,r2,r2,r1,r2,r2,r2],
		[r2,r2,r2,r2,r2,r2,r2,r2,r2,r1,r2,r2],
		[r2,r2,r2,r2,r2,r2,r2,r2,r2,r2,r1,r2],
		[r2,r2,r2,r2,r2,r2,r2,r2,r2,r2,r2,r1]
	];
	
	var scaleEmissionProb = [0.1, 0.04, 0.1, 0.04, 0.1, 0.1, 0.04, 0.1, 0.04, 0.1, 0.04, 0.1];
	
	// Make the matrix
	var emissionMatrix = [];
	var l = 12;
	while (l--) {
		emissionMatrix[l] = scaleEmissionProb.slice(12 - l).concat(scaleEmissionProb.slice(0, 12 - l));
	}
	
	console.log(emissionMatrix);
	
	// Test
	console.log(scaleEmissionProb.filter(Scribe.sum));
	
	var initialProb = [1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12];
	
	// Map functions
	
	function toArray(event) {
		return Array.prototype.slice.call(event, 0);
	}
	
	function toNote(event) {
		return mod12(event.number);
	}
	
	function toName(note) {
		return names[note];
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
	
	function byGreater(a, b) {
		return a > b ? 1 : -1 ;
	}
	
	function computeEmissions(notes, emissionMatrixRow) {
		var p = 1;
		
		for( var i = 0; i < notes.length; ++i ) {
			p = p * emissionMatrixRow[ notes[i] ];
		}
		
		return p;
	}
	
	function returnArg1(ting) {
		return ting;
	}
	
	
	// Viterbi algorithm for finding hidden relationships
	function viterbi(data, initialProb, transitionMatrix, emissionMatrix) {
		var V = [[]];
		var path = [];
		
		// Initialize base cases (t == 0)
		for(var i=0; i < 12; i++) {
			console.log(data[0], emissionMatrix[i], computeEmissions(data[0], emissionMatrix[i]));
			V[0][i] = initialProb[i] * computeEmissions(data[0], emissionMatrix[i]);
			path[i] = [i];
		}
		
		// Run Viterbi for t > 0
		for(var t=1; t < data.length; t++) {
			V.push([]);
			var newpath = [];
			
			for (var j = 0; j < 12; j++) {
				var max = [0, null];
				
				for (var i=0; i < 12; i++) {
					// Calculate the probablity
					var calc = V[t - 1][i]
						* transitionMatrix[i][j]
						//* emissionMatrix[j][data[t]];
						* computeEmissions(data[t], emissionMatrix[j]);
					
					if(calc > max[0]) {
						max = [calc, i];
					}
				}
				
				V[t][j] = max[0];
				newpath[j] = path[max[1]].concat(j);
			}
			path = newpath;
		}
	
		var max = [0,null];
		
		for (var i = 0; i < 12; i++) {
			var calc = V[data.length - 1][i];
			
			if (calc > max[0]) {
				max = [calc, i];
			}
		}
		
		console.log(max[0]);
	
		return path[max[1]];
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
	
	function invalidateCaches(collection) {
		collection._beats.length = 0;
		collection._keys.length = 0;
	}

	function toJSON(data) {
		return data.map(toArray);
	}
	
	function populateBeats(data, beats) {
		var n = data.length;
		var beats = data._beats || [];
		var event, beat;
		
		beats.length = 0;
		
		while (n--) {
			event = data[n];
			
			if (beat !== event.beat) {
				beat = event.beat;
				beats.push(beat);
			}
		}
		
		return beats;
	}
	
	// Object constructor
	
	var prototype = {
		add: function(item) {
			invalidateCaches(this);
			add(this, item);
			return this;
		},
		
		remove: function(item) {
			invalidateCaches(this);
			
			if (typeof item === 'string') {
				return this.find(item).destroy();
			}
			
			remove(this, item);
			return this;
		},
		
		find: function(id) {
			return findById(this, id);
		},
		
		eventsAtBeat: function(beat) {
			var n = this.length;
			var events = [];
			var event;
			
			while (n--) {
				event = this[n];
				
				if (event.beat <= beat && (event.beat + event.duration) > beat) {
					events.push(event);
				}
			}
			
			return events.reverse();
		},
		
		keyAtBeat: function(beat) {
			// Get the key at the given beat by looking at the latest event
			// beat to see what it has.
			var beats = this.beats();
			var n = beats.length;
			
			while (n--) {
				if (beats[n] <= beat) { break; }
			}
			
			return this.keys()[n];
		},
		
		toJSON: function() {
			return toJSON(this);
		},
		
		beats: function() {
			return this._beats.length ?
				this._beats :
				populateBeats(this) ;
		},
		
		keys: function() {
			if (this._keys.length) {
				return this._keys;
			}
			
			var beats = this.beats();
			var length = beats.length;
			var n = -1;
			var notes = [];
			var beat, events;
			
			while (++n < length) {
				beat = beats[n];
				events = this.eventsAtBeat(beat);
				notes.push(events.filter(isNote).map(toNote));
			}
			
			var keys = viterbi(notes, initialProb, transitionMatrix, emissionMatrix);
			
			this._keys.length = 0;
			n = keys.length;
			
			while (n--) {
				this._keys[n] = keys[n];
			}
			
			console.log(this._keys);
			
			console.log(keys.map(function(v, i) {
				return notes[i] + ' ' + toName(v);
			}));
			
			return keys;
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
		
		// Define caches
		Object.defineProperties(collection, {
			_beats: { value: [] },
			_keys:  { value: [] }
		});
		window.collection = collection;
		return collection;
	};
	
	Scribe.toNote = toNote;
})(Scribe);