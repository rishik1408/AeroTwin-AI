import React from 'react';
import { AlertTriangle, AlertOctagon, Info, ChevronRight } from 'lucide-react';
import { ActiveAlert } from '../../types/telemetry';

interface AlertBannerProps {
  alerts: ActiveAlert[];
  onSelectAlert?: (alert: ActiveAlert) => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onSelectAlert }) => {
  if (alerts.length === 0) return null;

  const topAlert = alerts[0];
  const isCritical = topAlert.severity === 'critical';

  return (
    <div
      className={`px-4 py-2.5 rounded-lg border flex items-center justify-between transition-all ${
        isCritical
          ? 'bg-[rgba(229,57,53,0.12)] border-[rgba(229,57,53,0.4)] text-[#F5F5F3]'
          : 'bg-[rgba(240,165,43,0.12)] border-[rgba(240,165,43,0.4)] text-[#F5F5F3]'
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div
          className={`p-1.5 rounded ${
            isCritical ? 'bg-[rgba(229,57,53,0.25)] text-[#E53935]' : 'bg-[rgba(240,165,43,0.25)] text-[#F0A52B]'
          }`}
        >
          {isCritical ? <AlertOctagon className="w-5 h-5 animate-pulse" /> : <AlertTriangle className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-mono font-bold tracking-wider uppercase ${
                isCritical ? 'text-[#E53935]' : 'text-[#F0A52B]'
              }`}
            >
              [{topAlert.severity.toUpperCase()}] {topAlert.title}
            </span>
            <span className="text-[10px] font-mono text-[#969BA1]">
              // Subsystem: {topAlert.subsystem} ({topAlert.detectedAt})
            </span>
          </div>
          <div className="text-xs text-[#F5F5F3] truncate max-w-3xl">
            {topAlert.description}
          </div>
        </div>
      </div>

      {topAlert.actionRequired && (
        <div className="hidden md:flex items-center gap-2 pl-4 text-xs font-mono text-[#969BA1] shrink-0">
          <span className="text-[#F0A52B] font-semibold">ACTION:</span>
          <span>{topAlert.actionRequired}</span>
        </div>
      )}
    </div>
  );
};
