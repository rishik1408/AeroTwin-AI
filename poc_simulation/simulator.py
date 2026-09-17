import asyncio
import json
import random
from datetime import datetime
import paho.mqtt.client as mqtt

BROKER = "test.mosquitto.org" 
TOPIC_TELEMETRY = "aerotwin/demo/telemetry"
TOPIC_AI = "aerotwin/demo/ai"
TOPIC_CONTROL = "aerotwin/demo/control"

anomaly_active = False
throttle_level = 100 # Initial normal throttle

# --- 1. VIRTUAL ENGINE MODEL (Physics Simulation) ---
def on_control_message(client, userdata, msg):
    """5b. Operator Analysis & Parameter Tweaking (Closed Loop Feedback)"""
    global throttle_level, anomaly_active
    try:
        command = json.loads(msg.payload.decode())
        if command.get("action") == "reduce_throttle":
            print("⏬ OPERATOR FEEDBACK: Reducing throttle to prevent engine failure...")
            throttle_level = 70
            anomaly_active = False # The human intervention cools the engine and clears the fault!
    except Exception as e: 
        print("Error in control loop:", e)

async def engine_node():
    """Generates synthetic telemetry based on physical constraints (Throttle)"""
    global anomaly_active, throttle_level
    client = mqtt.Client(client_id=f"engine_node_{random.randint(1000,9999)}", callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
    client.on_message = on_control_message
    client.connect(BROKER)
    client.subscribe(TOPIC_CONTROL) # Listen for operator feedback
    client.loop_start()
    
    print("🚀 Engine Node: Running thermodynamic simulation...")

    while True:
        # Physics model adjusts based on throttle
        base_rpm = 50 * throttle_level
        rpm = random.randint(base_rpm - 100, base_rpm + 100)
        
        base_cht = 150.0 if throttle_level == 100 else 125.0
        cht = random.uniform(base_cht - 5.0, base_cht + 5.0)
        
        base_egt = 700.0 if throttle_level == 100 else 550.0
        egt = random.uniform(base_egt - 15.0, base_egt + 15.0)
        
        vib = random.uniform(0.02, 0.05) if throttle_level == 100 else random.uniform(0.01, 0.03)

        # Inject severe anomaly if running at max throttle for too long
        if throttle_level == 100 and random.random() > 0.92:
            anomaly_active = True
        
        if anomaly_active:
            cht += random.uniform(40.0, 70.0) # Dangerous overheating
            vib += random.uniform(0.1, 0.25)  # Dangerous vibration

        # Auto-recover throttle to 100% after flying slow for a while
        if throttle_level < 100 and random.random() > 0.85:
            print("⏫ ENGINE RECOVERY: Restoring throttle to 100% for mission cruise.")
            throttle_level = 100

        # 2. EDGE TELEMETRY: Publish raw data
        payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "throttle": throttle_level,
            "rpm": rpm, "cht": round(cht, 1), "egt": round(egt, 1), "vibration": round(vib, 3)
        }
        client.publish(TOPIC_TELEMETRY, json.dumps(payload))
        await asyncio.sleep(1)

# --- 3. BACKEND & 4. AI INFERENCE ENGINE ---
def on_message_telemetry(client, userdata, msg):
    """Simulates FastAPI ingestion, Preprocessing, and AI Inference"""
    try:
        raw_data = json.loads(msg.payload.decode())
        
        # 3. Data Preprocessing (Mock)
        normalized_cht = raw_data["cht"] / 250.0 
        normalized_vib = raw_data["vibration"] / 0.5
        
        # 4. AI INFERENCE ENGINE (The Three Modules)
        # Module A: Anomaly Detection
        is_anomaly = raw_data["cht"] > 175 or raw_data["vibration"] > 0.1
        is_critical = raw_data["cht"] > 200 or raw_data["vibration"] > 0.2
        
        alert_level = "NORMAL"
        if is_critical: alert_level = "CRITICAL"
        elif is_anomaly: alert_level = "WARNING"
        
        # Module B: RUL Prediction (Sequence to Value Mock)
        if alert_level == "CRITICAL": rul_hours = random.randint(1, 4)
        elif alert_level == "WARNING": rul_hours = random.randint(10, 30)
        else: rul_hours = random.randint(450, 500)
        
        # Module C: SHAP Explainability (Root Cause Mapping)
        root_cause = "None"
        if is_anomaly:
            if raw_data["cht"] > 175 and raw_data["vibration"] > 0.1:
                root_cause = "Simultaneous Overheating & Bearing Wear Detected"
            elif raw_data["cht"] > 175:
                root_cause = "Cooling Degradation (High CHT feature impact)"
            else:
                root_cause = "Mechanical Imbalance (High RMS Vibration feature impact)"

        # Compile AI Output
        prediction_payload = {
            "timestamp": datetime.utcnow().isoformat(),
            "engine_state": {
                "throttle": raw_data["throttle"]
            },
            "ai_inference": {
                "anomaly_alert": alert_level,
                "rul_prediction": rul_hours,
                "shap_explainability": root_cause
            }
        }
        client.publish(TOPIC_AI, json.dumps(prediction_payload))
    except Exception as e:
        print("Backend Error:", e)

async def backend_ai_node():
    client = mqtt.Client(client_id=f"ai_node_{random.randint(1000,9999)}", callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
    client.on_message = on_message_telemetry
    client.connect(BROKER)
    client.subscribe(TOPIC_TELEMETRY)
    client.loop_start()
    
    print("🧠 Backend/AI Node: Processing Telemetry & Running Inference...")
    while True:
        await asyncio.sleep(1)

async def main():
    print("==================================================")
    print(" AeroTwin Architecture Simulation Started")
    print(" Flow: Engine -> MQTT -> Preprocessing -> AI -> UI")
    print("==================================================")
    await asyncio.gather(engine_node(), backend_ai_node())

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nSimulation Terminated.")
