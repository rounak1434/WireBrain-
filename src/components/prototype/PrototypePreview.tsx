import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Board, CanvasElement, Connector, SimulationScenario, SimulationStep } from '../../types';
import { ThemeColors } from '../../styles/theme';
import {
  ArrowLeft,
  X,
  RotateCcw,
  Smartphone,
  Layout,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  ChevronRight,
  Play,
  Pause,
  SkipForward,
  Activity,
} from 'lucide-react';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { ConnectorRenderer } from '../canvas/ConnectorRenderer';
import { getBoundingBox } from '../../utils/geometry';
import { getScenariosForBoard } from '../../utils/simulation';

interface PrototypePreviewProps {
  board: Board;
  allBoards: Board[];
  onExit: () => void;
  theme: ThemeColors;
  initialMode?: 'interactive' | 'simulate';
}

export const PrototypePreview: React.FC<PrototypePreviewProps> = ({
  board,
  allBoards,
  onExit,
  theme,
  initialMode = 'interactive',
}) => {
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [historyStack, setHistoryStack] = useState<string[]>([board.id]);
  const [currentBoardId, setCurrentBoardId] = useState(board.id);
  const [activeFrameId, setActiveFrameId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'focused' | 'canvas'>('focused');
  const [zoom, setZoom] = useState(1);

  const displayedBoard = allBoards.find((b) => b.id === currentBoardId) || board;

  // Find all frames (desktop or mobile) on the board
  const frames = useMemo(() => {
    return displayedBoard.elements.filter(
      (el) => el.type === 'frame-desktop' || el.type === 'frame-mobile'
    );
  }, [displayedBoard.elements]);

  // Default active frame to the first frame if not selected
  useEffect(() => {
    if (frames.length > 0 && (!activeFrameId || !frames.some((f) => f.id === activeFrameId))) {
      setActiveFrameId(frames[0].id);
    }
  }, [frames, activeFrameId]);

  const activeFrame = useMemo(() => {
    return frames.find((f) => f.id === activeFrameId) || frames[0] || null;
  }, [frames, activeFrameId]);

  // Elements belonging to the active frame (with robust boundary matching)
  const focusedElements = useMemo(() => {
    if (!activeFrame) return displayedBoard.elements;

    return displayedBoard.elements.filter((el) => {
      if (el.id === activeFrame.id) return true;
      // Do not include other top-level frames in the single frame focused view
      if (el.type === 'frame-desktop' || el.type === 'frame-mobile') return false;

      // Belonging check: Center point inside frame bounds OR boundary overlap
      const elCenterX = el.x + el.width / 2;
      const elCenterY = el.y + el.height / 2;
      const centerInFrame =
        elCenterX >= activeFrame.x - 10 &&
        elCenterX <= activeFrame.x + activeFrame.width + 10 &&
        elCenterY >= activeFrame.y - 10 &&
        elCenterY <= activeFrame.y + activeFrame.height + 10;

      const boundsOverlap =
        el.x >= activeFrame.x - 30 &&
        el.x + el.width <= activeFrame.x + activeFrame.width + 30 &&
        el.y >= activeFrame.y - 30 &&
        el.y + el.height <= activeFrame.y + activeFrame.height + 30;

      return centerInFrame || boundsOverlap;
    });
  }, [displayedBoard.elements, activeFrame]);

  // Map elements for connector rendering
  const elementsById = useMemo(() => {
    const map = new Map<string, CanvasElement>();
    displayedBoard.elements.forEach((el) => map.set(el.id, el));
    return map;
  }, [displayedBoard.elements]);

  // Prototype Simulation State
  const scenarios = useMemo(() => getScenariosForBoard(displayedBoard), [displayedBoard]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>(() => scenarios[0]?.id || '');
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(() => initialMode === 'simulate');
  const [simStepIndex, setSimStepIndex] = useState<number>(0);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  useEffect(() => {
    if (scenarios.length > 0 && !scenarios.some((s) => s.id === activeScenarioId)) {
      setActiveScenarioId(scenarios[0].id);
      setSimStepIndex(0);
    }
  }, [scenarios, activeScenarioId]);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) || scenarios[0] || null,
    [scenarios, activeScenarioId]
  );

  const currentStep =
    activeScenario && activeScenario.steps.length > 0
      ? activeScenario.steps[Math.min(simStepIndex, activeScenario.steps.length - 1)]
      : null;

  // Auto-play interval for prototype flow simulation
  useEffect(() => {
    if (!isSimPlaying || !activeScenario || activeScenario.steps.length === 0) return;

    const intervalMs = Math.round(2500 / simSpeed);
    const timer = setInterval(() => {
      setSimStepIndex((prev) => {
        const next = prev + 1 >= activeScenario.steps.length ? 0 : prev + 1;
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimPlaying, activeScenario, simSpeed]);

  // Synchronize screen view and overlays when simulation steps change
  useEffect(() => {
    if (!currentStep) return;

    // Resolve target screen frame
    let targetFrame = frames.find((f) => f.id === currentStep.targetNodeId);
    if (!targetFrame) {
      const targetElement = displayedBoard.elements.find((e) => e.id === currentStep.targetNodeId);
      if (targetElement) {
        targetFrame = frames.find(
          (f) =>
            targetElement.x >= f.x - 30 &&
            targetElement.x + targetElement.width <= f.x + f.width + 30 &&
            targetElement.y >= f.y - 30 &&
            targetElement.y + targetElement.height <= f.y + f.height + 30
        );
      }
    }

    if (targetFrame && targetFrame.id !== activeFrameId) {
      setActiveFrameId(targetFrame.id);
    }

    // Modal check
    const sourceEl = displayedBoard.elements.find((e) => e.id === currentStep.sourceNodeId);
    if (sourceEl?.prototypeAction === 'modal') {
      setActiveOverlay(sourceEl.prototypePayload || 'Interactive Sheet');
    } else if (!sourceEl || sourceEl.prototypeAction !== 'modal') {
      setActiveOverlay(null);
    }
  }, [currentStep, frames, displayedBoard.elements]);

  const handleStepForward = () => {
    if (!activeScenario || activeScenario.steps.length === 0) return;
    setIsSimPlaying(false);
    setSimStepIndex((s) => (s + 1 >= activeScenario.steps.length ? 0 : s + 1));
  };

  const handleRestart = () => {
    setCurrentBoardId(board.id);
    setHistoryStack([board.id]);
    setSimStepIndex(0);
    setIsSimPlaying(false);
    if (frames.length > 0) setActiveFrameId(frames[0].id);
    setActiveOverlay(null);
    showToast('Prototype reset to initial state');
  };

  // Handle interactions on prototype elements
  const handleElementClick = (el: CanvasElement) => {
    if (!el.prototypeAction || el.prototypeAction === 'none') {
      if (el.type === 'button') {
        showToast(`Clicked: "${el.label || 'Action'}"`);
      }
      return;
    }

    if (el.prototypeAction === 'navigate' && el.prototypeTarget) {
      // 1. Check if target is another board
      const targetBoard = allBoards.find((b) => b.id === el.prototypeTarget);
      if (targetBoard) {
        setHistoryStack((prev) => [...prev, targetBoard.id]);
        setCurrentBoardId(targetBoard.id);
        showToast(`Navigated to: ${targetBoard.title}`);
        return;
      }

      // 2. Check if target is a frame / screen on the current board
      let targetFrame = frames.find((f) => f.id === el.prototypeTarget);

      // 3. If target is an element inside another frame, transition to that containing frame
      if (!targetFrame) {
        const targetElement = displayedBoard.elements.find((e) => e.id === el.prototypeTarget);
        if (targetElement) {
          targetFrame = frames.find(
            (f) =>
              targetElement.x >= f.x - 30 &&
              targetElement.x + targetElement.width <= f.x + f.width + 30 &&
              targetElement.y >= f.y - 30 &&
              targetElement.y + targetElement.height <= f.y + f.height + 30
          );
        }
      }

      if (targetFrame) {
        setActiveFrameId(targetFrame.id);
        showToast(`Transitioned to: ${targetFrame.label || 'Screen'}`);
        return;
      }

      showToast(`Navigated to target: ${el.prototypeTarget}`);
    } else if (el.prototypeAction === 'modal') {
      setActiveOverlay(el.prototypePayload || el.label || 'Interactive Sheet');
    } else if (el.prototypeAction === 'back') {
      if (historyStack.length > 1) {
        const next = [...historyStack];
        next.pop();
        const prevId = next[next.length - 1];
        setHistoryStack(next);
        setCurrentBoardId(prevId);
        showToast('Navigated Back');
      } else if (frames.length > 1 && activeFrame && frames[0].id !== activeFrame.id) {
        setActiveFrameId(frames[0].id);
        showToast('Returned to main screen');
      } else {
        showToast('Already at root view');
      }
    } else if (el.prototypeAction === 'alert') {
      showToast(el.prototypePayload || `Action triggered by ${el.label}`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2500);
  };

  const handleFitScreen = () => {
    setZoom(1);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#040507',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Prototype Navigation Bar */}
      <div
        style={{
          height: 48,
          backgroundColor: '#07090d',
          borderBottom: '1px solid #1a1e28',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              backgroundColor: '#11151f',
              border: '1px solid #232938',
              borderRadius: 6,
              color: '#f0f4f9',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowLeft size={14} />
            <span>Exit Prototype</span>
          </button>

          <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
            {displayedBoard.title}
          </span>

          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#3b82f6',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            PROTOTYPE PREVIEW
          </span>
        </div>

        {/* Center: Multi-Screen Switcher & Prototype Flow Simulation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Screen Switcher for multi-screen boards */}
          {frames.length > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#0d1017',
                padding: '3px 6px',
                borderRadius: 6,
                border: '1px solid #1c2230',
              }}
            >
              {frames.map((fr, idx) => {
                const isSelected = activeFrame?.id === fr.id;
                return (
                  <button
                    key={fr.id}
                    type="button"
                    onClick={() => {
                      setActiveFrameId(fr.id);
                      setViewMode('focused');
                    }}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: isSelected ? '#1e293b' : 'transparent',
                      color: isSelected ? '#38bdf8' : '#7f8ea3',
                      cursor: 'pointer',
                    }}
                  >
                    {fr.type === 'frame-mobile' ? '📱 ' : '💻 '}
                    {fr.label || `Screen ${idx + 1}`}
                  </button>
                );
              })}

              <div style={{ width: 1, height: 16, backgroundColor: '#202636', margin: '0 4px' }} />

              <button
                type="button"
                onClick={() => setViewMode((m) => (m === 'focused' ? 'canvas' : 'focused'))}
                title="Toggle Full Canvas Flow"
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  backgroundColor: viewMode === 'canvas' ? '#172554' : 'transparent',
                  color: viewMode === 'canvas' ? '#60a5fa' : '#8b9bb4',
                  cursor: 'pointer',
                }}
              >
                All Screens Flow
              </button>
            </div>
          )}

          {/* Prototype Simulation Controls in Preview */}
          {activeScenario && activeScenario.steps.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#0c1018',
                border: '1px solid #1f2b3e',
                padding: '3px 10px',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Activity size={13} color={isSimPlaying ? '#10b981' : '#38bdf8'} />
                <select
                  value={activeScenarioId}
                  onChange={(e) => {
                    setActiveScenarioId(e.target.value);
                    setSimStepIndex(0);
                  }}
                  style={{
                    backgroundColor: '#121824',
                    border: '1px solid #25334c',
                    borderRadius: 4,
                    padding: '3px 6px',
                    color: '#e2edfc',
                    fontSize: 11,
                    fontWeight: 600,
                    outline: 'none',
                    maxWidth: 180,
                  }}
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setIsSimPlaying((p) => !p)}
                  title={isSimPlaying ? 'Pause Flow' : 'Play Flow'}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: 'none',
                    backgroundColor: isSimPlaying ? '#ef4444' : '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {isSimPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>

                <button
                  type="button"
                  onClick={handleStepForward}
                  title="Next Step in Flow"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: 'none',
                    backgroundColor: '#1f293d',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <SkipForward size={12} />
                </button>
              </div>

              <span
                style={{
                  fontSize: 11,
                  color: '#8b9bb4',
                  fontVariantNumeric: 'tabular-nums',
                  padding: '0 4px',
                }}
              >
                Step {simStepIndex + 1}/{activeScenario.steps.length}
              </span>
            </div>
          )}
        </div>

        {/* Action toast */}
        {toastMessage && (
          <div
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              backgroundColor: '#1b2434',
              border: '1px solid #3b82f6',
              color: '#e2edfc',
              fontSize: 11,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}
          >
            <CheckCircle size={13} color="#10b981" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Zoom & Restart Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
            title="Zoom Out"
            style={{
              padding: '5px',
              backgroundColor: '#11151f',
              border: '1px solid #232938',
              borderRadius: 5,
              color: '#8b9bb4',
              cursor: 'pointer',
            }}
          >
            <ZoomOut size={13} />
          </button>
          <span
            style={{
              fontSize: 11,
              color: '#94a3b8',
              fontVariantNumeric: 'tabular-nums',
              width: 38,
              textAlign: 'center',
            }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
            title="Zoom In"
            style={{
              padding: '5px',
              backgroundColor: '#11151f',
              border: '1px solid #232938',
              borderRadius: 5,
              color: '#8b9bb4',
              cursor: 'pointer',
            }}
          >
            <ZoomIn size={13} />
          </button>

          <button
            type="button"
            onClick={handleFitScreen}
            title="Reset Zoom to 100%"
            style={{
              padding: '5px 8px',
              backgroundColor: '#11151f',
              border: '1px solid #232938',
              borderRadius: 5,
              color: '#8b9bb4',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            100%
          </button>

          <div style={{ width: 1, height: 18, backgroundColor: '#1c2230', margin: '0 4px' }} />

          <button
            type="button"
            onClick={handleRestart}
            title="Restart Prototype Flow"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '5px 10px',
              backgroundColor: '#11151f',
              border: '1px solid #232938',
              borderRadius: 6,
              color: '#8b9bb4',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: 32,
          position: 'relative',
        }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease',
          }}
        >
          {/* FOCUSED SCREEN VIEW (Single Frame mode) */}
          {viewMode === 'focused' && activeFrame ? (
            <div
              style={{
                position: 'relative',
                width: activeFrame.width,
                height: activeFrame.height,
                boxShadow: '0 24px 72px rgba(0,0,0,0.85), 0 0 1px rgba(255,255,255,0.1)',
                borderRadius: activeFrame.cornerRadius || (activeFrame.type === 'frame-mobile' ? 36 : 12),
                overflow: 'hidden',
                backgroundColor: activeFrame.fillColor || '#07090e',
              }}
            >
              {focusedElements.map((el) => {
                if (el.hidden) return null;
                const isInteractive = el.type === 'button' || Boolean(el.prototypeAction);
                const isStepActive =
                  currentStep?.sourceNodeId === el.id || currentStep?.targetNodeId === el.id;

                // Compute offset relative to active frame
                const relX = el.id === activeFrame.id ? 0 : el.x - activeFrame.x;
                const relY = el.id === activeFrame.id ? 0 : el.y - activeFrame.y;

                return (
                  <div
                    key={el.id}
                    onClick={() => handleElementClick(el)}
                    style={{
                      position: 'absolute',
                      left: relX,
                      top: relY,
                      width: el.width,
                      height: el.height,
                      cursor: isInteractive ? 'pointer' : 'default',
                      zIndex: el.id === activeFrame.id ? 1 : 2,
                      transition: 'transform 0.1s ease, box-shadow 0.2s ease',
                      boxShadow: isStepActive ? '0 0 18px rgba(56, 189, 248, 0.75)' : 'none',
                      outline: isStepActive ? '2px solid #38bdf8' : 'none',
                      borderRadius: el.cornerRadius || 4,
                    }}
                    onMouseEnter={(e) => {
                      if (isInteractive) e.currentTarget.style.transform = 'scale(0.99)';
                    }}
                    onMouseLeave={(e) => {
                      if (isInteractive) e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <ElementRenderer element={el} isSelected={false} />
                  </div>
                );
              })}
            </div>
          ) : (
            /* ALL SCREENS / FULL CANVAS FLOW VIEW (with connectors) */
            <div
              style={{
                position: 'relative',
                width: Math.max(...displayedBoard.elements.map((e) => e.x + e.width), 900) + 60,
                height: Math.max(...displayedBoard.elements.map((e) => e.y + e.height), 600) + 60,
              }}
            >
              {/* Connectors SVG Layer */}
              <svg
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                {displayedBoard.connectors.map((c) => (
                  <ConnectorRenderer
                    key={c.id}
                    connector={c}
                    elementsById={elementsById}
                    isSelected={false}
                  />
                ))}
              </svg>

              {/* Elements Layer in Flow View */}
              {displayedBoard.elements.map((el) => {
                if (el.hidden) return null;
                const isInteractive = el.type === 'button' || Boolean(el.prototypeAction);
                const isFrame = el.type === 'frame-desktop' || el.type === 'frame-mobile';
                const isSelectedFrame = isFrame && activeFrame?.id === el.id;

                return (
                  <div
                    key={el.id}
                    onClick={() => {
                      if (isFrame) {
                        setActiveFrameId(el.id);
                        setViewMode('focused');
                      } else {
                        handleElementClick(el);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      cursor: isInteractive || isFrame ? 'pointer' : 'default',
                      zIndex: isFrame ? 1 : 3,
                      transition: 'transform 0.1s ease',
                      outline: isSelectedFrame ? '2px solid #38bdf8' : 'none',
                      outlineOffset: 2,
                    }}
                    onMouseEnter={(e) => {
                      if (isInteractive) e.currentTarget.style.transform = 'scale(0.99)';
                    }}
                    onMouseLeave={(e) => {
                      if (isInteractive) e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <ElementRenderer element={el} isSelected={false} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step Telemetry Floating Card */}
        {currentStep && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 60,
              backgroundColor: 'rgba(8, 11, 16, 0.95)',
              border: '1px solid #233148',
              borderRadius: 10,
              padding: '10px 18px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.85), 0 0 20px rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              maxWidth: 620,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {simStepIndex + 1}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
                  {currentStep.title}
                </span>
                {currentStep.protocol && (
                  <span
                    style={{
                      fontSize: 10,
                      backgroundColor: '#131b28',
                      color: '#60a5fa',
                      padding: '1px 6px',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                    }}
                  >
                    {currentStep.protocol}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: '#94a3b8',
                  lineHeight: 1.35,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentStep.description}
              </p>
            </div>

            <button
              type="button"
              onClick={handleStepForward}
              style={{
                padding: '5px 12px',
                borderRadius: 5,
                backgroundColor: '#1d273a',
                border: '1px solid #33435f',
                color: '#e2edfc',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Next Step →
            </button>
          </div>
        )}

        {/* Interactive Modal Sheet Overlay */}
        {activeOverlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
            }}
            onClick={() => setActiveOverlay(null)}
          >
            <div
              style={{
                width: 380,
                backgroundColor: '#0a0d14',
                border: '1px solid #283347',
                borderRadius: 12,
                padding: '20px 24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                  {activeOverlay}
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveOverlay(null)}
                  style={{ background: 'none', border: 'none', color: '#8895a6', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <p style={{ margin: 0, fontSize: 12, color: '#9ba7b8', lineHeight: 1.5 }}>
                Interactive dialog overlay sheet triggered from the active wireframe prototype action.
              </p>

              <div
                style={{
                  backgroundColor: '#040609',
                  border: '1px solid #1a2233',
                  borderRadius: 6,
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ fontSize: 11, color: '#64748b' }}>Action details:</div>
                <div style={{ fontSize: 12, color: '#60a5fa', fontFamily: 'monospace' }}>
                  prototypeAction: "modal"
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setActiveOverlay(null)}
                  style={{
                    padding: '7px 14px',
                    backgroundColor: '#161e2e',
                    border: '1px solid #273449',
                    borderRadius: 6,
                    color: '#cbd5e1',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveOverlay(null);
                    showToast('Confirmed action in sheet');
                  }}
                  style={{
                    padding: '7px 16px',
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Confirm & Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
