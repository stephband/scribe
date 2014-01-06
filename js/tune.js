
var melody = [
	[0,   1, 'chord', 'C∆'],
	[4,   1, 'chord', 'G-'],
	[8,   1, 'chord', 'C∆'],
	[12,  1, 'chord', 'Bø'],

	[2,      0.5,  'note', 60],
	[2.5,    0.5,  'note', 62],
	[3,      0.5,  'note', 64],
	[3.5,    0.5,  'note', 65],
	[4,      1,    'note', 68],
	[5,      1,    'note', 69],
	[6,      1,    'note', 71],
	[7,      1,    'note', 73],
	[8,      1,    'note', 68],
	[9,      1,    'note', 69],
	[10,      1,    'note', 71],
	[11,      1,    'note', 73],
	[12,      1,    'note', 68],
	[13,      1,    'note', 60],
	[14,      1,    'note', 71],
	[15,      1,    'note', 73],
	[16,      1,    'note', 68],
	[17,      1,    'note', 69],
	[18,      1,    'note', 71],
	[19,      1,    'note', 73],
	[20,      1,    'note', 68],
	[21,      1,    'note', 69],
	[22,      1,    'note', 71],
	[23,      1,    'note', 73]
];

var options = {
	key: 'C',
	
	clef: 'treble',
	staveSpacing: 22,
	chordsOffset: -9,
	paddingTop: 9,

	symbols: {
		16: 'repeat-start',
		152: 'repeat-end'
	},

	barsPerStave: {
		0: 4,
		112: 6
	},
	
	transpose: 0
}

var scribe = Scribe('sheet', melody, options);