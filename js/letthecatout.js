var melody = [
	['chord', 0,  'G7'],
	['chord', 16, 'C7'],
	['chord', 24, 'G7'],
	['chord', 32, 'Bø'],
	['chord', 34, 'E7alt'],
	['chord', 36, 'F-'],
	['chord', 40, 'G-'],
	['chord', 44, 'A♭∆(♯11)'],
	['chord', 48, 'B♭7sus'],
	['chord', 52, 'E♭-'],
	['chord', 54, 'B∆(♯11)'],
	['chord', 56, 'B♭-'],
	['chord', 58, 'A7alt/F'],
	['chord', 60, 'D∆/F♯'],
	['chord', 72, 'E♭-7'],
	['chord', 74, 'A♭7']
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