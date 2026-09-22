import React from 'react';
import { SubsystemStatus } from '../../types/telemetry';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface SubsystemStatusListProps {
  subsystems: SubsystemStatus[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const SubsystemStatusList: React.FC<SubsystemStatusListProps> = ({
  subsystems,
  selectedId,
  onSelect,
}) => {
  return (
    <div className="card p-3 space-y-2 select-none">
      <div className="flex items-center justify-between mb-1 pb-1 border-b border-[rgba(255,255,255,0.06)]">
        <div className="text-xs font-mono font-bold tracking-wider text-[#F5F5F3] uppercase">
          Engine Subsystems Matrix
        </div>
        <div className="text-[10px] font-mono text-[#969BA1]">
          8 MONITORED NODES
        </div>
      </div>

      <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
        {subsystems.map((sub) => {
          const isSelected = selectedId === sub.id;

          const statusIcon = {
            healthy: <CheckCircle2 className="w-3.5 h-3.5 text-[#38A169]" />,
            warning: <AlertTriangle className="w-3.5 h-3.5 text-[#F0A52B]" />,
            critical: <AlertOctagon className="w-3.5 h-3.5 text-[#E53935]" />,
            info: <CheckCircle2 className="w-3.5 h-3.5 text-[#4C8DFF]" />,
          }[sub.status];

          const statusBorder = {
            healthy: 'border-[rgba(56,161,105,0.2)]',
            warning: 'border-[rgba(240,165,43,0.35)]',
            critical: 'border-[rgba(229,57,53,0.45)]',
            info: 'border-[rgba(76,141,255,0.2)]',
          }[sub.status];

          return (
            <div
              key={sub.id}
              onClick={() => onSelect(sub.id)}
              className={`p-2 rounded card-inner flex items-center justify-between cursor-pointer transition-all border ${statusBorder} ${
                isSelected ? 'ring-1 ring-[#4C8DFF] bg-[#222529]' : 'hover:bg-[#1f2329]'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusIcon}
                <div>
                  <div className="text-xs font-mono font-bold text-[#F5F5F3]">{sub.name}</div>
                  <div className="text-[10px] font-mono text-[#969BA1]">
                    {sub.primaryMetric}: {sub.value} {sub.unit}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono font-bold text-[#F5F5F3]">{sub.health}%</div>
                <div
                  className={`text-[9px] font-mono uppercase font-semibold ${
                    sub.status === 'critical'
                      ? 'text-[#E53935]'
                      : sub.status === 'warning'
                      ? 'text-[#F0A52B]'
                      : 'text-[#38A169]'
                  }`}
                >
                  {sub.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
