import time
import json
import random
import math
from dataclasses import asdict

from schemas import Telemetry

class AR1Noise:
    """Autoregressive AR(1) noise generator for realistic sensor jitter."""
    def __init__(self, phi: float, sigma: float):
        self.phi = phi
        self.sigma = sigma
        self.value = 0.0

    def step(self) -> float:
        self.value = self.phi * self.value + random.gauss(0, self.sigma)
        return self.value

class EngineState:
    """
    Core simulator for a Rotax 912-class 4-cylinder aero piston engine.
    Advances by discrete 1-second ticks.
    """
    def __init__(self, initial_altitude_m: float = 0.0, initial_ambient_temp_celsius: float = 15.0):
        self.tick = 0
        self.timestamp = time.time()
        
        # Environmental inputs
        self.altitude_m = initial_altitude_m
        self.ambient_temp_celsius = initial_ambient_temp_celsius
        self.throttle_position = 0.0 # 0-100%
        self.is_running = False
        
        # Physical State (Clean baseline values)
        self.rpm = 0.0
        self.cht_celsius = self.ambient_temp_celsius
        self.egt_celsius = self.ambient_temp_celsius
        self.oil_temp_celsius = self.ambient_temp_celsius
        self.battery_voltage_v = 12.5 # Battery rest voltage
        
        # AR(1) Noise models to make sensors look real
        self.rpm_noise = AR1Noise(phi=0.8, sigma=15.0)
        self.cht_noise = AR1Noise(phi=0.9, sigma=0.2)
        self.egt_noise = AR1Noise(phi=0.8, sigma=3.0)
        self.oil_temp_noise = AR1Noise(phi=0.95, sigma=0.1)
        self.oil_press_noise = AR1Noise(phi=0.7, sigma=0.05)
        self.vib_noise = AR1Noise(phi=0.6, sigma=0.005)
        self.fuel_flow_noise = AR1Noise(phi=0.8, sigma=0.1)
        self.batt_noise = AR1Noise(phi=0.9, sigma=0.05)
        self.inj_noise = AR1Noise(phi=0.5, sigma=0.2)
        
        # Time constants (tau) in seconds for first-order response
        self.tau_rpm = 1.5      # RPM changes quickly
        self.tau_egt = 3.0      # EGT responds very quickly
        self.tau_cht = 20.0     # CHT takes longer (metal mass)
        self.tau_oil_temp = 180.0 # Oil temp changes very slowly (large thermal mass)
        
    def step(self, throttle_position: float, altitude_m: float, ambient_temp_celsius: float, is_running: bool = True) -> Telemetry:
        """
        Advance the engine simulation by 1 second (1 tick).
        """
        self.throttle_position = throttle_position
        self.altitude_m = altitude_m
        self.ambient_temp_celsius = ambient_temp_celsius
        self.is_running = is_running
        
        dt = 1.0 # 1 second per tick
        
        # 1. Update RPM
        if not self.is_running:
            target_rpm = 0.0
        else:
            # Throttle 0% -> 1400 RPM (idle), 100% -> 5800 RPM (max takeoff)
            target_rpm = 1400.0 + (self.throttle_position / 100.0) * (5800.0 - 1400.0)
            
        alpha_rpm = 1.0 - math.exp(-dt / self.tau_rpm)
        self.rpm += alpha_rpm * (target_rpm - self.rpm)
        
        # 2. Update EGT (Exhaust Gas Temp)
        if not self.is_running or self.rpm < 500:
            target_egt = self.ambient_temp_celsius
        else:
            rpm_norm = (self.rpm - 1400) / (5800 - 1400)
            target_egt = 500.0 + 350.0 * rpm_norm + (self.ambient_temp_celsius - 15.0)
            # Altitude lowers EGT slightly (simplified: thinner air)
            target_egt -= (self.altitude_m / 1000.0) * 15.0
            
        alpha_egt = 1.0 - math.exp(-dt / self.tau_egt)
        self.egt_celsius += alpha_egt * (target_egt - self.egt_celsius)
        
        # 3. Update CHT (Cylinder Head Temp)
        if not self.is_running or self.rpm < 500:
            target_cht = self.ambient_temp_celsius
        else:
            rpm_norm = (self.rpm - 1400) / (5800 - 1400)
            target_cht = 100.0 + 35.0 * rpm_norm + (self.ambient_temp_celsius - 15.0) * 0.8
            
        alpha_cht = 1.0 - math.exp(-dt / self.tau_cht)
        self.cht_celsius += alpha_cht * (target_cht - self.cht_celsius)
        
        # 4. Update Oil Temp
        if not self.is_running or self.rpm < 500:
            target_oil_temp = self.ambient_temp_celsius
        else:
            rpm_norm = (self.rpm - 1400) / (5800 - 1400)
            target_oil_temp = 85.0 + 25.0 * rpm_norm + (self.ambient_temp_celsius - 15.0) * 0.5
            
        alpha_oil = 1.0 - math.exp(-dt / self.tau_oil_temp)
        self.oil_temp_celsius += alpha_oil * (target_oil_temp - self.oil_temp_celsius)
        
        # 5. Calculate Oil Pressure
        if not self.is_running or self.rpm < 500:
            oil_pressure = 0.0
        else:
            if self.rpm < 1400:
                base_pressure = 0.8 + (self.rpm / 1400.0) * 1.2
            else:
                rpm_norm = (self.rpm - 1400) / (5800 - 1400)
                base_pressure = 2.0 + rpm_norm * 3.5
            temp_penalty = max(0.0, (self.oil_temp_celsius - 90.0) * 0.02)
            oil_pressure = max(0.8, min(7.0, base_pressure - temp_penalty))
            
        # 6. Calculate Vibration
        if not self.is_running or self.rpm < 500:
            vibration = 0.0
        else:
            rpm_norm = self.rpm / 5800.0
            vibration = 0.02 + 0.08 * (rpm_norm ** 2)
            
        # 7. Calculate Fuel Flow
        if not self.is_running or self.rpm < 500:
            fuel_flow = 0.0
        else:
            rpm_norm = self.rpm / 5800.0
            fuel_flow = 2.0 + 25.0 * (rpm_norm ** 1.5)
            
        # 8. Calculate Battery/Alternator Voltage
        if not self.is_running or self.rpm < 500:
            target_voltage = 12.5 # Off/Battery only
        else:
            if self.rpm < 2000:
                target_voltage = 13.0 + (self.rpm / 2000.0) * 0.8 # Charging spins up
            else:
                target_voltage = 14.0 + (self.rpm / 5800.0) * 0.2 # Full charge 14.0-14.2V
        self.battery_voltage_v += (target_voltage - self.battery_voltage_v) * 0.5 # Fast response
        
        # 9. Calculate Injection Timing (Degrees BTDC)
        if not self.is_running or self.rpm < 500:
            injection_timing = 0.0
        else:
            rpm_norm = self.rpm / 5800.0
            injection_timing = 5.0 + 20.0 * rpm_norm # Advances 5 to 25 deg
            
        # Add realistic noise for the output schema
        running_factor = 1.0 if (self.is_running and self.rpm > 500) else 0.1
        
        out_rpm = max(0.0, self.rpm + self.rpm_noise.step() * running_factor)
        out_cht = max(self.ambient_temp_celsius, self.cht_celsius + self.cht_noise.step() * running_factor)
        out_egt = max(self.ambient_temp_celsius, self.egt_celsius + self.egt_noise.step() * running_factor)
        out_oil_temp = max(self.ambient_temp_celsius, self.oil_temp_celsius + self.oil_temp_noise.step() * running_factor)
        out_oil_press = max(0.0, oil_pressure + self.oil_press_noise.step() * running_factor)
        out_vib = max(0.0, vibration + self.vib_noise.step() * running_factor)
        out_fuel_flow = max(0.0, fuel_flow + self.fuel_flow_noise.step() * running_factor)
        out_batt = max(0.0, self.battery_voltage_v + self.batt_noise.step())
        out_inj = max(0.0, injection_timing + self.inj_noise.step() * running_factor)
        
        telemetry = Telemetry(
            timestamp=self.timestamp + self.tick,
            rpm=round(out_rpm, 1),
            cht_celsius=round(out_cht, 2),
            egt_celsius=round(out_egt, 2),
            oil_pressure_bar=round(out_oil_press, 2),
            oil_temp_celsius=round(out_oil_temp, 2),
            vibration=round(out_vib, 4),
            fuel_flow=round(out_fuel_flow, 2),
            battery_voltage_v=round(out_batt, 2),
            injection_timing_deg=round(out_inj, 2),
            throttle_position=round(self.throttle_position, 1),
            altitude_m=round(self.altitude_m, 1),
            ambient_temp_celsius=round(self.ambient_temp_celsius, 1)
        )
        
        self.tick += 1
        return telemetry

