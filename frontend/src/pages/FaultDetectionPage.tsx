import React, { useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { AlertOctagon, AlertTriangle, ShieldCheck, Flame, RotateCcw, Play } from 'lucide-react';

interface FaultTypeOption {
  type: string;
  name: string;
  subsystem: string;
  defaultSeverity: number;
  duration: number;
  description: string;
  indicators: string;
}

const FAULT_OPTIONS: FaultTypeOption[] = [
  {
    type: 'cooling_degradation',
    name: 'Cooling System Degradation',
    subsystem: 'Cooling Radiator & CHT',
    defaultSeverity: 0.85,
    duration: 20,
    description: 'Coolant micro-leak / radiator airflow blockage causing gradual thermal climb.',
    indicators: 'CHT climbs +40°C, EGT rises +120°C, Oil temp rises +20°C',
  },
  {
    type: 'oil_pressure_drop',
    name: 'Lubrication Pressure Loss',
    subsystem: 'Dry Sump Oil Pump',
    defaultSeverity: 0.75,
    duration: 15,
    description: 'Oil pump cavitation / line pressure failure starving crankshaft bearings.',
    indicators: 'Oil pressure drops below 1.5 bar, oil temperature elevates',
  },
  {
    type: 'vibration_growth',
    name: 'Bearing Fatigue & Mechanical Wear',
    subsystem: 'Crankcase Assembly',
    defaultSeverity: 0.8,
    duration: 25,
    description: 'Propeller balance degradation or main journal harmonic fatigue.',
    indicators: 'RMS vibration increases up to 0.28 g, Welch PSD >2Hz energy surges',
  },
  {
    type: 'misfire',
    name: 'Cylinder Ignition Misfire',
    subsystem: 'Ignition / Spark Plug',
    defaultSeverity: 0.65,
    duration: 15,
    description: 'Intermittent spark ignition loss causing cyclic RPM and fuel surge.',
    indicators: 'Oscillating RPM variations, fuel flow hunting ±15%',
  },
  {
    type: 'sensor_drift',
    name: 'CHT Thermocouple Sensor Drift',
    subsystem: 'Sensor Bus',
    defaultSeverity: 0.5,
    duration: 20,
    description: 'Sensor circuit calibration drift reporting erroneously elevated temperatures.',
    indicators: 'CHT artificially climbs 20% while EGT and oil temp remain normal',
  },
  {
    type: 'injector_abnormality',
    name: 'Clogged Fuel Injector',
    subsystem: 'Fuel Rail & Injectors',
    defaultSeverity: 0.7,
    duration: 18,
    description: 'Clogged electronic injector causing lean cylinder operation.',
    indicators: 'Fuel flow drops 40%, EGT drops on lean misfire, RPM decreases',
  },
  {
    type: 'combustion_instability',
    name: 'Erratic Combustion Timing',
    subsystem: 'Combustion Chamber',
    defaultSeverity: 0.75,
    duration: 20,
    description: 'Detonation or erratic flame front propagation.',
    indicators: 'EGT fluctuates ±80°C rapidly, CHT noise spikes',
  },
  {
    type: 'battery_alternator_fail',
    name: 'Alternator / Generator Failure',
    subsystem: 'Electrical Bus',
    defaultSeverity: 0.9,
    duration: 30,
    description: 'Internal generator rectifier fails, discharging UAV battery bus.',
    indicators: 'Voltage drops from 14.1V to 12.5V, then steadily drains to 9.0V',
  },
];

export const FaultDetectionPage: React.FC = () => {
  const { activeFaults, triggerFault, resetSimulation, telemetry, aiState } = useTelemetry();
  const [selectedSeverity, setSelectedSeverity] = useState(0.8);
  const [selectedDuration, setSelectedDuration] = useState(20);

  return (
    <div className="p-4 space-y-4 max-w-[1680px] mx-auto select-none">
      {/* Page Header */}
      <div className="pb-2 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#F5F5F3] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
            Fault Detection &amp; Degradation Diagnostics
          </h1>
          <p className="text-xs font-mono text-[#969BA1]">
            Active degradation tracking, threshold exceedances, and fault injection validation lab (faults.py)
          </p>
        </div>
        <button
          onClick={resetSimulation}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#181A1D] border border-[rgba(255,255,255,0.1)] text-xs font-mono text-[#969BA1] hover:text-[#F5F5F3] hover:bg-[#222529] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET FAULTS</span>
        </button>
      </div>

      {/* Active Faults & Diagnostics Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Active Degradation Events (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5F5F3] flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-[#E53935]" />
            <span>Active Degradation Events ({activeFaults.length})</span>
          </div>

          {activeFaults.length === 0 ? (
            <div className="card p-8 flex flex-col items-center justify-center text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-[#38A169]" />
              <div className="font-mono text-sm font-bold text-[#F5F5F3]">NO ACTIVE FAULTS DETECTED</div>
              <p className="font-mono text-xs text-[#969BA1] max-w-md">
                All 8 engine subsystems are operating within nominal thermodynamic limits. Use the Injection Matrix on the right to test degradation responses.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeFaults.map((f, i) => {
                const opt = FAULT_OPTIONS.find((o) => o.type === f.fault_type);
                const isCrit = f.severity > 0.6;

                return (
                  <div
                    key={`${f.fault_type}-${i}`}
                    className={`p-3.5 rounded-lg border font-mono text-xs space-y-2 ${
                      isCrit
                        ? 'bg-[rgba(229,57,53,0.1)] border-[rgba(229,57,53,0.4)]'
                        : 'bg-[rgba(240,165,43,0.1)] border-[rgba(240,165,43,0.4)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isCrit ? (
                          <AlertOctagon className="w-4 h-4 text-[#E53935]" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-[#F0A52B]" />
                        )}
                        <span className={`font-bold uppercase ${isCrit ? 'text-[#E53935]' : 'text-[#F0A52B]'}`}>
                          [{isCrit ? 'CRITICAL FAULT' : 'WARNING DEGRADATION'}] {opt?.name || f.fault_type}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#969BA1]">
                        Onset Tick #{f.onset_tick}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#F5F5F3]">{opt?.description}</div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)] text-[10px]">
                      <div>
                        <span className="text-[#969BA1]">Severity Scale:</span>
                        <div className="font-bold text-[#F5F5F3]">{(f.severity * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <span className="text-[#969BA1]">Affected Subsystem:</span>
                        <div className="font-bold text-[#F5F5F3]">{opt?.subsystem}</div>
                      </div>
                      <div>
                        <span className="text-[#969BA1]">Diagnostic Confidence:</span>
                        <div className="font-bold text-[#38A169]">{(aiState.confidence * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    <div className="pt-1 text-[10px] text-[#F0A52B]">
                      RECOMMENDED INSPECTION: {opt?.indicators}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Historical/Resolved Reference Log */}
          <div className="card p-3 space-y-2 font-mono text-xs">
            <div className="text-[10px] text-[#969BA1] uppercase font-semibold">
              Telemetry Threshold Reference Specs (Rotax 912 Data Contract)
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-[#101112]">
                <div className="text-[#969BA1]">Max CHT Limit</div>
                <div className="font-bold text-[#E53935]">135.0 °C</div>
              </div>
              <div className="p-2 rounded bg-[#101112]">
                <div className="text-[#969BA1]">Min Oil Pressure</div>
                <div className="font-bold text-[#E53935]">0.80 bar</div>
              </div>
              <div className="p-2 rounded bg-[#101112]">
                <div className="text-[#969BA1]">Max EGT Limit</div>
                <div className="font-bold text-[#E53935]">900.0 °C</div>
              </div>
              <div className="p-2 rounded bg-[#101112]">
                <div className="text-[#969BA1]">Max Takeoff RPM</div>
                <div className="font-bold text-[#F0A52B]">5,800 RPM</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Fault Injection Testing Matrix (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="card p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
              <div className="font-bold text-sm text-[#F5F5F3] uppercase flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#F0A52B]" />
                <span>Simulation Fault Injection Lab</span>
              </div>
              <span className="text-[10px] text-[#F0A52B] bg-[rgba(240,165,43,0.12)] px-1.5 py-0.5 rounded border border-[rgba(240,165,43,0.25)]">
                faults.py
              </span>
            </div>

            <p className="text-[#969BA1] text-[11px]">
              Inject continuous physical degradation into the digital twin to test real-time AI anomaly detection and RUL deterioration.
            </p>

            {/* Severity Slider */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#969BA1]">Injection Severity:</span>
                <span className="font-bold text-[#F5F5F3]">{(selectedSeverity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(parseFloat(e.target.value))}
                className="w-full accent-[#E53935] bg-[#222529] cursor-pointer"
              />
            </div>

            {/* Duration Slider */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-[#969BA1]">Evolution Duration:</span>
                <span className="font-bold text-[#F5F5F3]">{selectedDuration} Seconds</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                className="w-full accent-[#4C8DFF] bg-[#222529] cursor-pointer"
              />
            </div>

            {/* Injection Buttons Grid */}
            <div className="space-y-1.5 pt-2">
              <div className="text-[10px] text-[#969BA1] uppercase font-semibold">Select Failure Mode:</div>
              <div className="grid grid-cols-1 gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                {FAULT_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    onClick={() => triggerFault(opt.type, selectedSeverity, selectedDuration)}
                    className="p-2 rounded card-inner text-left hover:border-[rgba(255,255,255,0.2)] hover:bg-[#222529] transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#F5F5F3] group-hover:text-[#4C8DFF]">
                        {opt.name}
                      </div>
                      <div className="text-[10px] text-[#969BA1]">{opt.subsystem}</div>
                    </div>
                    <Play className="w-3.5 h-3.5 text-[#969BA1] group-hover:text-[#4C8DFF]" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
