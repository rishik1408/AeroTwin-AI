import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTelemetry } from './hooks/useTelemetry';
import { TopBar } from './components/common/TopBar';
import { Sidebar } from './components/common/Sidebar';
import { MissionControlPage } from './pages/MissionControlPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { AIHealthPage } from './pages/AIHealthPage';
import { FaultDetectionPage } from './pages/FaultDetectionPage';
import { MissionReplayPage } from './pages/MissionReplayPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

const AppLayout: React.FC = () => {
  const {
    readiness,
    isBackendConnected,
    demoMode,
    toggleDemoMode,
    resetSimulation,
    triggerFault,
    activeFaults,
  } = useTelemetry();

  const location = useLocation();
  const isReplayMode = location.pathname === '/replay';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#101112] text-[#F5F5F3]">
      {/* Persistent Left Sidebar */}
      <Sidebar
        isBackendConnected={isBackendConnected}
        activeFaultCount={activeFaults.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Persistent Top Navigation Bar */}
        <TopBar
          readiness={readiness}
          isBackendConnected={isBackendConnected}
          demoMode={demoMode}
          onToggleDemoMode={toggleDemoMode}
          onReset={resetSimulation}
          onTriggerFault={triggerFault}
          isReplayMode={isReplayMode}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#101112]">
          <Routes>
            <Route path="/" element={<Navigate to="/mission-control" replace />} />
            <Route path="/mission-control" element={<MissionControlPage />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
            <Route path="/ai-health" element={<AIHealthPage />} />
            <Route path="/faults" element={<FaultDetectionPage />} />
            <Route path="/replay" element={<MissionReplayPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/mission-control" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
