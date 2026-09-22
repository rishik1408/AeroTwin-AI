import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TelemetryHistoryPoint } from '../../hooks/useTelemetry';

interface TelemetryStreamChartProps {
  data: TelemetryHistoryPoint[];
  height?: number;
}

export const TelemetryStreamChart: React.FC<TelemetryStreamChartProps> = ({
  data,
  height = 240,
}) => {
  return (
    <div className="card p-3 select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-mono font-bold tracking-wider text-[#F5F5F3] uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#4C8DFF]" />
          <span>Real-Time Telemetry Stream (60s Window)</span>
        </div>
        <div className="text-[10px] font-mono text-[#969BA1]">
          SAMPLING: 1 Hz // DUAL AXIS
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            {/* Primary Y-Axis: Temperatures (°C) */}
            <YAxis
              yAxisId="left"
              domain={[60, 850]}
              stroke="#969BA1"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v) => `${v}°`}
            />
            {/* Secondary Y-Axis: RPM */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 6000]}
              stroke="#4C8DFF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#181A1D',
                borderColor: 'rgba(255,255,255,0.15)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'IBM Plex Mono, monospace',
                color: '#F5F5F3',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '6px' }}
              iconType="plainline"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rpm"
              name="RPM"
              stroke="#4C8DFF"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cht"
              name="CHT (°C)"
              stroke="#F0A52B"
              strokeWidth={1.8}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="egt"
              name="EGT (°C)"
              stroke="#E53935"
              strokeWidth={1.2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="oilTemp"
              name="Oil Temp (°C)"
              stroke="#38A169"
              strokeWidth={1.2}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
