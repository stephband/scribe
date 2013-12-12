	var test = {
		equals: function(a, b) {
			if (a !== b)
				throw new Error(a + ' is not equal to ' + b);
		},
		
		number: function(n, name) {
			if (typeof n !== 'number')
				throw new Error(name + ' is not a number (it\'s a ' + (typeof n) + ')');
		},
		
		notNaN: (function(){
			var isNaN = Number.isNaN || window.isNaN;
			
			return function(n, name) {
				if (isNaN(n))
					throw new Error(name + ' is NaN');
			}
		})()
	};