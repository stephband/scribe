# Pitch Speller & Local Key Tracker

A machine learning engine for real-time musical pitch spelling and tonal key
tracking, designed for web and native JavaScript applications. It converts raw
MIDI note streams into grammatically correct musical notation (e.g. resolving
$F\sharp$ vs $G\flat$, $B\flat$ vs $A\sharp$) and estimates the underlying
harmonic key context.

The model is built on top of the bidirectional recurrent neural network engine
in [`modules/rnn/`](../modules/rnn/) and provides two runtime engines:

- **CPU Reference**: Pure JavaScript Backpropagation Through Time (BPTT), Adam
  optimizer, and inference.
- **WebGPU Engine**: Parallel WGSL compute shaders executing recurrent cell
  transitions directly in GPU VRAM for low-latency batch and sequence inference.

---

## 1. Background & The Pitch Spelling Problem

Raw MIDI events encode pitch as integers from $0$ to $127$ (semitones). However,
Western standard music notation is heptatonic and enharmonically ambiguous:

- MIDI pitch $66$ can represent $F\sharp$, $G\flat$, or $E\sharp\sharp$.
- MIDI pitch $70$ can represent $B\flat$, $A\sharp$, or $C\flat\flat$.

Choosing the correct spelling requires understanding:

1. **Global & Local Key Context**: A passage in $E\flat$ major spells pitch $66$
   as $G\flat$ (minor third / descending passing note), whereas in $D$ major it
   spells pitch $66$ as $F\sharp$ (major third).
2. **Voice Leading & Direction**: Leading tones resolving upward prefer sharps
   ($F\sharp \to G$), whereas chromatic tones resolving downward prefer flats
   ($G\flat \to F$).
3. **Enharmonic Simplicity**: Spellings with fewer accidentals are preferred
   over obscure double-accidentals unless harmonic syntax strictly demands them.

---

## 2. The Line-of-Fifths (TPC) Coordinate System

Notes and key signatures are modeled along the continuous **Line of Fifths**
(Tonal Pitch Class, or TPC), with integer coordinates centered at $C = 0$:

```
... D♭♭(-14) — A♭♭(-13) — E♭♭(-12) — B♭♭(-11) — F♭(-8) — C♭(-7) — G♭(-6) — D♭(-5) — A♭(-4) — E♭(-3) — B♭(-2) — F(-1) — C(0) — G(1) — D(2) — A(3) — E(4) — B(5) — F♯(6) — C♯(7) — G♯(8) — D♯(9) — A♯(10) — E♯(11) — B♯(12) — F𝄪(13) — C𝄪(14) ...
```

The model classifies both note spellings and local keys across **35 continuous
coordinates** ($-15$ to $+19$, covering $F\flat\flat$ to $B\sharp\sharp$):

$$\text{Class Index} = \text{TPC} + 15 \in [0, 34]$$

### Key Mathematical Invariants

- **MIDI Pitch Class Equivalence**:
  $$\text{PitchClass}(\text{TPC}) = (7 \cdot \text{TPC}) \pmod{12}$$
- **Diatonic Scale Window**: For any local key $k$, the 7 natural diatonic scale
  tones form a contiguous window: $$\text{Diatonic}(k) = [k - 1, k + 5]$$
- **Accidental Simplicity Regularization**: The local key classifier applies an
  accidental penalty prior: $$\text{Prior}(k) = -\alpha \cdot |k|$$
  This pulls ambiguous decisions toward harmonic centers with fewer accidentals
  (e.g. favoring $D\flat$ with 5 flats over $C\sharp$ with 7 sharps).

---

## 3. Model Architecture

The model uses a **Two-Layer Hierarchical Bidirectional GRU (BiGRU)** with
multi-task prediction heads:

```
Inputs per note: [Pitch Class (12), Duration One-Hot (8), Delta Beat (1)] (t = 1 ... T)
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────┐
│ Pre-projection: U = X · W_in (All time steps parallel via GEMM)│
└───────────────────────────────┬────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────┐
│ Layer 1: Bidirectional GRU (Hidden Local Key Context)          │
│ • Forward GRU (t = 0 → T-1, h_0 initialized with Initial Key)  │
│ • Backward GRU (t = T-1 → 0)                                   │
│ Output: H1_t = [h_fwd_t ; h_bwd_t]                            │
└───────────────┬────────────────────────────────┬───────────────┘
                │                                │
                ▼                                ▼
┌───────────────────────────────┐   ┌────────────────────────────┐
│ Multi-Task Head 1:            │   │ Layer 2: BiGRU             │
│ Local Key Classifier          │   │ (Tonal Pitch-Class Layer)  │
│ (35 classes: F𝄫=-15 to B𝄪=+19)│   │ Output: H2_t               │
└───────────────────────────────┘   └────────────┬───────────────┘
                                                 │
                                                 ▼
                                    ┌────────────────────────────┐
                                    │ Multi-Task Head 2:         │
                                    │ Note Spelling Classifier   │
                                    │ (35 classes: F𝄫=-15 to B𝄪) │
                                    └────────────────────────────┘
```

