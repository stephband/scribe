
import quantize from '../modules/quantize.js';
import test from 'fn/test.js';

const assign  = Object.assign;
const round32 = Math.fround;

test('Quantize', [
    [],
    [[0,    'note', 'C4', 1, 1]],
    [[round32(0.0833333333), 'note', 'C4', 1, 1]],
    [[round32(0.1666666667), 'note', 'C4', 1, 1]],
    [[0.25, 'note', 'C4', 1, 1]],
    [[round32(0.3333333333), 'note', 'C4', 1, 1]],
    [[round32(0.3333333333), 'note', 'C4', 1, 1]],
    [[round32(0.4166666667), 'note', 'C4', 1, 1]],
    [[0.5,  'note', 'C4', 1, 1]],
    [[round32(0.5833333333), 'note', 'C4', 1, 1]],
    [[round32(0.6666666667), 'note', 'C4', 1, 1]],
    [[round32(0.6666666667), 'note', 'C4', 1, 1]],
    [[0.75, 'note', 'C4', 1, 1]],
    [[round32(0.8333333333), 'note', 'C4', 1, 1]],
    [[round32(0.9166666667), 'note', 'C4', 1, 1]],
    [[1, 'note', 'C4', 1, 1]],
    [[1, 'note', 'C4', 1, 1]],
    [[1, 'note', 'C4', 1, 1]],
    [[1, 'note', 'C4', 1, 1]],
    [[1, 'note', 'C4', 1, 1]],
    [[1, 'note', 'C4', 1, 1]]
], (expect, done) => {
    expect(quantize([]));
    expect(quantize([[0.0,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.1,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.2,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.25, 'note', 'C4', 1, 1]]));
    expect(quantize([[0.3,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.33, 'note', 'C4', 1, 1]]));
    expect(quantize([[0.4,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.5,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.6,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.67, 'note', 'C4', 1, 1]]));
    expect(quantize([[0.7,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.75, 'note', 'C4', 1, 1]]));
    expect(quantize([[0.8,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.9,  'note', 'C4', 1, 1]]));
    expect(quantize([[0.97, 'note', 'C4', 1, 1]]));
    expect(quantize([[0.98, 'note', 'C4', 1, 1]]));
    expect(quantize([[0.99, 'note', 'C4', 1, 1]]));
    expect(quantize([[1.0,  'note', 'C4', 1, 1]]));
    expect(quantize([[1.01, 'note', 'C4', 1, 1]]));
    expect(quantize([[1.02, 'note', 'C4', 1, 1]]));
    done();
});

test('Quantize', [
    [
        [1,   'note', 'C4', 1, 1],
        [1,   'note', 'D4', 1, 1],
        [1.5, 'note', 'E4', 1, 1],
        [1.5, 'note', 'F4', 1, 1],
        [3,   'note', 'G4', 1, 1],
        [round32(3.9166666667), 'note', 'A4', 1, 1]
    ]
], (expect, done) => {
    expect(quantize([
        [0.97, 'note', 'C4', 1, 1],
        [0.98, 'note', 'D4', 1, 1],
        [1.47, 'note', 'E4', 1, 1],
        [1.48, 'note', 'F4', 1, 1],
        [3.01, 'note', 'G4', 1, 1],
        [3.92, 'note', 'A4', 1, 1]
    ]));
    done();
});
