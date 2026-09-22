import React from 'react';
import { useTelemetry } from '../hooks/useTelemetry';
import { ShapBarChart } from '../components/charts/ShapBarChart';
import { SpectralChart } from '../components/charts/SpectralChart';
import { BrainCircuit, Clock, ShieldCheck, Activity, Cpu, Layers } from 'lucide-react';

export const AIHealthPage: React.FC = () => {
  const { aiState, telemetry, readiness } = useTelemetry();

  const formatRul = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="p-4 space-y-4 max-w-[1680px] mx-auto select-none">
      {/* Page Header */}
      <div className="pb-2 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#F5F5F3] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38A169]" />
            AI Health Monitoring &amp; Predictive Maintenance
          </h1>
          <p className="text-xs font-mono text-[#969BA1]">
            Deep LSTM sequence-to-value remaining useful life, Isolation Forest anomalies &amp; TreeSHAP attribution
          </p>
        </div>
        <div className="font-mono text-xs text-[#969BA1] flex items-center gap-2">
          <span>STATUS:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[10px] border ${
              readiness === 'READY'
                ? 'bg-[rgba(56,161,105,0.15)] text-[#38A169] border-[rgba(56,161,105,0.3)]'
                : readiness === 'MONITOR'
                ? 'bg-[rgba(240,165,43,0.15)] text-[#F0A52B] border-[rgba(240,165,43,0.3)]'
                : 'bg-[rgba(229,57,53,0.15)] text-[#E53935] border-[rgba(229,57,53,0.3)]'
            }`}
          >
            {readiness}
          </span>
        </div>
      </div>

      {/* 4 Core AI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Engine Health */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#969BA1] font-semibold">
            <span>Engine Health</span>
            <BrainCircuit className="w-4 h-4 text-[#38A169]" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span
              className={`font-metric text-4xl font-extrabold ${
                aiState.healthScore < 50
                  ? 'text-[#E53935]'
                  : aiState.healthScore < 80
                  ? 'text-[#F0A52B]'
                  : 'text-[#38A169]'
              }`}
            >
              {aiState.healthScore}
            </span>
            <span className="text-sm font-mono text-[#969BA1]">/ 100</span>
          </div>
          <div className="h-2 w-full bg-[#222529] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                aiState.healthScore < 50
                  ? 'bg-[#E53935]'
                  : aiState.healthScore < 80
                  ? 'bg-[#F0A52B]'
                  : 'bg-[#38A169]'
              }`}
              style={{ width: `${aiState.healthScore}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Remaining Useful Life (RUL) */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#969BA1] font-semibold">
            <span>Remaining Useful Life (RUL)</span>
            <Clock className="w-4 h-4 text-[#4C8DFF]" />
          </div>
          <div className="my-2">
            <span className="font-metric text-4xl font-extrabold text-[#F5F5F3]">
              {formatRul(aiState.rulHours)}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#969BA1] flex justify-between pt-1 border-t border-[rgba(255,255,255,0.06)]">
            <span>PyTorch 2-Layer LSTM</span>
            <span>40-tick sequence window</span>
          </div>
        </div>

        {/* Metric 3: Predicted Operating Condition */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#969BA1] font-semibold">
            <span>Predicted Condition</span>
            <ShieldCheck className="w-4 h-4 text-[#F0A52B]" />
          </div>
          <div className="my-2">
            <span className="font-mono text-xl font-bold text-[#F5F5F3] leading-tight">
              {aiState.predictedCondition.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#969BA1] pt-1 border-t border-[rgba(255,255,255,0.06)]">
            STATE: {aiState.isAnomaly ? 'DEGRADATION ALERT' : 'NOMINAL ENVELOPE'}
          </div>
        </div>

        {/* Metric 4: Model Confidence Score */}
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#969BA1] font-semibold">
            <span>Model Confidence</span>
            <Activity className="w-4 h-4 text-[#4C8DFF]" />
          </div>
          <div className="my-2 flex items-baseline gap-1">
            <span className="font-metric text-4xl font-extrabold text-[#F5F5F3]">
              {(aiState.confidence * 100).toFixed(0)}
            </span>
            <span className="text-sm font-mono text-[#969BA1]">%</span>
          </div>
          <div className="text-[10px] font-mono text-[#969BA1] flex justify-between pt-1 border-t border-[rgba(255,255,255,0.06)]">
            <span>Decision Margin:</span>
            <span className="font-metric text-[#38A169]">
              {aiState.anomalyScore > 0 ? `+${aiState.anomalyScore.toFixed(2)}` : aiState.anomalyScore.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* SHAP Feature Attribution & Vibration Frequency Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: SHAP Feature Attribution Ranking */}
        <ShapBarChart contributors={aiState.primaryContributors} />

        {/* Right: Vibration Welch PSD Frequency Domain Analysis */}
        <SpectralChart currentVibration={telemetry.vibration} height={250} />
      </div>

      {/* Architecture Verification & Explainability Rationale */}
      <div className="card p-4 font-mono text-xs space-y-3">
        <div className="text-xs font-bold text-[#F5F5F3] uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#4C8DFF]" />
          <span>AI Pipeline Verification &amp; Model Architecture</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-[#969BA1]">
          <div className="p-3 rounded bg-[#101112] border border-[rgba(255,255,255,0.06)] space-y-1">
            <div className="font-bold text-[#F5F5F3] text-xs">LSTM-RUL Regressor (train_rul.py)</div>
            <p>
              2-layer PyTorch LSTM with 64 hidden units, dropout 0.2, and FC layers. Evaluates 40-step temporal sequences of normalized RPM, CHT, EGT, and vibration.
            </p>
          </div>

          <div className="p-3 rounded bg-[#101112] border border-[rgba(255,255,255,0.06)] space-y-1">
            <div className="font-bold text-[#F5F5F3] text-xs">Isolation Forest (anomaly_detection.py)</div>
            <p>
              Unsupervised ensemble tree trained on clean baseline data. Consumes rolling temporal statistics plus rolling Welch's Power Spectral Density for mechanical harmonic detection.
            </p>
          </div>

          <div className="p-3 rounded bg-[#101112] border border-[rgba(255,255,255,0.06)] space-y-1">
            <div className="font-bold text-[#F5F5F3] text-xs">TreeSHAP Explainability (shap_xai.py)</div>
            <p>
              XGBoost classifier paired with TreeSHAP to compute local Shapley additive explanations, pinpointing which sensor features caused an alert.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
