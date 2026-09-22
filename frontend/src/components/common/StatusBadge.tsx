import React from 'react';
import { ReadinessStatus } from '../../types/telemetry';

interface StatusBadgeProps {
  status: ReadinessStatus;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showSubtext = false,
}) => {
  const styles = {
    READY: {
      bg: 'bg-[rgba(56,161,105,0.12)]',
      border: 'border-[rgba(56,161,105,0.35)]',
      text: 'text-[#38A169]',
      dot: 'bg-[#38A169]',
      sub: 'ALL PARAMETERS NOMINAL',
    },
    MONITOR: {
      bg: 'bg-[rgba(240,165,43,0.12)]',
      border: 'border-[rgba(240,165,43,0.4)]',
      text: 'text-[#F0A52B]',
      dot: 'bg-[#F0A52B]',
      sub: 'ANOMALY DETECTED // ELEVATED GRADIENT',
    },
    'MISSION HOLD': {
      bg: 'bg-[rgba(229,57,53,0.14)]',
      border: 'border-[rgba(229,57,53,0.45)]',
      text: 'text-[#E53935]',
      dot: 'bg-[#E53935]',
      sub: 'CRITICAL LIMIT EXCEEDED // ABORT FLIGHT',
    },
  }[status];

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <div className="flex flex-col">
      <div className={`inline-flex items-center gap-1.5 rounded font-mono font-bold tracking-wider border ${styles.bg} ${styles.border} ${styles.text} ${sizeClasses}`}>
        <span className={`w-2 h-2 rounded-full ${styles.dot} ${status === 'MISSION HOLD' ? 'animate-ping' : ''}`} />
        <span>{status}</span>
      </div>
      {showSubtext && (
        <span className="text-[10px] text-[#969BA1] font-mono mt-1 tracking-tight">
          {styles.sub}
        </span>
      )}
    </div>
  );
};
