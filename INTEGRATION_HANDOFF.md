# AeroTwin Frontend & AI Integration Handoff Guide

**Target Audience:** AI/ML Team (Rishik, Karan) & Backend/Systems Team (SG)  
**Project:** SIH26054 — AeroTwin MALE UAV Digital Twin Framework  
**Frontend Location:** [`frontend/`](./frontend)  

---

## 1. Overview

The new aerospace mission-control frontend has been implemented under `frontend/`. It visualizes real-time engine telemetry, provides an interactive 3D Rotax 912 digital twin, displays predictive AI health metrics (RUL, Anomaly Detection, Welch PSD, TreeSHAP), allows mission replays, and controls engine parameters via closed-loop feedback.

The frontend operates in two modes:
1. **Live Backend Mode**: When `backend/server.py` or `backend/app.py` is running on `http://localhost:8765`, the frontend automatically polls `/api/telemetry` and posts to `/api/controls` and `/api/faults`.
2. **Simulation Mode**: If the backend is offline or Demo Mode is toggled on, the frontend uses an internal physical model matching `engine_model.py` and `faults.py` so demos never fail during presentation.

---

## 2. API Endpoints Contract

The frontend expects the backend at `http://localhost:8765` (proxied in Vite via `/api`):

| Endpoint | Method | Payload / Format | Purpose |
| :--- | :--- | :--- | :--- |
| `/telemetry` | `GET` | *None* | Advances engine simulation 1 tick; returns current telemetry, active fault labels, and controls. |
| `/controls` | `POST` | `{"throttle": float, "altitude": float, "ambient_temp": float, "airspeed_kts": float, "is_running": bool}` | Updates operator control parameters (closed loop). |
| `/faults` | `POST` | `{"fault_type": str, "severity": float, "duration": int}` | Injects progressive degradation fault. |
| `/reset` | `POST` | `{}` | Resets engine physics and clears active faults. |
| `/isa_temp` | `GET` | `?altitude=<meters>` | Returns standard ICAO atmosphere temperature and density ratio $\sigma$. |

---

## 3. Telemetry JSON Output Schema

When returning `GET /telemetry`, format the response object as follows:

```json
{
  "telemetry": {
    "timestamp": 1711100000.0,
    "rpm": 5240.0,
    "cht_celsius": 98.4,
    "egt_celsius": 712.0,
    "oil_pressure_bar": 3.85,
    "oil_temp_celsius": 96.2,
    "vibration": 0.024,
    "fuel_flow": 16.4,
    "battery_voltage_v": 14.1,
    "injection_timing_deg": 26.5,
    "map_inhg": 26.8,
    "airspeed_kts": 84.0,
    "throttle_position": 78.0,
    "altitude_m": 2450.0,
    "ambient_temp_celsius": -0.9
  },
  "labels": [
    {
      "fault_type": "cooling_degradation",
      "onset_tick": 45,
      "severity": 0.85
    }
  ],
  "controls": {
    "throttle": 78.0,
    "altitude": 2450.0,
    "ambient_temp": -0.9,
    "airspeed_kts": 84.0,
    "is_running": true
  },
  "ai_inference": {
    "health_score": 92,
    "rul_hours": 380.5,
    "predicted_condition": "NOMINAL_CRUISE",
    "confidence": 0.96,
    "anomaly_score": 0.82,
    "primary_contributors": [
      {
        "feature": "cht_celsius",
        "label": "Cylinder Head Temp",
        "impact": 0.52,
        "value": "98.4 °C",
        "direction": "neutral"
      },
      {
        "feature": "oil_pressure_bar",
        "label": "Oil Pressure",
        "impact": 0.31,
        "value": "3.85 bar",
        "direction": "neutral"
      },
      {
        "feature": "vibration",
        "label": "Vibration RMS",
        "impact": 0.17,
        "value": "0.024 g",
        "direction": "neutral"
      }
    ]
  }
}
```

---

## 4. Connecting AI/ML Models (`ai_ml/`)

To feed live inferences from trained models to the frontend:

1. **RUL Prediction (`ai_ml/train_rul.py`)**:
   - Maintain a sliding window buffer of the last 40 telemetry frames: `['rpm', 'cht_celsius', 'egt_celsius', 'vibration']`.
   - Normalize with `MinMaxScaler` and pass to `LSTMRUL`. Output scalar is `rul_hours`.
2. **Anomaly Detection (`ai_ml/anomaly_detection.py`)**:
   - Extract rolling statistics and Welch's PSD energy in frequencies $>2\text{ Hz}$.
   - Pass features to `iso_forest.decision_function()`. Negative scores indicate an anomaly; positive scores indicate healthy inlier.
3. **TreeSHAP Explainability (`ai_ml/shap_xai.py`)**:
   - Pass current anomaly features to `explainer(X)`.
   - Rank features by magnitude of positive contribution to identify the primary root-cause signal.

---

## 5. Running the Full Stack

1. **Start Backend & Physics Server**:
   ```bash
   python backend/server.py
   # Or using FastAPI:
   uvicorn backend.app:app --host 0.0.0.0 --port 8765 --reload
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173`.
