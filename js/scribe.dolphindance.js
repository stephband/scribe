var melody = [
	{ beat: 2,   number: 76,  duration: 0.5 },
	{ beat: 2.5, number: 77,  duration: 0.5 },
	{ beat: 3,   number: 79,  duration: 0.5 },
	{ beat: 3.5, number: 74,  duration: 3.5 },

	{ beat: 10,   number: 76,  duration: 0.5 },
	{ beat: 10.5, number: 77,  duration: 0.5 },
	{ beat: 11,   number: 79,  duration: 0.5 },
	{ beat: 11.5, number: 74,  duration: 3.5 },

	{ beat: 18,   number: 72,  duration: 0.5 },
	{ beat: 18.5, number: 74,  duration: 1 },
	{ beat: 19.5, number: 76,  duration: 0.5 },
	{ beat: 20,   number: 71,  duration: 1 },
	{ beat: 21,   number: 71,  duration: 2 },

	{ beat: 26,   number: 72,  duration: 0.5 },
	{ beat: 26.5, number: 74,  duration: 0.5 },
	{ beat: 27,   number: 76,  duration: 0.5 },
	{ beat: 27.5, number: 71,  duration: 3.5 },
	{ beat: 31,   number: 69,  duration: 1 },
	
	{ beat: 32,   number: 68,  duration: 1.5 },
	{ beat: 33.5, number: 75,  duration: 2.5 },
	{ beat: 36,   number: 75,  duration: 1.5 },
	{ beat: 37.5, number: 75,  duration: 0.5 },
	{ beat: 38,   number: 77,  duration: 0.5 },
	{ beat: 38.5, number: 75,  duration: 0.5 },
	{ beat: 39,   number: 77,  duration: 0.5 },
	{ beat: 39.5, number: 79,  duration: 4.5 },

	{ beat: 48,   number: 76,  duration: 1.5 },
	{ beat: 49.5, number: 79,  duration: 2.5 },
	{ beat: 52,   number: 79,  duration: 1 },
	{ beat: 53,   number: 79,  duration: 0.5 },
	{ beat: 53.5, number: 79,  duration: 0.5 },
	{ beat: 54,   number: 81,  duration: 0.5 },
	{ beat: 54.5, number: 79,  duration: 0.5 },
	{ beat: 55,   number: 81,  duration: 0.5 },
	{ beat: 55.5, number: 83,  duration: 4.5 },

	{ beat: 66,   number: 80,  duration: 0.5 },
	{ beat: 66.5, number: 81,  duration: 0.5 },
	{ beat: 67,   number: 83,  duration: 0.5 },
	{ beat: 67.5, number: 78,  duration: 3.5 },

	{ beat: 74,   number: 76,  duration: 0.5 },
	{ beat: 74.5, number: 78,  duration: 0.5 },
	{ beat: 75,   number: 80,  duration: 0.5 },
	{ beat: 75.5, number: 74,  duration: 3.5 },

	{ beat: 82,   number: 72,  duration: 0.5 },
	{ beat: 82.5, number: 74,  duration: 1 },
	{ beat: 83.5, number: 76,  duration: 0.5 },
	{ beat: 84,   number: 71,  duration: 1 },
	{ beat: 85,   number: 71,  duration: 2 },

	{ beat: 90,   number: 72,  duration: 0.5 },
	{ beat: 90.5, number: 74,  duration: 1 },
	{ beat: 91,   number: 76,  duration: 0.5 },
	{ beat: 91.5, number: 78,  duration: 4.5 },

	{ beat: 96,    number: 78,  duration: 0.5 },
	{ beat: 96.5,  number: 79,  duration: 0.5 },
	{ beat: 97.5,  number: 78,  duration: 0.25 },
	{ beat: 97.75, number: 77,  duration: 0.25 },
	{ beat: 98,    number: 78,  duration: 1 },
	{ beat: 99,    number: 78,  duration: 0.5 },
	{ beat: 99.5,  number: 83,  duration: 0.5 },
	{ beat: 100.5, number: 80,  duration: 3.5 },

	{ beat: 104,    number: 80,  duration: 0.5 },
	{ beat: 104.5,  number: 82,  duration: 0.5 },
	{ beat: 105.5,  number: 80,  duration: 0.25 },
	{ beat: 105.75, number: 78,  duration: 0.25 },
	{ beat: 106,    number: 80,  duration: 1 },
	{ beat: 107,    number: 80,  duration: 0.5 },
	{ beat: 107.5,  number: 85,  duration: 2.5 },
	{ beat: 110,    number: 86,  duration: 2 },

	{ beat: 112,    number: 87,  duration: 1.5 },
	{ beat: 113.5,  number: 85,  duration: 1 },
	{ beat: 114.5,  number: 80,  duration: 1 },
	{ beat: 115.5,  number: 77,  duration: 0.5 },
	
	{ beat: 116,    number: 84,  duration: 3 },
	{ beat: 119,    number: 75,  duration: 0.5 },
	{ beat: 119.5,  number: 80,  duration: 8.5 },

	{ beat: 138,   number: 81,  duration: 0.5 },
	{ beat: 138.5, number: 82,  duration: 0.5 },
	{ beat: 139,   number: 84,  duration: 0.5 },
	{ beat: 139.5, number: 79,  duration: 3.5 },

	{ beat: 146,   number: 76,  duration: 0.5 },
	{ beat: 146.5, number: 77,  duration: 0.5 },
	{ beat: 147,   number: 79,  duration: 0.5 },
	{ beat: 147.5, number: 74,  duration: 3.5 }
];

var chords = [
	{ beat: 0, duration: 4, type: 'mode', value: ['C', '-'] }
];

var scribe = Scribe('sheet', melody, {
	key: 'C',
	staveSpacing: 19,
	paddingTop: 4,
	symbols: {
		16: 'repeat-start',
		152: 'repeat-end'
	}
});