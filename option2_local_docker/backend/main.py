import os
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime

app = FastAPI(title="AeroTwin Digital Twin API (Local Docker)")

# InfluxDB Configuration from Environment Variables
INFLUX_URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
INFLUX_TOKEN = os.getenv("INFLUXDB_TOKEN", "my-super-secret-auth-token")
INFLUX_ORG = os.getenv("INFLUXDB_ORG", "aerotwin")
INFLUX_BUCKET = os.getenv("INFLUXDB_BUCKET", "engine_telemetry")

client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)

# Data Model for incoming telemetry
class EngineTelemetry(BaseModel):
    engine_id: str
    timestamp: float | None = None # Optional timestamp (unix seconds), defaults to now
    rpm: float
    cht: float # Cylinder Head Temperature
    egt: float # Exhaust Gas Temperature
    oil_pressure: float
    oil_temperature: float
    fuel_flow: float
    vibration: float

def write_to_influx(data: EngineTelemetry):
    point = (
        Point("engine_status")
        .tag("engine_id", data.engine_id)
        .field("rpm", data.rpm)
        .field("cht", data.cht)
        .field("egt", data.egt)
        .field("oil_pressure", data.oil_pressure)
        .field("oil_temperature", data.oil_temperature)
        .field("fuel_flow", data.fuel_flow)
        .field("vibration", data.vibration)
    )
    
    # Use provided timestamp or current time
    if data.timestamp:
        # Convert unix timestamp (seconds) to nanoseconds
        point.time(int(data.timestamp * 1e9), WritePrecision.NS)
    else:
        point.time(datetime.utcnow(), WritePrecision.NS)

    write_api.write(bucket=INFLUX_BUCKET, org=INFLUX_ORG, record=point)

@app.post("/api/telemetry")
async def ingest_telemetry(data: EngineTelemetry, background_tasks: BackgroundTasks):
    # Use background tasks so the API responds instantly to the simulation sender
    background_tasks.add_task(write_to_influx, data)
    return {"status": "success", "message": "Telemetry queued for InfluxDB"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "AeroTwin Local Backend"}
