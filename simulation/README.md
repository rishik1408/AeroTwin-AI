# AeroTwin AI - Engine Telemetry Simulator

This module is the core physics simulation engine for the AeroTwin AI project (Smart India Hackathon 2026). It generates realistic, physics-backed telemetry for a Rotax 912-class 4-cylinder aero piston engine to feed the ingestion pipelines, Digital Twin Core, and AI/ML models.

## Usage

### 1. Live JSON Demo (for Dashboards & Ingestion tests)
To run a real-time (1 JSON string per second) simulation of a standard mission profile:
```bash
python simulation/engine_model.py
```

### 2. Dataset Generation (for AI/ML Anomaly Detection)
To generate a batch of labeled CSV datasets (healthy and faulty) for model training:
```bash
python simulation/generate_dataset.py --healthy 5 --faulty 3 --outdir dataset
```

## Data Schema (Contract)
The output JSON and CSV files follow the exact data contract defined in `schemas.py`:

| Parameter | Type | Range / Description |
|-----------|------|---------------------|
| `timestamp` | `float` | UNIX timestamp or tick |
| `rpm` | `float` | idle ~1400, max continuous 5500, max takeoff 5800 |
| `cht_celsius` | `float` | Normal 110-135°C, max 135°C |
| `egt_celsius` | `float` | Normal cruise 650-800°C, max 900°C |
| `oil_pressure_bar`| `float` | Normal 2-5 bar, min 0.8 bar (hot/idle), max 7 bar |
| `oil_temp_celsius`| `float` | Normal 90-110°C, max 130°C |
| `vibration` | `float` | Unitless baseline scaling with RPM^2 |
| `fuel_flow` | `float` | Correlates with RPM and throttle (~2-27 L/hr) |
| `battery_voltage_v` | `float` | Battery/Alternator health. Normal 13.8-14.2V, off 12.0V |
| `injection_timing_deg`| `float` | Injection timing parameters. Advances 5 to 25 deg BTDC |
| `throttle_position`| `float` | 0-100% |
| `altitude_m` | `float` | Meters (High altitude environment simulation) |
| `ambient_temp_celsius` | `float` | Local outside air temp (Hot-weather operation simulation) |

## Fault Profiles
The `FaultInjector` in `faults.py` provides 8 toggleable failure modes designed to exactly match the AI/ML Layer requirements. These apply gradually over a configurable time window (`duration_seconds`), accurately reflecting mechanical degradation:

1. **`misfire`**: Simulates misfire conditions. RPM and fuel flow surge and sag cyclically.
2. **`injector_abnormality`**: Simulates injector clogging. Fuel flow drops, EGT drops on lean misfire, and RPM drops.
3. **`cooling_degradation`**: Simulates cooling degradation/overheating trends. CHT, EGT, and Oil Temp slowly climb out of normal limits.
4. **`oil_pressure_drop`**: Simulates lubrication issues (leak or pump wear). Oil pressure degrades tick-by-tick.
5. **`sensor_drift`**: Simulates sensor drift/failure. CHT thermocouple drifts to erroneously high values.
6. **`combustion_instability`**: Simulates combustion instability. EGT and CHT become highly erratic with injected variance.
7. **`vibration_growth`**: Simulates abnormal vibration patterns (bearing wear). Vibration amplitudes multiply over time.
8. **`battery_alternator_fail`**: Simulates battery/alternator health failure. Voltage drops to 12.5V and then slowly drains.

*Labels (`label_fault_type`, `label_severity`) are appended directly to the generated CSV datasets for easy ML ingestion.*
