# AeroTwin Digital Twin Framework - Option 2

This is the Local Docker framework for the AeroTwin Digital Twin project. 
It spins up a FastAPI backend and an InfluxDB time-series database.

## Architecture
- **FastAPI**: Runs on `localhost:8000`. Receives telemetry from the virtual engine via POST requests.
- **InfluxDB**: Runs on `localhost:8086`. Stores the engine's time-series data.

## Getting Started

1. **Install Docker**: Make sure you have Docker Desktop installed on your laptop.
2. **External Drive Setup (Optional but recommended)**:
   If you want to store the InfluxDB data on an external drive, open `docker-compose.yml` and change the volume path under `influxdb` from `./influxdb_data:/var/lib/influxdb2` to your external drive path (e.g., `D:/influxdb_data:/var/lib/influxdb2`).
3. **Start the Framework**:
   Open a terminal in this directory and run:
   ```bash
   docker-compose up --build -d
   ```
4. **Test the API**:
   Send a POST request to `http://localhost:8000/api/telemetry` with the following JSON:
   ```json
   {
       "engine_id": "engine_001",
       "rpm": 4500,
       "cht": 180.5,
       "egt": 750.2,
       "oil_pressure": 55.0,
       "oil_temperature": 90.0,
       "fuel_flow": 12.5,
       "vibration": 0.04
   }
   ```
5. **View Data**:
   Navigate to `http://localhost:8086` in your browser.
   - Username: `admin`
   - Password: `adminpassword123`

6. **Stop the Framework**:
   ```bash
   docker-compose down
   ```
