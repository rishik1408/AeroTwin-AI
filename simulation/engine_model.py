import time
import json
import random
import math
from dataclasses import asdict

from schemas import Telemetry


# ── ICAO Standard Atmosphere helpers ──────────────────────────────────────────

def isa_temperature(altitude_m: float) -> float:
    """
    ICAO ISA standard temperature at altitude (°C).
    Troposphere (0–11,000 m): -6.5 °C per 1,000 m from 15 °C at MSL.
    Stratosphere (11,000–20,000 m): constant -56.5 °C.
    """
    altitude_m = max(0.0, altitude_m)
    if altitude_m <= 11_000:
        return 15.0 - 6.5 * (altitude_m / 1_000.0)
    return -56.5


def density_ratio(altitude_m: float, ambient_temp_celsius: float) -> float:
    """
    Air density ratio σ = ρ / ρ₀ relative to ISA sea-level conditions.

    Uses the barometric (hypsometric) pressure formula for the troposphere,
    corrected for non-ISA temperature (density altitude effect):

        p_ratio  = (1 − 2.25577 × 10⁻⁵ · h)^5.25588        [ICAO troposphere]
        σ        = p_ratio × (T_ISA_SL / T_actual)           [ideal gas law]

    A naturally aspirated engine produces power proportional to σ:
    at 4,850 m ISA-standard, σ ≈ 0.61 (39% power loss vs. sea level).
    """
    altitude_m = max(0.0, altitude_m)
    # Pressure ratio (valid troposphere, 0–11 km)
    p_ratio = max(0.0, (1.0 - 2.25577e-5 * altitude_m) ** 5.25588)
    # Density correction for actual temperature (not ISA)
    T_K = max(200.0, ambient_temp_celsius + 273.15)    # actual temp [K]
    T_sl_K = 288.15                                     # ISA sea-level [K]
    sigma = p_ratio * (T_sl_K / T_K)
    return max(0.10, min(1.05, sigma))                  # clamp 10%–105%


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
        self.tau_oil_temp = 90.0  # Oil temp: large thermal mass, ~9 min to stabilize
                                  # (reduced from 180s — 180s caused unrealistically slow
                                  #  warmup in short simulation runs)
        
    def step(self, throttle_position: float, altitude_m: float, ambient_temp_celsius: float,
             is_running: bool = True, airspeed_kts: float = 0.0) -> Telemetry:
        """
        Advance the engine simulation by 1 second (1 tick).
        airspeed_kts: Indicated airspeed — affects ram-air cooling of CHT and oil temp.
        """
        self.throttle_position = throttle_position
        self.altitude_m = altitude_m
        self.ambient_temp_celsius = ambient_temp_celsius
        self.is_running = is_running

        dt = 1.0  # 1 second per tick

        # ── Atmosphere ────────────────────────────────────────────────────────
        sigma = density_ratio(self.altitude_m, self.ambient_temp_celsius)

        # Ambient pressure ratio (for MAP)
        p_ratio = max(0.0, (1.0 - 2.25577e-5 * max(0.0, self.altitude_m)) ** 5.25588)
        p_ambient_inhg = p_ratio * 29.921  # inHg at current altitude

        # ── Ram-air cooling factor ────────────────────────────────────────────
        # At 0 kts (ground static): no ram air, worst cooling.
        # At 100 kts cruise: typical cowl cooling.  Saturates above 150 kts.
        # Reduces CHT target by up to 25°C, oil temp by up to 15°C.
        ram_factor = min(1.0, airspeed_kts / 100.0)   # 0 → 1 over 0–100 kts
        cht_ram_reduction  = ram_factor * 25.0          # °C reduction at full ram
        oil_ram_reduction  = ram_factor * 15.0

        # ── 1. Update RPM ─────────────────────────────────────────────────────
        if not self.is_running:
            target_rpm = 0.0
        else:
            # Power-law throttle→RPM curve (exponent 1.5):
            #   0%  throttle → 1400 RPM (idle, governed)
            #  33%  throttle → ~2230 RPM  ← was 2850 with linear mapping
            #  75%  throttle → ~4250 RPM
            # 100%  throttle → 5800 RPM (max takeoff)
            # This better reflects the cubic prop-load characteristic where
            # small throttle increments produce smaller RPM gains at low power.
            t_norm = max(0.0, min(1.0, self.throttle_position / 100.0))
            target_rpm_sl = 1400.0 + 4400.0 * (t_norm ** 1.5)
            # Altitude prop-unloading cap (sqrt(σ) damper)
            rpm_cap = 1400.0 + 4400.0 * math.sqrt(sigma)
            target_rpm = min(target_rpm_sl, rpm_cap)

        alpha_rpm = 1.0 - math.exp(-dt / self.tau_rpm)
        self.rpm += alpha_rpm * (target_rpm - self.rpm)

        rpm_norm_idle = max(0.0, (self.rpm - 1400) / (5800 - 1400))

        # ── 2. Update EGT ─────────────────────────────────────────────────────
        if not self.is_running or self.rpm < 500:
            target_egt = self.ambient_temp_celsius
        else:
            target_egt = 500.0 + 350.0 * rpm_norm_idle + (self.ambient_temp_celsius - 15.0)
            power_loss_fraction = 1.0 - sigma
            target_egt += power_loss_fraction * 30.0   # lean mixture EGT rise
            target_egt -= power_loss_fraction * 15.0   # reduced combustion heat

        alpha_egt = 1.0 - math.exp(-dt / self.tau_egt)
        self.egt_celsius += alpha_egt * (target_egt - self.egt_celsius)

        # ── 3. Update CHT ─────────────────────────────────────────────────────
        if not self.is_running or self.rpm < 500:
            target_cht = self.ambient_temp_celsius
        else:
            cht_sl = 100.0 + 35.0 * rpm_norm_idle + (self.ambient_temp_celsius - 15.0) * 0.8
            target_cht = self.ambient_temp_celsius + sigma * (cht_sl - self.ambient_temp_celsius)
            # Ram-air cooling: faster airflow → better cylinder head cooling
            target_cht -= cht_ram_reduction

        alpha_cht = 1.0 - math.exp(-dt / self.tau_cht)
        self.cht_celsius += alpha_cht * (target_cht - self.cht_celsius)

        # ── 4. Update Oil Temp ────────────────────────────────────────────────
        if not self.is_running or self.rpm < 500:
            target_oil_temp = self.ambient_temp_celsius
        else:
            base_oil_temp = 85.0 + 25.0 * rpm_norm_idle + (self.ambient_temp_celsius - 15.0) * 0.5
            base_oil_temp = self.ambient_temp_celsius + sigma * (base_oil_temp - self.ambient_temp_celsius)
            cht_excess = max(0.0, self.cht_celsius - self.ambient_temp_celsius)
            target_oil_temp = base_oil_temp + 0.30 * cht_excess
            # Ram-air cooling: oil cooler benefits from airflow
            target_oil_temp -= oil_ram_reduction

        alpha_oil = 1.0 - math.exp(-dt / self.tau_oil_temp)
        self.oil_temp_celsius += alpha_oil * (target_oil_temp - self.oil_temp_celsius)

        # ── 5. Oil Pressure ───────────────────────────────────────────────────
        if not self.is_running or self.rpm < 500:
            oil_pressure = 0.0
        else:
            if self.rpm < 1400:
                base_pressure = 0.8 + (self.rpm / 1400.0) * 1.2
            else:
                base_pressure = 2.0 + rpm_norm_idle * 3.5
            temp_penalty = max(0.0, (self.oil_temp_celsius - 90.0) * 0.02)
            oil_pressure = max(0.8, min(7.0, base_pressure - temp_penalty))

        # ── 6. Vibration ──────────────────────────────────────────────────────
        if not self.is_running or self.rpm < 500:
            vibration = 0.0
        else:
            vibration = 0.02 + 0.08 * ((self.rpm / 5800.0) ** 2)

        # ── 7. Fuel Flow (L/hr) ───────────────────────────────────────────────
        if not self.is_running or self.rpm < 500:
            fuel_flow = 0.0
        elif self.rpm < 1400:
            fuel_flow = 4.5 * (self.rpm / 1400.0) * sigma
        else:
            rpm_norm_ff = max(0.0, min(1.0, (self.rpm - 1400) / (5800 - 1400)))
            fuel_flow = (4.5 + 21.5 * (rpm_norm_ff ** 1.3)) * sigma

        # ── 8. Battery / Alternator Voltage ──────────────────────────────────
        if not self.is_running or self.rpm < 500:
            target_voltage = 12.5
        else:
            if self.rpm < 2000:
                target_voltage = 13.0 + (self.rpm / 2000.0) * 0.8
            else:
                target_voltage = 14.0 + (self.rpm / 5800.0) * 0.2
        self.battery_voltage_v += (target_voltage - self.battery_voltage_v) * 0.5

        # ── 9. Injection Timing (deg BTDC) ────────────────────────────────────
        if not self.is_running or self.rpm < 500:
            injection_timing = 0.0
        else:
            injection_timing = 5.0 + 20.0 * (self.rpm / 5800.0)

        # ── 10. Manifold Absolute Pressure (inHg) ────────────────────────────
        # MAP = ambient_pressure × throttle_plate_opening_fraction
        # Idle: ~55% of ambient (high manifold vacuum)
        # Full throttle: 100% of ambient (wide-open throttle)
        if not self.is_running or self.rpm < 500:
            map_inhg = 0.0
        else:
            t_norm = max(0.0, min(1.0, self.throttle_position / 100.0))
            throttle_opening = 0.55 + 0.45 * (t_norm ** 0.7)  # concave: opens fast initially
            map_inhg = p_ambient_inhg * throttle_opening

        # ── Output with sensor noise ──────────────────────────────────────────
        running_factor = 1.0 if (self.is_running and self.rpm > 500) else 0.1

        out_rpm     = max(0.0, self.rpm              + self.rpm_noise.step()      * running_factor)
        out_cht     = max(self.ambient_temp_celsius,   self.cht_celsius           + self.cht_noise.step()      * running_factor)
        out_egt     = max(self.ambient_temp_celsius,   self.egt_celsius           + self.egt_noise.step()      * running_factor)
        out_oil_t   = max(self.ambient_temp_celsius,   self.oil_temp_celsius      + self.oil_temp_noise.step() * running_factor)
        out_oil_p   = max(0.0, oil_pressure            + self.oil_press_noise.step() * running_factor)
        out_vib     = max(0.0, vibration               + self.vib_noise.step()    * running_factor)
        out_fuel    = max(0.0, fuel_flow               + self.fuel_flow_noise.step() * running_factor)
        out_batt    = max(0.0, self.battery_voltage_v  + self.batt_noise.step())
        out_inj     = max(0.0, injection_timing        + self.inj_noise.step()    * running_factor)
        out_map     = max(0.0, map_inhg)

        telemetry = Telemetry(
            timestamp            = self.timestamp + self.tick,
            rpm                  = round(out_rpm,   1),
            cht_celsius          = round(out_cht,   2),
            egt_celsius          = round(out_egt,   2),
            oil_pressure_bar     = round(out_oil_p, 2),
            oil_temp_celsius     = round(out_oil_t, 2),
            vibration            = round(out_vib,   4),
            fuel_flow            = round(out_fuel,  2),
            battery_voltage_v    = round(out_batt,  2),
            injection_timing_deg = round(out_inj,   2),
            map_inhg             = round(out_map,   2),
            airspeed_kts         = round(airspeed_kts, 1),
            throttle_position    = round(self.throttle_position, 1),
            altitude_m           = round(self.altitude_m, 1),
            ambient_temp_celsius = round(self.ambient_temp_celsius, 1),
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
