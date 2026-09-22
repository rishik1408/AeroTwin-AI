import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { TelemetryData, SubsystemStatus } from '../../types/telemetry';
import { EngineComponent } from './EngineComponent';
import { EngineControls } from './EngineControls';
import { EngineStatusOverlay } from './EngineStatusOverlay';

interface Engine3DProps {
  telemetry: TelemetryData;
  subsystems: SubsystemStatus[];
  selectedSubsystemId: string | null;
  onSelectSubsystem: (id: string | null) => void;
  height?: string;
  showControls?: boolean;
}

export const Engine3D: React.FC<Engine3DProps> = ({
  telemetry,
  subsystems,
  selectedSubsystemId,
  onSelectSubsystem,
  height = '420px',
  showControls = true,
}) => {
  const [isExploded, setIsExploded] = useState(false);
  const controlsRef = useRef<any>(null);

  const getSubsystemStatus = (id: string) => {
    const sub = subsystems.find((s) => s.id === id);
    return sub ? sub.status : 'healthy';
  };

  const selectedSubsystem = subsystems.find((s) => s.id === selectedSubsystemId) || null;

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleSetPreset = (preset: 'isometric' | 'front' | 'top' | 'side') => {
    if (!controlsRef.current) return;
    const pos = {
      isometric: [4.2, 3.2, 4.2],
      front: [0, 0.5, 5.5],
      top: [0, 6.0, 0.1],
      side: [5.5, 0.8, 0],
    }[preset];
    controlsRef.current.object.position.set(pos[0], pos[1], pos[2]);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  // Separation multiplier when exploded
  const exp = isExploded ? 1.8 : 1.0;

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-[#0d0f12] border border-[rgba(255,255,255,0.08)] select-none" style={{ height }}>
      {/* 3D Scene Canvas */}
      <Canvas
        camera={{ position: [4.2, 3.0, 4.2], fov: 42 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <color attach="background" args={['#0d0f12']} />

        {/* Technical Aerospace Lighting */}
        <ambientLight intensity={0.65} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
        <directionalLight position={[-10, 10, -10]} intensity={0.5} color="#4c8dff" />
        <directionalLight position={[0, -10, 0]} intensity={0.2} color="#ffffff" />
        <pointLight position={[0, 4, 0]} intensity={0.4} color="#ffffff" />

        <Center>
          <group position={[0, 0, 0]}>
            {/* 1. Main Crankcase Housing */}
            <EngineComponent
              id="crankcase"
              name="Crankcase Block"
              position={[0, 0, 0]}
              geometryType="box"
              dimensions={[1.8, 0.9, 1.4]}
              status={getSubsystemStatus('crankcase')}
              isSelected={selectedSubsystemId === 'crankcase'}
              onSelect={onSelectSubsystem}
            />

            {/* 2. Cylinder 1 & 2 (Port Side) */}
            <EngineComponent
              id="cylinders"
              name="Cylinder 1 & 2 (Port)"
              position={[-1.2 * exp, 0.1 * exp, 0.4]}
              rotation={[0, 0, Math.PI / 2]}
              geometryType="cylinder"
              dimensions={[0.38, 0.38, 0.9, 16]}
              status={getSubsystemStatus('cylinders')}
              isSelected={selectedSubsystemId === 'cylinders'}
              onSelect={onSelectSubsystem}
            />

            {/* 3. Cylinder 3 & 4 (Starboard Side) */}
            <EngineComponent
              id="cylinders"
              name="Cylinder 3 & 4 (Starboard)"
              position={[1.2 * exp, 0.1 * exp, -0.4]}
              rotation={[0, 0, -Math.PI / 2]}
              geometryType="cylinder"
              dimensions={[0.38, 0.38, 0.9, 16]}
              status={getSubsystemStatus('cylinders')}
              isSelected={selectedSubsystemId === 'cylinders'}
              onSelect={onSelectSubsystem}
            />

            {/* 4. Propeller Drive Gearbox & Spinner Hub */}
            <EngineComponent
              id="crankcase"
              name="Reduction Gearbox & Hub"
              position={[0, 0.25, 1.35 * exp]}
              rotation={[Math.PI / 2, 0, 0]}
              geometryType="propeller"
              dimensions={[0.3, 0.3, 0.5, 16]}
              status={getSubsystemStatus('crankcase')}
              isSelected={selectedSubsystemId === 'crankcase'}
              onSelect={onSelectSubsystem}
              rpm={telemetry.rpm}
              isEngineRunning={telemetry.rpm > 300}
            />

            {/* 5. Cooling Radiator & Water Jacket */}
            <EngineComponent
              id="cooling"
              name="Cooling Heat Exchanger"
              position={[0, 0.75 * exp, 0.8 * exp]}
              geometryType="box"
              dimensions={[1.3, 0.5, 0.25]}
              status={getSubsystemStatus('cooling')}
              isSelected={selectedSubsystemId === 'cooling'}
              onSelect={onSelectSubsystem}
            />

            {/* 6. Lubrication Oil Sump Reservoir */}
            <EngineComponent
              id="lubrication"
              name="Dry Sump Oil Tank"
              position={[0, -0.75 * exp, -0.2 * exp]}
              geometryType="cylinder"
              dimensions={[0.45, 0.45, 0.7, 16]}
              status={getSubsystemStatus('lubrication')}
              isSelected={selectedSubsystemId === 'lubrication'}
              onSelect={onSelectSubsystem}
            />

            {/* 7. Fuel Injection Rail */}
            <EngineComponent
              id="fuel"
              name="Electronic Fuel Rail"
              position={[0, 0.65 * exp, -0.2 * exp]}
              rotation={[0, 0, Math.PI / 2]}
              geometryType="cylinder"
              dimensions={[0.08, 0.08, 1.6, 12]}
              status={getSubsystemStatus('fuel')}
              isSelected={selectedSubsystemId === 'fuel'}
              onSelect={onSelectSubsystem}
            />

            {/* 8. Air Intake Plenum */}
            <EngineComponent
              id="intake"
              name="Air Intake Plenum & MAP"
              position={[0, 0.85 * exp, 0.1 * exp]}
              geometryType="box"
              dimensions={[0.7, 0.35, 0.6]}
              status={getSubsystemStatus('intake')}
              isSelected={selectedSubsystemId === 'intake'}
              onSelect={onSelectSubsystem}
            />

            {/* 9. Exhaust 4-into-1 Collector */}
            <EngineComponent
              id="exhaust"
              name="Exhaust Collector"
              position={[0, -0.4 * exp, 0.8 * exp]}
              rotation={[0, 0, 0]}
              geometryType="torus"
              dimensions={[0.5, 0.12]}
              status={getSubsystemStatus('exhaust')}
              isSelected={selectedSubsystemId === 'exhaust'}
              onSelect={onSelectSubsystem}
            />

            {/* 10. Alternator Generator */}
            <EngineComponent
              id="electrical"
              name="250W Alternator"
              position={[0.55 * exp, -0.2 * exp, -1.0 * exp]}
              rotation={[Math.PI / 2, 0, 0]}
              geometryType="cylinder"
              dimensions={[0.3, 0.3, 0.45, 16]}
              status={getSubsystemStatus('electrical')}
              isSelected={selectedSubsystemId === 'electrical'}
              onSelect={onSelectSubsystem}
            />
          </group>
        </Center>

        {/* Technical Coordinate Grid Floor */}
        <Grid
          position={[0, -1.6, 0]}
          args={[14, 14]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#1f242c"
          sectionSize={2.0}
          sectionThickness={1.2}
          sectionColor="#2f3846"
          fadeDistance={18}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2.0}
          maxDistance={12.0}
          maxPolarAngle={Math.PI / 2 + 0.15}
        />
      </Canvas>

      {/* Selected Subsystem HUD Overlay */}
      <EngineStatusOverlay
        selectedSubsystem={selectedSubsystem}
        onClearSelection={() => onSelectSubsystem(null)}
        telemetry={telemetry}
      />

      {/* Interactive Camera Preset & View Controls */}
      {showControls && (
        <EngineControls
          onResetCamera={handleResetCamera}
          onSetPreset={handleSetPreset}
          isExploded={isExploded}
          onToggleExploded={() => setIsExploded(!isExploded)}
        />
      )}

      {/* RPM & Power Status Indicator in Corner */}
      <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1.5 rounded bg-[#141619]/90 backdrop-blur-md border border-[rgba(255,255,255,0.08)] font-mono text-[10px] text-[#969BA1] flex items-center gap-3 select-none">
        <div>
          <span>RPM: </span>
          <span className="font-bold text-[#F5F5F3] font-metric">{telemetry.rpm}</span>
        </div>
        <div>
          <span>STATUS: </span>
          <span className={telemetry.rpm > 400 ? 'text-[#38A169] font-bold' : 'text-[#969BA1]'}>
            {telemetry.rpm > 400 ? 'OPERATIONAL' : 'SHUTDOWN'}
          </span>
        </div>
      </div>
    </div>
  );
};
