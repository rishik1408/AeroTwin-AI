import React from 'react';
import { AIInferenceState } from '../../types/telemetry';

interface ShapBarChartProps {
  contributors: AIInferenceState['primaryContributors'];
}

export const ShapBarChart: React.FC<ShapBarChartProps> = ({ contributors }) => {
  return (
    <div className="card p-4 space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono font-bold tracking-wider text-[#F5F5F3] uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#38A169]" />
          <span>SHAP Feature Attribution (TreeSHAP XAI)</span>
        </div>
        <div className="text-[10px] font-mono text-[#969BA1]">
          NORMALIZED RISK WEIGHTS
        </div>
      </div>

      <div className="space-y-2.5">
        {contributors.map((c) => {
          const pct = Math.round(c.impact * 100);
          const isRisk = c.direction === 'increasing_risk';
          const barColor = isRisk ? 'bg-[#E53935]' : 'bg-[#4C8DFF]';
          const textColor = isRisk ? 'text-[#E53935]' : 'text-[#969BA1]';

          return (
            <div key={c.feature} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-[#F5F5F3] font-medium">{c.label}</span>
                  <span className="text-[10px] text-[#969BA1]">({c.value})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${textColor}`}>
                    {isRisk ? `+${(c.impact * 2.4).toFixed(2)}` : `${(c.impact * 0.4).toFixed(2)}`}
                  </span>
                  <span className="text-[10px] text-[#969BA1]">| {pct}% weight</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-[#222529] rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.max(6, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] text-[10px] font-mono text-[#969BA1] flex justify-between">
        <span>XAI ENGINE: XGBOOST + TREESHAP</span>
        <span>LOCAL EXPLANATION</span>
      </div>
    </div>
  );
};