### Architectural Details

1. **Input Encoding ($32$ features)**:
   - Pitch class: 12-dimensional one-hot vector.
   - Duration: 8-bucket one-hot encoding scaled by powers of 2 ($1/16$ to $8$
     beats).
   - Timing: Normalized inter-onset delta beats $\Delta\text{beat}$.
2. **Initial Key Priming**: The first layer's forward hidden state $h_0$ is
   initialized from a projection of the sequence's initial key signature.
3. **Layer 1 (Key Tracker)**: A BiGRU ($H = 48$) aggregates harmonic context
   across the timeline. Multi-Task Head 1 projects layer 1 activations to the
   local key distribution.
4. **Layer 2 (Spelling Classifier)**: Receives layer 1 hidden states and refines
   representations for individual note spelling. Multi-Task Head 2 projects
   layer 2 activations to note TPC classes.
5. **Loss Function**:
   $$\mathcal{L} = \mathcal{L}_{\text{spelling}} + \lambda_{\text{key}} \mathcal{L}_{\text{key}}$$
   with $\lambda_{\text{key}} = 0.3$.

### Layer-by-Layer Inventory

| Component                                                                  | Tensor Name                                                                                                                                                      | Dimensions                                                                                                                       | Float Count                                                        | Purpose                                                                                                                                                                                                                |
| :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Initial Key Priming**                                                    | `priming_W`<br>`priming_b`                                                                                                                                       | $[48 \times 35]$<br>$[48]$                                                                                                       | 1,680<br>48                                                        | Projects 1-hot initial key signature ($35$ classes) into initial forward hidden state $h_0$ ($H=48$)                                                                                                                   |
| **Layer 0 (Context BiGRU)**<br>• Forward GRU<br><br><br><br>• Backward GRU | <br>`layer0_Wih_fwd`<br>`layer0_Whh_fwd`<br>`layer0_bih_fwd`<br>`layer0_bhh_fwd`<br>`layer0_Wih_bwd`<br>`layer0_Whh_bwd`<br>`layer0_bih_bwd`<br>`layer0_bhh_bwd` | <br>$[144 \times 32]$<br>$[144 \times 48]$<br>$[144]$<br>$[144]$<br>$[144 \times 32]$<br>$[144 \times 48]$<br>$[144]$<br>$[144]$ | <br>4,608<br>6,912<br>144<br>144<br>4,608<br>6,912<br>144<br>144   | Processes raw note features ($D_{\text{in}}=32$) across sequence time steps to aggregate broad harmonic context.<br><br>Produces concatenated output:<br>$H_1 = [h_{\text{fwd}} ; h_{\text{bwd}}] \in \mathbb{R}^{96}$ |
| **Head 1 (Local Key Head)**                                                | `head_key_W`<br>`head_key_b`                                                                                                                                     | $[35 \times 96]$<br>$[35]$                                                                                                       | 3,360<br>35                                                        | Tapped directly from Layer 0 output ($96$ dims). Classifies local key into 35 Line-of-Fifths coordinates                                                                                                               |
| **Layer 1 (Tonal BiGRU)**<br>• Forward GRU<br><br><br><br>• Backward GRU   | <br>`layer1_Wih_fwd`<br>`layer1_Whh_fwd`<br>`layer1_bih_fwd`<br>`layer1_bhh_fwd`<br>`layer1_Wih_bwd`<br>`layer1_Whh_bwd`<br>`layer1_bih_bwd`<br>`layer1_bhh_bwd` | <br>$[144 \times 96]$<br>$[144 \times 48]$<br>$[144]$<br>$[144]$<br>$[144 \times 96]$<br>$[144 \times 48]$<br>$[144]$<br>$[144]$ | <br>13,824<br>6,912<br>144<br>144<br>13,824<br>6,912<br>144<br>144 | Receives Layer 0 hidden states ($D_{\text{in}}=96$) to resolve individual note spelling ambiguities.<br><br>Produces concatenated output:<br>$H_2 = [h_{\text{fwd}} ; h_{\text{bwd}}] \in \mathbb{R}^{96}$             |
| **Head 2 (Spelling Head)**                                                 | `head_spelling_W`<br>`head_spelling_b`                                                                                                                           | $[35 \times 96]$<br>$[35]$                                                                                                       | 3,360<br>35                                                        | Tapped from Layer 1 output ($96$ dims). Classifies note spelling into 35 TPC classes                                                                                                                                   |
| **Total**                                                                  | **22 tensors**                                                                                                                                                   |                                                                                                                                  | **74,182**                                                         | **~289.8 KiB (raw Float32Array)**                                                                                                                                                                                      |

---

### Why the Numbers Look the Way They Do

#### 1. The Fused 3-Gate Structure ($144$ rows)

A GRU cell contains 3 internal gates:

- **Reset gate** ($r$)
- **Update gate** ($z$)
- **Candidate hidden state** ($\tilde{h}$)

