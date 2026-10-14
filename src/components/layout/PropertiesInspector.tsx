import React, { useRef, useState } from 'react';
import {
  CanvasElement,
  Connector,
  Board,
  ThemeMode,
  PrototypeActionType,
  DesignTokens,
} from '../../types';
import { ThemeColors } from '../../styles/theme';
import { importLocalImageFile } from '../../utils/assets';
import { calculateElementFitSize, isFixedSizeElementType } from '../../utils/autoSize';
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
  Lock,
  Unlock,
  UploadCloud,
  RotateCcw,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Zap,
  Monitor,
  Tablet,
  Smartphone,
  Package,
  Check,
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
  onGroupElements?: (ids: string[], name?: string) => void;
  onUngroupElements?: (ids: string[]) => void;
  onReorderElement?: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  theme: ThemeColors;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onSaveReusableComponent?: (name: string, category: string, description?: string) => void;
  designTokens?: DesignTokens;
  onUpdateDesignTokens?: (tokens: Partial<DesignTokens>) => void;
  onApplyDesignTokensToBoard?: () => void;
  onApplyTokenToSelection?: (type: 'fill' | 'stroke' | 'radius', value: string | number) => void;
  width?: number;
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
  onGroupElements,
  onUngroupElements,
  onReorderElement,
  theme,
  themeMode,
  onToggleTheme,
  onSaveReusableComponent,
  designTokens,
  onUpdateDesignTokens,
  onApplyDesignTokensToBoard,
  onApplyTokenToSelection,
  width = 280,
}) => {
  const isMulti = selectedElements.length > 1;
  const single = selectedElements.length === 1 ? selectedElements[0] : null;
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const [componentName, setComponentName] = useState('');
  const [componentCategory, setComponentCategory] = useState('Cards');
  const [componentDesc, setComponentDesc] = useState('');
  const [isComponentSaved, setIsComponentSaved] = useState(false);
  const [showComponentForm, setShowComponentForm] = useState(false);

  return (
    <aside
      aria-label="Properties Inspector"
      style={{
        width,
        minWidth: width,
        maxWidth: width,
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
            ? single.groupId
              ? `${single.type.toUpperCase()} • ${single.groupName || 'GROUP'}`
              : `${single.type.toUpperCase()}`
            : isMulti
            ? `${selectedElements.length} SELECTED`
            : selectedConnector
            ? 'CONNECTOR LINK'
            : 'BOARD PROPERTIES'}
        </span>

        {(single || isMulti) && (
          <div style={{ display: 'flex', gap: 4 }}>
            {/* Group / Ungroup in header */}
            {selectedElements.some((el) => Boolean(el.groupId)) && onUngroupElements && (
              <button
                type="button"
                title="Ungroup"
                onClick={() => onUngroupElements(selectedElements.map((el) => el.id))}
                style={{ ...iconBtnStyle, color: '#f87171' }}
              >
                <Ungroup size={13} />
              </button>
            )}
            {isMulti && onGroupElements && (
              <button
                type="button"
                title="Group Selected"
                onClick={() => onGroupElements(selectedElements.map((el) => el.id))}
                style={{ ...iconBtnStyle, color: '#60a5fa' }}
              >
                <Group size={13} />
              </button>
            )}
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
                  onChange={(v) => {
                    const newW = Math.max(10, v);
                    if (single.aspectRatioLocked && single.width > 0 && single.height > 0) {
                      const ratio = single.width / single.height;
                      onUpdateElement(single.id, {
                        width: newW,
                        height: Math.max(10, Math.round(newW / ratio)),
                        autoSize: false,
                      });
                    } else {
                      onUpdateElement(single.id, { width: newW, autoSize: false });
                    }
                  }}
                  theme={theme}
                />
                <NumberInput
                  label="H"
                  value={Math.round(single.height)}
                  onChange={(v) => {
                    const newH = Math.max(10, v);
                    if (single.aspectRatioLocked && single.width > 0 && single.height > 0) {
                      const ratio = single.width / single.height;
                      onUpdateElement(single.id, {
                        height: newH,
                        width: Math.max(10, Math.round(newH * ratio)),
                        autoSize: false,
                      });
                    } else {
                      onUpdateElement(single.id, { height: newH, autoSize: false });
                    }
                  }}
                  theme={theme}
                />
              </div>

              {/* Aspect Ratio Lock Toggle */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: theme.textMuted }}>Aspect Ratio Lock</span>
                <button
                  type="button"
                  onClick={() => onUpdateElement(single.id, { aspectRatioLocked: !single.aspectRatioLocked })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: single.aspectRatioLocked ? '#172554' : theme.surfaceBg,
                    border: single.aspectRatioLocked ? `1px solid ${theme.accent}` : `1px solid ${theme.borderSubtle}`,
                    color: single.aspectRatioLocked ? '#60a5fa' : theme.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  {single.aspectRatioLocked ? <Lock size={12} /> : <Unlock size={12} />}
                  {single.aspectRatioLocked ? 'Locked' : 'Unlocked'}
                </button>
              </div>

              {/* Text Sizing & Auto-size to Content */}
              {!isFixedSizeElementType(single.type) && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: `1px solid ${theme.borderSubtle}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: theme.textSecondary }}>Auto-size to content</span>
                      <span style={{ fontSize: 10, color: theme.textMuted }}>Grows box when text changes</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const isCurrentlyEnabled = single.autoSize !== false;
                        if (!isCurrentlyEnabled) {
                          const fit = calculateElementFitSize(single);
                          onUpdateElement(single.id, {
                            width: Math.max(single.width, fit.width),
                            height: Math.max(single.height, fit.height),
                            autoSize: true,
                          });
                        } else {
                          onUpdateElement(single.id, { autoSize: false });
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: single.autoSize !== false ? '#172554' : theme.surfaceBg,
                        border: single.autoSize !== false ? `1px solid ${theme.accent}` : `1px solid ${theme.borderSubtle}`,
                        color: single.autoSize !== false ? '#60a5fa' : theme.textMuted,
                        cursor: 'pointer',
                      }}
                    >
                      <Sparkles size={11} />
                      {single.autoSize !== false ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const fit = calculateElementFitSize(single);
                      onUpdateElement(single.id, {
                        width: fit.width,
                        height: fit.height,
                        autoSize: true,
                      });
                    }}
                    style={{
                      ...toolActionBtnStyle(theme),
                      marginTop: 2,
                      justifyContent: 'center',
                      gap: 6,
                    }}
                    title="Calculate optimal shape dimensions and wrap text to fit comfortably"
                  >
                    <Sparkles size={12} color="#60a5fa" /> Fit Shape to Content
                  </button>
                </div>
              )}

              {/* Layer Ordering Controls */}
              {onReorderElement && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, color: theme.textMuted }}>Layer Order</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => onReorderElement(single.id, 'top')}
                      title="Bring to Front"
                      style={toolActionBtnStyle(theme)}
                    >
                      <ChevronsUp size={12} /> To Front
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorderElement(single.id, 'up')}
                      title="Bring Forward"
                      style={toolActionBtnStyle(theme)}
                    >
                      <ArrowUp size={12} /> Forward
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorderElement(single.id, 'down')}
                      title="Send Backward"
                      style={toolActionBtnStyle(theme)}
                    >
                      <ArrowDown size={12} /> Backward
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorderElement(single.id, 'bottom')}
                      title="Send to Back"
                      style={toolActionBtnStyle(theme)}
                    >
                      <ChevronsDown size={12} /> To Back
                    </button>
                  </div>
                </div>
              )}
            </Section>

            {/* Responsive Visibility & Sizing */}
            <Section title="Responsive Visibility & Sizing" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>
                    Show On Devices
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                    {(
                      [
                        { key: 'desktop', label: 'Desktop', icon: Monitor },
                        { key: 'tablet', label: 'Tablet', icon: Tablet },
                        { key: 'mobile', label: 'Mobile', icon: Smartphone },
                      ] as const
                    ).map(({ key, label, icon: Icon }) => {
                      const isVisible = single.responsiveVisibility?.[key] !== false;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const current = single.responsiveVisibility || { desktop: true, tablet: true, mobile: true };
                            onUpdateElement(single.id, {
                              responsiveVisibility: {
                                ...current,
                                [key]: !isVisible,
                              },
                            });
                          }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 4px',
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            backgroundColor: isVisible ? '#172554' : theme.surfaceBg,
                            border: isVisible ? `1px solid ${theme.accent}` : `1px solid ${theme.borderSubtle}`,
                            color: isVisible ? '#60a5fa' : theme.textMuted,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <Icon size={14} />
                          <span>{label}</span>
                          <span style={{ fontSize: 9, opacity: 0.8 }}>
                            {isVisible ? 'Visible' : 'Hidden'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>
                    Responsive Width
                  </div>
                  <select
                    value={single.responsiveWidth || 'fixed'}
                    onChange={(e) =>
                      onUpdateElement(single.id, {
                        responsiveWidth: e.target.value as 'fixed' | 'fill' | 'hug',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      backgroundColor: theme.surfaceBg,
                      border: `1px solid ${theme.borderSubtle}`,
                      color: theme.textPrimary,
                      outline: 'none',
                    }}
                  >
                    <option value="fixed">Fixed Size ({Math.round(single.width)}px)</option>
                    <option value="fill">Fill Container Width (100%)</option>
                    <option value="hug">Hug Content (Auto)</option>
                  </select>
                </div>
              </div>
            </Section>

            {/* Reusable Component Section */}
            {onSaveReusableComponent && (
              <Section title="Reusable Component" theme={theme}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {!showComponentForm ? (
                    <button
                      type="button"
                      onClick={() => {
                        setComponentName(single.label || single.type);
                        setShowComponentForm(true);
                        setIsComponentSaved(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '7px 10px',
                        backgroundColor: '#172554',
                        border: '1px solid #1d4ed8',
                        borderRadius: 6,
                        color: '#93c5fd',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Package size={13} />
                      <span>Save Selection as Component</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        padding: 10,
                        backgroundColor: theme.surfaceBg,
                        border: `1px solid ${theme.borderSubtle}`,
                        borderRadius: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div>
                        <label style={labelStyle(theme)}>Component Name</label>
                        <input
                          type="text"
                          value={componentName}
                          onChange={(e) => setComponentName(e.target.value)}
                          placeholder="e.g. Navigation Header"
                          style={inputStyle(theme)}
                        />
                      </div>

                      <div>
                        <label style={labelStyle(theme)}>Category</label>
                        <select
                          value={componentCategory}
                          onChange={(e) => setComponentCategory(e.target.value)}
                          style={selectStyle(theme)}
                        >
                          <option value="Buttons">Buttons</option>
                          <option value="Cards">Cards</option>
                          <option value="Navigation">Navigation</option>
                          <option value="Forms">Forms</option>
                          <option value="Layout">Layout</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>

                      <div>
                        <label style={labelStyle(theme)}>Description (Optional)</label>
                        <input
                          type="text"
                          value={componentDesc}
                          onChange={(e) => setComponentDesc(e.target.value)}
                          placeholder="Short description..."
                          style={inputStyle(theme)}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setShowComponentForm(false)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            backgroundColor: 'transparent',
                            border: `1px solid ${theme.borderSubtle}`,
                            borderRadius: 5,
                            color: theme.textMuted,
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (componentName.trim()) {
                              onSaveReusableComponent(componentName.trim(), componentCategory, componentDesc.trim());
                              setIsComponentSaved(true);
                              setTimeout(() => {
                                setShowComponentForm(false);
                                setIsComponentSaved(false);
                              }, 1200);
                            }
                          }}
                          style={{
                            flex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            padding: '6px 8px',
                            backgroundColor: isComponentSaved ? '#059669' : '#2563eb',
                            border: 'none',
                            borderRadius: 5,
                            color: '#ffffff',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {isComponentSaved ? <Check size={12} /> : <Package size={12} />}
                          <span>{isComponentSaved ? 'Saved to Library!' : 'Save Component'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Image Asset Controls when type === 'image' */}
            {single.type === 'image' && (
              <Section title="Image Asset & Fit" theme={theme}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const asset = await importLocalImageFile(file);
                        onUpdateElement(single.id, {
                          assetId: asset.assetId,
                          originalWidth: asset.width,
                          originalHeight: asset.height,
                          aspectRatioLocked: true,
                          label: single.label || file.name.replace(/\.[^/.]+$/, ""),
                        });
                      } catch (err) {
                        console.error('Failed to import local image:', err);
                      }
                      e.target.value = '';
                    }}
                  />

                  {/* Choose / Replace Image Button */}
                  <button
                    type="button"
                    onClick={() => imageFileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      backgroundColor: '#172554',
                      border: `1px solid ${theme.accent}`,
                      color: '#93c5fd',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <UploadCloud size={14} />
                    {single.assetId || single.src ? 'Replace Local Image…' : 'Choose Local Image…'}
                  </button>

                  {/* Image Fit Setting */}
                  <div>
                    <label style={labelStyle(theme)}>Object Fit Mode</label>
                    <select
                      value={single.imageFit || 'cover'}
                      onChange={(e) => onUpdateElement(single.id, { imageFit: e.target.value as any })}
                      style={selectStyle(theme)}
                    >
                      <option value="cover">Cover (Fill & Crop nicely)</option>
                      <option value="contain">Contain (Fit within frame)</option>
                      <option value="fill">Fill (Stretch exact dimensions)</option>
                    </select>
                  </div>

                  {/* Original Dimensions & Reset */}
                  {single.originalWidth && single.originalHeight ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        backgroundColor: '#0a0d14',
                        borderRadius: 4,
                        border: '1px solid #1a2233',
                        fontSize: 11,
                        color: '#8b9bb4',
                      }}
                    >
                      <span>Original: {single.originalWidth} × {single.originalHeight}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateElement(single.id, {
                            width: single.originalWidth,
                            height: single.originalHeight,
                          })
                        }
                        title="Reset canvas dimensions to native image resolution"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#60a5fa',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        <RotateCcw size={11} /> Reset
                      </button>
                    </div>
                  ) : null}

                  {/* Clear Asset */}
                  {(single.assetId || single.src) && (
                    <button
                      type="button"
                      onClick={() => onUpdateElement(single.id, { assetId: undefined, src: undefined })}
                      style={{
                        padding: '5px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        color: '#f87171',
                        backgroundColor: 'transparent',
                        border: '1px solid #3f1d24',
                        cursor: 'pointer',
                      }}
                    >
                      Remove Image (Reset to Placeholder)
                    </button>
                  )}
                </div>
              </Section>
            )}

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
                    <label style={labelStyle(theme)}>Destination Screen or Board</label>
                    <select
                      value={single.prototypeTarget || ''}
                      onChange={(e) => onUpdateElement(single.id, { prototypeTarget: e.target.value })}
                      style={selectStyle(theme)}
                    >
                      <option value="">Select destination...</option>
                      {board.elements
                        .filter((el) => el.type.startsWith('frame') && el.id !== single.id)
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            📱 Screen: {f.label || f.type}
                          </option>
                        ))}
                      {allBoards.map((b) => (
                        <option key={b.id} value={b.id}>
                          📋 Board: {b.title}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {single.prototypeAction === 'modal' && (
                  <>
                    <label style={labelStyle(theme)}>Modal Dialog Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Confirm Order"
                      value={single.prototypeTarget || ''}
                      onChange={(e) => onUpdateElement(single.id, { prototypeTarget: e.target.value })}
                      style={inputStyle(theme)}
                    />

                    <label style={labelStyle(theme)}>Modal Description / Body</label>
                    <textarea
                      placeholder="e.g. Are you sure you want to proceed with this operation?"
                      value={single.prototypePayload || ''}
                      onChange={(e) => onUpdateElement(single.id, { prototypePayload: e.target.value })}
                      rows={2}
                      style={{ ...inputStyle(theme), resize: 'vertical' }}
                    />
                  </>
                )}

                {single.prototypeAction === 'alert' && (
                  <>
                    <label style={labelStyle(theme)}>Toast Notification Message</label>
                    <input
                      type="text"
                      placeholder="e.g. Settings updated successfully"
                      value={single.prototypePayload || ''}
                      onChange={(e) => onUpdateElement(single.id, { prototypePayload: e.target.value })}
                      style={inputStyle(theme)}
                    />
                  </>
                )}

                {single.prototypeAction && single.prototypeAction !== 'none' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 8px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      color: '#38bdf8',
                      fontSize: 11,
                    }}
                  >
                    <Zap size={12} />
                    <span>Active in Prototype Preview & Simulation</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Fill Color */}
            <Section title="Fill Color" theme={theme}>
              {designTokens && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 4 }}>
                    Design Token Colors
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {[
                      { label: 'Primary', color: designTokens.colors.primary },
                      { label: 'Secondary', color: designTokens.colors.secondary },
                      { label: 'Surface', color: designTokens.colors.surface },
                      { label: 'Border', color: designTokens.colors.border },
                    ].map(({ label, color }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => onUpdateElement(single.id, { fillColor: color })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 6px',
                          backgroundColor: theme.surfaceBg,
                          border: single.fillColor === color ? `1px solid ${theme.accent}` : `1px solid ${theme.borderSubtle}`,
                          borderRadius: 4,
                          fontSize: 10,
                          color: theme.textPrimary,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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

              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>
                  <span>Opacity</span>
                  <span>{Math.round((single.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round((single.opacity ?? 1) * 100)}
                  onChange={(e) => onUpdateElement(single.id, { opacity: Number(e.target.value) / 100 })}
                  style={{ width: '100%', accentColor: theme.accent }}
                />
              </div>
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

              <div style={{ marginTop: 8 }}>
                <label style={labelStyle(theme)}>Border Style</label>
                <select
                  value={single.strokeStyle || 'solid'}
                  onChange={(e) => onUpdateElement(single.id, { strokeStyle: e.target.value as any })}
                  style={selectStyle(theme)}
                >
                  <option value="solid">Solid Line</option>
                  <option value="dashed">Dashed Line</option>
                  <option value="dotted">Dotted Line</option>
                </select>
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

            {/* Design Tokens & Design System */}
            {designTokens && onUpdateDesignTokens && (
              <Section title="Design Tokens & System" theme={theme}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>
                      Color Palette Tokens
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div>
                        <div style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 2 }}>Primary</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="color"
                            value={designTokens.colors.primary}
                            onChange={(e) =>
                              onUpdateDesignTokens({
                                colors: { ...designTokens.colors, primary: e.target.value },
                              })
                            }
                            style={{ width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'none' }}
                          />
                          <input
                            type="text"
                            value={designTokens.colors.primary}
                            onChange={(e) =>
                              onUpdateDesignTokens({
                                colors: { ...designTokens.colors, primary: e.target.value },
                              })
                            }
                            style={{ ...inputStyle(theme), fontSize: 11, padding: '3px 6px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 2 }}>Secondary</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="color"
                            value={designTokens.colors.secondary}
                            onChange={(e) =>
                              onUpdateDesignTokens({
                                colors: { ...designTokens.colors, secondary: e.target.value },
                              })
                            }
                            style={{ width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'none' }}
                          />
                          <input
                            type="text"
                            value={designTokens.colors.secondary}
                            onChange={(e) =>
                              onUpdateDesignTokens({
                                colors: { ...designTokens.colors, secondary: e.target.value },
                              })
                            }
                            style={{ ...inputStyle(theme), fontSize: 11, padding: '3px 6px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 2 }}>Surface</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="color"
                            value={designTokens.colors.surface}
                            onChange={(e) =>
                              onUpdateDesignTokens({
                                colors: { ...designTokens.colors, surface: e.target.value },
                              })
                            }
                            style={{ width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'none' }}
                          />
                          <input
                            type="text"
                            value={designTokens.colors.surface}
                            onChange={(e) =>
                              onUpdateDesignTokens({
                                colors: { ...designTokens.colors, surface: e.target.value },
                              })
                            }
                            style={{ ...inputStyle(theme), fontSize: 11, padding: '3px 6px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 2 }}>Border</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="color"
                            value={designTokens.colors.border}
                            onChange={(e) =>
                              onUpdateDesignTokens({
                                colors: { ...designTokens.colors, border: e.target.value },
                              })
                            }
                            style={{ width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer', background: 'none' }}
                          />
                          <input
                            type="text"
                            value={designTokens.colors.border}
                            onChange={(e) =>
                              onUpdateDesignTokens({
                                colors: { ...designTokens.colors, border: e.target.value },
                              })
                            }
                            style={{ ...inputStyle(theme), fontSize: 11, padding: '3px 6px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>
                      Typography Family
                    </div>
                    <select
                      value={designTokens.typography.fontFamily}
                      onChange={(e) =>
                        onUpdateDesignTokens({
                          typography: { ...designTokens.typography, fontFamily: e.target.value },
                        })
                      }
                      style={selectStyle(theme)}
                    >
                      <option value="Inter, system-ui, sans-serif">Inter (Modern Clean Sans)</option>
                      <option value="-apple-system, BlinkMacSystemFont, sans-serif">Apple SF Pro / System</option>
                      <option value="JetBrains Mono, monospace">JetBrains Mono (Technical)</option>
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>
                      Corner Radius Scale
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <NumberInput
                        label="Medium"
                        value={designTokens.borderRadius.medium}
                        onChange={(v) =>
                          onUpdateDesignTokens({
                            borderRadius: { ...designTokens.borderRadius, medium: v },
                          })
                        }
                        theme={theme}
                      />
                      <NumberInput
                        label="Large"
                        value={designTokens.borderRadius.large}
                        onChange={(v) =>
                          onUpdateDesignTokens({
                            borderRadius: { ...designTokens.borderRadius, large: v },
                          })
                        }
                        theme={theme}
                      />
                    </div>
                  </div>

                  {onApplyDesignTokensToBoard && (
                    <button
                      type="button"
                      onClick={onApplyDesignTokensToBoard}
                      style={{
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '7px 10px',
                        backgroundColor: '#172554',
                        border: '1px solid #1d4ed8',
                        borderRadius: 6,
                        color: '#93c5fd',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <Sparkles size={12} />
                      <span>Apply Tokens to Active Board</span>
                    </button>
                  )}
                </div>
              </Section>
            )}

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
