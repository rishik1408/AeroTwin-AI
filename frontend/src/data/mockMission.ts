import { TelemetryData, MissionEvent } from '../types/telemetry';

export interface MissionReplayFrame {
  tick: number;
  timeString: string;
  telemetry: TelemetryData;
  health: number;
  rulHours: number;
  activeFault?: string;
  alertTitle?: string;
}

export const MISSION_EVENTS: MissionEvent[] = [
  { tick: 0, timestamp: '00:00', label: 'TAKEOFF ROLL', type: 'takeoff', description: 'Full throttle 5800 RPM climb initiation from runway' },
  { tick: 20, timestamp: '00:20', label: 'PASS 1000M AGL', type: 'climb', description: 'Engine operating nominal at continuous cruise rating' },
  { tick: 40, timestamp: '00:40', label: 'CRUISE LEVEL 2500M', type: 'cruise', description: 'Rotax 912 stabilized at 5200 RPM, CHT 98°C, Oil 3.8 bar' },
  { tick: 60, timestamp: '01:00', label: 'THERMAL DRIFT ONSET', type: 'fault_onset', description: 'Coolant jacket micro-leak: CHT begins uncommanded +1.2°C/s climb' },
  { tick: 80, timestamp: '01:20', label: 'AI ANOMALY DETECTED', type: 'anomaly_detected', description: 'Isolation Forest triggers warning: CHT crosses 118°C threshold' },
  { tick: 95, timestamp: '01:35', label: 'CRITICAL OVERHEAT', type: 'critical_hold', description: 'CHT reaches 132°C. RUL drops to 2.4 hrs. Mission Hold initiated' },
  { tick: 105, timestamp: '01:45', label: 'OPERATOR THROTTLE REDUCTION', type: 'operator_intervention', description: 'Operator trims throttle to 65%: engine temperature begins recovery' },
];

/**
 * Precomputes 120 ticks of historical mission replay frames
 */
export function generateMissionFrames(): MissionReplayFrame[] {
  const frames: MissionReplayFrame[] = [];
  const baseTimestamp = 1711100000;

  for (let tick = 0; tick <= 120; tick++) {
    const minutes = Math.floor(tick / 60);
    const seconds = tick % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    let rpm = 5200;
    let cht = 98.0;
    let egt = 710.0;
    let oilPress = 3.85;
    let oilTemp = 96.0;
    let vib = 0.024;
    let fuelFlow = 16.2;
    let throttle = 78.0;
    let altitude = 2450;
    let health = 98;
    let rul = 412;
    let activeFault: string | undefined;
    let alertTitle: string | undefined;

    // Phase 1: Takeoff & Climb (ticks 0-39)
    if (tick < 20) {
      throttle = 95.0;
      rpm = 5500 + Math.sin(tick) * 30;
      cht = 92.0 + tick * 0.4;
      altitude = 50 + tick * 60;
      fuelFlow = 24.0;
    } else if (tick < 40) {
      throttle = 82.0;
      rpm = 5300 + Math.cos(tick) * 25;
      cht = 96.0 + (tick - 20) * 0.15;
      altitude = 1250 + (tick - 20) * 60;
      fuelFlow = 18.0;
    } 
    // Phase 2: Stable Cruise (ticks 40-59)
    else if (tick < 60) {
      rpm = 5220 + Math.sin(tick * 0.5) * 20;
      cht = 98.5 + Math.cos(tick * 0.3) * 0.8;
      oilPress = 3.82 + Math.sin(tick * 0.2) * 0.04;
      vib = 0.025 + Math.sin(tick) * 0.003;
      health = 98;
    }
    // Phase 3: Fault onset (ticks 60-79)
    else if (tick < 80) {
      const p = (tick - 60) / 20;
      activeFault = 'cooling_degradation';
      cht = 99.0 + p * 19.0; // rises to 118°C
      egt = 712.0 + p * 45.0;
      oilTemp = 96.5 + p * 12.0;
      health = Math.round(98 - p * 30); // drops to 68
      rul = Math.round(412 - p * 350); // drops to ~60 hrs
      if (tick >= 75) {
        alertTitle = 'WARNING: CHT Trend Exceeds Normal Gradient';
      }
    }
    // Phase 4: Critical Anomaly (ticks 80-104)
    else if (tick < 105) {
      const p = (tick - 80) / 25;
      activeFault = 'cooling_degradation';
      cht = 118.0 + p * 16.0; // rises to 134°C
      egt = 757.0 + p * 60.0;
      oilTemp = 108.5 + p * 18.0;
      vib = 0.035 + p * 0.04;
      health = Math.round(68 - p * 48); // drops to 20
      rul = Math.max(1.8, +(40 - p * 38).toFixed(1));
      alertTitle = 'CRITICAL: Engine Overheat Imminent (134°C)';
    }
    // Phase 5: Operator Intervention & Cooling Down (ticks 105-120)
    else {
      const p = (tick - 105) / 15;
      throttle = 65.0;
      rpm = 4200 - p * 400;
      cht = 134.0 - p * 16.0; // cools back down to 118°C
      egt = 817.0 - p * 90.0;
      oilTemp = 126.5 - p * 10.0;
      health = Math.round(20 + p * 35); // recovers to 55
      rul = +(2.4 + p * 14).toFixed(1);
      alertTitle = 'RECOVERY: Throttle Trimmed — CHT Decreasing';
    }

    frames.push({
      tick,
      timeString,
      telemetry: {
        timestamp: baseTimestamp + tick,
        rpm: Math.round(rpm),
        cht_celsius: +cht.toFixed(1),
        egt_celsius: +egt.toFixed(1),
        oil_pressure_bar: +oilPress.toFixed(2),
        oil_temp_celsius: +oilTemp.toFixed(1),
        vibration: +vib.toFixed(4),
        fuel_flow: +fuelFlow.toFixed(1),
        battery_voltage_v: +(14.1 - (cht > 120 ? 0.4 : 0)).toFixed(2),
        injection_timing_deg: 26.0,
        map_inhg: +(26.8 * (throttle / 78.0)).toFixed(1),
        airspeed_kts: 84.0,
        throttle_position: +throttle.toFixed(1),
        altitude_m: altitude,
        ambient_temp_celsius: -0.9,
      },
      health,
      rulHours: rul,
      activeFault,
      alertTitle,
    });
  }

  return frames;
}