Each gate has its own input transformation $W_{x}$ and recurrent transformation
$W_{h}$. To allow fast, contiguous GEMM matrix multiplication in both CPU and
WebGPU shaders, all 3 gates are fused into a single parameter matrix with
$3 \times H = 3 \times 48 = 144$ rows:

- Rows $0 \dots 47$: Reset gate
- Rows $48 \dots 95$: Update gate
- Rows $96 \dots 143$: Candidate state

#### 2. Why Layer 1 is Bigger than Layer 0 ($42\text{k}$ vs $23.6\text{k}$)

- **Layer 0** takes raw feature vectors ($D_{\text{in}} = 32$), so its input
  matrix $W_{ih}$ is $[144 \times 32] = 4,608$ floats per direction.
- **Layer 1** takes the concatenated forward and backward states of Layer 0
  ($48 + 48 = 96$), so its input matrix $W_{ih}$ is $[144 \times 96] = 13,824$
  floats per direction (exactly $3\times$ larger).
- The recurrent matrices $W_{hh}$ ($[144 \times 48] = 6,912$) are identical in
  size for both layers because both layers use hidden dimension $H = 48$.

#### 3. Output Heads ($35 \times 96$)

Both the local key classifier and note spelling classifier project the
$96$-dimensional bidirectional hidden states
($48 \text{ forward} + 48 \text{ backward}$) onto the $35$ Line-of-Fifths
coordinates ($F\flat\flat = -15$ up to $B\sharp\sharp = +19$), requiring
$35 \times 96 = 3,360$ weights and $35$ biases each.

---

## 4. Directory Structure

```
speller/
├── transpose.js             # Line-of-Fifths transposition augmentation
├── data/
│   └── corpus.js            # Curated musical progressions and training corpus
├── speller-rnn.js           # WebGPU-accelerated pitch speller inference
├── schema.js                # Recurrent neural network architecture definition
├── key-tpc.js               # Coordinate math, Line of Fifths conversions & constants
├── sequence-encoder.js      # Encodes Sequence note events to tensors & decodes output
├── speller-network.js       # CPU SpellerNetwork class (BPTT, training & inference)
├── speller-weights.bin      # Pre-trained weights in raw binary format (Float32Array)
├── speller-weights.js       # Pre-trained weights bundled as a self-contained ES module
└── train.js                 # Training pipeline and weight serialization script
```

---

## 5. Getting Started

### Running Inference on CPU

```javascript
import { SpellerNetwork } from "./speller/speller-network.js";
import deserializeWeights from "./modules/deserialize.js";

// Load pre-trained weights from binary or ES module
const weightBuffer = await Deno.readFile("./speller/speller-weights.bin");

const speller = new SpellerNetwork();
speller.loadWeights(deserializeWeights(weightBuffer));

// Input: Sequence note event array
const events = [
    [0.0, "key", 0], // C major
    [0.0, "note", 60, 0.8, 1.0], // C4
    [1.0, "note", 64, 0.8, 1.0], // E4
    [2.0, "note", 66, 0.8, 0.5], // MIDI 66 (F# leading to G)
    [2.5, "note", 67, 0.8, 1.0], // G4
];

const results = speller.predictSequence(events);
console.log(results);
// [
//   { tpc: 0,  name: 'C',  key: 0, keyName: 'C' },
//   { tpc: 4,  name: 'E',  key: 0, keyName: 'C' },
//   { tpc: 6,  name: 'F♯', key: 1, keyName: 'G' },
//   { tpc: 1,  name: 'G',  key: 1, keyName: 'G' }
// ]
```

### Running Inference on WebGPU

```javascript
import SpellerRNN from "./speller/speller-rnn.js";

// Initializes WebGPU, validates byte length, and loads weights in one step:
const weightBuffer = await Deno.readFile("./speller/speller-weights.bin");
const gpuSpeller = await SpellerRNN.from(weightBuffer);

const results = await gpuSpeller.predictSequence(events);
console.log(results);
```

Or with generic `RNN`:

```javascript
import RNN from "./modules/rnn.js";

const network = await RNN.from(config, weightBuffer);
const output = await network.predict(features, sequenceLength);
```

---

## 6. Training & Verification

To train the network on the full musical corpus and export updated weights:

```bash
deno run --allow-write --allow-read speller/train.js
```

To run the verification test suites:

```bash
# CPU reference & convergence tests
deno run test/test-rnn-cpu.js

# WebGPU compute kernels & numerical parity test
deno run test/test-gpu-rnn.js

# Sequence event ingestion & coordinate mapping tests
deno run test/test-rnn-pipeline.js
```

---

## 7. Model Footprint

- **Parameter Count**: 22 parameter tensors (input projection, forward/backward
  GRU gate weights, and 2 classification heads).
- **Binary Weight Size**: ~292 KB raw `Float32Array` buffer
  (`speller-weights.bin`).
- **ES Module Size**: ~390 KB base64-encoded zero-dependency module
  (`speller-weights.js`).
- **Dependencies**: Zero external ML libraries (no TensorFlow, ONNX, or PyTorch
  runtimes required).
