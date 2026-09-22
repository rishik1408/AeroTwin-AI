import { TelemetryData, FaultLabel, EngineControlState } from '../types/telemetry';
import { HEALTHY_BASELINE } from '../data/mockTelemetry';

export interface TelemetryResponse {
  telemetry: TelemetryData;
  labels: FaultLabel[];
  controls: EngineControlState;
  isBackendConnected: boolean;
}

class TelemetryService {
  private isConnected = false;
  private demoMode = true; // Default to demo/simulated mode for reliable hackathon presentation
  private localTelemetry: TelemetryData = { ...HEALTHY_BASELINE };
  private activeFaults: { type: string; severity: number; duration: number; elapsed: number }[] = [];
  private controls: EngineControlState = {
    throttle: 78.0,
    altitude: 2450,
    ambient_temp: -0.9,
    airspeed_kts: 84.0,
    is_running: true,
  };
  private tickCount = 0;

  constructor() {
    this.checkBackendHealth();
  }

  public setDemoMode(active: boolean) {
    this.demoMode = active;
  }

  public getDemoMode(): boolean {
    return this.demoMode;
  }

  public async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await fetch('/api/telemetry', { signal: AbortSignal.timeout(1000) });
      this.isConnected = res.ok;
    } catch {
      this.isConnected = false;
    }
    return this.isConnected;
  }

  public async fetchTelemetry(): Promise<TelemetryResponse> {
    if (!this.demoMode && this.isConnected) {
      try {
        const res = await fetch('/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          return {
            telemetry: data.telemetry,
            labels: data.labels || [],
            controls: data.controls || this.controls,
            isBackendConnected: true,
          };
        }
      } catch {
        this.isConnected = false;
      }
    }

    // Local High-Fidelity Simulator
    return this.stepLocalSimulator();
  }

  public async updateControls(newControls: Partial<EngineControlState>): Promise<boolean> {
    this.controls = { ...this.controls, ...newControls };

    if (!this.demoMode && this.isConnected) {
      try {
        const res = await fetch('/api/controls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.controls),
        });
        return res.ok;
      } catch {
        // Fallback to local
      }
    }
    return true;
  }

  public async triggerFault(fault_type: string, severity: number, duration: number): Promise<boolean> {
    this.activeFaults.push({
      type: fault_type,
      severity: Math.max(0.1, Math.min(1.0, severity)),
      duration: Math.max(5, duration),
      elapsed: 0,
    });

    if (!this.demoMode && this.isConnected) {
      try {
        await fetch('/api/faults', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fault_type, severity, duration }),
        });
      } catch {
        // Fallback
      }
    }
    return true;
  }

  public async resetSimulation(): Promise<void> {
    this.localTelemetry = { ...HEALTHY_BASELINE };
    this.activeFaults = [];
    this.tickCount = 0;
    this.controls = {
      throttle: 78.0,
      altitude: 2450,
      ambient_temp: -0.9,
      airspeed_kts: 84.0,
      is_running: true,
    };

    if (this.isConnected) {
      try {
        await fetch('/api/reset', { method: 'POST', body: '{}' });
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Internal physics simulator reproducing engine_model.py equations
   */
  private stepLocalSimulator(): TelemetryResponse {
    this.tickCount++;
    const t = this.tickCount;

    // Throttle impact
    const thr = this.controls.is_running ? this.controls.throttle / 100 : 0;
    const baseRpm = this.controls.is_running ? 1400 + thr * 4100 : 0;

    // Small stochastic noise (AR1 jitter simulation)
    const rpmNoise = (Math.sin(t * 0.7) + Math.cos(t * 1.3)) * 8;
    const chtNoise = Math.sin(t * 0.2) * 0.3;
    const vibNoise = Math.sin(t * 2.1) * 0.002;

    let rpm = baseRpm + rpmNoise;
    let cht = 98.0 + thr * 8.0 + chtNoise;
    let egt = 705.0 + thr * 50.0 + (Math.sin(t * 0.5) * 3);
    let oilPress = 2.0 + thr * 2.2 + (Math.sin(t * 0.3) * 0.03);
    let oilTemp = 92.0 + thr * 12.0;
    let vib = 0.02 + thr * 0.015 + vibNoise;
    let fuelFlow = 4.5 + thr * 16.5;

    // Advance active faults
    const activeLabels: FaultLabel[] = [];
    for (const fault of this.activeFaults) {
      fault.elapsed++;
      const progress = Math.min(1.0, fault.elapsed / fault.duration);
      const effect = progress * fault.severity;

      activeLabels.push({
        fault_type: fault.type,
        onset_tick: this.tickCount - fault.elapsed,
        severity: fault.severity,
      });

      if (fault.type === 'cooling_degradation') {
        cht += effect * 38.0;
        egt += effect * 95.0;
        oilTemp += effect * 24.0;
      } else if (fault.type === 'oil_pressure_drop') {
        oilPress = Math.max(0.4, oilPress * (1.0 - effect * 0.75));
        oilTemp += effect * 18.0;
      } else if (fault.type === 'vibration_growth') {
        vib += effect * 0.22;
      } else if (fault.type === 'misfire') {
        const osc = Math.sin(fault.elapsed * 0.8);
        rpm *= (1.0 + effect * 0.12 * osc);
        fuelFlow *= (1.0 + effect * 0.15 * osc);
      }
    }

    this.localTelemetry = {
      timestamp: Date.now() / 1000,
      rpm: Math.max(0, Math.round(rpm)),
      cht_celsius: +cht.toFixed(1),
      egt_celsius: +egt.toFixed(1),
      oil_pressure_bar: +oilPress.toFixed(2),
      oil_temp_celsius: +oilTemp.toFixed(1),
      vibration: +vib.toFixed(4),
      fuel_flow: +fuelFlow.toFixed(1),
      battery_voltage_v: +(14.1 - (this.controls.is_running ? 0 : 1.6)).toFixed(2),
      injection_timing_deg: +(15 + thr * 14).toFixed(1),
      map_inhg: +(16 + thr * 13.9).toFixed(1),
      airspeed_kts: this.controls.airspeed_kts,
      throttle_position: this.controls.throttle,
      altitude_m: this.controls.altitude,
      ambient_temp_celsius: this.controls.ambient_temp,
    };

    return {
      telemetry: this.localTelemetry,
      labels: activeLabels,
      controls: this.controls,
      isBackendConnected: this.isConnected,
    };
  }
}

export const telemetryService = new TelemetryService();
