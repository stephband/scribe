var melody = [
	{ beat: 0,  type: 'mode', value: 'G7' },
	{ beat: 16, type: 'mode', value: 'C7' },
	{ beat: 24, type: 'mode', value: 'G7' },
	
	{ beat: 32, type: 'mode', value: 'Bø' },
	{ beat: 34, type: 'mode', value: 'E7alt' },
	{ beat: 36, type: 'mode', value: 'F-' },
	{ beat: 40, type: 'mode', value: 'G-' },
	{ beat: 44, type: 'mode', value: 'A♭∆(♯11)' },
	{ beat: 48, type: 'mode', value: 'B♭7sus' },

	{ beat: 52, type: 'mode', value: 'E♭-' },
	{ beat: 54, type: 'mode', value: 'B∆(♯11)' },
	{ beat: 56, type: 'mode', value: 'B♭-' },
	{ beat: 58, type: 'mode', value: 'A7alt/F' },
	
	{ beat: 60, type: 'mode', value: 'D∆/F♯' },
	{ beat: 72, type: 'mode', value: 'E♭-7' },
	{ beat: 74, type: 'mode', value: 'A♭7' }
];

var scribe = Scribe('sheet', melody, {
	key: 'C',
	
	clef: 'treble',
	staveSpacing: 19.8,
	paddingTop: 8,
	symbols: {
		16: 'repeat-start',
		152: 'repeat-end'
	},
	end: 80
});