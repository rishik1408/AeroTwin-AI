import React, { useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { Engine3D } from '../components/digital-twin/Engine3D';
import { EngineSchematic2D } from '../components/digital-twin/EngineSchematic2D';
import { SubsystemStatusList } from '../components/digital-twin/SubsystemStatusList';
import { ENGINE_COMPONENTS } from '../data/engineComponents';
import { Sliders, Activity, Thermometer, ShieldCheck, Play, Square } from 'lucide-react';

export const DigitalTwinPage: React.FC = () => {
  const {
    telemetry,
    subsystems,
    controls,
    updateControls,
    selectedSubsystemId,
    setSelectedSubsystemId,
  } = useTelemetry();

  const [viewType, setViewType] = useState<'3d' | '2d'>('3d');

  const selectedDef = ENGINE_COMPONENTS.find((c) => c.id === selectedSubsystemId);
  const selectedSub = subsystems.find((s) => s.id === selectedSubsystemId);

  return (
    <div className="p-4 space-y-4 max-w-[1680px] mx-auto select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#F5F5F3] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4C8DFF]" />
            Aero Piston Engine Virtual Twin Inspector
          </h1>
          <p className="text-xs font-mono text-[#969BA1]">
            Subsystem-level 3D CAD visualization &amp; thermal/vibrational state mapping (Rotax 912-iS)
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 rounded bg-[#181A1D] border border-[rgba(255,255,255,0.1)] font-mono text-xs">
          <button
            onClick={() => setViewType('3d')}
            className={`px-3 py-1 rounded transition-colors ${
              viewType === '3d'
                ? 'bg-[#222529] text-[#F5F5F3] font-bold border border-[rgba(255,255,255,0.1)]'
                : 'text-[#969BA1] hover:text-[#F5F5F3]'
            }`}
          >
            3D ISOMETRIC TWIN
          </button>
          <button
            onClick={() => setViewType('2d')}
            className={`px-3 py-1 rounded transition-colors ${
              viewType === '2d'
                ? 'bg-[#222529] text-[#F5F5F3] font-bold border border-[rgba(255,255,255,0.1)]'
                : 'text-[#969BA1] hover:text-[#F5F5F3]'
            }`}
          >
            2D CROSS-SECTION SCHEMATIC
          </button>
        </div>
      </div>

      {/* Main Grid: 3D Twin (8 Cols) + Subsystems & Parameter Controls (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 3D Engine Canvas (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="card p-3">
            {viewType === '3d' ? (
              <Engine3D
                telemetry={telemetry}
                subsystems={subsystems}
                selectedSubsystemId={selectedSubsystemId}
                onSelectSubsystem={setSelectedSubsystemId}
                height="520px"
              />
            ) : (
              <EngineSchematic2D
                subsystems={subsystems}
                selectedId={selectedSubsystemId}
                onSelect={(id) => setSelectedSubsystemId(id)}
                height="520px"
              />
            )}
          </div>

          {/* Subsystem Specifications Card */}
          {selectedDef && (
            <div className="card p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4C8DFF]" />
                  <span className="font-bold text-sm text-[#F5F5F3]">{selectedDef.name}</span>
                  <span className="text-[10px] text-[#969BA1] uppercase">({selectedDef.category})</span>
                </div>
                {selectedSub && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedSub.status === 'critical'
                        ? 'bg-[rgba(229,57,53,0.2)] text-[#E53935]'
                        : selectedSub.status === 'warning'
                        ? 'bg-[rgba(240,165,43,0.2)] text-[#F0A52B]'
                        : 'bg-[rgba(56,161,105,0.2)] text-[#38A169]'
                    }`}
                  >
                    HEALTH: {selectedSub.health}%
                  </span>
                )}
              </div>

              <p className="text-[#969BA1]">{selectedDef.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-[11px]">
                <div className="p-2 rounded bg-[#101112]">
                  <div className="text-[10px] text-[#969BA1]">Associated Sensors</div>
                  <div className="font-bold text-[#F5F5F3]">{selectedDef.telemetryKeys.join(', ')}</div>
                </div>
                <div className="p-2 rounded bg-[#101112]">
                  <div className="text-[10px] text-[#969BA1]">Nominal Range</div>
                  <div className="font-bold text-[#38A169]">{selectedDef.nominalRange}</div>
                </div>
                <div className="p-2 rounded bg-[#101112]">
                  <div className="text-[10px] text-[#969BA1]">Current Value</div>
                  <div className="font-bold text-[#4C8DFF] font-metric">
                    {selectedSub?.value} {selectedSub?.unit}
                  </div>
                </div>
                <div className="p-2 rounded bg-[#101112]">
                  <div className="text-[10px] text-[#969BA1]">State Condition</div>
                  <div className="font-bold text-[#F5F5F3]">
                    {selectedSub?.anomalyDetected ? '⚠️ ANOMALY' : 'NOMINAL'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Subsystem List & Closed-Loop Controls (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Subsystem Matrix List */}
          <SubsystemStatusList
            subsystems={subsystems}
            selectedId={selectedSubsystemId}
            onSelect={setSelectedSubsystemId}
          />

          {/* Closed-Loop Engine Feedback Controls */}
          <div className="card p-3 space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)]">
              <div className="text-xs font-bold text-[#F5F5F3] uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#F0A52B]" />
                <span>Closed-Loop Operator Controls</span>
              </div>
              <button
                onClick={() => updateControls({ is_running: !controls.is_running })}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  controls.is_running
                    ? 'bg-[rgba(229,57,53,0.2)] text-[#E53935] hover:bg-[rgba(229,57,53,0.3)]'
                    : 'bg-[rgba(56,161,105,0.2)] text-[#38A169] hover:bg-[rgba(56,161,105,0.3)]'
                }`}
              >
                {controls.is_running ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{controls.is_running ? 'SHUTDOWN' : 'START'}</span>
              </button>
            </div>

            {/* Throttle Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#969BA1]">Throttle Position:</span>
                <span className="font-bold font-metric text-[#F5F5F3]">{controls.throttle}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={controls.throttle}
                onChange={(e) => updateControls({ throttle: parseFloat(e.target.value) })}
                className="w-full accent-[#4C8DFF] bg-[#222529] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#969BA1]">
                <span>IDLE (0%)</span>
                <span>CRUISE (75%)</span>
                <span>MAX (100%)</span>
              </div>
            </div>

            {/* Altitude Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#969BA1]">Simulated Altitude:</span>
                <span className="font-bold font-metric text-[#F5F5F3]">{controls.altitude} m</span>
              </div>
              <input
                type="range"
                min={0}
                max={6000}
                step={50}
                value={controls.altitude}
                onChange={(e) => updateControls({ altitude: parseFloat(e.target.value) })}
                className="w-full accent-[#38A169] bg-[#222529] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#969BA1]">
                <span>SEA LEVEL (0m)</span>
                <span>CRUISE (2500m)</span>
                <span>CEILING (6000m)</span>
              </div>
            </div>

            {/* Airspeed Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#969BA1]">Airspeed (Ram Cooling):</span>
                <span className="font-bold font-metric text-[#F5F5F3]">{controls.airspeed_kts} kts</span>
              </div>
              <input
                type="range"
                min={0}
                max={120}
                value={controls.airspeed_kts}
                onChange={(e) => updateControls({ airspeed_kts: parseFloat(e.target.value) })}
                className="w-full accent-[#F0A52B] bg-[#222529] cursor-pointer"
              />
            </div>

            <div className="text-[10px] text-[#969BA1] pt-1 border-t border-[rgba(255,255,255,0.06)]">
              💡 Lowering throttle cools cylinder heads dynamically via closed-loop feedback.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
