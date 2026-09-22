import React, { useState } from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { MetricCard } from '../components/common/MetricCard';
import { AlertBanner } from '../components/common/AlertBanner';
import { Engine3D } from '../components/digital-twin/Engine3D';
import { EngineSchematic2D } from '../components/digital-twin/EngineSchematic2D';
import { TelemetryStreamChart } from '../components/charts/TelemetryStreamChart';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Gauge,
  Thermometer,
  Flame,
  Droplets,
  Activity,
  Fuel,
  Zap,
  Wind,
  Layers,
  BrainCircuit,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export const MissionControlPage: React.FC = () => {
  const {
    telemetry,
    history,
    subsystems,
    aiState,
    readiness,
    alerts,
    selectedSubsystemId,
    setSelectedSubsystemId,
  } = useTelemetry();

  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  // Helper to format RUL hours nicely
  const formatRul = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="p-4 space-y-4 max-w-[1680px] mx-auto">
      {/* ── Section G: Active Alert Banner ── */}
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {/* ── Section B: Mission Readiness & High-Level KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1: Large Prominent Readiness Status */}
        <div className="card p-3 flex flex-col justify-between">
          <div className="text-[10px] font-mono tracking-wider text-[#969BA1] uppercase font-semibold">
            Mission Readiness
          </div>
          <div className="my-1">
            <StatusBadge status={readiness} size="lg" showSubtext />
          </div>
          <div className="text-[10px] font-mono text-[#969BA1] pt-1 border-t border-[rgba(255,255,255,0.06)]">
            MODE: {aiState.predictedCondition}
          </div>
        </div>

        {/* KPI 2: Engine Health Index */}
        <div className="card p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-[#969BA1] uppercase font-semibold">
            <span>Engine Health Index</span>
            <BrainCircuit className="w-3.5 h-3.5 text-[#38A169]" />
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span
              className={`font-metric text-3xl font-extrabold ${
                aiState.healthScore < 50
                  ? 'text-[#E53935]'
                  : aiState.healthScore < 80
                  ? 'text-[#F0A52B]'
                  : 'text-[#38A169]'
              }`}
            >
              {aiState.healthScore}
            </span>
            <span className="text-xs font-mono text-[#969BA1]">/ 100</span>
          </div>
          <div className="h-1.5 w-full bg-[#222529] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                aiState.healthScore < 50
                  ? 'bg-[#E53935]'
                  : aiState.healthScore < 80
                  ? 'bg-[#F0A52B]'
                  : 'bg-[#38A169]'
              }`}
              style={{ width: `${aiState.healthScore}%` }}
            />
          </div>
        </div>

        {/* KPI 3: Remaining Useful Life (RUL) */}
        <div className="card p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-[#969BA1] uppercase font-semibold">
            <span>Predicted RUL</span>
            <Clock className="w-3.5 h-3.5 text-[#4C8DFF]" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="font-metric text-3xl font-extrabold text-[#F5F5F3]">
              {formatRul(aiState.rulHours)}
            </span>
            <span className="text-[10px] font-mono text-[#969BA1]">ESTIMATED</span>
          </div>
          <div className="text-[10px] font-mono text-[#969BA1] pt-1 border-t border-[rgba(255,255,255,0.06)] flex justify-between">
            <span>MODEL: LSTM-RUL</span>
            <span className="text-[#38A169]">{(aiState.confidence * 100).toFixed(0)}% CONF</span>
          </div>
        </div>

        {/* KPI 4: Shaft RPM */}
        <div className="card p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-[#969BA1] uppercase font-semibold">
            <span>Engine RPM</span>
            <Gauge className="w-3.5 h-3.5 text-[#4C8DFF]" />
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="font-metric text-3xl font-extrabold text-[#F5F5F3]">
              {telemetry.rpm}
            </span>
            <span className="text-xs font-mono text-[#969BA1]">RPM</span>
          </div>
          <div className="text-[10px] font-mono text-[#969BA1] pt-1 border-t border-[rgba(255,255,255,0.06)]">
            LIMIT: 5,800 RPM (MAX TAKEOFF)
          </div>
        </div>

        {/* KPI 5: Anomaly Probability */}
        <div className="card p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-[#969BA1] uppercase font-semibold">
            <span>Anomaly Status</span>
            <ShieldAlert className="w-3.5 h-3.5 text-[#F0A52B]" />
          </div>
          <div className="my-1">
            <span
              className={`font-mono font-bold text-lg ${
                aiState.isAnomaly ? 'text-[#E53935]' : 'text-[#38A169]'
              }`}
            >
              {aiState.isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL INLIER'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#969BA1] pt-1 border-t border-[rgba(255,255,255,0.06)] flex justify-between">
            <span>DECISION SCORE:</span>
            <span className="font-metric text-[#F5F5F3]">{aiState.anomalyScore.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ── Section C & F: Central Digital Twin + AI Prediction Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Central Digital Twin Model (8 Columns) */}
        <div className="lg:col-span-8 card p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-mono font-bold tracking-wider text-[#F5F5F3] uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4C8DFF]" />
              <span>Interactive Engine Digital Twin (Rotax 912 Architecture)</span>
            </div>
            {/* View Mode Toggle: 3D vs 2D */}
            <div className="flex items-center gap-1 p-0.5 rounded bg-[#101112] border border-[rgba(255,255,255,0.08)] font-mono text-[11px]">
              <button
                onClick={() => setViewMode('3d')}
                className={`px-2 py-0.5 rounded ${
                  viewMode === '3d'
                    ? 'bg-[#222529] text-[#F5F5F3] font-bold'
                    : 'text-[#969BA1] hover:text-[#F5F5F3]'
                }`}
              >
                3D TWIN
              </button>
              <button
                onClick={() => setViewMode('2d')}
                className={`px-2 py-0.5 rounded ${
                  viewMode === '2d'
                    ? 'bg-[#222529] text-[#F5F5F3] font-bold'
                    : 'text-[#969BA1] hover:text-[#F5F5F3]'
                }`}
              >
                2D SCHEMATIC
              </button>
            </div>
          </div>

          {/* Render 3D or 2D Schematic */}
          {viewMode === '3d' ? (
            <Engine3D
              telemetry={telemetry}
              subsystems={subsystems}
              selectedSubsystemId={selectedSubsystemId}
              onSelectSubsystem={setSelectedSubsystemId}
              height="380px"
            />
          ) : (
            <EngineSchematic2D
              subsystems={subsystems}
              selectedId={selectedSubsystemId}
              onSelect={(id) => setSelectedSubsystemId(id)}
              height="380px"
            />
          )}
        </div>

        {/* AI Diagnostics & Primary Contributors (4 Columns) */}
        <div className="lg:col-span-4 card p-3 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(255,255,255,0.06)]">
              <div className="text-xs font-mono font-bold tracking-wider text-[#F5F5F3] uppercase flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-[#38A169]" />
                <span>AI Diagnostics &amp; SHAP</span>
              </div>
              <span className="text-[10px] font-mono text-[#38A169] bg-[rgba(56,161,105,0.12)] px-1.5 py-0.2 rounded border border-[rgba(56,161,105,0.25)]">
                LIVE XAI
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="p-2 rounded bg-[#101112] border border-[rgba(255,255,255,0.06)] font-mono text-xs">
                <div className="text-[10px] text-[#969BA1] uppercase">Estimated Failure Mode</div>
                <div className="font-bold text-sm text-[#F5F5F3] mt-0.5">
                  {aiState.predictedCondition.replace(/_/g, ' ')}
                </div>
                <div className="text-[10px] text-[#969BA1] mt-1 flex justify-between">
                  <span>Confidence:</span>
                  <span className="font-metric font-bold text-[#F5F5F3]">
                    {(aiState.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Contributors Bars */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono tracking-wider text-[#969BA1] uppercase font-semibold">
                Primary Contributing Signals (SHAP)
              </div>
              <div className="space-y-1.5">
                {aiState.primaryContributors.map((c) => (
                  <div key={c.feature} className="space-y-0.5">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#F5F5F3]">{c.label}</span>
                      <span className="text-[#969BA1] font-metric">{c.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#222529] rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full ${
                          c.direction === 'increasing_risk' ? 'bg-[#E53935]' : 'bg-[#4C8DFF]'
                        }`}
                        style={{ width: `${Math.round(c.impact * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-[#969BA1] pt-2 border-t border-[rgba(255,255,255,0.06)] flex justify-between">
            <span>INFERENCE: 100ms CYCLIC</span>
            <span>PYTORCH + TREESHAP</span>
          </div>
        </div>
      </div>

      {/* ── Section D: Live Telemetry Grid (10 Parameters) ── */}
      <div>
        <div className="text-xs font-mono font-bold tracking-wider text-[#969BA1] uppercase mb-2">
          Engine Telemetry Matrix (Direct Rotax 912 Sensors)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <MetricCard
            label="Cylinder Temp (CHT)"
            value={telemetry.cht_celsius}
            unit="°C"
            nominalRange="80 - 120 °C"
            min={50}
            max={150}
            currentNum={telemetry.cht_celsius}
            status={telemetry.cht_celsius > 132 ? 'critical' : telemetry.cht_celsius > 120 ? 'warning' : 'healthy'}
            icon={<Thermometer className="w-3.5 h-3.5 text-[#F0A52B]" />}
          />

          <MetricCard
            label="Exhaust Temp (EGT)"
            value={telemetry.egt_celsius}
            unit="°C"
            nominalRange="650 - 800 °C"
            min={400}
            max={950}
            currentNum={telemetry.egt_celsius}
            status={telemetry.egt_celsius > 850 ? 'critical' : telemetry.egt_celsius > 800 ? 'warning' : 'healthy'}
            icon={<Flame className="w-3.5 h-3.5 text-[#E53935]" />}
          />

          <MetricCard
            label="Oil Pressure"
            value={telemetry.oil_pressure_bar}
            unit="bar"
            nominalRange="2.0 - 5.0 bar"
            min={0}
            max={7}
            currentNum={telemetry.oil_pressure_bar}
            status={telemetry.oil_pressure_bar < 1.4 ? 'critical' : telemetry.oil_pressure_bar < 2.0 ? 'warning' : 'healthy'}
            icon={<Droplets className="w-3.5 h-3.5 text-[#4C8DFF]" />}
          />

          <MetricCard
            label="Oil Temperature"
            value={telemetry.oil_temp_celsius}
            unit="°C"
            nominalRange="90 - 110 °C"
            min={60}
            max={140}
            currentNum={telemetry.oil_temp_celsius}
            status={telemetry.oil_temp_celsius > 128 ? 'critical' : telemetry.oil_temp_celsius > 110 ? 'warning' : 'healthy'}
            icon={<Thermometer className="w-3.5 h-3.5 text-[#38A169]" />}
          />

          <MetricCard
            label="Vibration (RMS)"
            value={telemetry.vibration}
            unit="g"
            nominalRange="< 0.05 g"
            min={0}
            max={0.3}
            currentNum={telemetry.vibration}
            status={telemetry.vibration > 0.18 ? 'critical' : telemetry.vibration > 0.08 ? 'warning' : 'healthy'}
            icon={<Activity className="w-3.5 h-3.5 text-[#F0A52B]" />}
          />

          <MetricCard
            label="Fuel Flow"
            value={telemetry.fuel_flow}
            unit="L/hr"
            nominalRange="15 - 18 L/hr"
            min={0}
            max={30}
            currentNum={telemetry.fuel_flow}
            status="healthy"
            icon={<Fuel className="w-3.5 h-3.5 text-[#969BA1]" />}
          />

          <MetricCard
            label="Electrical Bus"
            value={telemetry.battery_voltage_v}
            unit="V"
            nominalRange="13.8 - 14.2 V"
            min={9}
            max={16}
            currentNum={telemetry.battery_voltage_v}
            status={telemetry.battery_voltage_v < 11.5 ? 'critical' : telemetry.battery_voltage_v < 12.8 ? 'warning' : 'healthy'}
            icon={<Zap className="w-3.5 h-3.5 text-[#38A169]" />}
          />

          <MetricCard
            label="Manifold Press (MAP)"
            value={telemetry.map_inhg}
            unit="inHg"
            nominalRange="16 - 29.9 inHg"
            min={10}
            max={32}
            currentNum={telemetry.map_inhg}
            status="healthy"
            icon={<Gauge className="w-3.5 h-3.5 text-[#969BA1]" />}
          />

          <MetricCard
            label="Airspeed"
            value={telemetry.airspeed_kts}
            unit="kts"
            nominalRange="Cruise 80 - 100"
            min={0}
            max={140}
            currentNum={telemetry.airspeed_kts}
            status="info"
            icon={<Wind className="w-3.5 h-3.5 text-[#4C8DFF]" />}
          />

          <MetricCard
            label="Altitude / Temp"
            value={`${telemetry.altitude_m}m`}
            unit={`/ ${telemetry.ambient_temp_celsius}°C`}
            nominalRange="ICAO Troposphere"
            status="info"
            icon={<Layers className="w-3.5 h-3.5 text-[#4C8DFF]" />}
          />
        </div>
      </div>

      {/* ── Section E: Real-time Telemetry Charts ── */}
      <TelemetryStreamChart data={history} height={220} />
    </div>
  );
};
