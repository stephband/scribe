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

The model classifies note spellings via **5 accidental classes** (`𝄫`, `♭`, `♮`, `♯`, `𝄪`, which combine with the note's MIDI pitch class to resolve any of the 35 TPC coordinates from $-15$ to $+19$) and local keys across **15 standard key signatures** ($-7$ to $+7$, covering $C\flat$ to $C\sharp$):

$$\text{Accidental Class Index} = \lfloor (\text{TPC} + 1) / 7 \rfloor + 2 \in [0, 4]$$
$$\text{Key Class Index} = \text{Key} + 7 \in [0, 14]$$

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
Inputs per note X_t: [Pitch Class (12), Duration (4), Delta Beat (8), Key (15)] (39 dims)
                 │                                              │
                 ▼                                              │
┌────────────────────────────────────────────────────┐          │
│ Layer 0: Bidirectional GRU (H_0 = 24 per dir)      │          │
│ • Output: H0_t = [h_fwd_t ; h_bwd_t] (48 dims)     │          │
└────────┬───────────────────────────────────┬───────┘          │
         │                                   │                  │
         ▼                                   │                  │
┌────────────────────────────────┐           │                  │
│ Multi-Task Head 1:             │           │                  │
│ Local Key Classifier           │           │                  │
│ (25 classes: D𝄫=-12 to B♯=+12) │           │                  │
└────────┬───────────────────────┘           │                  │
         │ P(key_t) (25 dims)                │ H0_t (48 dims)   │ X_t (39 dims)
         └───────────────────────────────────┼──────────────────┘
                                             ▼
                         ┌──────────────────────────────────────┐
                         │ Concat: [H0_t ; P(key_t) ; X_t]      │
                         │ (48 + 25 + 39 = 112 dims)            │
                         └───────────────────┬──────────────────┘
                                             ▼
                         ┌──────────────────────────────────────┐
                         │ Layer 1: BiGRU (H_1 = 8 per dir)     │
                         │ • Output: H1_t (16 dims)             │
                         └───────────────────┬──────────────────┘
                                             ▼
                         ┌──────────────────────────────────────┐
                         │ Multi-Task Head 2:                   │
                         │ Accidental Classifier                │
                         │ (5 classes: 𝄫, ♭, ♮, ♯, 𝄪)           │
                         └──────────────────────────────────────┘
```

### Architectural Details

1. **Input Encoding ($39$ features)**:
   - Pitch class: 12-dimensional one-hot vector.
   - Duration: 4-bucket thermometer encoding floored to powers of 2 ($\le 1/4$ to $\ge 2$
     beats).
   - Timing: 8-bucket encoding — simultaneous flag ($< 1/16$ beat) + 7-bucket thermometer inter-onset delta beats $\Delta\text{beat}$ ($1/16$ to $\ge 4$ beats).
   - Current Key Signature: 15-dimensional one-hot vector ($C\flat = -7$ to $C\sharp = +7$), tracking key signature changes across the sequence.
2. **Layer 0 (Key Tracker)**: A BiGRU ($H_0 = 24$) aggregates harmonic context
   across the timeline. Multi-Task Head 1 projects Layer 0 activations ($48$ dims) to the
   25-class local key distribution ($D\flat\flat = -12$ to $B\sharp = +12$) with simplicity prior.
3. **Layer 1 (Spelling Classifier)**: A compact BiGRU ($H_1 = 8$) receives the concatenation of Layer 0 hidden states ($48$ dims), Head 1 key probabilities ($25$ dims), and raw note input features ($39$ dims) — $112$ dims total (`concat: ["key", "input"]`) — to resolve individual note spellings. Multi-Task Head 2 projects Layer 1 activations ($16$ dims) to the 5 accidental classes (`𝄫`, `♭`, `♮`, `♯`, `𝄪`), which combine with the note's MIDI pitch class to resolve the exact TPC in $[-15, +19]$.
4. **Loss Function**:
   $$\mathcal{L} = \mathcal{L}_{\text{spelling}} + \lambda_{\text{key}} \mathcal{L}_{\text{key}}$$
   with $\lambda_{\text{key}} = 0.3$ (and full BPTT gradient routing from $\mathcal{L}_{\text{spelling}}$ back through both $H_0$ and the softmax Jacobian of $P(\text{key}_t)$).

### Layer-by-Layer Inventory

| Component                                                                  | Tensor Name                                                                                                                                                      | Dimensions                                                                                                                     | Float Count                                                      | Purpose                                                                                                                                                                                                                |
| :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Layer 0 (Context BiGRU)**<br>• Forward GRU<br><br><br><br>• Backward GRU | <br>`layer0_Wih_fwd`<br>`layer0_Whh_fwd`<br>`layer0_bih_fwd`<br>`layer0_bhh_fwd`<br>`layer0_Wih_bwd`<br>`layer0_Whh_bwd`<br>`layer0_bih_bwd`<br>`layer0_bhh_bwd` | <br>$[72 \times 39]$<br>$[72 \times 24]$<br>$[72]$<br>$[72]$<br>$[72 \times 39]$<br>$[72 \times 24]$<br>$[72]$<br>$[72]$       | <br>2,808<br>1,728<br>72<br>72<br>2,808<br>1,728<br>72<br>72     | Processes raw note features ($D_{\text{in}}=39$) across sequence time steps to aggregate broad harmonic context.<br><br>Produces concatenated output:<br>$H_0 = [h_{\text{fwd}} ; h_{\text{bwd}}] \in \mathbb{R}^{48}$ |
| **Head 1 (Local Key Head)**                                                | `head_key_W`<br>`head_key_b`                                                                                                                                     | $[25 \times 48]$<br>$[25]$                                                                                                     | 1,200<br>25                                                      | Tapped directly from Layer 0 output ($48$ dims). Classifies local key into 25 key coordinates ($-12$ to $+12$)                                                                                                         |
| **Layer 1 (Tonal BiGRU)**<br>• Forward GRU<br><br><br><br>• Backward GRU   | <br>`layer1_Wih_fwd`<br>`layer1_Whh_fwd`<br>`layer1_bih_fwd`<br>`layer1_bhh_fwd`<br>`layer1_Wih_bwd`<br>`layer1_Whh_bwd`<br>`layer1_bih_bwd`<br>`layer1_bhh_bwd` | <br>$[24 \times 112]$<br>$[24 \times 8]$<br>$[24]$<br>$[24]$<br>$[24 \times 112]$<br>$[24 \times 8]$<br>$[24]$<br>$[24]$       | <br>2,688<br>192<br>24<br>24<br>2,688<br>192<br>24<br>24         | Receives $[H_0 ; P(\text{key}) ; X]$ ($D_{\text{in}}=112$) to resolve individual note spelling ambiguities.<br><br>Produces concatenated output:<br>$H_1 = [h_{\text{fwd}} ; h_{\text{bwd}}] \in \mathbb{R}^{16}$      |
| **Head 2 (Spelling Head)**                                                 | `head_spelling_W`<br>`head_spelling_b`                                                                                                                           | $[5 \times 16]$<br>$[5]$                                                                                                       | 80<br>5                                                          | Tapped from Layer 1 output ($16$ dims). Classifies note accidental into 5 classes (`𝄫`, `♭`, `♮`, `♯`, `𝄪`)                                                                                                            |
| **Total**                                                                  | **20 tensors**                                                                                                                                                   |                                                                                                                                | **16,134**                                                       | **~63.0 KiB (`Float32`) / ~15.8 KiB (`Int8`)**                                                                                                                                                                         |

---

### Why the Numbers Look the Way They Do

#### 1. The Fused 3-Gate Structure ($3 \times H$ rows)

A GRU cell contains 3 internal gates:

- **Reset gate** ($r$)
- **Update gate** ($z$)
- **Candidate hidden state** ($\tilde{h}$)

Each gate has its own input transformation $W_{x}$ and recurrent transformation
$W_{h}$. To allow fast, contiguous GEMM matrix multiplication in both CPU and
WebGPU shaders, all 3 gates are fused into a single parameter matrix with
$3 \times H$ rows ($72$ rows for Layer 0 with $H_0 = 24$, and $24$ rows for Layer 1 with $H_1 = 8$).

#### 2. Asymmetric Layer Sizing ($H_0 = 24, H_1 = 8$)

- **Layer 0** tracks 15-class local harmonic key transitions from the $39$-dimensional input features, using $H_0 = 24$ per direction ($48$ bidirectional).
- **Layer 1** only needs to resolve the 5-class accidental choice given Layer 0's harmonic context, so it uses a narrower hidden state of $H_1 = 8$ per direction ($16$ bidirectional), reducing Layer 1's parameter count by $15\times$ compared to $H_1 = 48$ ($2,784$ floats vs $42,048$ floats).

#### 3. Output Heads ($15 \times 48$ and $5 \times 16$)

- The **local key classifier** projects the $48$-dimensional bidirectional hidden state of Layer 0 onto the $15$ standard key coordinates ($C\flat = -7$ up to $C\sharp = +7$), requiring $15 \times 48 = 720$ weights and $15$ biases.
- The **accidental spelling classifier** projects the $16$-dimensional bidirectional hidden state of Layer 1 onto the $5$ accidental classes (`𝄫`, `♭`, `♮`, `♯`, `𝄪`), requiring $5 \times 16 = 80$ weights and $5$ biases.

---

## 4. Directory Structure

```
speller/
├── speller-rnn.js                # WebGPU-accelerated pitch speller inference
├── schema.js                     # Recurrent neural network architecture definition
├── key-tpc.js                    # Coordinate math, Line of Fifths conversions & constants
├── sequence-encoder.js           # Encodes Sequence note events to tensors & decodes output
├── speller-network.js            # CPU SpellerNetwork class (BPTT, training & inference)
├── speller-weights-32b.local.bin # Pre-trained weights in raw Float32 binary format (~50.6 KB)
├── speller-weights-8b.local.bin  # Pre-trained weights in quantized Int8 binary format (~12.7 KB)
├── speller-weights-8b.js         # Pre-trained Int8 weights bundled as a self-contained ES module (~17.1 KB)
└── train.js                      # Training pipeline and weight serialization script
```

---

## 5. Getting Started

### Running Inference on CPU

```javascript
import { SpellerNetwork } from "./speller/speller-network.js";

// Load pre-trained weights from binary (-8b.bin or -32b.bin) or ES module
const weightBuffer = await Deno.readFile("./speller/speller-weights-8b.bin");

const speller = SpellerNetwork.from(weightBuffer);

// Input: Sequence note event array
const events = [
    [0.0, "key", 0], // C major
    [0.0, "note", 60, 0.8, 1.0], // C4
    [1.0, "note", 64, 0.8, 1.0], // E4
    [2.0, "note", 66, 0.8, 0.5], // MIDI 66 (F# leading to G)
    [2.5, "note", 67, 0.8, 1.0], // G4
];

const results = speller.process(events);
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
const weightBuffer = await Deno.readFile("./speller/speller-weights-8b.bin");
const gpuSpeller = await SpellerRNN.from(weightBuffer);

const results = await gpuSpeller.process(events);
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
