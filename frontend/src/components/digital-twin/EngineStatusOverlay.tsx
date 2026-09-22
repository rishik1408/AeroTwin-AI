import React from 'react';
import { SubsystemStatus, TelemetryData } from '../../types/telemetry';
import { X, Cpu, Thermometer, Activity } from 'lucide-react';

interface EngineStatusOverlayProps {
  selectedSubsystem: SubsystemStatus | null;
  onClearSelection: () => void;
  telemetry: TelemetryData;
}

export const EngineStatusOverlay: React.FC<EngineStatusOverlayProps> = ({
  selectedSubsystem,
  onClearSelection,
  telemetry,
}) => {
  if (!selectedSubsystem) {
    return (
      <div className="absolute top-3 left-3 z-10 p-2.5 rounded bg-[#141619]/85 backdrop-blur-md border border-[rgba(255,255,255,0.08)] font-mono text-[11px] text-[#969BA1] pointer-events-none select-none max-w-xs">
        <div className="text-[10px] tracking-wider text-[#F5F5F3] font-bold uppercase mb-1 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-[#4C8DFF]" />
          <span>ROTAX 912 DIGITAL TWIN</span>
        </div>
        <div>Click any engine component to inspect subsystem telemetry & health.</div>
      </div>
    );
  }

  const statusBadgeColor = {
    healthy: 'bg-[rgba(56,161,105,0.15)] text-[#38A169] border-[rgba(56,161,105,0.3)]',
    warning: 'bg-[rgba(240,165,43,0.15)] text-[#F0A52B] border-[rgba(240,165,43,0.3)]',
    critical: 'bg-[rgba(229,57,53,0.18)] text-[#E53935] border-[rgba(229,57,53,0.4)]',
    info: 'bg-[rgba(76,141,255,0.15)] text-[#4C8DFF] border-[rgba(76,141,255,0.3)]',
  }[selectedSubsystem.status];

  return (
    <div className="absolute top-3 left-3 z-10 p-3 rounded-lg bg-[#141619]/90 backdrop-blur-md border border-[rgba(255,255,255,0.12)] font-mono text-xs text-[#F5F5F3] select-none shadow-xl min-w-[260px] max-w-xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="text-[10px] text-[#969BA1] tracking-wider uppercase">Selected Subsystem</div>
          <div className="font-bold text-sm text-[#F5F5F3]">{selectedSubsystem.name}</div>
        </div>
        <button
          onClick={onClearSelection}
          className="p-1 rounded hover:bg-[#222529] text-[#969BA1] hover:text-[#F5F5F3]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[#969BA1]">Health Index:</span>
          <span className="font-bold font-metric">{selectedSubsystem.health}%</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#969BA1]">Operational Status:</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeColor}`}>
            {selectedSubsystem.status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#969BA1]">Primary Telemetry:</span>
          <span className="font-bold font-metric text-[#4C8DFF]">
            {selectedSubsystem.value} {selectedSubsystem.unit}
          </span>
        </div>

        {selectedSubsystem.affectedByFault && (
          <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-[10px] text-[#E53935]">
            ⚠️ ACTIVE DEGRADATION: {selectedSubsystem.affectedByFault.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};
