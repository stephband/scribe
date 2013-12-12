(function(Scribe) {
	"use strict";
	
	Scribe.mixin.array = {
		filter: Array.prototype.filter,
		map:    Array.prototype.map,
		reduce: Array.prototype.reduce,
		sort:   Array.prototype.sort,
		splice: Array.prototype.map
	};
})(Scribe);