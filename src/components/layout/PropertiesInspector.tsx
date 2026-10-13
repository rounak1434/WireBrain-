import React from 'react';
import {
  CanvasElement,
  Connector,
  Board,
  ThemeMode,
  PrototypeActionType,
} from '../../types';
import { ThemeColors } from '../../styles/theme';
import {
  Trash2,
  Copy,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  Spline,
  ArrowRight,
  Sparkles,
  Play,
  Moon,
} from 'lucide-react';

interface PropertiesInspectorProps {
  board: Board;
  allBoards: Board[];
  selectedElements: CanvasElement[];
  selectedConnector: Connector | null;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onUpdateConnector: (id: string, updates: Partial<Connector>) => void;
  onDeleteElements: (ids: string[]) => void;
  onDeleteConnector: (id: string) => void;
  onDuplicateElements: (elements: CanvasElement[]) => void;
  onAlignElements: (type: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void;
  onDistributeElements: (direction: 'h' | 'v') => void;
  onUpdateBoardTitle: (title: string) => void;
  onUpdateBoardDesc: (desc: string) => void;
  theme: ThemeColors;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

const COLOR_SWATCHES = [
  '#000000',
  '#0e1015',
  '#141720',
  '#1e2430',
  '#ffffff',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  'transparent',
];

const STROKE_SWATCHES = [
  '#1c202a',
  '#282f3e',
  '#3d475c',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  'transparent',
];

export const PropertiesInspector: React.FC<PropertiesInspectorProps> = ({
  board,
  allBoards,
  selectedElements,
  selectedConnector,
  onUpdateElement,
  onUpdateConnector,
  onDeleteElements,
  onDeleteConnector,
  onDuplicateElements,
  onAlignElements,
  onDistributeElements,
  onUpdateBoardTitle,
  onUpdateBoardDesc,
  theme,
  themeMode,
  onToggleTheme,
}) => {
  const isMulti = selectedElements.length > 1;
  const single = selectedElements.length === 1 ? selectedElements[0] : null;

  return (
    <aside
      aria-label="Properties Inspector"
      style={{
        width: 280,
        backgroundColor: theme.panelBg,
        borderLeft: `1px solid ${theme.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.panelHeaderBg,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: theme.textMuted,
          }}
        >
          {single
            ? `${single.type.toUpperCase()}`
            : isMulti
            ? `${selectedElements.length} SELECTED`
            : selectedConnector
            ? 'CONNECTOR LINK'
            : 'BOARD PROPERTIES'}
        </span>

        {(single || isMulti) && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              title="Duplicate"
              onClick={() => onDuplicateElements(selectedElements)}
              style={iconBtnStyle}
            >
              <Copy size={13} color={theme.textMuted} />
            </button>
            <button
              type="button"
              title="Delete"
              onClick={() => onDeleteElements(selectedElements.map((el) => el.id))}
              style={{ ...iconBtnStyle, color: '#ef4444' }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {selectedConnector && (
          <button
            type="button"
            title="Delete Connector"
            onClick={() => onDeleteConnector(selectedConnector.id)}
            style={{ ...iconBtnStyle, color: '#ef4444' }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* CASE 1: Single Element Selected */}
        {single && (
          <>
            {/* Dimensions & Transform */}
            <Section title="Dimensions & Position" theme={theme}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <NumberInput
                  label="X"
                  value={Math.round(single.x)}
                  onChange={(v) => onUpdateElement(single.id, { x: v })}
                  theme={theme}
                />
                <NumberInput
                  label="Y"
                  value={Math.round(single.y)}
                  onChange={(v) => onUpdateElement(single.id, { y: v })}
                  theme={theme}
                />
                <NumberInput
                  label="W"
                  value={Math.round(single.width)}
                  onChange={(v) => onUpdateElement(single.id, { width: Math.max(10, v) })}
                  theme={theme}
                />
                <NumberInput
                  label="H"
                  value={Math.round(single.height)}
                  onChange={(v) => onUpdateElement(single.id, { height: Math.max(10, v) })}
                  theme={theme}
                />
              </div>
            </Section>

            {/* Typography / Content */}
            <Section title="Text & Content" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle(theme)}>Primary Label / Text</label>
                <textarea
                  rows={2}
                  value={single.label || ''}
                  onChange={(e) => onUpdateElement(single.id, { label: e.target.value })}
                  style={textareaStyle(theme)}
                />

                {(single.type === 'service' ||
                  single.type === 'cylinder' ||
                  single.type === 'cloud' ||
                  single.type === 'rectangle' ||
                  single.type === 'queue') && (
                  <>
                    <label style={labelStyle(theme)}>Secondary Description</label>
                    <input
                      type="text"
                      value={single.secondaryText || ''}
                      onChange={(e) => onUpdateElement(single.id, { secondaryText: e.target.value })}
                      style={inputStyle(theme)}
                    />
                  </>
                )}

                {single.type === 'frame-desktop' && (
                  <>
                    <label style={labelStyle(theme)}>Address Bar URL</label>
                    <input
                      type="text"
                      value={single.urlBar || ''}
                      onChange={(e) => onUpdateElement(single.id, { urlBar: e.target.value })}
                      style={inputStyle(theme)}
                    />
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  <NumberInput
                    label="Font Size"
                    value={single.fontSize || 14}
                    onChange={(v) => onUpdateElement(single.id, { fontSize: Math.max(8, v) })}
                    theme={theme}
                  />
                  <div>
                    <label style={labelStyle(theme)}>Weight</label>
                    <select
                      value={single.fontWeight || 'normal'}
                      onChange={(e) => onUpdateElement(single.id, { fontWeight: e.target.value as any })}
                      style={selectStyle(theme)}
                    >
                      <option value="normal">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semibold (600)</option>
                      <option value="700">Bold (700)</option>
                    </select>
                  </div>
                </div>
              </div>
            </Section>

            {/* Prototype Trigger Actions */}
            <Section title="Prototype Action" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle(theme)}>On Click Interaction</label>
                <select
                  value={single.prototypeAction || 'none'}
                  onChange={(e) =>
                    onUpdateElement(single.id, {
                      prototypeAction: e.target.value as PrototypeActionType,
                    })
                  }
                  style={selectStyle(theme)}
                >
                  <option value="none">None (Static element)</option>
                  <option value="navigate">Navigate to Board / Frame</option>
                  <option value="modal">Open Interactive Modal Sheet</option>
                  <option value="back">Go Back</option>
                  <option value="alert">Show Notification Toast</option>
                </select>

                {single.prototypeAction === 'navigate' && (
                  <>
                    <label style={labelStyle(theme)}>Target Board</label>
                    <select
                      value={single.prototypeTarget || ''}
                      onChange={(e) => onUpdateElement(single.id, { prototypeTarget: e.target.value })}
                      style={selectStyle(theme)}
                    >
                      <option value="">Select destination board...</option>
                      {allBoards.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {(single.prototypeAction === 'modal' || single.prototypeAction === 'alert') && (
                  <>
                    <label style={labelStyle(theme)}>Sheet Title / Message</label>
                    <input
                      type="text"
                      placeholder="e.g. Success Notification"
                      value={single.prototypePayload || ''}
                      onChange={(e) => onUpdateElement(single.id, { prototypePayload: e.target.value })}
                      style={inputStyle(theme)}
                    />
                  </>
                )}
              </div>
            </Section>

            {/* Fill Color */}
            <Section title="Fill Color" theme={theme}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onUpdateElement(single.id, { fillColor: c })}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: c === 'transparent' ? '#181b22' : c,
                      border: single.fillColor === c ? `2px solid ${theme.accent}` : `1px solid ${theme.borderStrong}`,
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    title={c}
                  >
                    {c === 'transparent' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: 0,
                          right: 0,
                          height: 1,
                          backgroundColor: '#ef4444',
                          transform: 'rotate(-45deg)',
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={single.fillColor}
                onChange={(e) => onUpdateElement(single.id, { fillColor: e.target.value })}
                style={inputStyle(theme)}
              />
            </Section>

            {/* Stroke / Border */}
            <Section title="Stroke & Border" theme={theme}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {STROKE_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onUpdateElement(single.id, { strokeColor: c })}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: c === 'transparent' ? '#181b22' : c,
                      border: single.strokeColor === c ? `2px solid ${theme.accent}` : `1px solid ${theme.borderStrong}`,
                      cursor: 'pointer',
                    }}
                    title={c}
                  />
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <NumberInput
                  label="Width"
                  value={single.strokeWidth}
                  onChange={(v) => onUpdateElement(single.id, { strokeWidth: Math.max(0, v) })}
                  theme={theme}
                />
                <NumberInput
                  label="Radius"
                  value={single.cornerRadius || 0}
                  onChange={(v) => onUpdateElement(single.id, { cornerRadius: Math.max(0, v) })}
                  theme={theme}
                />
              </div>
            </Section>
          </>
        )}

        {/* CASE 2: Multi-selection */}
        {isMulti && (
          <Section title="Alignment & Distribution" theme={theme}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  title="Align Left"
                  onClick={() => onAlignElements('left')}
                  style={toolActionBtnStyle(theme)}
                >
                  <AlignLeft size={15} /> Left
                </button>
                <button
                  type="button"
                  title="Align Center Horizontal"
                  onClick={() => onAlignElements('center-h')}
                  style={toolActionBtnStyle(theme)}
                >
                  <AlignCenter size={15} /> Center
                </button>
                <button
                  type="button"
                  title="Align Right"
                  onClick={() => onAlignElements('right')}
                  style={toolActionBtnStyle(theme)}
                >
                  <AlignRight size={15} /> Right
                </button>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  title="Align Top"
                  onClick={() => onAlignElements('top')}
                  style={toolActionBtnStyle(theme)}
                >
                  <AlignStartVertical size={15} /> Top
                </button>
                <button
                  type="button"
                  title="Align Middle"
                  onClick={() => onAlignElements('center-v')}
                  style={toolActionBtnStyle(theme)}
                >
                  <AlignCenterVertical size={15} /> Middle
                </button>
                <button
                  type="button"
                  title="Align Bottom"
                  onClick={() => onAlignElements('bottom')}
                  style={toolActionBtnStyle(theme)}
                >
                  <AlignEndVertical size={15} /> Bottom
                </button>
              </div>

              <div style={{ height: 1, backgroundColor: theme.borderSubtle, margin: '4px 0' }} />

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  title="Distribute Horizontally"
                  onClick={() => onDistributeElements('h')}
                  style={toolActionBtnStyle(theme)}
                >
                  Distribute X
                </button>
                <button
                  type="button"
                  title="Distribute Vertically"
                  onClick={() => onDistributeElements('v')}
                  style={toolActionBtnStyle(theme)}
                >
                  Distribute Y
                </button>
              </div>
            </div>
          </Section>
        )}

        {/* CASE 3: Connector Selected */}
        {selectedConnector && (
          <Section title="Connector Line Properties" theme={theme}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={labelStyle(theme)}>Line Style</label>
                <select
                  value={selectedConnector.style}
                  onChange={(e) =>
                    onUpdateConnector(selectedConnector.id, { style: e.target.value as any })
                  }
                  style={selectStyle(theme)}
                >
                  <option value="orthogonal">Orthogonal Right-Angle</option>
                  <option value="curved">Curved Bezier</option>
                  <option value="straight">Direct Straight</option>
                </select>
              </div>

              <div>
                <label style={labelStyle(theme)}>Label Text</label>
                <input
                  type="text"
                  value={selectedConnector.label || ''}
                  onChange={(e) => onUpdateConnector(selectedConnector.id, { label: e.target.value })}
                  placeholder="e.g. REST / HTTPS"
                  style={inputStyle(theme)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <NumberInput
                  label="Stroke Width"
                  value={selectedConnector.strokeWidth}
                  onChange={(v) =>
                    onUpdateConnector(selectedConnector.id, { strokeWidth: Math.max(1, v) })
                  }
                  theme={theme}
                />
                <div>
                  <label style={labelStyle(theme)}>Color</label>
                  <input
                    type="text"
                    value={selectedConnector.color}
                    onChange={(e) =>
                      onUpdateConnector(selectedConnector.id, { color: e.target.value })
                    }
                    style={inputStyle(theme)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={!!selectedConnector.dashed}
                    onChange={(e) =>
                      onUpdateConnector(selectedConnector.id, { dashed: e.target.checked })
                    }
                  />
                  Dashed
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={!!selectedConnector.arrowEnd}
                    onChange={(e) =>
                      onUpdateConnector(selectedConnector.id, { arrowEnd: e.target.checked })
                    }
                  />
                  End Arrow
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={!!selectedConnector.arrowStart}
                    onChange={(e) =>
                      onUpdateConnector(selectedConnector.id, { arrowStart: e.target.checked })
                    }
                  />
                  Start Arrow
                </label>
              </div>
            </div>
          </Section>
        )}

        {/* CASE 4: Nothing Selected (Board & App Theme Settings) */}
        {!single && !isMulti && !selectedConnector && (
          <>
            <Section title="Active Board" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle(theme)}>Board Title</label>
                <input
                  type="text"
                  value={board.title}
                  onChange={(e) => onUpdateBoardTitle(e.target.value)}
                  style={inputStyle(theme)}
                />

                <label style={labelStyle(theme)}>Description</label>
                <textarea
                  rows={3}
                  value={board.description || ''}
                  onChange={(e) => onUpdateBoardDesc(e.target.value)}
                  placeholder="Notes about this board..."
                  style={textareaStyle(theme)}
                />
              </div>
            </Section>

            {/* App Dark Theme Preference */}
            <Section title="Theme Preference" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: theme.surfaceBg,
                    border: `1px solid ${theme.borderStrong}`,
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Moon size={15} color={theme.accent} />
                    <span>Mode: {themeMode === 'pure-black' ? 'Pure Black (OLED)' : 'Midnight Obsidian'}</span>
                  </div>
                  <span style={{ fontSize: 11, color: theme.accent }}>Toggle</span>
                </button>
              </div>
            </Section>

            <Section title="Board Telemetry" theme={theme}>
              <div
                style={{
                  backgroundColor: theme.surfaceBg,
                  borderRadius: 6,
                  padding: 10,
                  fontSize: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  color: theme.textSecondary,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Elements Count:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{board.elements.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Connectors Count:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{board.connectors.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Format:</span>
                  <span style={{ color: theme.accent, fontWeight: 600 }}>Infinite Studio Canvas</span>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </aside>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; theme: ThemeColors }> = ({
  title,
  children,
  theme,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: theme.textMuted,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
  theme: ThemeColors;
}> = ({ label, value, onChange, theme }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <label style={labelStyle(theme)}>{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      style={inputStyle(theme)}
    />
  </div>
);

const labelStyle = (theme: ThemeColors): React.CSSProperties => ({
  fontSize: 11,
  color: theme.textSecondary,
  fontWeight: 500,
});

const inputStyle = (theme: ThemeColors): React.CSSProperties => ({
  width: '100%',
  backgroundColor: theme.surfaceBg,
  border: `1px solid ${theme.borderSubtle}`,
  borderRadius: 6,
  padding: '6px 8px',
  fontSize: 12,
  color: theme.textPrimary,
  outline: 'none',
  fontVariantNumeric: 'tabular-nums',
});

const textareaStyle = (theme: ThemeColors): React.CSSProperties => ({
  width: '100%',
  backgroundColor: theme.surfaceBg,
  border: `1px solid ${theme.borderSubtle}`,
  borderRadius: 6,
  padding: '6px 8px',
  fontSize: 12,
  color: theme.textPrimary,
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
});

const selectStyle = (theme: ThemeColors): React.CSSProperties => ({
  width: '100%',
  backgroundColor: theme.surfaceBg,
  border: `1px solid ${theme.borderSubtle}`,
  borderRadius: 6,
  padding: '6px 8px',
  fontSize: 12,
  color: theme.textPrimary,
  outline: 'none',
});

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 4,
  borderRadius: 4,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};

const toolActionBtnStyle = (theme: ThemeColors): React.CSSProperties => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '6px 8px',
  backgroundColor: theme.surfaceBg,
  border: `1px solid ${theme.borderSubtle}`,
  borderRadius: 6,
  color: theme.textPrimary,
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
});
