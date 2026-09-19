import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import scipy.signal as signal
import scipy.stats as stats
import os
import warnings

# Suppress welch warnings for small segments
warnings.filterwarnings('ignore')

# ---------------------------------------------------------
# 1. Synthetic Telemetry Generation & Fault Injection
# ---------------------------------------------------------
print("Generating synthetic telemetry with injected faults...")
np.random.seed(42)
n_samples = 5000
t = np.arange(n_samples)

# Healthy Baseline
rpm = np.random.normal(5000, 20, n_samples)
cht = np.random.normal(150, 2, n_samples)
egt = np.random.normal(700, 5, n_samples)
vib = 0.05 * np.sin(2 * np.pi * 0.01 * t) + np.random.normal(0, 0.01, n_samples)
labels = np.zeros(n_samples)

# Event 1: Sensor Drift (EGT) - slow divergence
egt[1000:1500] += np.linspace(0, 50, 500)
labels[1000:1500] = 1

# Event 2: Cooling Degradation (CHT) - gradual rise
cht[2500:3000] += np.linspace(0, 30, 500)
labels[2500:3000] = 1

# Event 3: Misfire / Vibration Anomaly - high frequency noise
vib[4000:4500] += 0.2 * np.sin(2 * np.pi * 0.5 * np.arange(500)) + np.random.normal(0, 0.05, 500)
labels[4000:4500] = 1

df = pd.DataFrame({'rpm': rpm, 'cht': cht, 'egt': egt, 'vib': vib, 'label': labels})

# ---------------------------------------------------------
# 2. Feature Engineering (using SciPy & Pandas)
# ---------------------------------------------------------
print("Extracting statistical and frequency-domain features (SciPy)...")
window_size = 50

# Rolling temporal statistics
df['cht_mean'] = df['cht'].rolling(window=window_size, min_periods=1).mean()
df['egt_var'] = df['egt'].rolling(window=window_size, min_periods=1).var().fillna(0)
df['vib_skew'] = df['vib'].rolling(window=window_size, min_periods=1).skew().fillna(0)

# Frequency-domain feature (Rolling Welch's PSD for vibration)
vib_freq = np.zeros(n_samples)
for i in range(window_size, n_samples):
    chunk = df['vib'].values[i-window_size:i]
    f, Pxx = signal.welch(chunk, fs=10.0, nperseg=window_size)
    # Sum of Power Spectral Density in higher frequencies (>2Hz)
    vib_freq[i] = np.sum(Pxx[f > 2.0]) 

df['vib_high_freq_energy'] = vib_freq
df.fillna(0, inplace=True)
features = ['cht_mean', 'egt_var', 'vib_skew', 'vib_high_freq_energy']

# ---------------------------------------------------------
# 3. Unsupervised Anomaly Detection (Scikit-Learn)
# ---------------------------------------------------------
print("Training Isolation Forest on healthy baseline data...")
X = df[features].values
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train ONLY on the first 800 samples (known healthy region)
X_train = X_scaled[:800]
iso_forest = IsolationForest(n_estimators=100, contamination=0.01, random_state=42)
iso_forest.fit(X_train)

# Inference on entire dataset
df['anomaly_score'] = iso_forest.decision_function(X_scaled)
df['pred_anomaly'] = iso_forest.predict(X_scaled) # 1 for inlier, -1 for anomaly

# ---------------------------------------------------------
# 4. Visualization & Evaluation
# ---------------------------------------------------------
print("Plotting results...")
plt.style.use('dark_background')
fig, axes = plt.subplots(3, 1, figsize=(14, 10), sharex=True)

# Plot 1: Temperatures
axes[0].plot(df['cht'], label='Cylinder Head Temp (CHT)', color='cyan')
axes[0].plot(df['egt']/4.5, label='EGT (Scaled for view)', color='magenta')
axes[0].set_title("Engine Temperatures", color='white')
axes[0].set_ylabel("Degrees (C)")

# Plot 2: Vibration
axes[1].plot(df['vib'], label='Vibration (RMS)', color='yellow')
axes[1].set_title("Engine Vibration", color='white')
axes[1].set_ylabel("g-force")

# Plot 3: Anomaly Score
axes[2].plot(df['anomaly_score'], label='Isolation Forest Score', color='white')
axes[2].axhline(0, color='red', linestyle='--', linewidth=2, label='Anomaly Threshold (<0)')
axes[2].set_title("Predicted Anomaly Score (Scikit-Learn)", color='white')
axes[2].set_xlabel("Time Steps")
axes[2].set_ylabel("Score")

# Add Ground Truth Shaded Regions
for ax in axes:
    ax.axvspan(1000, 1500, color='red', alpha=0.3, label='Event 1: Sensor Drift' if ax == axes[0] else "")
    ax.axvspan(2500, 3000, color='orange', alpha=0.3, label='Event 2: Cooling Degradation' if ax == axes[0] else "")
    ax.axvspan(4000, 4500, color='purple', alpha=0.3, label='Event 3: Misfire Vibration' if ax == axes[0] else "")
    ax.grid(alpha=0.2)
    if ax == axes[0]: ax.legend(loc='upper left', bbox_to_anchor=(1, 1))
    elif ax == axes[1]: ax.legend(loc='upper left', bbox_to_anchor=(1, 1))
    else: ax.legend(loc='lower left', bbox_to_anchor=(1, 0))

plt.tight_layout()
artifact_dir = "/Users/rishikm/.gemini/antigravity/brain/f8f018e4-56c1-4c86-a47a-17d4fae6161b"
plot_path = os.path.join(artifact_dir, 'anomaly_detection.png')
plt.savefig(plot_path, facecolor='#0b0c10')
print(f"Done! Saved visualization to {plot_path}")
