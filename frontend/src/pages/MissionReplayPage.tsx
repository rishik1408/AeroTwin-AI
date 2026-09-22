import React, { useState } from 'react';
import { useMissionReplay } from '../hooks/useMissionReplay';
import { Engine3D } from '../components/digital-twin/Engine3D';
import { MetricCard } from '../components/common/MetricCard';
import { deriveSubsystems } from '../data/mockTelemetry';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Flag,
  AlertTriangle,
  History,
  Clock,
  Activity,
  Layers,
} from 'lucide-react';

export const MissionReplayPage: React.FC = () => {
  const {
    frames,
    currentTick,
    currentFrame,
    isPlaying,
    playbackSpeed,
    events,
    togglePlay,
    seek,
    setSpeed,
    reset,
  } = useMissionReplay();

  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);

  // Derive subsystems for the current replay frame
  const subsystems = deriveSubsystems(
    currentFrame.telemetry,
    currentFrame.activeFault ? [{ fault_type: currentFrame.activeFault, onset_tick: 60, severity: 0.85 }] : []
  );

  return (
    <div className="p-4 space-y-4 max-w-[1680px] mx-auto select-none">
      {/* Page Header */}
      <div className="pb-2 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#F5F5F3] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4C8DFF]" />
            Historical Mission Telemetry Replay &amp; Blackbox Review
          </h1>
          <p className="text-xs font-mono text-[#969BA1]">
            Tick-by-tick synchronous digital-twin state playback with event flags and AI diagnostic logs
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#969BA1]">
          <span>RECORDING:</span>
          <span className="text-[#F5F5F3] font-bold">MISSION_ALPHA_04 (120s)</span>
        </div>
      </div>

      {/* Main Scrubber & Playback Controls Bar */}
      <div className="card p-4 space-y-3 font-mono">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Controls: Play/Pause, Speed, Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded font-bold text-xs transition-colors ${
                isPlaying
                  ? 'bg-[rgba(240,165,43,0.2)] text-[#F0A52B] border border-[rgba(240,165,43,0.4)]'
                  : 'bg-[#4C8DFF] text-[#101112] hover:bg-[#3b75d6]'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            <button
              onClick={reset}
              className="p-1.5 rounded bg-[#181A1D] border border-[rgba(255,255,255,0.08)] text-[#969BA1] hover:text-[#F5F5F3] hover:bg-[#222529]"
              title="Rewind to start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Playback Speed Selectors */}
            <div className="flex items-center gap-1 bg-[#101112] p-1 rounded border border-[rgba(255,255,255,0.08)] text-xs">
              {([1, 2, 5] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 rounded ${
                    playbackSpeed === s
                      ? 'bg-[#222529] text-[#F5F5F3] font-bold'
                      : 'text-[#969BA1] hover:text-[#F5F5F3]'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Time & Frame Counter */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#4C8DFF]" />
              <span className="text-[#969BA1]">MISSION TIME:</span>
              <span className="font-metric font-bold text-sm text-[#F5F5F3]">{currentFrame.timeString}</span>
            </div>
            <div className="text-[#969BA1]">
              FRAME: <span className="font-bold text-[#F5F5F3] font-metric">{currentTick}</span> / {frames.length - 1}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#969BA1]">HEALTH:</span>
              <span
                className={`font-metric font-bold ${
                  currentFrame.health < 50
                    ? 'text-[#E53935]'
                    : currentFrame.health < 80
                    ? 'text-[#F0A52B]'
                    : 'text-[#38A169]'
                }`}
              >
                {currentFrame.health}%
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Slider with Event Flags */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={currentTick}
            onChange={(e) => seek(parseInt(e.target.value))}
            className="w-full accent-[#4C8DFF] bg-[#222529] cursor-pointer h-2 rounded"
          />

          {/* Event Flags along Timeline */}
          <div className="flex justify-between text-[10px] text-[#969BA1] pt-1">
            {events.map((ev) => (
              <button
                key={ev.tick}
                onClick={() => seek(ev.tick)}
                className={`hover:text-[#F5F5F3] flex items-center gap-0.5 transition-colors ${
                  Math.abs(currentTick - ev.tick) < 3 ? 'text-[#4C8DFF] font-bold' : ''
                }`}
                title={ev.description}
              >
                <Flag className="w-2.5 h-2.5" />
                <span>{ev.timestamp}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Frame Alert Callout */}
        {currentFrame.alertTitle && (
          <div className="p-2 rounded bg-[rgba(229,57,53,0.15)] border border-[rgba(229,57,53,0.3)] text-xs text-[#E53935] font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{currentFrame.alertTitle}</span>
          </div>
        )}
      </div>

      {/* Grid: 3D Twin View (7 Cols) + Replay Telemetry Metrics & Events (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Synchronized 3D Digital Twin */}
        <div className="lg:col-span-7 card p-3 flex flex-col">
          <div className="text-xs font-mono font-bold tracking-wider text-[#F5F5F3] uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4C8DFF]" />
            <span>Digital Twin Replay State (T+{currentFrame.timeString})</span>
          </div>
          <Engine3D
            telemetry={currentFrame.telemetry}
            subsystems={subsystems}
            selectedSubsystemId={selectedSubsystemId}
            onSelectSubsystem={setSelectedSubsystemId}
            height="440px"
          />
        </div>

        {/* Right: Key Telemetry Cards & Event Log */}
        <div className="lg:col-span-5 space-y-3">
          {/* Telemetry Snapshot at Current Replay Tick */}
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="RPM"
              value={currentFrame.telemetry.rpm}
              unit="RPM"
              nominalRange="5,000 - 5,500"
              status="healthy"
            />
            <MetricCard
              label="CHT (Head Temp)"
              value={currentFrame.telemetry.cht_celsius}
              unit="°C"
              nominalRange="80 - 120 °C"
              status={
                currentFrame.telemetry.cht_celsius > 130
                  ? 'critical'
                  : currentFrame.telemetry.cht_celsius > 118
                  ? 'warning'
                  : 'healthy'
              }
            />
            <MetricCard
              label="EGT (Exhaust)"
              value={currentFrame.telemetry.egt_celsius}
              unit="°C"
              nominalRange="650 - 800 °C"
              status={currentFrame.telemetry.egt_celsius > 800 ? 'warning' : 'healthy'}
            />
            <MetricCard
              label="Oil Pressure"
              value={currentFrame.telemetry.oil_pressure_bar}
              unit="bar"
              nominalRange="2.0 - 5.0 bar"
              status="healthy"
            />
          </div>

          {/* Chronological Mission Event Log */}
          <div className="card p-3 space-y-2 font-mono text-xs">
            <div className="text-[10px] text-[#969BA1] uppercase font-semibold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#4C8DFF]" />
              <span>Mission Flight Plan Events</span>
            </div>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {events.map((ev) => {
                const isPassed = currentTick >= ev.tick;
                const isCurrent = Math.abs(currentTick - ev.tick) < 5;

                return (
                  <div
                    key={ev.tick}
                    onClick={() => seek(ev.tick)}
                    className={`p-2 rounded card-inner cursor-pointer transition-all border ${
                      isCurrent
                        ? 'border-[#4C8DFF] bg-[#222529]'
                        : isPassed
                        ? 'border-[rgba(255,255,255,0.06)] opacity-70'
                        : 'border-transparent opacity-40 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="font-bold text-[#F5F5F3] flex items-center gap-1.5">
                        <span className="text-[#4C8DFF]">[{ev.timestamp}]</span>
                        <span>{ev.label}</span>
                      </div>
                      <span className="text-[9px] uppercase px-1 rounded bg-[#101112] text-[#969BA1]">
                        {ev.type}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#969BA1] mt-0.5">{ev.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
