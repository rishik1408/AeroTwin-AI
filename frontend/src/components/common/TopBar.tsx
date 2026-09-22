import React, { useState, useEffect } from 'react';
import { Activity, Radio, RotateCcw, AlertTriangle } from 'lucide-react';
import { ReadinessStatus } from '../../types/telemetry';
import { StatusBadge } from './StatusBadge';

interface TopBarProps {
  readiness: ReadinessStatus;
  isBackendConnected: boolean;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onReset: () => void;
  onTriggerFault: (type: string, severity: number, duration: number) => void;
  isReplayMode?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  readiness,
  isBackendConnected,
  demoMode,
  onToggleDemoMode,
  onReset,
  onTriggerFault,
  isReplayMode = false,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toISOString().substring(11, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-[rgba(255,255,255,0.08)] bg-[#141619] px-4 flex items-center justify-between select-none">
      {/* Left: Branding & Unit Identifier */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#1c2026] border border-[rgba(255,255,255,0.15)] flex items-center justify-center font-mono font-bold text-xs text-[#4C8DFF]">
            AT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-[#F5F5F3]">AEROTWIN</span>
              <span className="text-[10px] tracking-widest px-1.5 py-0.5 rounded bg-[#222529] text-[#969BA1] font-mono border border-[rgba(255,255,255,0.06)]">
                DT-01
              </span>
            </div>
            <div className="text-[10px] text-[#969BA1] tracking-tight">
              MALE UAV PISTON TWIN // ROTAX 912
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-6 w-[1px] bg-[rgba(255,255,255,0.08)]" />

        {/* Readiness Tag */}
        <StatusBadge status={readiness} size="md" />

        {/* Stream Status Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#181A1D] border border-[rgba(255,255,255,0.08)]">
          <span className={`w-2 h-2 rounded-full ${isReplayMode ? 'bg-[#4C8DFF]' : 'bg-[#38A169] animate-pulse-live'}`} />
          <span className="text-xs font-mono font-semibold tracking-wider text-[#F5F5F3]">
            {isReplayMode ? 'MISSION REPLAY' : 'LIVE TELEMETRY'}
          </span>
        </div>
      </div>

      {/* Center: System Status Summary */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-[#969BA1] font-mono">
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-[#4C8DFF]" />
          <span>CAN/MQTT:</span>
          <span className="text-[#F5F5F3]">10 Hz NOMINAL</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#38A169]" />
          <span>ESTIMATOR:</span>
          <span className="text-[#F5F5F3]">PHYSICS + AI HYBRID</span>
        </div>
      </div>

      {/* Right: Actions, Simulation Controls & Clock */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Fault Injection Button */}
        <div className="relative group">
          <button
            onClick={() => onTriggerFault('cooling_degradation', 0.85, 20)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded bg-[rgba(240,165,43,0.12)] border border-[rgba(240,165,43,0.3)] text-[#F0A52B] hover:bg-[rgba(240,165,43,0.2)] transition-colors"
            title="Inject progressive cooling system degradation fault"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">INJECT FAULT</span>
          </button>
        </div>

        {/* Reset Simulation Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-[#969BA1] hover:text-[#F5F5F3] rounded bg-[#181A1D] border border-[rgba(255,255,255,0.08)] hover:bg-[#222529] transition-colors"
          title="Reset engine state to clean baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">RESET</span>
        </button>

        {/* Backend / Demo Toggle */}
        <button
          onClick={onToggleDemoMode}
          className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
            isBackendConnected && !demoMode
              ? 'bg-[rgba(56,161,105,0.15)] border-[rgba(56,161,105,0.4)] text-[#38A169]'
              : 'bg-[#181A1D] border-[rgba(255,255,255,0.1)] text-[#969BA1]'
          }`}
          title={isBackendConnected ? 'Connected to local backend' : 'Running internal physics simulation'}
        >
          {isBackendConnected && !demoMode ? 'BACKEND: LIVE' : 'SIMULATION MODE'}
        </button>

        {/* UTC Clock */}
        <div className="px-2.5 py-1 rounded bg-[#101112] border border-[rgba(255,255,255,0.08)] font-metric text-xs text-[#F5F5F3]">
          {timeStr || '00:00:00 UTC'}
        </div>
      </div>
    </header>
  );
};
