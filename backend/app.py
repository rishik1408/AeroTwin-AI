import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'simulation')))

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engine_model import EngineState
from faults import FaultInjector

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulation state
engine = EngineState()
fault_injector = FaultInjector(engine)

control_state = {
    "throttle": 0.0,
    "altitude": 0.0,
    "ambient_temp": 15.0,
    "is_running": True
}

class ControlUpdate(BaseModel):
    throttle: float
    altitude: float
    ambient_temp: float
    is_running: bool

class FaultTrigger(BaseModel):
    fault_type: str
    severity: float
    duration: int

@app.get("/")
def read_root():
    html_path = os.path.join(os.path.dirname(__file__), "ui.html")
    with open(html_path, "r") as f:
        return HTMLResponse(content=f.read())

@app.post("/controls")
def update_controls(update: ControlUpdate):
    control_state["throttle"] = update.throttle
    control_state["altitude"] = update.altitude
    control_state["ambient_temp"] = update.ambient_temp
    control_state["is_running"] = update.is_running
    return {"status": "success"}

@app.post("/faults")
def trigger_fault(fault: FaultTrigger):
    fault_injector.trigger_fault(fault.fault_type, fault.severity, fault.duration)
    return {"status": "success"}

@app.get("/telemetry")
def get_telemetry():
    telemetry, labels = fault_injector.step(
        throttle_position=control_state["throttle"],
        altitude_m=control_state["altitude"],
        ambient_temp_celsius=control_state["ambient_temp"],
        is_running=control_state["is_running"]
    )
    return {
        "telemetry": telemetry.__dict__,
        "labels": [label.__dict__ for label in labels],
        "controls": control_state
    }
