(function(Scribe) {
	Scribe.mixin.array = {
		filter: Array.prototype.filter,
		map: Array.prototype.map,
		reduce: Array.prototype.reduce,
		splice: Array.prototype.map
	};
})(Scribe);