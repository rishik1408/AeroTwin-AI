import { TelemetryData, AIInferenceState, SubsystemStatus, ReadinessStatus, FaultLabel } from '../types/telemetry';

export const HEALTHY_BASELINE: TelemetryData = {
  timestamp: Date.now() / 1000,
  rpm: 5240,
  cht_celsius: 98.4,
  egt_celsius: 712.0,
  oil_pressure_bar: 3.85,
  oil_temp_celsius: 96.2,
  vibration: 0.024,
  fuel_flow: 16.4,
  battery_voltage_v: 14.1,
  injection_timing_deg: 26.5,
  map_inhg: 26.8,
  airspeed_kts: 84.0,
  throttle_position: 78.0,
  altitude_m: 2450,
  ambient_temp_celsius: -0.9, // ICAO altitude temp
};

export const INITIAL_AI_STATE: AIInferenceState = {
  healthScore: 98,
  rulHours: 412.5,
  predictedCondition: 'NOMINAL_CRUISE',
  confidence: 0.98,
  anomalyScore: 0.84, // positive = inlier
  isAnomaly: false,
  primaryContributors: [
    { feature: 'cht_celsius', label: 'Cylinder Head Temp', impact: 0.04, value: '98.4 °C', direction: 'neutral' },
    { feature: 'oil_pressure_bar', label: 'Oil Pressure', impact: 0.03, value: '3.85 bar', direction: 'neutral' },
    { feature: 'vibration', label: 'Vibration RMS', impact: 0.02, value: '0.024 g', direction: 'neutral' },
    { feature: 'egt_celsius', label: 'Exhaust Gas Temp', impact: 0.02, value: '712 °C', direction: 'neutral' },
  ],
};

/**
 * Derives subsystem health based on current telemetry and active faults
 */
export function deriveSubsystems(telemetry: TelemetryData, activeFaults: FaultLabel[]): SubsystemStatus[] {
  const isOverheating = telemetry.cht_celsius > 120;
  const isCritOverheating = telemetry.cht_celsius > 132;
  const isOilLow = telemetry.oil_pressure_bar < 2.0;
  const isOilCrit = telemetry.oil_pressure_bar < 1.2;
  const isVibHigh = telemetry.vibration > 0.08;
  const isVibCrit = telemetry.vibration > 0.18;

  const coolingFault = activeFaults.find(f => f.fault_type === 'cooling_degradation');
  const oilFault = activeFaults.find(f => f.fault_type === 'oil_pressure_drop');
  const vibFault = activeFaults.find(f => f.fault_type === 'vibration_growth');
  const misfireFault = activeFaults.find(f => f.fault_type === 'misfire');

  return [
    {
      id: 'cylinders',
      name: 'Cylinder Heads',
      health: isCritOverheating ? 24 : isOverheating ? 65 : 98,
      status: isCritOverheating ? 'critical' : isOverheating ? 'warning' : 'healthy',
      primaryMetric: 'CHT',
      value: telemetry.cht_celsius,
      unit: '°C',
      anomalyDetected: isOverheating,
      affectedByFault: coolingFault?.fault_type,
    },
    {
      id: 'crankcase',
      name: 'Crankshaft / Bearings',
      health: isVibCrit ? 18 : isVibHigh ? 55 : 99,
      status: isVibCrit ? 'critical' : isVibHigh ? 'warning' : 'healthy',
      primaryMetric: 'VIB',
      value: telemetry.vibration,
      unit: 'g RMS',
      anomalyDetected: isVibHigh,
      affectedByFault: vibFault?.fault_type,
    },
    {
      id: 'cooling',
      name: 'Cooling Radiator',
      health: isCritOverheating ? 15 : isOverheating ? 45 : 95,
      status: isCritOverheating ? 'critical' : isOverheating ? 'warning' : 'healthy',
      primaryMetric: 'Heat Rejection',
      value: Math.round(100 - (telemetry.cht_celsius - 80) * 1.5),
      unit: '% eff',
      anomalyDetected: isOverheating,
      affectedByFault: coolingFault?.fault_type,
    },
    {
      id: 'lubrication',
      name: 'Oil Lubrication Circuit',
      health: isOilCrit ? 20 : isOilLow ? 60 : 96,
      status: isOilCrit ? 'critical' : isOilLow ? 'warning' : 'healthy',
      primaryMetric: 'Oil Press',
      value: telemetry.oil_pressure_bar,
      unit: 'bar',
      anomalyDetected: isOilLow,
      affectedByFault: oilFault?.fault_type,
    },
    {
      id: 'fuel',
      name: 'Fuel Delivery & Timing',
      health: misfireFault ? 42 : 97,
      status: misfireFault ? 'warning' : 'healthy',
      primaryMetric: 'Fuel Flow',
      value: telemetry.fuel_flow,
      unit: 'L/hr',
      anomalyDetected: !!misfireFault,
      affectedByFault: misfireFault?.fault_type,
    },
    {
      id: 'exhaust',
      name: 'Exhaust Manifold (EGT)',
      health: telemetry.egt_celsius > 850 ? 30 : telemetry.egt_celsius > 800 ? 68 : 99,
      status: telemetry.egt_celsius > 850 ? 'critical' : telemetry.egt_celsius > 800 ? 'warning' : 'healthy',
      primaryMetric: 'EGT',
      value: telemetry.egt_celsius,
      unit: '°C',
      anomalyDetected: telemetry.egt_celsius > 800,
    },
    {
      id: 'intake',
      name: 'Air Intake & MAP',
      health: 98,
      status: 'healthy',
      primaryMetric: 'MAP',
      value: telemetry.map_inhg,
      unit: 'inHg',
      anomalyDetected: false,
    },
    {
      id: 'electrical',
      name: 'Alternator Bus',
      health: telemetry.battery_voltage_v < 11.5 ? 25 : telemetry.battery_voltage_v < 12.8 ? 60 : 99,
      status: telemetry.battery_voltage_v < 11.5 ? 'critical' : telemetry.battery_voltage_v < 12.8 ? 'warning' : 'healthy',
      primaryMetric: 'Bus Voltage',
      value: telemetry.battery_voltage_v,
      unit: 'V',
      anomalyDetected: telemetry.battery_voltage_v < 12.8,
    },
  ];
}

