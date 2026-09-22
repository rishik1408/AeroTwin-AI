import React from 'react';
import { SubsystemStatus } from '../../types/telemetry';

interface EngineSchematic2DProps {
  subsystems: SubsystemStatus[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  height?: string;
}

export const EngineSchematic2D: React.FC<EngineSchematic2DProps> = ({
  subsystems,
  selectedId,
  onSelect,
  height = '420px',
}) => {
  const getSub = (id: string) => subsystems.find((s) => s.id === id);

  const getSubColor = (id: string) => {
    const s = getSub(id)?.status;
    if (s === 'critical') return '#e53935';
    if (s === 'warning') return '#f0a52b';
    return '#38a169';
  };

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden bg-[#0d0f12] border border-[rgba(255,255,255,0.08)] flex items-center justify-center p-4 select-none"
      style={{ height }}
    >
      <svg viewBox="0 0 800 480" className="w-full h-full max-h-[420px]">
        {/* Background Grid Lines */}
        <defs>
          <pattern id="tech-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="800" height="480" fill="url(#tech-grid)" />

        {/* 1. Crankcase Center Block */}
        <g
          onClick={() => onSelect('crankcase')}
          className="cursor-pointer transition-all hover:opacity-80"
        >
          <rect
            x="310"
            y="170"
            width="180"
            height="140"
            rx="8"
            fill="#181a1d"
            stroke={selectedId === 'crankcase' ? '#4C8DFF' : getSubColor('crankcase')}
            strokeWidth={selectedId === 'crankcase' ? '3' : '2'}
          />
          <text x="400" y="235" textAnchor="middle" fill="#F5F5F3" fontSize="13" fontFamily="monospace" fontWeight="bold">
            CRANKCASE / GEARBOX
          </text>
          <text x="400" y="255" textAnchor="middle" fill="#969BA1" fontSize="10" fontFamily="monospace">
            {getSub('crankcase')?.value} {getSub('crankcase')?.unit}
          </text>
        </g>

        {/* 2. Left Opposed Cylinders (1 & 2) */}
        <g
          onClick={() => onSelect('cylinders')}
          className="cursor-pointer transition-all hover:opacity-80"
        >
          <rect
            x="140"
            y="155"
            width="150"
            height="75"
            rx="6"
            fill="#1c2026"
            stroke={selectedId === 'cylinders' ? '#4C8DFF' : getSubColor('cylinders')}
            strokeWidth={selectedId === 'cylinders' ? '3' : '2'}
          />
          <text x="215" y="190" textAnchor="middle" fill="#F5F5F3" fontSize="12" fontFamily="monospace" fontWeight="bold">
            CYLINDERS 1 & 2
          </text>
          <text x="215" y="210" textAnchor="middle" fill={getSubColor('cylinders')} fontSize="10" fontFamily="monospace">
            CHT: {getSub('cylinders')?.value} °C
          </text>

          {/* Cooling Fins */}
          <line x1="160" y1="145" x2="160" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="180" y1="145" x2="180" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="200" y1="145" x2="200" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="220" y1="145" x2="220" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="240" y1="145" x2="240" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="260" y1="145" x2="260" y2="155" stroke="#969BA1" strokeWidth="2" />
        </g>

        {/* 3. Right Opposed Cylinders (3 & 4) */}
        <g
          onClick={() => onSelect('cylinders')}
          className="cursor-pointer transition-all hover:opacity-80"
        >
          <rect
            x="510"
            y="155"
            width="150"
            height="75"
            rx="6"
            fill="#1c2026"
            stroke={selectedId === 'cylinders' ? '#4C8DFF' : getSubColor('cylinders')}
            strokeWidth={selectedId === 'cylinders' ? '3' : '2'}
          />
          <text x="585" y="190" textAnchor="middle" fill="#F5F5F3" fontSize="12" fontFamily="monospace" fontWeight="bold">
            CYLINDERS 3 & 4
          </text>
          <text x="585" y="210" textAnchor="middle" fill={getSubColor('cylinders')} fontSize="10" fontFamily="monospace">
            CHT: {getSub('cylinders')?.value} °C
          </text>

          {/* Cooling Fins */}
          <line x1="530" y1="145" x2="530" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="550" y1="145" x2="550" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="570" y1="145" x2="570" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="590" y1="145" x2="590" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="610" y1="145" x2="610" y2="155" stroke="#969BA1" strokeWidth="2" />
          <line x1="630" y1="145" x2="630" y2="155" stroke="#969BA1" strokeWidth="2" />
        </g>

        {/* 4. Top Cooling Radiator */}
        <g
          onClick={() => onSelect('cooling')}
          className="cursor-pointer transition-all hover:opacity-80"
        >
          <rect
            x="290"
            y="65"
            width="220"
            height="65"
            rx="6"
            fill="#1c2026"
            stroke={selectedId === 'cooling' ? '#4C8DFF' : getSubColor('cooling')}
            strokeWidth={selectedId === 'cooling' ? '3' : '2'}
          />
          <text x="400" y="98" textAnchor="middle" fill="#F5F5F3" fontSize="12" fontFamily="monospace" fontWeight="bold">
            COOLING RADIATOR
          </text>
          <text x="400" y="116" textAnchor="middle" fill={getSubColor('cooling')} fontSize="10" fontFamily="monospace">
            EFFICIENCY: {getSub('cooling')?.value}%
          </text>
          {/* Coolant line to engine */}
          <path d="M 400 130 L 400 170" stroke={getSubColor('cooling')} strokeWidth="2" strokeDasharray="4 2" />
        </g>

        {/* 5. Bottom Lubrication & Oil Sump */}
        <g
          onClick={() => onSelect('lubrication')}
          className="cursor-pointer transition-all hover:opacity-80"
        >
          <rect
            x="320"
            y="350"
            width="160"
            height="70"
            rx="6"
            fill="#1c2026"
            stroke={selectedId === 'lubrication' ? '#4C8DFF' : getSubColor('lubrication')}
            strokeWidth={selectedId === 'lubrication' ? '3' : '2'}
          />
          <text x="400" y="385" textAnchor="middle" fill="#F5F5F3" fontSize="12" fontFamily="monospace" fontWeight="bold">
            OIL DRY SUMP & PUMP
          </text>
          <text x="400" y="405" textAnchor="middle" fill={getSubColor('lubrication')} fontSize="10" fontFamily="monospace">
            PRESS: {getSub('lubrication')?.value} bar
          </text>
          {/* Oil Feed Line */}
          <path d="M 400 310 L 400 350" stroke={getSubColor('lubrication')} strokeWidth="2" strokeDasharray="4 2" />
        </g>

        {/* 6. Front Propeller Flange & Drive */}
        <g className="cursor-default">
          <ellipse cx="400" cy="240" rx="14" ry="14" fill="#38A169" />
          <path d="M 400 190 L 400 290" stroke="#F5F5F3" strokeWidth="4" strokeLinecap="round" />
          <text x="400" y="306" textAnchor="middle" fill="#969BA1" fontSize="9" fontFamily="monospace">
            DRIVE HUB
          </text>
        </g>
      </svg>
    </div>
  );
};
