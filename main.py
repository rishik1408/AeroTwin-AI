import os
from fastapi import FastAPI, BackgroundTasks
import models
from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS
from datetime import datetime

app = FastAPI(title="AeroTwin Ingestion API (InfluxDB)")

# InfluxDB Configuration
INFLUX_URL = os.getenv("INFLUXDB_URL", "http://localhost:8086")
INFLUX_TOKEN = os.getenv("INFLUXDB_TOKEN", "aerotwin-super-secret-token")
INFLUX_ORG = os.getenv("INFLUXDB_ORG", "aerotwin_org")
INFLUX_BUCKET = os.getenv("INFLUXDB_BUCKET", "engine_telemetry")

client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = client.write_api(write_options=SYNCHRONOUS)

def write_to_influx(data: models.TelemetryCreate):
    point = (
        Point("engine_status")
        .tag("engine_id", data.engine_id)
        .field("rpm", data.rpm)
        .field("cht", data.cht)
        .field("egt", data.egt)
        .field("oil_pressure", data.oil_pressure)
        .field("vibration", data.vibration)
        .time(datetime.utcnow(), WritePrecision.NS)
    )
    try:
        write_api.write(bucket=INFLUX_BUCKET, org=INFLUX_ORG, record=point)
    except Exception as e:
        print(f"Error writing to InfluxDB: {e}")

@app.post("/api/telemetry")
async def ingest_telemetry(data: models.TelemetryCreate, background_tasks: BackgroundTasks):
    # Process asynchronously to respond to the virtual engine instantly
    background_tasks.add_task(write_to_influx, data)
    return {"status": "success", "message": "Telemetry queued for InfluxDB"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "AeroTwin InfluxDB Backend"}
