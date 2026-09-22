import React from 'react';
import { SeverityLevel } from '../../types/telemetry';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit: string;
  nominalRange: string;
  status: SeverityLevel;
  min?: number;
  max?: number;
  currentNum?: number;
  icon?: React.ReactNode;
  subtext?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  nominalRange,
  status,
  min = 0,
  max = 100,
  currentNum,
  icon,
  subtext,
  onClick,
  isSelected = false,
}) => {
  const statusColors = {
    healthy: {
      text: 'text-[#38A169]',
      bg: 'bg-[rgba(56,161,105,0.08)]',
      border: 'border-[rgba(56,161,105,0.25)]',
      bar: 'bg-[#38A169]',
      badge: 'NOMINAL',
    },
    warning: {
      text: 'text-[#F0A52B]',
      bg: 'bg-[rgba(240,165,43,0.1)]',
      border: 'border-[rgba(240,165,43,0.35)]',
      bar: 'bg-[#F0A52B]',
      badge: 'ELEVATED',
    },
    critical: {
      text: 'text-[#E53935]',
      bg: 'bg-[rgba(229,57,53,0.12)]',
      border: 'border-[rgba(229,57,53,0.45)]',
      bar: 'bg-[#E53935]',
      badge: 'CRITICAL',
    },
    info: {
      text: 'text-[#4C8DFF]',
      bg: 'bg-[rgba(76,141,255,0.08)]',
      border: 'border-[rgba(76,141,255,0.25)]',
      bar: 'bg-[#4C8DFF]',
      badge: 'INFO',
    },
  }[status];

  // Percentage for envelope gauge bar
  const num = currentNum !== undefined ? currentNum : typeof value === 'number' ? value : 50;
  const pct = Math.max(0, Math.min(100, ((num - min) / (max - min)) * 100));

  return (
    <div
      onClick={onClick}
      className={`card p-3 flex flex-col justify-between transition-all ${
        onClick ? 'cursor-pointer hover:border-[rgba(255,255,255,0.2)]' : ''
      } ${isSelected ? 'ring-1 ring-[#4C8DFF] border-[#4C8DFF]' : ''}`}
    >
      {/* Header with Label and Status Badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-[#969BA1]">{icon}</span>}
          <span className="text-[11px] font-mono tracking-wider text-[#969BA1] uppercase font-semibold">
            {label}
          </span>
        </div>
        <span
          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${statusColors.bg} ${statusColors.border} ${statusColors.text}`}
        >
          {statusColors.badge}
        </span>
      </div>

      {/* Main Value Readout */}
      <div className="flex items-baseline justify-between my-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-metric text-2xl font-bold text-[#F5F5F3]">
            {value}
          </span>
          <span className="text-xs font-mono text-[#969BA1] font-medium">
            {unit}
          </span>
        </div>
      </div>

      {/* Envelope Progress Bar */}
      <div className="mt-1">
        <div className="h-1.5 w-full bg-[#222529] rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all duration-500 rounded-full ${statusColors.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Footer Range Specs */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[#969BA1] mt-2 pt-1.5 border-t border-[rgba(255,255,255,0.05)]">
        <span>NOM: {nominalRange}</span>
        {subtext && <span className="text-[#F5F5F3] font-semibold">{subtext}</span>}
      </div>
    </div>
  );
};
