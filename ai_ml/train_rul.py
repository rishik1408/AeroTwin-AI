import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import MinMaxScaler
import os

print(f"Using PyTorch version: {torch.__version__}")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {device}")

# ---------------------------------------------------------
# 1. Synthetic Data Generation (Run-to-Failure)
# ---------------------------------------------------------
np.random.seed(42)
torch.manual_seed(42)

def generate_engine_data(engine_id, max_cycles):
    """Simulates run-to-failure telemetry for a single engine."""
    rul = np.arange(max_cycles, 0, -1)
    # Baseline steady RPM
    rpm = np.random.normal(5000, 50, max_cycles)
    # CHT degrading (increasing) over time
    cht = np.linspace(150, 220 + np.random.randint(0, 30), max_cycles) + np.random.normal(0, 5, max_cycles)
    # EGT slowly increasing
    egt = np.linspace(700, 800, max_cycles) + np.random.normal(0, 10, max_cycles)
    # Vibration exponentially increasing near failure
    vib = np.linspace(0.02, 0.1, max_cycles) + np.exp(np.linspace(0, 2, max_cycles))/30.0 + np.random.normal(0, 0.01, max_cycles)
    
    return pd.DataFrame({'engine_id': engine_id, 'rpm': rpm, 'cht': cht, 'egt': egt, 'vib': vib, 'rul': rul})

# Generate 5 engines (4 for training, 1 for testing)
dfs = [generate_engine_data(i, np.random.randint(800, 1200)) for i in range(1, 6)]
full_df = pd.concat(dfs, ignore_index=True)

# Normalization
scaler = MinMaxScaler()
features = ['rpm', 'cht', 'egt', 'vib']
full_df[features] = scaler.fit_transform(full_df[features])

def create_sequences(data, target, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        x = data[i:(i+seq_length)]
        y = target[i+seq_length]
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)

def process_engines(df, window_size):
    X_list, y_list = [], []
    for engine_id, group in df.groupby('engine_id'):
        X_eng, y_eng = create_sequences(group[features].values, group['rul'].values, window_size)
        X_list.append(X_eng)
        y_list.append(y_eng)
    return np.vstack(X_list), np.concatenate(y_list)

window_size = 40
train_df = full_df[full_df['engine_id'] < 5]
test_df = full_df[full_df['engine_id'] == 5]

X_train, y_train = process_engines(train_df, window_size)
X_test, y_test = process_engines(test_df, window_size)

print(f"Train Shape: {X_train.shape}, Test Shape: {X_test.shape}")

# ---------------------------------------------------------
# 2. PyTorch DataLoaders & Model Architecture
# ---------------------------------------------------------
class RULDataset(Dataset):
    def __init__(self, X, y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32).view(-1, 1)
    def __len__(self): return len(self.X)
    def __getitem__(self, idx): return self.X[idx], self.y[idx]

train_loader = DataLoader(RULDataset(X_train, y_train), batch_size=64, shuffle=True)
test_loader = DataLoader(RULDataset(X_test, y_test), batch_size=64, shuffle=False)

class LSTMRUL(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers):
        super(LSTMRUL, self).__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc1 = nn.Linear(hidden_size, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, 1)
        
    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :] # Use the last sequence output
        out = self.relu(self.fc1(out))
        out = self.fc2(out)
        return out

model = LSTMRUL(input_size=4, hidden_size=64, num_layers=2).to(device)
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.005)

# ---------------------------------------------------------
# 3. Training Pipeline
# ---------------------------------------------------------
epochs = 30
print("\nStarting Training...")
for epoch in range(epochs):
    model.train()
    train_loss = 0
    for X_batch, y_batch in train_loader:
        X_batch, y_batch = X_batch.to(device), y_batch.to(device)
        optimizer.zero_grad()
        y_pred = model(X_batch)
        loss = criterion(y_pred, y_batch)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()
    
    if (epoch+1) % 5 == 0:
        print(f"Epoch {epoch+1:02d}/{epochs} - MSE Loss: {train_loss/len(train_loader):.2f}")

# ---------------------------------------------------------
# 4. Evaluation & Visualization
# ---------------------------------------------------------
model.eval()
predictions = []
actuals = []
with torch.no_grad():
    for X_batch, y_batch in test_loader:
        X_batch = X_batch.to(device)
        y_pred = model(X_batch)
        predictions.extend(y_pred.cpu().numpy().flatten())
        actuals.extend(y_batch.numpy().flatten())

plt.figure(figsize=(12, 6))
plt.style.use('dark_background')
plt.plot(actuals, label='Actual RUL', color='#66fcf1', linewidth=2)
plt.plot(predictions, label='Predicted RUL (LSTM)', color='#e74c3c', linestyle='dashed', linewidth=2)
plt.title('Test Engine - Remaining Useful Life (RUL) Prediction', fontsize=14, color='white')
plt.xlabel('Time (Cycles)', fontsize=12)
plt.ylabel('Remaining Useful Life (Cycles)', fontsize=12)
plt.legend()
plt.grid(alpha=0.3)

# Save to artifacts directory so Antigravity can display it
artifact_dir = "/Users/rishikm/.gemini/antigravity/brain/f8f018e4-56c1-4c86-a47a-17d4fae6161b"
os.makedirs(artifact_dir, exist_ok=True)
plot_path = os.path.join(artifact_dir, 'rul_prediction.png')
plt.savefig(plot_path, facecolor='#0b0c10')
print(f"\nPlot saved to {plot_path}")
