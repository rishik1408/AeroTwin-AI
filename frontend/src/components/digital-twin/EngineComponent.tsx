import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SeverityLevel } from '../../types/telemetry';

interface EngineComponentProps {
  id: string;
  name: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  geometryType: 'box' | 'cylinder' | 'sphere' | 'torus' | 'propeller';
  dimensions: number[];
  status: SeverityLevel;
  isSelected: boolean;
  onSelect: (id: string) => void;
  rpm?: number;
  isEngineRunning?: boolean;
}

export const EngineComponent: React.FC<EngineComponentProps> = ({
  id,
  name,
  position,
  rotation = [0, 0, 0],
  geometryType,
  dimensions,
  status,
  isSelected,
  onSelect,
  rpm = 0,
  isEngineRunning = true,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Status colors
  const baseColor = {
    healthy: '#3a414d',
    warning: '#f0a52b',
    critical: '#e53935',
    info: '#4c8dff',
  }[status];

  // Dynamic animation (propeller rotation or subtle heat shimmer)
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (geometryType === 'propeller' && isEngineRunning) {
      const speed = Math.max(1, (rpm / 5000) * 25);
      meshRef.current.rotation.z += delta * speed;
    }

    if (status === 'critical') {
      const s = 1 + Math.sin(Date.now() * 0.006) * 0.02;
      meshRef.current.scale.set(s, s, s);
    } else {
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  const renderGeometry = () => {
    switch (geometryType) {
      case 'box':
        return <boxGeometry args={[dimensions[0], dimensions[1], dimensions[2]]} />;
      case 'cylinder':
        return <cylinderGeometry args={[dimensions[0], dimensions[1], dimensions[2], dimensions[3] || 16]} />;
      case 'sphere':
        return <sphereGeometry args={[dimensions[0], 24, 24]} />;
      case 'torus':
        return <torusGeometry args={[dimensions[0], dimensions[1], 16, 32]} />;
      case 'propeller':
        return <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={hovered ? '#6b7280' : baseColor}
          metalness={0.7}
          roughness={0.3}
          wireframe={isSelected}
          emissive={status === 'critical' ? '#e53935' : status === 'warning' ? '#f0a52b' : isSelected ? '#4c8dff' : '#000000'}
          emissiveIntensity={status === 'critical' ? 0.6 : status === 'warning' ? 0.4 : isSelected ? 0.3 : 0.0}
        />
      </mesh>

      {/* Propeller Blades attached to hub */}
      {geometryType === 'propeller' && (
        <group>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[0.22, 1.8, 0.04]} />
            <meshStandardMaterial color="#1a1d22" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, -1.1, 0]}>
            <boxGeometry args={[0.22, 1.8, 0.04]} />
            <meshStandardMaterial color="#1a1d22" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* Subtle selection ring */}
      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[1.2, 1.25, 32]} />
          <meshBasicMaterial color="#4c8dff" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};
