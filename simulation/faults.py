"""
Fault injection module for AeroTwin AI engine simulator.
Modifies EngineState telemetry tick-by-tick to inject realistic degradation.
"""
import math
from schemas import FaultLabel, Telemetry
from engine_model import EngineState

class FaultInjector:
    """
    Wraps an EngineState and injects faults gracefully over time.
    """
    def __init__(self, engine: EngineState):
        self.engine = engine
        self.active_faults = []
        
    def trigger_fault(self, fault_type: str, severity: float, duration_seconds: int):
        """
        Trigger a fault that will evolve over `duration_seconds`.
        """
        self.active_faults.append({
            "type": fault_type,
            "severity": max(0.0, min(1.0, severity)), # clamp 0-1
            "duration": duration_seconds,
            "onset_tick": self.engine.tick,
            "ticks_elapsed": 0
        })
        
    def step(self, throttle_position: float, altitude_m: float, ambient_temp_celsius: float, is_running: bool = True) -> tuple[Telemetry, list[FaultLabel]]:
        """
        Advance the engine and apply any active faults to the telemetry.
        Returns the modified Telemetry and a list of active FaultLabels.
        """
        # Get clean telemetry
        telemetry = self.engine.step(throttle_position, altitude_m, ambient_temp_celsius, is_running)
        
        labels = []
        if not self.active_faults:
            return telemetry, labels
            
        for fault in self.active_faults:
            fault["ticks_elapsed"] += 1
            elapsed = fault["ticks_elapsed"]
            duration = fault["duration"]
            severity = fault["severity"]
            
            # Progress from 0.0 to 1.0 over the duration window
            progress = min(1.0, elapsed / duration) if duration > 0 else 1.0
            
            # Current effect magnitude (scaled by severity)
            effect = progress * severity
            f_type = fault["type"]
            
            if f_type == "oil_pressure_drop":
                # Gradual loss of oil pressure (lubrication fault)
                telemetry.oil_pressure_bar *= (1.0 - effect)
                
            elif f_type == "cooling_degradation":
                # Cooling system failure causing temps to slowly climb
                telemetry.cht_celsius += effect * 40.0
                telemetry.egt_celsius += effect * 120.0
                telemetry.oil_temp_celsius += effect * 20.0
                
            elif f_type == "vibration_growth":
                # Bearing wear causing increasing vibration
                telemetry.vibration *= (1.0 + effect * 9.0)
                
            elif f_type == "misfire":
                # Misfire causing RPM and fuel flow to surge/sag cyclically
                osc = math.sin(elapsed * 0.5)
                fluctuation = effect * 0.15 * osc
                telemetry.rpm *= (1.0 + fluctuation)
                telemetry.fuel_flow *= (1.0 + fluctuation)
                
            elif f_type == "sensor_drift":
                # CHT sensor slowly drifts to report erroneously high values
                telemetry.cht_celsius *= (1.0 + effect * 0.2)
                
            elif f_type == "injector_abnormality":
                # Clogged injector: fuel flow drops, EGT drops on lean misfire, RPM drops
                telemetry.fuel_flow *= (1.0 - effect * 0.4)
                telemetry.rpm *= (1.0 - effect * 0.2)
                telemetry.egt_celsius -= effect * 100.0
                
            elif f_type == "combustion_instability":
                # EGT and CHT become highly erratic (simulated by random noise injection)
                import random
                telemetry.egt_celsius += effect * random.uniform(-80, 80)
                telemetry.cht_celsius += effect * random.uniform(-15, 15)
                
            elif f_type == "battery_alternator_fail":
                # Alternator dies, voltage drops to battery level (12.5) then drains
                # Severity 1.0 means battery is completely drained to 9.0V
                if telemetry.battery_voltage_v > 12.5:
                    telemetry.battery_voltage_v = 12.5 # Instant drop off alternator
                telemetry.battery_voltage_v -= effect * 3.5 # Drain down to 9.0V
                
            labels.append(FaultLabel(
                fault_type=f_type,
                onset_tick=fault["onset_tick"],
                severity=severity
            ))
            
        # Note: Faults persist at their max severity after `duration` is reached.
        # A broken engine stays broken.
        
        # Re-round telemetry to maintain clean schema format
        telemetry.rpm = round(max(0.0, telemetry.rpm), 1)
        telemetry.cht_celsius = round(telemetry.cht_celsius, 2)
        telemetry.egt_celsius = round(telemetry.egt_celsius, 2)
        telemetry.oil_pressure_bar = round(max(0.0, telemetry.oil_pressure_bar), 2)
        telemetry.oil_temp_celsius = round(max(0.0, telemetry.oil_temp_celsius), 2)
        telemetry.vibration = round(max(0.0, telemetry.vibration), 4)
        telemetry.fuel_flow = round(max(0.0, telemetry.fuel_flow), 2)
        telemetry.battery_voltage_v = round(max(0.0, telemetry.battery_voltage_v), 2)
        telemetry.injection_timing_deg = round(max(0.0, telemetry.injection_timing_deg), 2)
        
        return telemetry, labels
