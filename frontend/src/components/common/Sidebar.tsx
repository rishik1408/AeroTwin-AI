import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  BrainCircuit,
  AlertOctagon,
  History,
  LineChart,
  HardDrive,
  Cpu,
  Radio,
  Sliders,
} from 'lucide-react';

interface SidebarProps {
  isBackendConnected: boolean;
  activeFaultCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isBackendConnected,
  activeFaultCount,
}) => {
  const navItems = [
    { to: '/mission-control', label: 'Mission Control', icon: LayoutDashboard },
    { to: '/digital-twin', label: 'Digital Twin', icon: Box },
    { to: '/ai-health', label: 'AI Health & RUL', icon: BrainCircuit },
    { to: '/faults', label: 'Fault Detection', icon: AlertOctagon, badge: activeFaultCount > 0 ? activeFaultCount : undefined },
    { to: '/replay', label: 'Mission Replay', icon: History },
    { to: '/analytics', label: 'Analytics & Trends', icon: LineChart },
  ];

  return (
    <aside className="w-64 bg-[#141619] border-r border-[rgba(255,255,255,0.08)] flex flex-col justify-between select-none h-full">
      {/* Navigation Section */}
      <div className="p-3 space-y-6">
        {/* Navigation Category Label */}
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#969BA1] uppercase px-3 mb-2 font-semibold">
            Operations Matrix
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#222529] text-[#F5F5F3] border border-[rgba(255,255,255,0.12)] font-semibold shadow-sm'
                        : 'text-[#969BA1] hover:text-[#F5F5F3] hover:bg-[#181A1D]'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-[#4C8DFF]" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[rgba(229,57,53,0.2)] text-[#E53935] border border-[rgba(229,57,53,0.4)]">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Engine Specs Quick Reference */}
        <div className="px-3 py-2.5 rounded bg-[#181A1D] border border-[rgba(255,255,255,0.06)] font-mono text-[11px] space-y-1.5">
          <div className="text-[10px] tracking-wider text-[#969BA1] uppercase flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#38A169]" />
            <span>Powerplant Profile</span>
          </div>
          <div className="flex justify-between text-[#F5F5F3]">
            <span>Model:</span>
            <span>Rotax 912-iS</span>
          </div>
          <div className="flex justify-between text-[#969BA1]">
            <span>Displacement:</span>
            <span>1,352 cc (4-Cyl)</span>
          </div>
          <div className="flex justify-between text-[#969BA1]">
            <span>Max Takeoff:</span>
            <span>5,800 RPM (5m)</span>
          </div>
          <div className="flex justify-between text-[#969BA1]">
            <span>Continuous:</span>
            <span>5,500 RPM (100HP)</span>
          </div>
        </div>
      </div>

      {/* Persistent System-Status Area */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.08)] bg-[#101112]">
        <div className="text-[10px] font-mono tracking-wider text-[#969BA1] uppercase mb-2">
          System Infrastructure
        </div>
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between text-[#969BA1]">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-[#4C8DFF]" />
              <span>Telemetry Stream</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendConnected ? 'bg-[#38A169]' : 'bg-[#F0A52B]'}`} />
              <span className="text-[10px] text-[#F5F5F3]">{isBackendConnected ? 'LIVE' : 'SIM'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[#969BA1]">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-[#38A169]" />
              <span>AI Health Guard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38A169]" />
              <span className="text-[10px] text-[#F5F5F3]">ACTIVE</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[#969BA1]">
            <div className="flex items-center gap-2">
              <HardDrive className="w-3.5 h-3.5 text-[#4C8DFF]" />
              <span>InfluxDB Replay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38A169]" />
              <span className="text-[10px] text-[#F5F5F3]">READY</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[#969BA1]">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-[#F0A52B]" />
              <span>Physics Core</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38A169]" />
              <span className="text-[10px] text-[#F5F5F3]">1 Hz TICK</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[10px] font-mono text-[#969BA1]">
          <span>SIH26054</span>
          <span>v2.4.0-PROD</span>
        </div>
      </div>
    </aside>
  );
};
