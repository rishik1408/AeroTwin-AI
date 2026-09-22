# AeroTwin-AI — Database Management Layer

Indigenous Digital Twin framework for aero-piston engines used in MALE UAV applications.
**Branch: database-management**

---

## Overview

This module handles real-time telemetry ingestion from the Virtual Engine Model into a locally running InfluxDB instance via a FastAPI server.

## Stack

| Component | Technology |
|-----------|------------|
| Ingestion API | FastAPI + Uvicorn |
| Time-Series Database | InfluxDB OSS 2.7.12 (Local) |
| Data Validation | Pydantic v2 |
| Virtual Engine Streamer | Python + Pandas |

## Files

| File | Purpose |
|------|---------|
| `main.py` | FastAPI server — receives telemetry and writes to InfluxDB |
| `models.py` | Pydantic schema for engine telemetry validation |
| `streamer.py` | Simulates virtual engine by streaming a CSV dataset row-by-row to FastAPI |
| `sample_dataset.csv` | Sample engine telemetry dataset for testing |

## InfluxDB Credentials

| Setting | Value |
|---------|-------|
| URL | `http://localhost:8086` |
| Organization | `aerotwin_org` |
| Bucket | `engine_telemetry` |
| Token | Set during first InfluxDB setup |

## How to Run

### Step 1: Start InfluxDB
Open a new terminal and run:
```bash
influxd
```
Then visit `http://localhost:8086` to complete the one-time setup with the credentials above.

### Step 2: Start FastAPI Server
```bash
pip install fastapi uvicorn influxdb-client pydantic pandas requests
uvicorn main:app --reload
```

### Step 3: Stream Virtual Engine Data
```bash
python streamer.py
```
> To use your own dataset, replace `sample_dataset.csv` with your file and update the filename in `streamer.py`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/telemetry` | Ingest engine telemetry |
| GET | `/api/health` | Health check |

## Engine Parameters Captured

- `engine_id` — Engine identifier tag
- `rpm` — Revolutions per minute
- `cht` — Cylinder Head Temperature (°C)
- `egt` — Exhaust Gas Temperature (°C)
- `oil_pressure` — Oil pressure (PSI)
- `vibration` — Vibration amplitude (g)
