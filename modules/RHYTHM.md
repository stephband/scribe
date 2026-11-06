# Rhythm Detection Architecture & Design

> **Proposal**: Elastic Phase-Locked Metrical Quantizer (EPL-MQ)  
> **Author**: Antigravity & Stephen Band  
> **Date**: October 2026  

---

## 1. The Core Problem

Human musical performance takes place in **continuous, expressive time** (rubato, pushing, dragging, swing, microtiming). Western music notation exists in **discrete, rational metric trees** (bars, beats, tuplets, subdivisions).

A musical rhythm detector has two competing responsibilities:

1. **Perceptual Tracking**: If a drummer lays back by $35\text{ms}$ on beat 2, a human listener does not perceive an exotic syncopation or a 64th-note rest — the listener's auditory cortex adjusts its internal clock and perceives straight or swung notes on an *elastic reference frame*.
2. **Metric Grounding (The "Elastic Band")**: The listener's internal clock does not wander off indefinitely. A persistent restoring force pulls the perceived pulse back toward the nominal grid (the barline, the downbeat, the conductor's baton).

---

## 2. Critique of Current Rhythm Detectors

### The Old Detector (`modules/rhythm.js`)
- Tested stationary harmonic oscillators with `atan2(i, r)` to calculate `drift` and `phase`.
- Used `driftWeight = gaussian(0.125, drift)` purely as a **penalty filter** to disqualify rhythms.
- It suffered from rigid windows: phase was treated as an error metric rather than an adaptive reference frame.

### The New Detector (`modules/detect-rhythm.js`)
- Uses recursive binary tree bifurcation (`detectBestFit`), which elegantly reflects the hierarchical structure of Western notation.
- Scores candidates using a stationary cosine comb: $\sum \cos(2\pi x)$.
- **Limitations**:
  1. **Rigid Window Boundaries**: Windows are strictly anchored to powers of 2 ($[0, 1), [1, 2), [0, 0.5)$). A note that drifts across a boundary (e.g. at $0.99$ or $1.02$) is cleaved into separate sub-windows.
  2. **Memoryless Across Windows**: When evaluating beat 1, the detector has no recollection of beat 0’s drift. If beat 0 pushed by $+30\text{ms}$ and beat 1 also pushes by $+30\text{ms}$, beat 1 is penalized against absolute $0.000\text{ms}$ instead of locking into the groove.
  3. **Phase Discarded**: Sine quadrature $\sum \sin(2\pi x)$ is computed but unused. Drift immediately reduces the cosine score instead of steering the local origin.
  4. **Phase Dilation with Scale**: Because phase is $x = \frac{t \cdot \text{divisor}}{\text{duration}}$, doubling the duration halves the phase error for the same absolute time deviation. Coarse grids ($d \ge 2$) naturally over-accept far notes unless counterbalanced by duration-dependent scaling.

---

## 3. The New Architecture: Elastic Phase-Locked Metrical Quantizer (EPL-MQ)

If we were to design a production-grade rhythm detector from scratch, it would unite **Harmonic Oscillator Analysis** with a **Phase-Locked Loop (PLL)** inside an **Elastic Metrical Tree**.

