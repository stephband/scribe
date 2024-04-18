
import sum          from '../../../fn/modules/sum.js';
import eventsAtBeat from './events-at-beat.js';
import toBeats      from './to-beats.js';
import toScale      from './to-scale.js';


/** toKeys(events)
   Uses the Viterbi algorithm to probabalistically determine key centres of an
   array of events.
**/

const initialProb = [1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12, 1/12];

const transitionProbs = [10, 5, 8, 10, 6, 10, 8, 10, 7, 10, 8, 4];

const transitionSum = transitionProbs
	.reduce(sum);

const transitionMatrix = transitionProbs
	.map(function(n) { return n / transitionSum; })
	.map(toMatrix);

const emissionMatrix = [0.1, 0.04, 0.1, 0.04, 0.1, 0.1, 0.04, 0.1, 0.04, 0.1, 0.04, 0.1]
	.map(toMatrix);


function toMatrix(v, i, arr) {
	return arr.slice(12 - i).concat(arr.slice(0, 12 - i));
}

function computeEmissions(notes, emissionMatrixRow) {
	var p = 0;

	for( var i = 0; i < notes.length; ++i ) {
		p += Math.log(emissionMatrixRow[notes[i]]);
	}

	return p;
}

function viterbi(data, initialProb, transitionMatrix, emissionMatrix) {
	var probs = [];
	var matrix = [];
	var path = [];
	var max = [];
	var t = 0;
	var i = -1;
	var j, newpath, prob;

	// Calculate base probabilities for t = 0
	matrix[t] = probs;

	while (++i < 12) {
		probs[i] = Math.log(initialProb[i]) + computeEmissions(data[0], emissionMatrix[i]);
		path[i] = [i];
	}

	// Calculate probable paths
	while (++t < data.length) {
		probs = [];
		newpath = [];
		matrix[t] = probs;
		j = -1;

		while (++j < 12) {
			// Initialise max array
			max.length = 0;
			max[0] = -Infinity;
			i = -1;

			while (++i < 12) {
				// Calculate the probablity
				prob = matrix[t - 1][i]
					+ Math.log(transitionMatrix[i][j])
					+ computeEmissions(data[t], emissionMatrix[j]);

				if (prob > max[0]) {
					max[0] = prob;
					max[1] = i;
				}
			}

			probs[j] = max[0];
			newpath[j] = path[max[1]].concat(j);
		}

		path = newpath;
	}

	// Initialise max array
	max.length = 0;
	max[0] = -Infinity;
	i = -1;

	while (++i < 12) {
		prob = matrix[data.length - 1][i];

		if (prob > max[0]) {
			max[0] = prob;
			max[1] = i;
		}
	}

	return path[max[1]];
}

function pushAll(array1, array2) {
	array1.push.apply(array1, array2)
	return array1;
}

export default function toKeys(events) {
	const beats  = toBeats(events);
	const length = beats.length;
	const notes  = [];

	let n = -1;
	let beat, beatEvents;
	while (++n < length) {
		beat = beats[n];
		// beatEvents must be used synchronously – it is a buffer that is
		// overwritten on the next call to eventsAtBeat()
		beatEvents = eventsAtBeat(beat, events);
		notes.push(
			beatEvents
			.map(toScale)
			.reduce(pushAll, [])
		);
	}

	return viterbi(notes, initialProb, transitionMatrix, emissionMatrix);
}
