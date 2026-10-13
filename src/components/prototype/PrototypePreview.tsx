import React, { useState } from 'react';
import { Board, CanvasElement } from '../../types';
import { ThemeColors } from '../../styles/theme';
import {
  ArrowLeft,
  X,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Smartphone,
  Layout,
  CheckCircle,
} from 'lucide-react';
import { ElementRenderer } from '../canvas/ElementRenderer';

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

  const displayedBoard = allBoards.find((b) => b.id === currentBoardId) || board;

  // Find primary frame element (Desktop or Mobile)
  const frameEl = displayedBoard.elements.find(
    (el) => el.type === 'frame-desktop' || el.type === 'frame-mobile'
  );

  const handleElementClick = (el: CanvasElement) => {
    if (!el.prototypeAction || el.prototypeAction === 'none') {
      // Default fallback interaction if no explicit action set
      if (el.type === 'button') {
        showToast(`Clicked: "${el.label || 'Button'}" (No action assigned)`);
      }
      return;
    }

    if (el.prototypeAction === 'navigate' && el.prototypeTarget) {
      setHistoryStack((prev) => [...prev, el.prototypeTarget!]);
      setCurrentBoardId(el.prototypeTarget);
      showToast(`Navigated to board: ${el.prototypeTarget}`);
    } else if (el.prototypeAction === 'modal') {
      setActiveOverlay(el.prototypePayload || el.label || 'Interactive Dialog Sheet');
    } else if (el.prototypeAction === 'back') {
      if (historyStack.length > 1) {
        const next = [...historyStack];
        next.pop();
        const prevId = next[next.length - 1];
        setHistoryStack(next);
        setCurrentBoardId(prevId);
        showToast('Navigated Back');
      } else {
        showToast('Already at the first screen');
      }
    } else if (el.prototypeAction === 'alert') {
      showToast(el.prototypePayload || `Action triggered by ${el.label}`);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
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
          backgroundColor: '#090a0d',
          borderBottom: '1px solid #1a1e28',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
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
              backgroundColor: '#131620',
              border: '1px solid #242938',
              borderRadius: 6,
              color: '#f0f4f9',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
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
            INTERACTIVE PREVIEW
          </span>
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

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              setCurrentBoardId(board.id);
              setHistoryStack([board.id]);
              setActiveOverlay(null);
            }}
            title="Reset Prototype"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              backgroundColor: '#131620',
              border: '1px solid #242938',
              borderRadius: 6,
              color: '#8b96a8',
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
          padding: 24,
          position: 'relative',
        }}
      >
        {/* Rendered Frame Area */}
        {frameEl ? (
          <div
            style={{
              position: 'relative',
              width: frameEl.width,
              height: frameEl.height,
              boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
              borderRadius: frameEl.cornerRadius || 12,
              overflow: 'hidden',
            }}
          >
            {/* Background elements */}
            {displayedBoard.elements.map((el) => {
              if (el.hidden) return null;
              const isInteractive = el.type === 'button' || el.prototypeAction;

              // Compute offset relative to frame if nested
              const relX = el.id === frameEl.id ? 0 : el.x - frameEl.x;
              const relY = el.id === frameEl.id ? 0 : el.y - frameEl.y;

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
                    zIndex: el.id === frameEl.id ? 1 : 2,
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
          /* Fallback for freeform elements */
          <div style={{ position: 'relative', width: 900, height: 600 }}>
            {displayedBoard.elements.map((el) => (
              <div
                key={el.id}
                onClick={() => handleElementClick(el)}
                style={{
                  position: 'absolute',
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  cursor: el.type === 'button' ? 'pointer' : 'default',
                }}
              >
                <ElementRenderer element={el} isSelected={false} />
              </div>
            ))}
          </div>
        )}

        {/* Modal Overlay if active */}
        {activeOverlay && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 30,
            }}
            onClick={() => setActiveOverlay(null)}
          >
            <div
              style={{
                width: 360,
                backgroundColor: '#12151d',
                border: '1px solid #2d3647',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 16px 40px rgba(0,0,0,0.8)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{activeOverlay}</h4>
                <button
                  type="button"
                  onClick={() => setActiveOverlay(null)}
                  style={{ background: 'none', border: 'none', color: '#8895a6', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <p style={{ fontSize: 12, color: '#9ba7b8', lineHeight: 1.45 }}>
                Interactive modal overlay sheet triggered from prototype wireframe action.
              </p>

              <button
                type="button"
                onClick={() => setActiveOverlay(null)}
                style={{
                  alignSelf: 'flex-end',
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
                Dismiss Sheet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
