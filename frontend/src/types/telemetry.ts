/**
 * AeroTwin Telemetry & System Data Contracts
 * Corresponds to simulation/schemas.py with frontend extensions.
 */

export interface TelemetryData {
  timestamp: number;
  rpm: number;
  cht_celsius: number;
  egt_celsius: number;
  oil_pressure_bar: number;
  oil_temp_celsius: number;
  vibration: number;
  fuel_flow: number;
  battery_voltage_v: number;
  injection_timing_deg: number;
  map_inhg: number;
  airspeed_kts: number;
  throttle_position: number;
  altitude_m: number;
  ambient_temp_celsius: number;
}

export interface FaultLabel {
  fault_type: string;
  onset_tick: number;
  severity: number;
}

export interface EngineControlState {
  throttle: number;
  altitude: number;
  ambient_temp: number;
  airspeed_kts: number;
  is_running: boolean;
}

export type ReadinessStatus = 'READY' | 'MONITOR' | 'MISSION HOLD';
export type SeverityLevel = 'healthy' | 'warning' | 'critical' | 'info';

export interface SubsystemStatus {
  id: string;
  name: string;
  health: number; // 0 to 100
  status: SeverityLevel;
  primaryMetric: string;
  value: number;
  unit: string;
  anomalyDetected: boolean;
  affectedByFault?: string;
}

export interface AIInferenceState {
  healthScore: number; // 0 to 100
  rulHours: number;
  predictedCondition: string;
  confidence: number; // 0 to 1 (or 0 to 100%)
  anomalyScore: number; // IsoForest decision function: positive is normal, negative is anomaly
  isAnomaly: boolean;
  primaryContributors: {
    feature: string;
    label: string;
    impact: number; // SHAP value magnitude
    value: string;
    direction: 'increasing_risk' | 'decreasing_risk' | 'neutral';
  }[];
}

export interface ActiveAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  subsystem: string;
  detectedAt: string;
  confidence: number;
  actionRequired?: string;
}

export interface MissionEvent {
  tick: number;
  timestamp: string;
  label: string;
  type: 'takeoff' | 'climb' | 'cruise' | 'fault_onset' | 'anomaly_detected' | 'operator_intervention' | 'critical_hold';
  description: string;
}