```
             Performed Event Timings [t0, t1, t2, ...]
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Event Clustering & Chord Aggregation                     │
│    - Groups simultaneous/flam notes (|Δt| < 0.02 beats)     │
│    - Extracts onset density and initial tempo estimate      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Continuous Phase-Tracking Frame (The "Elastic Band")      │
│    - State: δ(t) (phase offset in beats), v(t) (local tempo)│
│    - Predicts local beat coordinate: b(t) = t - δ(t)        │
│    - Restoring spring pulls δ(t) → 0 at barlines            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Complex Phasor Resonance (Separating Coherence & Phase)  │
│    - Z(divisor) = Σ exp(i · 2π · x) = R + i·I               │
│    - Magnitude |Z|: Rhythm Coherence (Phase-Invariant)      │
│    - Argument atan2(I, R): Performer Drift Angle            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Elastic Metrical Tree Search (Progressive Bifurcation)    │
│    - Soft receptive-field windows (no knife-edge cleaving)  │
│    - Score = Coherence × SpringPenalty(Phase) × Coverage(d) │
│    - Outputs minimal complexity notation tree               │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Mathematical Details

### 4.1 The Elastic Phase-Locked Loop (PLL)

Let $t_n$ be the raw performed time of event $n$. The effective metric time $b_n$ is:
$$b_n = t_n - \delta_n$$

Where $\delta_n$ is the local phase displacement.

When event $n$ is matched to a candidate grid slot $g_n = \text{round}(b_n \cdot \frac{\text{divisor}}{d}) \cdot \frac{d}{\text{divisor}}$, the instantaneous prediction error is:
$$e_n = b_n - g_n$$

The state update for $\delta$ is governed by a discrete **critically damped spring**:
$$\delta_{n} = (1 - \lambda) \cdot \delta_{n-1} + \alpha \cdot e_n$$

- $\alpha \in [0.15, 0.35]$ is the **tracking elasticity**: how readily the reference frame adapts to the performer's local groove.
- $\lambda \in [0.05, 0.20]$ is the **restoring spring constant**: the elastic band that continually pulls $\delta \to 0$ (back to the true metric beat).

#### Musical Behavior:
1. **Sustained Rush/Drag (e.g., +40ms groove)**: $\delta$ glides to $+40\text{ms}$. The notes within the bar are evaluated relative to each other, achieving near $1.0$ harmonic alignment.
2. **Isolated Stumble / Flam**: An isolated timing error causes only a small nudge ($\alpha \cdot e_n$), and the restoring term $(1 - \lambda)$ immediately pulls the grid back on the next beat.
3. **Empty Rests / Barlines**: With no events, $\delta_n = (1 - \lambda)^k \cdot \delta_0 \to 0$. The frame resets cleanly for the next downbeat.

---

### 4.2 Complex Phasor Resonance: Decoupling Coherence from Drift

In current code:
$$\text{score} = \sum \cos(2\pi x_n)$$

If a triplet rhythm is played cleanly but slightly pushed by $\Delta x = 0.1$ cycles, every cosine term drops from $1.0$ to $\cos(0.2\pi) = 0.809$. The detector cannot distinguish between a *sloppy straight rhythm* and a *tight swung/displaced rhythm*.

Instead, evaluate the **complex Fourier sum**:
$$Z(\text{divisor}) = \sum_{n=1}^N e^{i 2\pi x_n} = R + i \cdot I$$
where:
$$R = \sum_{n=1}^N \cos(2\pi x_n), \quad I = \sum_{n=1}^N \sin(2\pi x_n)$$

This yields two completely orthogonal measurements:

#### 1. Rhythmic Coherence (Phase-Invariant Strength)
$$C = \frac{\sqrt{R^2 + I^2}}{N} \in [0, 1]$$
- If notes are evenly spaced at the triplet period (regardless of where the triplet starts), $C = 1.0$.
- If notes are randomly scattered or fall on incompatible divisions, $C \to 0$.

#### 2. Local Phase Offset (Performer Drift)
$$\phi = \text{atan2}(I, R) \in [-\pi, \pi]$$
$$\text{drift\_beats} = \frac{\phi}{2\pi \cdot \text{divisor}} \cdot d$$

#### 3. Elastic Match Score
$$\text{Score} = C \times \exp\left(-\frac{\text{drift\_beats}^2}{2\sigma_{\text{elastic}}^2}\right)$$
- If the performer drifts within the elastic limit $\sigma_{\text{elastic}} \approx 0.08\text{ beats}$, the score remains high ($> 0.95$).
- If the pattern is shifted by half a slot (syncopation/wrong slot), the Gaussian smoothly downweights it without cliff-edge artefacts.
- Crucially, $\phi$ is passed to the PLL to update $\delta$ for subsequent notes!

---

### 4.3 Soft Receptive-Field Windows

Instead of hard boundaries $[0, 1)$ and $[1, 2)$:
- Sub-windows have a nominal span $d$, but an **elastic margin** $\epsilon = \pm 0.06\text{ beats}$ around boundaries.
- Notes landing within $[1 - \epsilon, 1 + \epsilon]$ are evaluated in context of both windows:
  - If beat 0 has a trailing swing note at $0.98$, and beat 1 begins at $1.02$, the note at $0.98$ is claimed by beat 0’s triplet group, while the note at $1.02$ seeds beat 1’s downbeat.
  - Chords with timing spread (flams) are grouped as single compound events before tree bifurcation.

---

### 4.4 Continuous Multi-Scale Duration Penalty

As derived in our progressive span penalty fix:
$$\text{bfit} \leftarrow \text{bfit} \times \left(\frac{\text{span}}{d}\right)^{p(d)} \quad \text{where} \quad p(d) = \frac{1}{d^2}$$

- **At $d \le 1$**: $p(d) \ge 1.0$. Rhythms spanning only $0.75$ beats face a strong penalty ($0.75$), preventing swing 8ths from fracturing into 16th-note pieces.
- **At $d = 2$**: $p(2) = 0.25$. Penalty is $(0.75)^{0.25} = 0.931$. Exact rhythms ending on rests easily beat coarse triplets.
- **At $d \ge 4$**: $p(d) \to 0$. Multiplier $\to 1.0$. The detector allows full measures to conclude with unplayed rests without penalizing the valid notes.

---

## 5. Architectural Comparison

| Dimension | Current Detector (`detect-rhythm.js`) | Proposed Detector (EPL-MQ) |
| :--- | :--- | :--- |
| **Search Structure** | Recursive binary tree (`detectBestFit`) | Recursive binary tree with soft receptive fields |
| **Grid Alignment** | Stationary cosine comb: $\sum \cos(2\pi x)$ | Complex phasor: $\|Z\|$ (coherence) + $\text{atan2}(I, R)$ (phase) |
| **Phase Drift Tracking** | None (rigid absolute coordinates) | Critically damped spring PLL: $\delta_n = (1-\lambda)\delta_{n-1} + \alpha e_n$ |
| **Elastic Restoring Force**| N/A | Exponential spring back to absolute beat $\lambda$ |
| **Window Transitions** | Hard power-of-2 boundaries | Soft margins ($\pm \epsilon$) with event handover |
| **Swing Representation** | Divisor 3 with prime tie-break | Natural phasor resonance with swing-ratio prior |
| **Coarse Grid Scaling** | Progressive exponent $p(d) = 1/d^2$ | Inherent: Phase drift in beats $\sigma_{\text{elastic}}$ is scale-invariant |

---

## 6. Summary Recommendation

You do **not** need to discard your oscillator-based model or your recursive bifurcation tree. The recursive tree is the natural representation of Western notation, and Fourier oscillators are far more elegant than combinatorial grid-snapping.

To make it follow drift with an elastic band:
1. **Reintroduce $\sin$ (quadrature)**: Use the complex magnitude $\sqrt{R^2 + I^2}$ for the rhythmic pattern strength, and $\text{atan2}(I, R)$ for the drift angle.
2. **Add a state variable $\delta$ to the recursion**: Pass the running drift $\delta$ down the recursion tree, updated by an elasticity factor $\alpha$ and restored by $\lambda$.
3. **Use the progressive span exponent** $p(d) = 1/d^2$ to allow rests at large scales while maintaining swing grouping at small scales.
