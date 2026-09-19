import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import xgboost as xgb
import shap
from sklearn.model_selection import train_test_split

np.random.seed(42)
n = 2000
cht_mean = np.random.normal(150, 5, n)
egt_var = np.random.normal(10, 2, n)
vib_fft = np.random.normal(0.5, 0.1, n)
oil_drop = np.random.normal(0, 1, n)
target = np.zeros(n)

fault_idx = np.random.choice(n, int(0.2*n), replace=False)
for idx in fault_idx:
    target[idx] = 1
    fault_type = np.random.choice(['overheat', 'vibration', 'oil_leak'])
    if fault_type == 'overheat':
        cht_mean[idx] += np.random.uniform(20, 40)
        egt_var[idx] += np.random.uniform(5, 15)
    elif fault_type == 'vibration':
        vib_fft[idx] += np.random.uniform(1.0, 2.5)
    elif fault_type == 'oil_leak':
        oil_drop[idx] += np.random.uniform(6, 12)

df = pd.DataFrame({'CHT_rolling_mean': cht_mean, 'EGT_variance': egt_var, 
                   'Vibration_FFT_peak': vib_fft, 'Oil_Pressure_drop': oil_drop})

X_train, X_test, y_train, y_test = train_test_split(df, target, test_size=0.2, random_state=42)

model = xgb.XGBClassifier(n_estimators=100, max_depth=4, random_state=42, use_label_encoder=False, eval_metric='logloss')
model.fit(X_train, y_train)

explainer = shap.TreeExplainer(model)
shap_values = explainer(X_test)

preds = model.predict(X_test)
tp_indices = np.where((preds == 1) & (y_test == 1))[0]
local_idx = tp_indices[0]

def generate_ui_alert(shap_explanation, feature_names, confidence_score):
    sv = shap_explanation.values
    data = shap_explanation.data
    impact_indices = np.argsort(np.abs(sv))[::-1]
    
    top_drivers = []
    for i in impact_indices[:3]:
        if sv[i] > 0:
            driver = f"{feature_names[i]} reading at {data[i]:.2f} (Impact: +{sv[i]:.2f})"
            top_drivers.append(driver)
            
    alert = f"🚨 CRITICAL ALERT: Engine Fault Predicted ({confidence_score*100:.1f}% confidence).\n"
    alert += "Primary root-cause drivers:\n"
    for d in top_drivers:
        alert += f"  -> {d}\n"
    return alert

confidence = model.predict_proba(X_test.iloc[[local_idx]])[0][1]
alert_msg = generate_ui_alert(shap_values[local_idx], X_test.columns, confidence)
print(alert_msg)
