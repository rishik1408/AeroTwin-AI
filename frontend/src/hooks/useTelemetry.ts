import { useState, useEffect, useCallback, useRef } from 'react';
import {
  TelemetryData,
  SubsystemStatus,
  AIInferenceState,
  ReadinessStatus,
  ActiveAlert,
  EngineControlState,
  FaultLabel,
} from '../types/telemetry';
import { HEALTHY_BASELINE, INITIAL_AI_STATE, deriveSubsystems, deriveAIDiagnostics, deriveReadiness } from '../data/mockTelemetry';
import { telemetryService } from '../services/telemetryService';

export interface TelemetryHistoryPoint {
  time: string;
  rpm: number;
  cht: number;
  egt: number;
  oilPress: number;
  oilTemp: number;
  vib: number;
  health: number;
}

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData>(HEALTHY_BASELINE);
  const [activeFaults, setActiveFaults] = useState<FaultLabel[]>([]);
  const [controls, setControls] = useState<EngineControlState>({
    throttle: 78.0,
    altitude: 2450,
    ambient_temp: -0.9,
    airspeed_kts: 84.0,
    is_running: true,
  });
  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);
  const [subsystems, setSubsystems] = useState<SubsystemStatus[]>([]);
  const [aiState, setAiState] = useState<AIInferenceState>(INITIAL_AI_STATE);
  const [readiness, setReadiness] = useState<ReadinessStatus>('READY');
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [demoMode, setDemoModeState] = useState(true);
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);

  const historyRef = useRef<TelemetryHistoryPoint[]>([]);

  const step = useCallback(async () => {
    const res = await telemetryService.fetchTelemetry();
    const t = res.telemetry;
    const fl = res.labels;

    setTelemetry(t);
    setActiveFaults(fl);
    setControls(res.controls);
    setIsBackendConnected(res.isBackendConnected);

    const subs = deriveSubsystems(t, fl);
    setSubsystems(subs);

    const ai = deriveAIDiagnostics(t, fl);
    setAiState(ai);

    const rdy = deriveReadiness(ai, t);
    setReadiness(rdy);

    // Active alert synthesis
    const newAlerts: ActiveAlert[] = [];
    if (rdy === 'MISSION HOLD') {
      newAlerts.push({
        id: 'alt-hold',
        severity: 'critical',
        title: 'MISSION HOLD DECLARED',
        description: `Critical threshold breached: CHT ${t.cht_celsius}°C / Oil ${t.oil_pressure_bar} bar. RUL depleted to ${ai.rulHours}h.`,
        subsystem: 'Propulsion Main',
        detectedAt: new Date().toLocaleTimeString(),
        confidence: 0.98,
        actionRequired: 'Execute emergency descent or reduce throttle to idle immediately.',
      });
    } else if (rdy === 'MONITOR') {
      newAlerts.push({
        id: 'alt-warn',
        severity: 'warning',
        title: 'SYSTEM HEALTH DEGRADED',
        description: `Anomaly detected by Isolation Forest. Health index dropped to ${ai.healthScore}%. Primary driver: ${ai.primaryContributors[0]?.label || 'Thermal Drift'}.`,
        subsystem: 'AI Health Guard',
        detectedAt: new Date().toLocaleTimeString(),
        confidence: ai.confidence,
        actionRequired: 'Monitor CHT/Oil trend. Prepare for power setting adjustment.',
      });
    }

    if (t.vibration > 0.09) {
      newAlerts.push({
        id: 'alt-vib',
        severity: t.vibration > 0.18 ? 'critical' : 'warning',
        title: 'MECHANICAL HARMONIC ANOMALY',
        description: `High frequency vibration peak at ${t.vibration.toFixed(3)} g RMS (>2Hz PSD energy elevated).`,
        subsystem: 'Rotating Assembly',
        detectedAt: new Date().toLocaleTimeString(),
        confidence: 0.94,
        actionRequired: 'Check propeller balancing and crankshaft main journal bearings.',
      });
    }

    setAlerts(newAlerts);

    // Append to rolling history (max 60 points)
    const nowStr = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    const newPoint: TelemetryHistoryPoint = {
      time: nowStr,
      rpm: t.rpm,
      cht: t.cht_celsius,
      egt: t.egt_celsius,
      oilPress: t.oil_pressure_bar,
      oilTemp: t.oil_temp_celsius,
      vib: t.vibration,
      health: ai.healthScore,
    };

    historyRef.current = [...historyRef.current.slice(-59), newPoint];
    setHistory([...historyRef.current]);
  }, []);

  useEffect(() => {
    // Initial step
    step();
    const timer = setInterval(step, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const toggleDemoMode = () => {
    const next = !demoMode;
    telemetryService.setDemoMode(next);
    setDemoModeState(next);
  };

  const updateControls = async (newControls: Partial<EngineControlState>) => {
    await telemetryService.updateControls(newControls);
    step();
  };

  const triggerFault = async (type: string, severity: number, duration: number) => {
    await telemetryService.triggerFault(type, severity, duration);
    step();
  };

  const resetSimulation = async () => {
    await telemetryService.resetSimulation();
    historyRef.current = [];
    setHistory([]);
    step();
  };

  return {
    telemetry,
    activeFaults,
    controls,
    history,
    subsystems,
    aiState,
    readiness,
    alerts,
    isBackendConnected,
    demoMode,
    selectedSubsystemId,
    setSelectedSubsystemId,
    toggleDemoMode,
    updateControls,
    triggerFault,
    resetSimulation,
  };
}
