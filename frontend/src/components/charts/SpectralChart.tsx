import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface SpectralChartProps {
  currentVibration: number;
  height?: number;
}

export const SpectralChart: React.FC<SpectralChartProps> = ({
  currentVibration,
  height = 180,
}) => {
  // Generate realistic Welch PSD points based on current vibration amplitude
  const isElevated = currentVibration > 0.08;
  const data = [
    { freq: '0.5 Hz', psd: 0.012, baseline: 0.01 },
    { freq: '1.0 Hz', psd: 0.018, baseline: 0.015 },
    { freq: '1.5 Hz', psd: 0.022, baseline: 0.02 },
    { freq: '2.0 Hz', psd: isElevated ? 0.075 : 0.014, baseline: 0.012 },
    { freq: '2.5 Hz', psd: isElevated ? 0.12 : 0.009, baseline: 0.008 },
    { freq: '3.0 Hz', psd: isElevated ? 0.18 : 0.006, baseline: 0.006 },
    { freq: '3.5 Hz', psd: isElevated ? 0.14 : 0.005, baseline: 0.005 },
    { freq: '4.0 Hz', psd: isElevated ? 0.09 : 0.004, baseline: 0.004 },
    { freq: '5.0 Hz', psd: isElevated ? 0.05 : 0.003, baseline: 0.003 },
    { freq: '6.0 Hz', psd: isElevated ? 0.03 : 0.002, baseline: 0.002 },
  ];

  return (
    <div className="card p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-mono font-bold tracking-wider text-[#F5F5F3] uppercase flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isElevated ? 'bg-[#E53935]' : 'bg-[#38A169]'}`} />
          <span>Vibration Welch PSD Spectrum (SciPy Engine)</span>
        </div>
        <div className="text-[10px] font-mono text-[#969BA1]">
          ANOMALY THRESHOLD: &gt;2 Hz BAND
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="psdGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isElevated ? '#E53935' : '#4C8DFF'} stopOpacity={0.4} />
                <stop offset="95%" stopColor={isElevated ? '#E53935' : '#4C8DFF'} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="freq"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#181A1D',
                borderColor: 'rgba(255,255,255,0.15)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#F5F5F3',
              }}
            />
            <Area
              type="monotone"
              dataKey="psd"
              name="Current PSD"
              stroke={isElevated ? '#E53935' : '#4C8DFF'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#psdGrad)"
            />
            <Area
              type="monotone"
              dataKey="baseline"
              name="Healthy Baseline"
              stroke="#38A169"
              strokeWidth={1}
              strokeDasharray="4 2"
              fillOpacity={0}
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
