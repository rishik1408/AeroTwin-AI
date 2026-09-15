# AeroTwin (MALE UAV Digital Twin Framework)

Indigenous Digital Twin framework for aero-piston engines used in MALE UAV applications.
Developed for Smart India Hackathon 2026.

## Team
- **Rishik**: AI/ML Architect & Team Lead
- **Karan**: Predictive Data Scientist
- **Ninaad**: Simulation & Engine Modeler
- **SG**: Systems Architect & Backend Lead
- **Shama**: Telemetry & Edge Pipeline Engineer
- **Hansika**: Full-Stack & UI Developer

## Architecture
- **Simulation**: SciPy/NumPy based thermodynamic modeling.
- **Edge**: CAN bus & MQTT (Mosquitto).
- **Backend**: FastAPI, WebSockets, InfluxDB.
- **AI/ML**: PyTorch, XGBoost, SHAP for PINNs & XAI.
- **Frontend**: React.js / Grafana HMI.

## Quickstart
1. Spin up the infrastructure (MQTT + InfluxDB):
   \`docker-compose up -d\`
