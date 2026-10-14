import React, { useState, useRef, useEffect } from 'react';
import {
  MousePointer,
  Hand,
  Spline,
  Layout,
  Smartphone,
  Square,
  Circle,
  Diamond,
  Database,
  Cloud,
  Type,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Magnet,
  Download,
  Upload,
  ChevronDown,
  Layers,
  FileJson,
  FileImage,
  Code2,
  Play,
  Activity,
  Server,
  Workflow,
  GitBranch,
} from 'lucide-react';
import { Board, ToolMode, EditorMode } from '../../types';
import { ThemeColors } from '../../styles/theme';

interface TopToolbarProps {
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (id: string) => void;
  toolMode: ToolMode;
  onSelectTool: (mode: ToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitContent: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  theme: ThemeColors;
  editorMode: EditorMode;
  onSetEditorMode: (mode: EditorMode) => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  boards,
  activeBoardId,
  onSelectBoard,
  toolMode,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitContent,
  snapToGrid,
  onToggleSnap,
  onExportJSON,
  onImportJSON,
  onExportSVG,
  onExportPNG,
  theme,
  editorMode,
  onSetEditorMode,
}) => {
  const [boardMenuOpen, setBoardMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const boardMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  const isWireframeBoard =
    activeBoard &&
    (activeBoard.boardType === 'website' ||
      activeBoard.boardType === 'mobile' ||
      activeBoard.id.includes('web') ||
      activeBoard.id.includes('mob') ||
      activeBoard.elements.some((el) => el.type === 'frame-desktop' || el.type === 'frame-mobile'));


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boardMenuRef.current && !boardMenuRef.current.contains(e.target as Node)) {
        setBoardMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      aria-label="Top Toolbar"
      style={{
        height: 48,
        backgroundColor: theme.panelBg,
        borderBottom: `1px solid ${theme.borderSubtle}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'relative',
        zIndex: 50,
        overflow: 'visible',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Left: Active Board Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div ref={boardMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            data-testid="board-switcher-trigger"
            onClick={() => setBoardMenuOpen(!boardMenuOpen)}
            title={activeBoard ? `Active Board: ${activeBoard.title}` : 'Select Board'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: theme.surfaceBg,
              border: `1px solid ${theme.borderStrong}`,
              borderRadius: 6,
              padding: '5px 10px',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              maxWidth: 220,
              transition: 'background-color 0.12s ease, border-color 0.12s ease',
            }}
          >
            <Layers size={14} color={theme.accent} style={{ flexShrink: 0 }} />
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 150,
                display: 'inline-block',
              }}
            >
              {activeBoard ? activeBoard.title : 'Select Board'}
            </span>
            <ChevronDown size={13} color={theme.textMuted} style={{ flexShrink: 0 }} />
          </button>

          {boardMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                minWidth: 260,
                maxWidth: 'min(380px, calc(100vw - 32px))',
                width: 'max-content',
                maxHeight: 'min(420px, calc(100vh - 64px))',
                overflowY: 'auto',
                overflowX: 'hidden',
                backgroundColor: theme.panelBg,
                border: `1px solid ${theme.borderStrong}`,
                borderRadius: 8,
                padding: 6,
                boxShadow: '0 16px 36px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                zIndex: 100,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px 6px',
                  borderBottom: `1px solid ${theme.borderSubtle}`,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: theme.textMuted,
                  }}
                >
                  Switch Board ({boards.length})
                </span>
                <span style={{ fontSize: 10, color: theme.accent, fontWeight: 600 }}>Active</span>
              </div>
              {boards.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  title={b.title}
                  data-board-id={b.id}
                  data-testid={`board-dropdown-item-${b.id}`}
                  onClick={() => {
                    onSelectBoard(b.id);
                    setBoardMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 5,
                    border: 'none',
                    backgroundColor: b.id === activeBoardId ? theme.surfaceActive : 'transparent',
                    color: b.id === activeBoardId ? theme.accent : theme.textSecondary,
                    fontSize: 12,
                    fontWeight: b.id === activeBoardId ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    width: '100%',
                    gap: 10,
                    boxSizing: 'border-box',
                    transition: 'background-color 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (b.id !== activeBoardId) {
                      e.currentTarget.style.backgroundColor = theme.surfaceHover;
                      e.currentTarget.style.color = '#ffffff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (b.id !== activeBoardId) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = theme.textSecondary;
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <span style={{ color: b.id === activeBoardId ? theme.accent : theme.textMuted, flexShrink: 0 }}>
                      {b.id.includes('web') || b.boardType === 'website' ? (
                        <Layout size={14} />
                      ) : b.id.includes('mob') || b.boardType === 'mobile' ? (
                        <Smartphone size={14} />
                      ) : b.id.includes('flow') || b.boardType === 'flowchart' ? (
                        <Workflow size={14} />
                      ) : (
                        <Server size={14} />
                      )}
                    </span>
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      {b.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: b.id === activeBoardId ? theme.accent : theme.textMuted,
                      flexShrink: 0,
                      backgroundColor: b.id === activeBoardId ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                      padding: '2px 6px',
                      borderRadius: 10,
                    }}
                  >
                    {b.elements.length} items
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ToolButton
            theme={theme}
            icon={<Undo2 size={15} />}
            tooltip="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onClick={onUndo}
          />
          <ToolButton
            theme={theme}
            icon={<Redo2 size={15} />}
            tooltip="Redo (Ctrl+Y)"
            disabled={!canRedo}
            onClick={onRedo}
          />
        </div>
      </div>

      {/* Center: Tools selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: '#000000',
          padding: 3,
          borderRadius: 8,
          border: `1px solid ${theme.borderSubtle}`,
        }}
      >
        <ToolButton
          theme={theme}
          icon={<MousePointer size={15} />}
          tooltip="Select & Move (V)"
          isActive={toolMode === 'select'}
          onClick={() => onSelectTool('select')}
        />
        <ToolButton
          theme={theme}
          icon={<Hand size={15} />}
          tooltip="Pan Canvas (H / Space)"
          isActive={toolMode === 'pan'}
          onClick={() => onSelectTool('pan')}
        />
        <ToolButton
          theme={theme}
          icon={<Spline size={15} />}
          tooltip="Connector Arrow (C)"
          isActive={toolMode === 'connector'}
          onClick={() => onSelectTool('connector')}
        />
        <div style={{ width: 1, height: 16, backgroundColor: theme.borderStrong, margin: '0 4px' }} />
        <ToolButton
          theme={theme}
          icon={<Layout size={15} />}
          tooltip="Website Desktop Frame (W)"
          isActive={toolMode === 'frame-desktop'}
          onClick={() => onSelectTool('frame-desktop')}
        />
        <ToolButton
          theme={theme}
          icon={<Smartphone size={15} />}
          tooltip="Mobile Phone Frame (M)"
          isActive={toolMode === 'frame-mobile'}
          onClick={() => onSelectTool('frame-mobile')}
        />
        <ToolButton
          theme={theme}
          icon={<Square size={15} />}
          tooltip="Box / Rectangle (R)"
          isActive={toolMode === 'rectangle'}
          onClick={() => onSelectTool('rectangle')}
        />
        <ToolButton
          theme={theme}
          icon={<Circle size={15} />}
          tooltip="Ellipse / Terminal (O)"
          isActive={toolMode === 'ellipse'}
          onClick={() => onSelectTool('ellipse')}
        />
        <ToolButton
          theme={theme}
          icon={<Diamond size={15} />}
          tooltip="Decision Diamond (D)"
          isActive={toolMode === 'diamond'}
          onClick={() => onSelectTool('diamond')}
        />
        <ToolButton
          theme={theme}
          icon={<Database size={15} />}
          tooltip="Database Cylinder (B)"
          isActive={toolMode === 'cylinder'}
          onClick={() => onSelectTool('cylinder')}
        />
        <ToolButton
          theme={theme}
          icon={<Cloud size={15} />}
          tooltip="Cloud Resource (S)"
          isActive={toolMode === 'cloud'}
          onClick={() => onSelectTool('cloud')}
        />
        <ToolButton
          theme={theme}
          icon={<Type size={15} />}
          tooltip="Text Box (T)"
          isActive={toolMode === 'text'}
          onClick={() => onSelectTool('text')}
        />
      </div>

      {/* Right: Simulation/Preview Modes, Zoom, Snapping, Export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Simulate Mode Action: Accessible on ALL boards */}
        <button
          type="button"
          data-testid="toolbar-simulate-btn"
          onClick={() => onSetEditorMode(editorMode === 'simulate' ? 'edit' : 'simulate')}
          title={
            editorMode === 'simulate'
              ? 'Exit simulation mode (Esc)'
              : 'Simulate logical data flow or prototype navigation'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: editorMode === 'simulate' ? '#059669' : theme.surfaceBg,
            border: `1px solid ${editorMode === 'simulate' ? '#10b981' : theme.borderStrong}`,
            borderRadius: 6,
            padding: '5px 11px',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: editorMode === 'simulate' ? '0 0 12px rgba(16, 185, 129, 0.45)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Activity size={13} color={editorMode === 'simulate' ? '#ffffff' : '#38bdf8'} />
          <span>{editorMode === 'simulate' ? 'Exit Simulation' : 'Simulate'}</span>
        </button>

        {/* Prototype Preview Action: Available on wireframe boards */}
        {isWireframeBoard && (
          <button
            type="button"
            data-testid="toolbar-preview-btn"
            onClick={() => onSetEditorMode(editorMode === 'prototype' ? 'edit' : 'prototype')}
            title={
              editorMode === 'prototype'
                ? 'Exit interactive device preview (Esc)'
                : 'Interactive device & browser prototype preview'
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: editorMode === 'prototype' ? theme.accent : theme.surfaceBg,
              border: `1px solid ${editorMode === 'prototype' ? theme.accent : theme.borderStrong}`,
              borderRadius: 6,
              padding: '5px 11px',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: editorMode === 'prototype' ? '0 0 12px rgba(59, 130, 246, 0.45)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Play size={13} color={editorMode === 'prototype' ? '#ffffff' : '#60a5fa'} />
            <span>{editorMode === 'prototype' ? 'Exit Preview' : 'Preview'}</span>
          </button>
        )}

        {/* Snapping toggle */}
        <ToolButton
          theme={theme}
          icon={<Magnet size={15} />}
          tooltip={snapToGrid ? 'Snap to Grid: ON' : 'Snap to Grid: OFF'}
          isActive={snapToGrid}
          onClick={onToggleSnap}
        />

        {/* Zoom Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: theme.surfaceBg,
            border: `1px solid ${theme.borderSubtle}`,
            borderRadius: 6,
            padding: '2px 4px',
          }}
        >
          <ToolButton theme={theme} icon={<ZoomOut size={13} />} tooltip="Zoom Out" onClick={onZoomOut} />
          <button
            type="button"
            title="Reset to 100%"
            onClick={onResetZoom}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textPrimary,
              fontSize: 11,
              fontWeight: 600,
              padding: '0 6px',
              fontVariantNumeric: 'tabular-nums',
              cursor: 'pointer',
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <ToolButton theme={theme} icon={<ZoomIn size={13} />} tooltip="Zoom In" onClick={onZoomIn} />
          <ToolButton theme={theme} icon={<Maximize2 size={13} />} tooltip="Fit Content" onClick={onFitContent} />
        </div>

        {/* Export / Import Dropdown */}
        <div ref={exportMenuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: theme.accent,
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.35)',
            }}
          >
            <Download size={14} />
            <span>Export</span>
            <ChevronDown size={13} />
          </button>

          {exportMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                width: 200,
                backgroundColor: theme.panelBg,
                border: `1px solid ${theme.borderStrong}`,
                borderRadius: 8,
                padding: 6,
                boxShadow: '0 12px 32px rgba(0,0,0,0.85)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                zIndex: 100,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onExportPNG();
                  setExportMenuOpen(false);
                }}
                style={exportItemStyle(theme)}
              >
                <FileImage size={15} color="#38bdf8" />
                <span>Export as PNG Image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onExportSVG();
                  setExportMenuOpen(false);
                }}
                style={exportItemStyle(theme)}
              >
                <Code2 size={15} color="#fbbf24" />
                <span>Export as Vector SVG</span>
              </button>
              <div style={{ height: 1, backgroundColor: theme.borderSubtle, margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => {
                  onExportJSON();
                  setExportMenuOpen(false);
                }}
                style={exportItemStyle(theme)}
              >
                <FileJson size={15} color="#a855f7" />
                <span>Save Project (JSON)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onImportJSON();
                  setExportMenuOpen(false);
                }}
                style={exportItemStyle(theme)}
              >
                <Upload size={15} color="#22c55e" />
                <span>Load Project (JSON)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const exportItemStyle = (theme: ThemeColors): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 10px',
  borderRadius: 5,
  border: 'none',
  backgroundColor: 'transparent',
  color: theme.textPrimary,
  fontSize: 12,
  fontWeight: 500,
  textAlign: 'left',
  cursor: 'pointer',
});

interface ToolButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  theme: ThemeColors;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  tooltip,
  isActive,
  disabled,
  onClick,
  theme,
}) => {
  return (
    <button
      type="button"
      title={tooltip}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        border: 'none',
        backgroundColor: isActive ? theme.surfaceActive : 'transparent',
        color: disabled ? theme.textMuted : isActive ? theme.accent : theme.textSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.12s ease',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.backgroundColor = theme.surfaceHover;
          e.currentTarget.style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.textSecondary;
        }
      }}
    >
      {icon}
    </button>
  );
};
