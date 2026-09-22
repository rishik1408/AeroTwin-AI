"""
Telemetry Output Schema

This schema is the data contract for the telemetry ingestion and AI/ML teammates
for the AeroTwin AI project (Rotax 912-class 4-cylinder aero piston engine).
"""

from dataclasses import dataclass

@dataclass
class Telemetry:
    """
    Telemetry output schema for a Rotax 912-class 4-cylinder aero piston engine.
    """
    timestamp: float
    
    # Engine RPM. idle ~1400, max continuous 5500, max takeoff 5800 for 5 min only
    rpm: float
    
    # Cylinder Head Temperature (Celsius). normal 80-120, max 135
    cht_celsius: float
    
    # Exhaust Gas Temperature (Celsius). normal cruise 650-800, max ~900
    egt_celsius: float
    
    # Oil Pressure (bar). normal 2-5 above 1400rpm, min 0.8 below, max 7
    oil_pressure_bar: float
    
    # Oil Temperature (Celsius). normal 90-110, max 130
    oil_temp_celsius: float
    
    # Vibration (unitless amplitude). no hard spec - baseline scaling with RPM
    vibration: float
    
    # Fuel flow (L/hr). idle ~4.5, cruise ~15-18, max ~26
    fuel_flow: float
    
    # Battery & Alternator voltage. Normal running ~13.8-14.2V, off ~12.0-12.5V
    battery_voltage_v: float
    
    # Injection timing (degrees before Top Dead Center). Advances with RPM.
    injection_timing_deg: float
    
    # Manifold Absolute Pressure (inches of mercury).
    # Sea level idle ~16 inHg, sea level full throttle ~29.9 inHg.
    map_inhg: float

    # Indicated Airspeed (knots). Affects ram-air cooling of CHT and oil temp.
    airspeed_kts: float
    
    # Throttle position (0-100%)
    throttle_position: float
    
    # Altitude (meters)
    altitude_m: float
    
    # Ambient Temperature (Celsius)
    ambient_temp_celsius: float


@dataclass
class FaultLabel:
    """
    Schema for labeling faults, to be used in faults.py.
    """
    fault_type: str
    onset_tick: int
    severity: float
