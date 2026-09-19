# NASA C-MAPSS Dataset — Parameter Reference

Compiled for AeroTwin AI (SIH 2026). Based on the actual uploaded files
(train/test FD001–FD004, RUL_FD001–4, readme.txt, and Saxena et al. 2008,
"Damage Propagation Modeling for Aircraft Engine Run-to-Failure Simulation").

## 1. What the four datasets actually are

| Dataset | Train units | Test units | Operating conditions | Fault modes |
|---|---|---|---|---|
| FD001 | 100 | 100 | 1 (sea level) | 1 (HPC degradation) |
| FD002 | 260 | 259 | 6 | 1 (HPC degradation) |
| FD003 | 100 | 100 | 1 (sea level) | 2 (HPC + Fan degradation) |
| FD004 | 248 | 249 | 6 | 2 (HPC + Fan degradation) |

**Recommendation: start with FD001.** Single operating condition, single fault
mode — cleanest signal, easiest to validate your simulator's fault profiles
against. FD002–4 add operating-condition variability and a second fault mode,
useful later if you want to demonstrate robustness, but they're harder to
interpret and better tackled once FD001 validation works.

## 2. File roles

- **train_FD00X.txt** — full run-to-failure trajectories (each engine runs
  until failure). Use this for model training AND for your benchmark
  comparison (`cmapss_benchmark.py`), since it has complete degradation curves.
- **test_FD00X.txt** — trajectories truncated *before* failure. Used to
  evaluate whether a trained RUL model can predict the remaining life at the
  cutoff point.
- **RUL_FD00X.txt** — the true remaining-cycle answer key for each unit in
  the corresponding test file (row N = true RUL for test unit N). Only used
  for scoring test predictions, not for training.

For your simulator-validation use case (comparing degradation *shape*), use
**train_FD00X.txt only** — it has the complete curves.

## 3. Column reference (26 columns total, confirmed from your files)

Columns 1–5 are always present and named directly in the readme. Columns
6–26 are 21 sensor measurements; the readme only labels them generically
("sensor measurement 1...26"), but the reference paper's Table 2 gives their
actual physical identity — reproduced below with the generic `sensor_N` alias
your `cmapss_benchmark.py` script uses, so the two naming schemes line up.

| Col # | sensor_N alias | Name | Description | Unit |
|---|---|---|---|---|
| 1 | — | unit | Engine unit ID | — |
| 2 | — | cycle | Time, in operational cycles | cycles |
| 3 | — | op1 | Operational setting 1 (altitude-related) | — |
| 4 | — | op2 | Operational setting 2 (Mach-related) | — |
| 5 | — | op3 | Operational setting 3 (throttle resolver angle) | — |
| 6 | sensor_1 | T2 | Total temperature at fan inlet | °R |
| 7 | sensor_2 | T24 | Total temperature at LPC outlet | °R |
| 8 | sensor_3 | T30 | Total temperature at HPC outlet | °R |
| 9 | sensor_4 | T50 | Total temperature at LPT outlet | °R |
| 10 | sensor_5 | P2 | Pressure at fan inlet | psia |
| 11 | sensor_6 | P15 | Total pressure in bypass duct | psia |
| 12 | sensor_7 | P30 | Total pressure at HPC outlet | psia |
| 13 | sensor_8 | Nf | Physical fan speed | rpm |
| 14 | sensor_9 | Nc | Physical core speed | rpm |
| 15 | sensor_10 | epr | Engine pressure ratio (P50/P2) | — |
| 16 | sensor_11 | Ps30 | **Static pressure at HPC outlet** | psia |
| 17 | sensor_12 | phi | Ratio of fuel flow to Ps30 | pps/psi |
| 18 | sensor_13 | NRf | Corrected fan speed | rpm |
| 19 | sensor_14 | NRc | Corrected core speed | rpm |
| 20 | sensor_15 | BPR | Bypass ratio | — |
| 21 | sensor_16 | farB | Burner fuel-air ratio | — |
| 22 | sensor_17 | htBleed | Bleed enthalpy | — |
| 23 | sensor_18 | Nf_dmd | Demanded fan speed | rpm |
| 24 | sensor_19 | PCNfR_dmd | Demanded corrected fan speed | rpm |
| 25 | sensor_20 | W31 | HPT coolant bleed | lbm/s |
| 26 | sensor_21 | W32 | LPT coolant bleed | lbm/s |

**Note for `cmapss_benchmark.py`:** its default `--cmapss-sensor sensor_11`
maps to **Ps30 (static pressure at HPC outlet)** — a pressure sensor that
degrades over an engine's life, which is why it was chosen as the closest
conceptual analog to your `oil_pressure_bar` parameter.

## 4. Which columns actually carry signal (computed from your files)

### FD001 / FD003 (single operating condition)
These 7 columns are **constant** — zero variance, drop them:
`op3, T2, P2, epr, farB, Nf_dmd, PCNfR_dmd` (FD003 also keeps epr near-constant
but with a tiny variance — check your exact copy).

Most informative (highest variance, clearest degradation signal), ranked:
`Nc, NRc, T50, T30, htBleed, P30, phi, T24, Ps30, W31, W32`

### FD002 / FD004 (six operating conditions)
No columns are literally constant — operating-condition changes make
everything move. But this means raw variance is dominated by *which flight
condition* the engine is in, not degradation. To use these for a fair
benchmark or model training, you must first **normalize per operating
condition** (cluster rows by op1/op2/op3 combination, then z-score each
sensor within its cluster) before the degradation signal is usable.

## 5. RUL labeling convention (for consistency with your synthetic data)

The standard approach used in essentially all published work on this dataset:
```
RUL(t) = min(max_cycle_for_unit - t, RUL_CAP)
```
`RUL_CAP` is typically 125 or 130 cycles — this assumes an engine is
"fully healthy" (RUL doesn't need to decrease) more than ~125 cycles before
failure, and only meaningfully degrades within that final window. This is
the convention already implemented in your `cmapss_benchmark.py`.

## 6. Practical next steps for your project

1. **For simulator validation** (Ninaad's task): use `train_FD001.txt`,
   column `Ps30` (a.k.a. `sensor_11`), against your `oil_pressure_bar` —
   this is already wired into `cmapss_benchmark.py`.
2. **For RUL model benchmarking** (AI/ML teammate): start training/testing
   on FD001 only, using the 11 informative columns listed above plus `cycle`.
   Drop the 7 constant columns — they add noise, not signal, on FD001/FD003.
3. **If you want a "robustness" demo later**: FD002/FD004 with proper
   per-condition normalization is a good stretch goal to show the model
   generalizes beyond one flight condition — but treat this as a v2, not
   the first working version.
