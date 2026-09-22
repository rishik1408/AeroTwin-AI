import React from 'react';
import { Eye, RotateCcw, Layers, Compass } from 'lucide-react';

interface EngineControlsProps {
  onResetCamera: () => void;
  onSetPreset: (preset: 'isometric' | 'front' | 'top' | 'side') => void;
  isExploded: boolean;
  onToggleExploded: () => void;
}

export const EngineControls: React.FC<EngineControlsProps> = ({
  onResetCamera,
  onSetPreset,
  isExploded,
  onToggleExploded,
}) => {
  return (
    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 p-1 rounded-md bg-[#141619]/90 backdrop-blur-md border border-[rgba(255,255,255,0.1)] font-mono text-[11px] select-none shadow-lg">
      <button
        onClick={() => onSetPreset('isometric')}
        className="px-2 py-1 rounded hover:bg-[#222529] text-[#969BA1] hover:text-[#F5F5F3] flex items-center gap-1 transition-colors"
        title="Isometric View"
      >
        <Compass className="w-3.5 h-3.5 text-[#4C8DFF]" />
        <span>ISO</span>
      </button>

      <button
        onClick={() => onSetPreset('front')}
        className="px-2 py-1 rounded hover:bg-[#222529] text-[#969BA1] hover:text-[#F5F5F3] flex items-center gap-1 transition-colors"
        title="Front View (Gearbox & Propeller)"
      >
        <Eye className="w-3.5 h-3.5 text-[#38A169]" />
        <span>FRONT</span>
      </button>

      <button
        onClick={() => onSetPreset('top')}
        className="px-2 py-1 rounded hover:bg-[#222529] text-[#969BA1] hover:text-[#F5F5F3] flex items-center gap-1 transition-colors"
        title="Top View (Opposed Cylinders)"
      >
        <span>TOP</span>
      </button>

      <button
        onClick={() => onSetPreset('side')}
        className="px-2 py-1 rounded hover:bg-[#222529] text-[#969BA1] hover:text-[#F5F5F3] flex items-center gap-1 transition-colors"
        title="Side View (Intake & Exhaust Sump)"
      >
        <span>SIDE</span>
      </button>

      <div className="w-[1px] h-4 bg-[rgba(255,255,255,0.1)] mx-0.5" />

      <button
        onClick={onToggleExploded}
        className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
          isExploded
            ? 'bg-[rgba(76,141,255,0.2)] text-[#4C8DFF] border border-[rgba(76,141,255,0.4)]'
            : 'hover:bg-[#222529] text-[#969BA1] hover:text-[#F5F5F3]'
        }`}
        title="Toggle Exploded Subsystem Separation"
      >
        <Layers className="w-3.5 h-3.5" />
        <span>EXPLODE</span>
      </button>

      <button
        onClick={onResetCamera}
        className="p-1 rounded hover:bg-[#222529] text-[#969BA1] hover:text-[#F5F5F3] transition-colors"
        title="Reset Camera Position"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
