import React from 'react';
import { ThemeColors } from '../../styles/theme';
import { SimulationScenario, SimulationStep } from '../../types';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  ArrowRight,
  X,
  Activity,
  CheckCircle,
  HelpCircle,
  Server,
  Terminal,
  Smartphone,
  Spline,
} from 'lucide-react';

interface SimulationControllerProps {
  theme: ThemeColors;
  scenarios: SimulationScenario[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onRestart: () => void;
  speed: number;
  onChangeSpeed: (spd: number) => void;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: SimulationStep | null;
  onExitSimulation: () => void;
  onOpenDevicePreview?: () => void;
  isWireframe?: boolean;
  boardTitle?: string;
}

export const SimulationController: React.FC<SimulationControllerProps> = ({
  theme,
  scenarios,
  activeScenarioId,
  onSelectScenario,
  isRunning,
  onTogglePlay,
  onStepForward,
  onRestart,
  speed,
  onChangeSpeed,
  currentStepIndex,
  totalSteps,
  currentStep,
  onExitSimulation,
  onOpenDevicePreview,
  isWireframe = false,
  boardTitle,
}) => {
  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  // Useful empty state when board has no configured routes or interactions
  if (totalSteps === 0 || !activeScenario || activeScenario.steps.length === 0) {
    return (
      <div
        data-testid="simulation-empty-state-bar"
        style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          userSelect: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '14px 18px',
            backgroundColor: '#07090d',
            border: '1.5px solid #283142',
            borderRadius: 10,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.85), 0 0 16px rgba(59, 130, 246, 0.1)',
            minWidth: 420,
            maxWidth: 540,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#64748b',
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.03em' }}>
                SIMULATION · NO CONNECTED ROUTES {boardTitle ? `(${boardTitle})` : ''}
              </span>
            </div>

            <button
              type="button"
              onClick={onExitSimulation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                backgroundColor: '#161b24',
                border: '1px solid #283142',
                borderRadius: 6,
                color: '#d0dae7',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X size={13} /> Exit Simulation
            </button>
          </div>

          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
            {isWireframe
              ? 'This wireframe has no connected screens or configured prototype interactions. To simulate a user flow, connect CTA buttons to target screens using the Connector tool (C) or configure Prototype Actions in the Properties panel.'
              : 'This diagram has no active data flow pathways. Connect nodes using the Connector tool (C) to trace events and data movement through the diagram.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {onOpenDevicePreview && (
              <button
                type="button"
                onClick={onOpenDevicePreview}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  backgroundColor: '#1e3a8a',
                  border: '1px solid #3b82f6',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Smartphone size={12} color="#93c5fd" />
                <span>Open Device Viewport</span>
              </button>
            )}
            <button
              type="button"
              onClick={onExitSimulation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 12px',
                backgroundColor: '#151922',
                border: '1px solid #2d3648',
                borderRadius: 6,
                color: '#cbd5e1',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Spline size={12} color="#38bdf8" />
              <span>Return to Editor to Connect</span>
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div
      data-testid="simulation-controller-bar"
      style={{
        position: 'absolute',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        userSelect: 'none',
      }}
    >
      {/* Top Floating Simulation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          backgroundColor: '#07090d',
          border: '1.5px solid #3b82f6',
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(59, 130, 246, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isRunning ? '#10b981' : '#f59e0b',
              boxShadow: isRunning ? '0 0 8px #10b981' : '0 0 6px #f59e0b',
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', letterSpacing: '0.03em' }}>
            SIMULATE MODE
          </span>
        </div>

        <div style={{ width: 1, height: 20, backgroundColor: '#1d2330' }} />

        {/* Scenario Dropdown */}
        <select
          value={activeScenarioId}
          onChange={(e) => onSelectScenario(e.target.value)}
          style={{
            backgroundColor: '#11141c',
            border: '1px solid #252c3c',
            borderRadius: 6,
            padding: '5px 10px',
            fontSize: 12,
            color: '#e2e8f0',
            fontWeight: 500,
            outline: 'none',
          }}
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        {/* Transport Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={onTogglePlay}
            title={isRunning ? 'Pause (Space)' : 'Play (Space)'}
            style={actionBtnStyle(isRunning ? '#ef4444' : '#10b981')}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            type="button"
            onClick={onStepForward}
            title="Step Forward"
            disabled={totalSteps === 0}
            style={actionBtnStyle('#3b82f6')}
          >
            <SkipForward size={14} />
          </button>

          <button
            type="button"
            onClick={onRestart}
            title="Restart Simulation"
            style={actionBtnStyle('#8b9bb4')}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onChangeSpeed(spd)}
              style={{
                backgroundColor: speed === spd ? '#1e2636' : 'transparent',
                border: speed === spd ? '1px solid #3b82f6' : '1px solid transparent',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 11,
                fontWeight: 600,
                color: speed === spd ? '#3b82f6' : '#6b778c',
                cursor: 'pointer',
              }}
            >
              {spd}x
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, backgroundColor: '#1d2330' }} />

        {/* Step Counter */}
        <span style={{ fontSize: 11, color: '#8895a7', fontVariantNumeric: 'tabular-nums' }}>
          Hop {totalSteps === 0 ? 0 : currentStepIndex + 1} of {totalSteps}
        </span>

        {/* Device Viewport shortcut for wireframes */}
        {onOpenDevicePreview && (
          <button
            type="button"
            onClick={onOpenDevicePreview}
            title="Open interactive screen prototype in device viewport"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              backgroundColor: '#172554',
              border: '1px solid #3b82f6',
              borderRadius: 6,
              color: '#93c5fd',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Smartphone size={12} color="#60a5fa" />
            <span>Device Viewport</span>
          </button>
        )}

        {/* Exit Button */}
        <button
          type="button"
          onClick={onExitSimulation}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            backgroundColor: '#171c26',
            border: '1px solid #283142',
            borderRadius: 6,
            color: '#d0dae7',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <X size={13} /> Exit
        </button>
      </div>

      {/* Active Step Telemetry Card */}
      {currentStep && (
        <div
          style={{
            width: 480,
            backgroundColor: '#080a0e',
            border: '1px solid #202736',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
              {currentStep.title}
            </span>
            {currentStep.protocol && (
              <span
                style={{
                  fontSize: 10,
                  backgroundColor: '#101520',
                  color: '#93a1b5',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                }}
              >
                {currentStep.protocol}
              </span>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#9ba7b8', lineHeight: 1.35 }}>
            {currentStep.description}
          </p>

          {(currentStep.payload || currentStep.response) && (
            <div
              style={{
                backgroundColor: '#040507',
                borderRadius: 5,
                border: '1px solid #181d28',
                padding: '6px 8px',
                fontFamily: 'monospace',
                fontSize: 10,
                color: '#8291a5',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {currentStep.payload && <div>→ Outbound: {currentStep.payload}</div>}
              {currentStep.response && <div style={{ color: '#10b981' }}>← Returned: {currentStep.response}</div>}
            </div>
          )}

          <div style={{ fontSize: 9, color: '#525d6e', textAlign: 'center', marginTop: 2 }}>
            {isWireframe
              ? 'ⓘ Interactive prototype simulation: navigating between connected screens and UI states.'
              : 'ⓘ Illustrative data flow simulation. Logical diagram routing trace only.'}
          </div>
        </div>
      )}
    </div>
  );
};

const actionBtnStyle = (color: string): React.CSSProperties => ({
  width: 26,
  height: 26,
  borderRadius: 5,
  border: 'none',
  backgroundColor: '#131822',
  color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'transform 0.1s ease',
});
