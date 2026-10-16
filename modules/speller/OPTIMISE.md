Ran command: List files in modules/speller/ (`ls -la modules/speller/`)
Viewed README.md:1-282
Viewed schema.js:1-43
Viewed key-tpc.js:1-88
Viewed sequence-encoder.js:1-174
Viewed speller-network.js:1-129
Viewed speller-rnn.js:1-58
Viewed train.js:1-147
Viewed transpose.js:1-66
Viewed build-dataset.js:1-63
Ran command: List files in modules/speller/data/ and data/ (`ls -la modules/speller/data/ data/`)
Viewed deno.json:1-18
Viewed create-data.js:1-66
Viewed README.md:1-64
Viewed chromatic.js:1-89
Viewed major.js:1-100
Viewed triads.js:1-100
Viewed tetrads.js:1-100

Here is an analysis of the current model architecture in [`modules/speller/`](file:///Users/stephband/Sites/scribe/modules/speller/), an evaluation of your three proposed changes, and a roadmap of ways to shrink and optimise the model iteratively.

---

### Current Parameter Breakdown (Baseline)

Right now, [`schema.js`](file:///Users/stephband/Sites/scribe/modules/speller/schema.js) defines a 2-layer BiGRU with `inDim = 32`, `hiddenDim = 48` per direction ($96$ bidirectional), and $35$ output classes for both heads:

| Component | Shape / Formula | Floats | % of Model |
| :--- | :--- | ---: | ---: |
| **Priming** (`priming_W`, `priming_b`) | $48 \times 35 + 48$ | 1,728 | 2.3% |
| **Layer 0 BiGRU** (Context / Key) | $2 \times [144 \times 32 + 144 \times 48 + 288]$ | 23,616 | 31.8% |
| **Head 1** (`key`) | $35 \times 96 + 35$ | 3,395 | 4.6% |
| **Layer 1 BiGRU** (Spelling) | $2 \times [144 \times 96 + 144 \times 48 + 288]$ | 42,048 | 56.7% |
| **Head 2** (`spelling`) | $35 \times 96 + 35$ | 3,395 | 4.6% |
| **Total** | **22 tensors** | **74,182** | **100% (~290 KB bin / ~396 KB JS)** |

Notice that **Layer 1 alone accounts for 56.7% of the parameters** because its input is the concatenated forward+backward state from Layer 0 ($D_{\text{in}} = 96$).

---

### Evaluation of Your 3 Proposed Changes

#### 1. Passing current key signature per note event (instead of $h_0$ priming)
* **Pros:**
  * Supports mid-piece key signature changes (`[beat, "key", key]` events at any point in a sequence).
  * In a bidirectional RNN, priming only $h_0$ of the forward GRU means the backward GRU has no awareness of the key signature until it reaches the beginning of the piece, and the forward GRU's memory of $h_0$ decays over long sequences. Passing the active key at every step gives both directions immediate local access to the notated key signature.
  * Eliminates the special-case `priming` configuration in [`schema.js`](file:///Users/stephband/Sites/scribe/modules/speller/schema.js#L26-L29), [`speller-network.js`](file:///Users/stephband/Sites/scribe/modules/speller/speller-network.js#L31-L33), and [`speller-rnn.js`](file:///Users/stephband/Sites/scribe/modules/speller/speller-rnn.js#L41-L46).
* **Size Impact:**
  * Removing `priming` saves $1,728$ floats.
  * If encoded as a **15-dim one-hot vector** (with Change #2), `FEATURE_DIM` goes from $32 \to 47$. At $H=48$, Layer 0 $W_{ih}$ increases by $2 \times 144 \times 15 = 4,320$ floats (net $+2,592$ floats).
  * **Optimization tip:** Instead of a 15-dim one-hot vector, the active key signature can be encoded as **1 or 2 continuous features**—e.g. normalized Line-of-Fifths coordinate $k / 7 \in [-1, 1]$ (plus optionally $\sin/\cos$ on the circle of fifths). That gives mid-sequence key changes while *shrinking* the model by $\sim 1,440$ floats!

#### 2. Limiting Keys to `[-7, +7]` (15 keys: $\text{C}\flat$ to $\text{C}\sharp$)
* **Pros:**
  * Completely sensible. Standard key signatures only exist in `[-7, +7]`, and as noted in [`modules/speller/data/README.md`](file:///Users/stephband/Sites/scribe/modules/speller/data/README.md#L21), even secondary dominants in extreme keys enharmonically respell to stay within `[-7, +7]`.
  * Eliminates 20 dead classes from the key head (`head_key_W` drops from $35 \times 96 \to 15 \times 96$, saving $1,940$ floats) and sharpens the softmax gradient during training.
* **Important distinction for the Spelling Head (`outDim`):**
  * While *keys* live in `[-7, +7]` (15 classes), *note spellings* (TPCs) in those keys still span a wider range on the Line of Fifths:
    * Simply playing diatonic major scales from $\text{C}\flat$ to $\text{C}\sharp$ requires TPCs from $\text{F}\flat$ ($-8$) to $\text{B}\sharp$ ($+12$) = **21 TPCs** (`[-8, +12]`, all single flats/sharps + naturals).
    * If you also want double flats and double sharps (e.g. $\text{G}\sharp$ leading tone in $\text{A}$ harmonic minor is $\text{G}\sharp$, or $\text{F}\𝄪$ leading to $\text{G}\sharp$ in $\text{G}\sharp$ minor), the full double-accidental range is $\text{F}\𝄫$ ($-15$) to $\text{B}\𝄪$ ($+19$) = **35 TPCs**.
    * **Even better (see Pitch-Class Relative Spelling below):** You can actually replace the 35-class TPC head with a **3- or 5-class accidental head**, which avoids this problem entirely and shrinks the output layer by 90%!

#### 3. Expanding the Key Output Layer to Understand Modes / Scales (Cost/Benefit)
Right now, a "local key" on the Line of Fifths ($k \in [-7, +7]$) really represents a **diatonic signature** (the 7-note window $[k-1, k+5]$). For example, C Ionian, D Dorian, E Phrygian, and A Aeolian all share $k = 0$.

* **How does this affect Note Spelling? (Low benefit, or already captured)**
  * For strictly diatonic modes (Dorian, Phrygian, Lydian, Mixolydian, Aeolian), the spelling of every scale degree is *identical* to its relative major key $k$. Knowing whether a passage is in D Dorian vs C Major does not change a single note's accidental.
  * Where mode *does* affect spelling is **altered scale degrees in minor/harmonic scales** (e.g., in A harmonic minor, pitch class 8 is spelled $\text{G}\sharp$, not $\text{A}\flat$, even though the key signature is $0$).
  * *However*, examine how your training data ([`triads.js`](file:///Users/stephband/Sites/scribe/data/triads.js), [`tetrads.js`](file:///Users/stephband/Sites/scribe/data/tetrads.js), [`chromatic.js`](file:///Users/stephband/Sites/scribe/data/chromatic.js)) already handles this: on an E7 chord ($\text{V/vi}$ in C), the annotation sets `expectedKey = 'A'` ($k = +3$), where $\text{G}\sharp$ is diatonic! In other words, treating `key` as the **instantaneous local tonicization on the Line of Fifths** already gives the model harmonic analysis of secondary dominants and modal mixture without multiplying the class count.
* **What is the Cost of adding explicit Modes?**
  * **Combinatorial & Annotation Cost (High):** If you cross 15 tonic centers with $M$ modes (say, 7 diatonic modes + harmonic minor + melodic minor = 9 modes), the key head explodes from $15 \to 135$ classes. Worse, you would have to manually annotate every note in your training corpus with both a tonic and a mode, and many chords (like a lone C major triad) are modally ambiguous (is it I in C Ionian, IV in G Mixolydian, or V in F?). That ambiguity adds label noise that hurts convergence.
* **Verdict / Alternative:**
  * **Don't use a Cartesian-product (Key $\times$ Mode) head.**
  * If you want harmonic/modal analysis later, keep Head 1 as the 15-class **Diatonic Key Signature** ($k \in [-7, +7]$) and add a **separate tiny multi-task head** (e.g., 7 classes for the active scale degree of the local tonic/root relative to $k$, or 3 classes for Major / Minor / Dominant quality). Two factored heads ($15 + 7 = 22$ outputs) are $6\times$ smaller than a joint $15 \times 7 = 105$ head and much easier to train.

---

### Suggestions for Reducing Model Size & Optimising

Because parameter count scales **quadratically** with `hiddenDim` ($O(H^2)$), and file size scales linearly with bytes-per-weight, you can achieve massive reductions by combining structural changes with weight compression:

#### 1. Reduce `hiddenDim` ($H$) and Test Unequal Layer Sizes (Biggest Win)
Currently $H_0 = 48, H_1 = 48$ ($74,182$ params). Because `W_ih` of Layer 1 and `W_hh` of both layers scale with $H^2$, stepping down $H$ shrinks the model dramatically:
* $H = 48 \to \mathbf{74.2\text{k}}$ params (~290 KB)
* $H = 32 \to \mathbf{35.7\text{k}}$ params (~140 KB, **52% reduction**)
* $H = 24 \to \mathbf{21.7\text{k}}$ params (~85 KB, **71% reduction**)
* $H = 16 \to \mathbf{11.0\text{k}}$ params (~43 KB, **85% reduction**)
* You can also make Layer 1 smaller than Layer 0 (e.g. `layers: [{ hiddenDim: 32 }, { hiddenDim: 16 }]`), since Layer 1 only needs to combine the local key representation with the note's pitch class.

#### 2. Predict Displacement / Accidental (3 or 5 classes) Instead of Absolute TPC (35 classes)
We already know the input note's MIDI pitch class $p \in [0, 11]$!
For any given MIDI pitch class $p$, almost all 35 TPC classes are impossible (their `(tpc * 7) % 12 !== p`). In fact, within the 35-TPC window `[-15, 19]`, any MIDI pitch class has **at most 3 possible enharmonic spellings** (e.g. for MIDI $60$: $\text{D}\𝄫 = -12$, $\text{C} = 0$, $\text{B}\sharp = +12$, spaced 12 steps apart on the Line of Fifths).
* Right now, the network spends capacity learning which of the 35 TPCs correspond to which of the 12 MIDI pitch classes—a deterministic mathematical formula (`tpcToMidiPitchClass`).
* **Two ways to exploit this:**
  1. **Zero-parameter inference masking:** Keep TPC targets, but mask out logits where `tpcToMidiPitchClass(c) !== pitchClass` before argmax/softmax. This guarantees the model can *never* output a note with the wrong MIDI pitch class, allowing a much smaller `hiddenDim` to still hit 100% accuracy.
  2. **3-class Enharmonic Choice Head:** Since each pitch class has at most 3 valid TPCs in `[-15, 19]` (flat-side, natural/central, sharp-side), `outDim` for the spelling head drops from **35 to 3**! That shrinks `head_spelling_W` by **91%** and makes the classification problem vastly simpler for Layer 1, allowing a much smaller recurrent layer.

#### 3. Test a 1-Layer BiGRU (Joint Heads on Layer 0)
Currently, Layer 1 takes 56.7% of all weights ($42,048$ floats).
Wait—does spelling actually require a second stacked BiGRU layer, or can both `key` and `spelling` heads tap off a single BiGRU layer (`layerIndex: 0`)?
* Or, if a second layer helps, does Layer 1 really need to be *bidirectional*, or could Layer 0 be bidirectional (for broad key context) and Layer 1 be unidirectional or even a simple linear/MLP projection that combines `[H0_t, pitchClass_t, keyLogits_t]`?
* Dropping Layer 1 entirely reduces the model from **$74.2\text{k} \to 32.1\text{k}$ params** at $H=48$ (or **$16.8\text{k}$ params** at $H=32$).

#### 4. Compress Input Features (`FEATURE_DIM`: $32 \to 15\text{–}17$)
In [`sequence-encoder.js`](file:///Users/stephband/Sites/scribe/modules/speller/sequence-encoder.js#L50-L56), every note uses 32 floats:
* `12` for One-Hot Pitch Class (keep this—categorical pitch class is essential).
* `8` for One-Hot Duration Buckets (`[1/16 .. 8]` beats).
* `12` for One-Hot Inter-Onset Delta Buckets (`[0 .. 64]` beats).
Notice that duration and delta-beat are inherently **continuous, ordered quantities** ($\log_2(\text{beats})$), and buckets like 16, 32, or 64 beats are almost never activated in your training data (leaving dead columns in `W_ih`).
* Replacing the 8-dim duration one-hot and 12-dim delta one-hot with:
  * `1` float: normalized $\log_2(\text{duration})$
  * `1` float: `isSimultaneous` flag ($\Delta\text{beat} == 0$, crucial for chord detection)
  * `1` float: normalized $\log_2(\max(1/16, \Delta\text{beat}))$
  * `1` or `2` floats (or `15` one-hot): active key signature
* This cuts 17 dead/redundant input dimensions out of Layer 0.

#### 5. Weight Quantization (`Float16` or `Int8` Serialization)
Once you find the smallest architecture that hits 100% accuracy, you can shrink the serialized file size (`speller-weights.bin` and `speller-weights.js`) without changing the architecture at all:
* **`Float16` (`Uint16Array`)**: Neural network weights in $[-1, +1]$ suffer zero accuracy loss when stored as 16-bit floats (or `Int16` fixed-point) and unpacked to `Float32Array` on load. That immediately cuts binary and JS bundle size in **half** (e.g. $50\%$).
* **`Int8` symmetric quantization**: Storing per-tensor `maxAbs` scale + `Int8Array` weights cuts the file size by **75%** ($4\times$ smaller) with negligible accuracy impact on classification tasks.

---

### Suggested Iterative Plan

If you'd like to proceed, I recommend we tackle this in the following order so we can benchmark accuracy after each step using `deno task train`:

1. **Step 1 (Your Changes #1 & #2):**
   * Restrict keys to `[-7, +7]` (15 classes) and TPCs to `[-15, +19]` (35 classes, or `[-8, +12]` = 21 classes if double accidentals aren't needed yet—let me know your preference!).
   * Replace `priming` with per-note current key signature in [`sequence-encoder.js`](file:///Users/stephband/Sites/scribe/modules/speller/sequence-encoder.js) and [`schema.js`](file:///Users/stephband/Sites/scribe/modules/speller/schema.js).
2. **Step 2 (Input & Output Head Streamlining):**
   * Test compressing duration/delta features and/or pitch-class masking.
3. **Step 3 (Iterative Architecture Sweep):**
   * Step down `hiddenDim` ($48 \to 32 \to 24 \to 16$) and test 2-layer vs 1-layer BiGRU until we find the exact Pareto frontier where accuracy starts to dip below 100%.

How does this sound? For **Step 1**, should we keep note spelling TPCs at 35 classes (`F𝄫` to `B𝄪` to support double accidentals) while restricting keys to 15 classes (`C♭` to `C♯`), and how would you prefer the per-note key signature to be encoded (15-dim one-hot vs normalized scalar)?
