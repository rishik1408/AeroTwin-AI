import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import MinMaxScaler
import warnings
warnings.filterwarnings('ignore')

df = pd.read_csv('dataset/all_missions.csv')

def calculate_rul(group):
    max_tick = group['tick'].max()
    group['rul'] = max_tick - group['tick']
    return group
df = df.groupby('mission_id', group_keys=False).apply(calculate_rul)

features = ['rpm', 'cht_celsius', 'egt_celsius', 'oil_pressure_bar', 'vibration', 'fuel_flow']
df[features] = MinMaxScaler().fit_transform(df[features])

train_df = df[df['mission_id'] != 'healthy_0']
test_df = df[df['mission_id'] == 'healthy_0']

model = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
model.fit(train_df[features], train_df['rul'])

preds = model.predict(test_df[features])
mae = mean_absolute_error(test_df['rul'], preds)
print(f"RUL Model Mean Absolute Error on Ninaad's Virtual Engine test mission: {mae:.2f} ticks")
