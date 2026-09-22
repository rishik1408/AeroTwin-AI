"""
cmapss_benchmark.py

Compares the statistical "shape" of your synthetic fault-degradation curves
(from generate_dataset.py) against real degradation behavior in NASA's
C-MAPSS turbofan dataset.

This does NOT compare raw sensor values (different engines, different
physics). It compares domain-agnostic degradation SIGNATURES:
  1. Rate-of-decline distribution near end-of-life
  2. Noise-to-signal ratio
  3. RUL labeling consistency (piecewise-linear RUL, C-MAPSS convention)

Usage:
    python cmapss_benchmark.py \
        --cmapss path/to/train_FD001.txt \
        --synthetic path/to/your_generated_dataset.csv \
        --synthetic-col oil_pressure_bar \
        --synthetic-id-col mission_id \
        --synthetic-time-col tick

Outputs a printed comparison report and (if matplotlib is available) a
side-by-side plot saved to benchmark_report.png.
"""

import argparse
import numpy as np
import pandas as pd
from scipy import stats

CMAPSS_COLS = (
    ["unit", "cycle", "op1", "op2", "op3"]
    + [f"sensor_{i}" for i in range(1, 22)]
)

RUL_CAP = 125  # standard C-MAPSS piecewise-linear RUL cap


def load_cmapss(path):
    df = pd.read_csv(path, sep=r"\s+", header=None)
    df = df.iloc[:, : len(CMAPSS_COLS)]
    df.columns = CMAPSS_COLS
    return df


def add_piecewise_rul(df, id_col, time_col, cap=RUL_CAP):
    """Standard C-MAPSS-style RUL labeling: max life minus current cycle,
    capped at `cap` (engine is assumed 'healthy' beyond that horizon)."""
    df = df.copy()
    max_cycle = df.groupby(id_col)[time_col].transform("max")
    rul = max_cycle - df[time_col]
    df["RUL"] = rul.clip(upper=cap)
    return df


def normalize_curve(series):
    s = series.values.astype(float)
    lo, hi = np.nanmin(s), np.nanmax(s)
    if hi - lo < 1e-9:
        return np.zeros_like(s)
    return (s - lo) / (hi - lo)


def decline_rate_near_eol(norm_curve, window=20):
    """Linear regression slope over the last `window` points — captures
    how steeply the parameter is falling as failure approaches."""
    n = len(norm_curve)
    if n < 5:
        return np.nan
    w = min(window, n)
    y = norm_curve[-w:]
    x = np.arange(w)
    slope, _, _, _, _ = stats.linregress(x, y)
    return slope


def noise_to_signal(norm_curve, window=20):
    """Residual std after detrending the last `window` points — captures
    how noisy the sensor is relative to its trend."""
    n = len(norm_curve)
    if n < 5:
        return np.nan
    w = min(window, n)
    y = norm_curve[-w:]
    x = np.arange(w)
    slope, intercept, _, _, _ = stats.linregress(x, y)
    trend = slope * x + intercept
    residual = y - trend
    return np.std(residual)


def extract_signatures(df, id_col, value_col):
    """Per-unit degradation signatures: decline rate + noise, from each
    trajectory's final segment (closest to failure/fault maturity)."""
    rates, noises = [], []
    for _, g in df.groupby(id_col):
        curve = normalize_curve(g[value_col])
        rates.append(decline_rate_near_eol(curve))
        noises.append(noise_to_signal(curve))
    return np.array(rates), np.array(noises)


def compare(cmapss_rates, cmapss_noise, synth_rates, synth_noise):
    print("=" * 60)
    print("DEGRADATION SIGNATURE COMPARISON")
    print("=" * 60)

    def report(name, a, b):
        a, b = a[~np.isnan(a)], b[~np.isnan(b)]
        ks_stat, p_value = stats.ks_2samp(a, b)
        print(f"\n{name}")
        print(f"  C-MAPSS   : mean={np.mean(a):.4f}  std={np.std(a):.4f}")
        print(f"  Synthetic : mean={np.mean(b):.4f}  std={np.std(b):.4f}")
        print(f"  KS test   : statistic={ks_stat:.4f}  p-value={p_value:.4f}")
        if p_value > 0.05:
            print("  -> Distributions are NOT significantly different "
                  "(consistent with real degradation behavior)")
        else:
            print("  -> Distributions differ significantly "
                  "(synthetic curves may be too clean/noisy/steep vs real data)")

    report("Decline rate near end-of-life", cmapss_rates, synth_rates)
    report("Noise-to-signal ratio", cmapss_noise, synth_noise)


def maybe_plot(cmapss_rates, cmapss_noise, synth_rates, synth_noise):
    try:
        import matplotlib.pyplot as plt
    except ImportError:
        print("\n(matplotlib not installed — skipping plot, "
              "`pip install matplotlib` to enable)")
        return

    fig, axes = plt.subplots(1, 2, figsize=(11, 4))
    axes[0].hist(cmapss_rates[~np.isnan(cmapss_rates)], bins=20, alpha=0.6, label="C-MAPSS")
    axes[0].hist(synth_rates[~np.isnan(synth_rates)], bins=20, alpha=0.6, label="Synthetic")
    axes[0].set_title("Decline rate near EOL")
    axes[0].legend()

    axes[1].hist(cmapss_noise[~np.isnan(cmapss_noise)], bins=20, alpha=0.6, label="C-MAPSS")
    axes[1].hist(synth_noise[~np.isnan(synth_noise)], bins=20, alpha=0.6, label="Synthetic")
    axes[1].set_title("Noise-to-signal ratio")
    axes[1].legend()

    plt.tight_layout()
    plt.savefig("benchmark_report.png", dpi=150)
    print("\nSaved plot to benchmark_report.png")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cmapss", required=True, help="Path to train_FD00X.txt")
    ap.add_argument("--cmapss-sensor", default="sensor_11",
                     help="C-MAPSS sensor column known to show clear degradation "
                          "(sensor_11 / HPC outlet pressure is a common choice)")
    ap.add_argument("--synthetic", required=True, help="Path to your generated CSV")
    ap.add_argument("--synthetic-col", required=True,
                     help="Column to benchmark, e.g. oil_pressure_bar")
    ap.add_argument("--synthetic-id-col", required=True,
                     help="Column identifying each mission/run, e.g. mission_id")
    ap.add_argument("--synthetic-time-col", required=True,
                     help="Column identifying tick/time within a mission")
    args = ap.parse_args()

    print("Loading C-MAPSS data...")
    cmapss = load_cmapss(args.cmapss)
    cmapss = add_piecewise_rul(cmapss, "unit", "cycle")
    cmapss_rates, cmapss_noise = extract_signatures(cmapss, "unit", args.cmapss_sensor)

    print("Loading synthetic dataset...")
    synth = pd.read_csv(args.synthetic)
    synth = add_piecewise_rul(synth, args.synthetic_id_col, args.synthetic_time_col)
    synth_rates, synth_noise = extract_signatures(
        synth, args.synthetic_id_col, args.synthetic_col
    )

    compare(cmapss_rates, cmapss_noise, synth_rates, synth_noise)
    maybe_plot(cmapss_rates, cmapss_noise, synth_rates, synth_noise)


if __name__ == "__main__":
    main()