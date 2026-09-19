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

## Data Workflow Architecture
The system architecture follows a closed-loop digital twin model, integrating real-time physical simulation, edge telemetry, and deep learning diagnostics.

```mermaid
graph TD
    classDef primary fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b,font-weight:bold;
    classDef secondary fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px,color:#4a148c,font-weight:bold;
    classDef subProcess fill:#e8eaf6,stroke:#3949ab,stroke-width:2px,color:#1a237e,font-weight:bold;
    classDef aiNode fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100,font-weight:bold;
    classDef outputText fill:none,stroke:none,color:#333,font-weight:bold;

    A["1. Virtual Engine Model<br>(Physics Simulation)"]:::primary
    B["2. Edge Telemetry<br>(CAN / MQTT Stream)"]:::primary
    C["3. FastAPI & InfluxDB<br>Ingestion Backend"]:::primary
    
    D["InfluxDB<br>Storage"]:::subProcess
    E["Data<br>Preprocessing"]:::subProcess
    
    subgraph AI_Engine ["4. AI Inference Engine"]
        F1["RUL Prediction"]:::aiNode
        F2["Anomaly Detection"]:::aiNode
        F3["SHAP Explainability"]:::aiNode
    end
    
    O1["RUL Predictions"]:::outputText
    O2["Anomaly Alerts"]:::outputText
    O3["Root Cause Data"]:::outputText
    
    G["5. Operator HMI<br>Dashboard & Replay"]:::primary
    H["Operator Analysis &<br>Parameter Tweaking"]:::secondary

    A -->|"Raw Data"| B
    B --> C
    C --> D
    C --> E
    E --> F1
    E --> F2
    E --> F3
    F1 -.-> O1
    F2 -.-> O2
    F3 -.-> O3
    F1 --> G
    F2 --> G
    F3 --> G
    D -->|"Historical Data<br>(For Replay)"| G
    G --> H
    H -->|"Closed Loop Feedback"| A
```

### Data Pipeline Flow
1. **Virtual Engine Model**: Physics simulation calculates real-time variables (RPM, CHT, EGT, vibration).
2. **Edge Telemetry**: Packages raw data into JSON and pushes it via MQTT/CAN to simulate UAV constraints.
3. **Backend Split**: Data is bifurcated into a **Cold Path** (InfluxDB for Mission Replay) and a **Hot Path** (Preprocessing for AI).
4. **AI Inference**: Preprocessed data enters multi-branch neural networks outputting RUL, Anomaly Alerts, and SHAP Root Causes.
5. **Operator HMI & Feedback Loop**: The dashboard visualizes the diagnostics. Operators can tweak parameters (e.g., lower throttle), which feeds back into the virtual engine to dynamically resolve issues.

## Quickstart
1. Spin up the infrastructure (MQTT + InfluxDB):
   `docker-compose up -d`