def run_demo():
    """Run a short simulated mission profile and print JSON telemetry."""
    print("Starting engine demo... (Press Ctrl+C to stop)")
    engine = EngineState(initial_altitude_m=0.0, initial_ambient_temp_celsius=20.0)
    
    # Mission phases (shortened durations for demo purposes)
    phases = [
        {"name": "startup", "dur": 3, "throttle": 0.0, "alt_rate": 0.0, "is_running": False},
        {"name": "taxi/idle", "dur": 5, "throttle": 0.0, "alt_rate": 0.0, "is_running": True},
        {"name": "takeoff", "dur": 5, "throttle": 100.0, "alt_rate": 0.0, "is_running": True},
        {"name": "climb", "dur": 10, "throttle": 85.0, "alt_rate": 20.0, "is_running": True},
        {"name": "cruise", "dur": 10, "throttle": 65.0, "alt_rate": 0.0, "is_running": True},
        {"name": "descent", "dur": 5, "throttle": 20.0, "alt_rate": -40.0, "is_running": True},
        {"name": "shutdown", "dur": 3, "throttle": 0.0, "alt_rate": 0.0, "is_running": False},
    ]
    
    alt = 0.0
    oat = 20.0
    for phase in phases:
        print(f"\n--- Entering Phase: {phase['name']} (Throttle: {phase['throttle']}%) ---")
        for _ in range(phase["dur"]):
            alt_rate = phase.get("alt_rate", 0.0)
            alt = max(0.0, alt + alt_rate)
            
            # Simple standard lapse rate: temp drops 6.5C per 1000m
            oat = 20.0 - (alt / 1000.0) * 6.5
            
            telem = engine.step(
                throttle_position=phase["throttle"],
                altitude_m=alt,
                ambient_temp_celsius=oat,
                is_running=phase["is_running"]
            )
            
            # Print pretty JSON
            print(json.dumps(asdict(telem), indent=2))
            
            # Output once per second per instructions
            time.sleep(1)

if __name__ == "__main__":
    run_demo()
