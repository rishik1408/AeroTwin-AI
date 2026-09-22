import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Calendar, Download, Filter, BarChart3, TrendingUp } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  // Realistic historical flight analytics dataset
  const trendData = [
    { time: '14:00', rpm: 5200, cht: 96, egt: 705, oilPress: 3.9, vib: 0.022, health: 98, rul: 420 },
    { time: '14:10', rpm: 5220, cht: 97, egt: 710, oilPress: 3.88, vib: 0.024, health: 98, rul: 418 },
    { time: '14:20', rpm: 5210, cht: 98, egt: 712, oilPress: 3.85, vib: 0.025, health: 97, rul: 412 },
    { time: '14:30', rpm: 5180, cht: 104, egt: 724, oilPress: 3.81, vib: 0.028, health: 92, rul: 380 },
    { time: '14:40', rpm: 5150, cht: 114, egt: 745, oilPress: 3.75, vib: 0.035, health: 78, rul: 210 },
    { time: '14:50', rpm: 5100, cht: 126, egt: 780, oilPress: 3.65, vib: 0.045, health: 54, rul: 65 },
    { time: '15:00', rpm: 4800, cht: 118, egt: 730, oilPress: 3.72, vib: 0.032, health: 70, rul: 180 },
  ];

  const faultFrequencyData = [
    { name: 'Cooling Drift', count: 12, meanDuration: '18s' },
    { name: 'Oil Sag', count: 5, meanDuration: '12s' },
    { name: 'Vibration 2Hz+', count: 8, meanDuration: '24s' },
    { name: 'Misfires', count: 3, meanDuration: '10s' },
    { name: 'Sensor Drift', count: 4, meanDuration: '30s' },
    { name: 'Alternator Sag', count: 2, meanDuration: '45s' },
  ];

  return (
    <div className="p-4 space-y-4 max-w-[1680px] mx-auto select-none">
      {/* Page Header */}
      <div className="pb-2 border-b border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#F5F5F3] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38A169]" />
            Fleet Analytics &amp; Statistical Mission Trends
          </h1>
          <p className="text-xs font-mono text-[#969BA1]">
            Multi-mission thermodynamic degradation analysis, sensor envelope compliance, and fault distribution
          </p>
        </div>

        {/* Time Range Selector & Export Action */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1 bg-[#181A1D] p-1 rounded border border-[rgba(255,255,255,0.08)]">
            {(['1h', '6h', '24h', '7d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeRange === r
                    ? 'bg-[#222529] text-[#F5F5F3] font-bold border border-[rgba(255,255,255,0.1)]'
                    : 'text-[#969BA1] hover:text-[#F5F5F3]'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => alert('Exporting full mission telemetry CSV log...')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#181A1D] border border-[rgba(255,255,255,0.1)] hover:bg-[#222529] text-[#F5F5F3] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#4C8DFF]" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="card p-3">
          <div className="text-[10px] text-[#969BA1] uppercase">Flight Hours Monitored</div>
          <div className="text-2xl font-bold font-metric text-[#F5F5F3] mt-1">142.8 hrs</div>
          <div className="text-[10px] text-[#38A169] mt-0.5">↑ 18 hrs this week</div>
        </div>

        <div className="card p-3">
          <div className="text-[10px] text-[#969BA1] uppercase">Mean CHT Gradient</div>
          <div className="text-2xl font-bold font-metric text-[#F5F5F3] mt-1">0.14 °C/min</div>
          <div className="text-[10px] text-[#38A169] mt-0.5">NOMINAL THERMAL SINK</div>
        </div>

        <div className="card p-3">
          <div className="text-[10px] text-[#969BA1] uppercase">Mean Oil Pressure</div>
          <div className="text-2xl font-bold font-metric text-[#4C8DFF] mt-1">3.82 bar</div>
          <div className="text-[10px] text-[#969BA1] mt-0.5">SIGMA: ±0.06 bar</div>
        </div>

        <div className="card p-3">
          <div className="text-[10px] text-[#969BA1] uppercase">Anomaly Detection Rate</div>
          <div className="text-2xl font-bold font-metric text-[#F0A52B] mt-1">99.4%</div>
          <div className="text-[10px] text-[#38A169] mt-0.5">ZERO FALSE HOLDS</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Historical Health Index vs RUL Decay */}
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[rgba(255,255,255,0.06)]">
            <div className="text-xs font-mono font-bold text-[#F5F5F3] uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#38A169]" />
              <span>Engine Health Index vs Predicted RUL Trajectory</span>
            </div>
            <span className="text-[10px] font-mono text-[#969BA1]">DUAL SERIES</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis yAxisId="health" domain={[0, 100]} stroke="#38A169" fontSize={10} tickLine={false} />
                <YAxis yAxisId="rul" orientation="right" domain={[0, 500]} stroke="#4C8DFF" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181A1D',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Line
                  yAxisId="health"
                  type="monotone"
                  dataKey="health"
                  name="Health Index (%)"
                  stroke="#38A169"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="rul"
                  type="monotone"
                  dataKey="rul"
                  name="Predicted RUL (hrs)"
                  stroke="#4C8DFF"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Thermal & Pressure Degradation Profiles */}
        <div className="card p-3 space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[rgba(255,255,255,0.06)]">
            <div className="text-xs font-mono font-bold text-[#F5F5F3] uppercase flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F0A52B]" />
              <span>Thermal Profile (CHT vs EGT Trends)</span>
            </div>
            <span className="text-[10px] font-mono text-[#969BA1]">DEGREES CELSIUS</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[80, 850]} stroke="#969BA1" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181A1D',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Line
                  type="monotone"
                  dataKey="cht"
                  name="CHT (°C)"
                  stroke="#F0A52B"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="egt"
                  name="EGT (°C)"
                  stroke="#E53935"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fault Frequency Histogram */}
      <div className="card p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="font-bold text-[#F5F5F3] uppercase text-xs">
            Injected Failure Mode Distribution (Last 30 Missions)
          </div>
          <div className="text-[10px] text-[#969BA1]">TOTAL EVENTS: 34</div>
        </div>

        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={faultFrequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#181A1D',
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Bar dataKey="count" name="Event Occurrences" fill="#4C8DFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
