import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Board, CanvasElement, Connector } from '../../types';
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
} from 'lucide-react';
import { ElementRenderer } from '../canvas/ElementRenderer';
import { ConnectorRenderer } from '../canvas/ConnectorRenderer';
import { getBoundingBox } from '../../utils/geometry';

interface PrototypePreviewProps {
  board: Board;
  allBoards: Board[];
  onExit: () => void;
  theme: ThemeColors;
}

export const PrototypePreview: React.FC<PrototypePreviewProps> = ({
  board,
  allBoards,
  onExit,
  theme,
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

  // Elements belonging to the active frame
  const focusedElements = useMemo(() => {
    if (!activeFrame) return displayedBoard.elements;

    return displayedBoard.elements.filter((el) => {
      if (el.id === activeFrame.id) return true;
      // Inside frame bounds
      return (
        el.x >= activeFrame.x - 20 &&
        el.x + el.width <= activeFrame.x + activeFrame.width + 20 &&
        el.y >= activeFrame.y - 20 &&
        el.y + el.height <= activeFrame.y + activeFrame.height + 20
      );
    });
  }, [displayedBoard.elements, activeFrame]);

  // Map elements for connector rendering
  const elementsById = useMemo(() => {
    const map = new Map<string, CanvasElement>();
    displayedBoard.elements.forEach((el) => map.set(el.id, el));
    return map;
  }, [displayedBoard.elements]);

  // Handle interactions on prototype elements
  const handleElementClick = (el: CanvasElement) => {
    if (!el.prototypeAction || el.prototypeAction === 'none') {
      if (el.type === 'button') {
        showToast(`Clicked: "${el.label || 'Action'}"`);
      }
      return;
    }

    if (el.prototypeAction === 'navigate' && el.prototypeTarget) {
      // Check if target is another board
      const targetBoard = allBoards.find((b) => b.id === el.prototypeTarget);
      if (targetBoard) {
        setHistoryStack((prev) => [...prev, targetBoard.id]);
        setCurrentBoardId(targetBoard.id);
        showToast(`Navigated to: ${targetBoard.title}`);
        return;
      }

      // Check if target is a frame / screen on the current board
      const targetFrame = frames.find((f) => f.id === el.prototypeTarget);
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
          <span style={{ fontSize: 11, color: '#94a3b8', fontVariantNumeric: 'tabular-nums', width: 38, textAlign: 'center' }}>
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
            onClick={() => {
              setCurrentBoardId(board.id);
              setHistoryStack([board.id]);
              if (frames.length > 0) setActiveFrameId(frames[0].id);
              setActiveOverlay(null);
            }}
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
                      transition: 'transform 0.1s ease',
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
                <defs>
                  <marker
                    id="arrow-end-proto"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                  </marker>
                </defs>
                {displayedBoard.connectors.map((conn) => (
                  <ConnectorRenderer
                    key={conn.id}
                    connector={{ ...conn, color: '#3b82f6' }}
                    elementsById={elementsById}
                    isSelected={false}
                    onSelect={() => {}}
                  />
                ))}
              </svg>

              {/* Elements Layer */}
              {displayedBoard.elements.map((el) => {
                if (el.hidden) return null;
                const isInteractive = el.type === 'button' || Boolean(el.prototypeAction);

                return (
                  <div
                    key={el.id}
                    onClick={() => handleElementClick(el)}
                    style={{
                      position: 'absolute',
                      left: el.x,
                      top: el.y,
                      width: el.width,
                      height: el.height,
                      cursor: isInteractive ? 'pointer' : 'default',
                      zIndex: el.type.startsWith('frame') ? 1 : 3,
                      transition: 'transform 0.1s ease',
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
