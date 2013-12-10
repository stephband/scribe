var melody = [
	['mode', 0,  'G7'],
	['mode', 16, 'C7'],
	['mode', 24, 'G7'],
	['mode', 32, 'Bø'],
	['mode', 34, 'E7alt'],
	['mode', 36, 'F-'],
	['mode', 40, 'G-'],
	['mode', 44, 'A♭∆(♯11)'],
	['mode', 48, 'B♭7sus'],
	['mode', 52, 'E♭-'],
	['mode', 54, 'B∆(♯11)'],
	['mode', 56, 'B♭-'],
	['mode', 58, 'A7alt/F'],
	['mode', 60, 'D∆/F♯'],
	['mode', 72, 'E♭-7'],
	['mode', 74, 'A♭7']
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