/**
 * Computes AI diagnostics and SHAP contributions from current telemetry
 */
export function deriveAIDiagnostics(telemetry: TelemetryData, activeFaults: FaultLabel[]): AIInferenceState {
  let healthScore = 98;
  let rulHours = 412;
  let predictedCondition = 'NOMINAL_CRUISE';
  let confidence = 0.96;
  let anomalyScore = 0.82;
  let isAnomaly = false;

  const coolingFault = activeFaults.find(f => f.fault_type === 'cooling_degradation');
  const oilFault = activeFaults.find(f => f.fault_type === 'oil_pressure_drop');
  const vibFault = activeFaults.find(f => f.fault_type === 'vibration_growth');

  const contributors: AIInferenceState['primaryContributors'] = [];

  if (coolingFault || telemetry.cht_celsius > 115) {
    const sev = coolingFault?.severity || (telemetry.cht_celsius - 110) / 25;
    healthScore -= Math.round(sev * 55);
    rulHours = Math.max(1.8, Math.round((1 - sev) * 45));
    predictedCondition = sev > 0.6 ? 'CRITICAL_COOLING_FAILURE' : 'THERMAL_DEGRADATION';
    confidence = Math.min(0.99, 0.82 + sev * 0.16);
    anomalyScore = -0.45 - sev * 0.4;
    isAnomaly = true;

    contributors.push({
      feature: 'cht_celsius',
      label: 'Cylinder Head Temp',
      impact: Math.min(0.92, 0.45 + sev * 0.4),
      value: `${telemetry.cht_celsius.toFixed(1)} °C`,
      direction: 'increasing_risk',
    });
    contributors.push({
      feature: 'egt_celsius',
      label: 'Exhaust Gas Temp',
      impact: Math.min(0.65, 0.25 + sev * 0.3),
      value: `${telemetry.egt_celsius.toFixed(1)} °C`,
      direction: 'increasing_risk',
    });
  }

  if (oilFault || telemetry.oil_pressure_bar < 2.2) {
    const sev = oilFault?.severity || (2.5 - telemetry.oil_pressure_bar) / 1.5;
    healthScore -= Math.round(sev * 60);
    rulHours = Math.max(0.5, Math.round((1 - sev) * 20));
    predictedCondition = sev > 0.6 ? 'LUBRICATION_FAILURE_IMMINENT' : 'OIL_PRESSURE_SAG';
    confidence = Math.min(0.99, 0.85 + sev * 0.14);
    anomalyScore = -0.6 - sev * 0.3;
    isAnomaly = true;

    contributors.push({
      feature: 'oil_pressure_bar',
      label: 'Oil Pressure Delta',
      impact: Math.min(0.95, 0.5 + sev * 0.4),
      value: `${telemetry.oil_pressure_bar.toFixed(2)} bar`,
      direction: 'increasing_risk',
    });
  }

  if (vibFault || telemetry.vibration > 0.08) {
    const sev = vibFault?.severity || telemetry.vibration * 4;
    healthScore -= Math.round(sev * 50);
    rulHours = Math.max(3.2, Math.round((1 - sev) * 60));
    predictedCondition = 'BEARING_WEAR_HARMONIC';
    confidence = Math.min(0.98, 0.8 + sev * 0.15);
    anomalyScore = -0.5 - sev * 0.35;
    isAnomaly = true;

    contributors.push({
      feature: 'vibration',
      label: 'Vibration FFT 2Hz+ Energy',
      impact: Math.min(0.9, 0.4 + sev * 0.45),
      value: `${telemetry.vibration.toFixed(3)} g RMS`,
      direction: 'increasing_risk',
    });
  }

  // If no faults, fill with baseline contributors
  if (contributors.length === 0) {
    contributors.push(
      { feature: 'cht_celsius', label: 'Cylinder Head Temp', impact: 0.06, value: `${telemetry.cht_celsius.toFixed(1)} °C`, direction: 'neutral' },
      { feature: 'oil_pressure_bar', label: 'Oil Pressure', impact: 0.04, value: `${telemetry.oil_pressure_bar.toFixed(2)} bar`, direction: 'neutral' },
      { feature: 'vibration', label: 'Vibration RMS', impact: 0.03, value: `${telemetry.vibration.toFixed(3)} g`, direction: 'neutral' },
      { feature: 'rpm', label: 'RPM Stability', impact: 0.02, value: `${Math.round(telemetry.rpm)}`, direction: 'neutral' }
    );
  }

  return {
    healthScore: Math.max(8, Math.min(100, healthScore)),
    rulHours,
    predictedCondition,
    confidence,
    anomalyScore,
    isAnomaly,
    primaryContributors: contributors.sort((a, b) => b.impact - a.impact),
  };
}

export function deriveReadiness(aiState: AIInferenceState, telemetry: TelemetryData): ReadinessStatus {
  if (aiState.healthScore < 40 || telemetry.cht_celsius > 132 || telemetry.oil_pressure_bar < 1.4) {
    return 'MISSION HOLD';
  }
  if (aiState.healthScore < 75 || aiState.isAnomaly || telemetry.cht_celsius > 118) {
    return 'MONITOR';
  }
  return 'READY';
}
