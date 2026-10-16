# Speller Training & Test Datasets

This directory contains sequence datasets used to train and evaluate the Scribe musical pitch speller neural network (`modules/speller/`).

## Datasets Overview

- **`major.js`**: 15 diatonic major scales covering all standard keys from $C\sharp$ (7 sharps) to $C\flat$ (7 flats), played ascending and descending (16 notes each).
- **`triads.js`**: 15 triad progressions covering all 15 standard keys, played as broken triads (39 notes each: 13 triads $\times$ 3 notes).
- **`chromatic.js`**: Ascending and descending chromatic scales.
- **`corpus.js`**: Polyphonic and melodic sequences for complex spelling evaluation.

---

## 15-Key Triad Progressions (`triads.js`)

Each triad sequence steps through diatonic triads and secondary dominants:
$$\text{I} \rightarrow \text{V/ii} \rightarrow \text{ii} \rightarrow \text{V/iii} \rightarrow \text{iii} \rightarrow \text{IV} \rightarrow \text{V/V} \rightarrow \text{V} \rightarrow \text{V/vi} \rightarrow \text{vi} \rightarrow \text{V/vii}^\circ \rightarrow \text{vii}^\circ \rightarrow \text{I}$$

### 15 Keys & Enharmonic Passing Substitutions

To adhere to the 15 standard key signatures (keys with at most 7 sharps or 7 flats, avoiding double sharps or double flats in key signatures), secondary dominant passing chords that would require double sharps in sharp keys momentarily jump to their enharmonic equivalent keys:

| Export | Sequence Name | Base Key | Notes | Passing Chord Substitutions |
|---|---|---|---|---|
| `triadsInCs` | **C♯ triads** | `C♯` | 39 | Enharmonic jumps to `E♭`, `F`, `A♭`, `B♭`, `C` |
| `triadsInFs` | **F♯ triads** | `F♯` | 39 | Enharmonic jumps to `A♭`, `B♭`, `E♭`, `F` |
| `triadsInB`  | **B triads**  | `B`  | 39 | Enharmonic jumps to `E♭`, `A♭`, `B♭` |
| `triadsInE`  | **E triads**  | `E`  | 39 | Enharmonic jumps to `A♭`, `E♭` |
| `triadsInA`  | **A triads**  | `A`  | 39 | Enharmonic jump to `A♭` |
| `triadsInD`  | **D triads**  | `D`  | 39 | Diatonic / single accidentals |
| `triadsInG`  | **G triads**  | `G`  | 39 | Diatonic / single accidentals |
| `triadsInC`  | **C triads**  | `C`  | 39 | Diatonic / single accidentals |
| `triadsInF`  | **F triads**  | `F`  | 39 | Diatonic / single accidentals |
| `triadsInBb` | **B♭ triads** | `B♭` | 39 | Diatonic / single accidentals |
| `triadsInEb` | **E♭ triads** | `E♭` | 39 | Diatonic / single accidentals |
| `triadsInAb` | **A♭ triads** | `A♭` | 39 | Diatonic / single accidentals |
| `triadsInDb` | **D♭ triads** | `D♭` | 39 | Diatonic / single accidentals |
| `triadsInGb` | **G♭ triads** | `G♭` | 39 | Diatonic / single accidentals |
| `triadsInCb` | **C♭ triads** | `C♭` | 39 | Diatonic / single accidentals |

---

## 15 Major Scales (`major.js`)

All 15 standard major scales arranged in Circle of Fifths order:

| Export | Sequence Name | Key | Notes | Range |
|---|---|---|---|---|
| `majorCs` | **C♯ major** | `C♯` (7♯) | 16 | `C♯4` – `C♯5` |
| `majorFs` | **F♯ major** | `F♯` (6♯) | 16 | `F♯4` – `F♯5` |
| `majorB`  | **B major**  | `B` (5♯)  | 16 | `B3` – `B4` |
| `majorE`  | **E major**  | `E` (4♯)  | 16 | `E4` – `E5` |
| `majorA`  | **A major**  | `A` (3♯)  | 16 | `A3` – `A4` |
| `majorD`  | **D major**  | `D` (2♯)  | 16 | `D4` – `D5` |
| `majorG`  | **G major**  | `G` (1♯)  | 16 | `G3` – `G4` |
| `majorC`  | **C major**  | `C` (0)   | 16 | `C4` – `C5` |
| `majorF`  | **F major**  | `F` (1♭)  | 16 | `F3` – `F4` |
| `majorBb` | **B♭ major** | `B♭` (2♭) | 16 | `B♭3` – `B♭4` |
| `majorEb` | **E♭ major** | `E♭` (3♭) | 16 | `E♭4` – `E♭5` |
| `majorAb` | **A♭ major** | `A♭` (4♭) | 16 | `A♭3` – `A♭4` |
| `majorDb` | **D♭ major** | `D♭` (5♭) | 16 | `D♭4` – `D♭5` |
| `majorGb` | **G♭ major** | `G♭` (6♭) | 16 | `G♭3` – `G♭4` |
| `majorCb` | **C♭ major** | `C♭` (7♭) | 16 | `C♭4` – `C♭5` |
