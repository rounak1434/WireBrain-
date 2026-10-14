import React, { useState, useMemo } from 'react';
import {
  CanvasElement,
  ElementType,
} from '../../types';
import { ThemeColors } from '../../styles/theme';
import {
  Folder,
  FolderOpen,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Edit2,
  Check,
  X,
  Search,
  Layers,
  Group,
  Ungroup,
  Zap,
  Smartphone,
  Layout,
  Database,
  Cloud,
  Diamond,
  Server,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  TextCursorInput,
  Square,
  Circle,
  HelpCircle,
} from 'lucide-react';

interface StructurePanelProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  onSelectElement: (id: string, isMulti: boolean) => void;
  onSelectElements?: (ids: string[]) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorderElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onGroupElements?: (ids: string[], name?: string) => void;
  onUngroupElements?: (ids: string[]) => void;
  onRenameElement?: (id: string, newLabel: string) => void;
  theme: ThemeColors;
}

export const StructurePanel: React.FC<StructurePanelProps> = ({
  elements,
  selectedElementIds,
  onSelectElement,
  onSelectElements,
  onToggleVisibility,
  onToggleLock,
  onReorderElement,
  onGroupElements,
  onUngroupElements,
  onRenameElement,
  theme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Toggle group collapse
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Start inline rename
  const handleStartRename = (id: string, currentLabel: string) => {
    setEditingId(id);
    setEditingText(currentLabel);
  };

  // Save inline rename
  const handleSaveRename = (id: string) => {
    if (editingText.trim() && onRenameElement) {
      onRenameElement(id, editingText.trim());
    }
    setEditingId(null);
  };

  // Filter elements by search query
  const filteredElements = useMemo(() => {
    if (!searchQuery.trim()) return elements;
    const q = searchQuery.toLowerCase();
    return elements.filter(
      (el) =>
        el.label.toLowerCase().includes(q) ||
        el.type.toLowerCase().includes(q) ||
        (el.groupName && el.groupName.toLowerCase().includes(q))
    );
  }, [elements, searchQuery]);

  // Group elements by groupId or frames
  const { groups, standaloneElements, frames } = useMemo(() => {
    const groupMap: Record<string, { id: string; name: string; elements: CanvasElement[] }> = {};
    const frameList: CanvasElement[] = [];
    const standalone: CanvasElement[] = [];

    // Reverse elements for top-to-bottom layer tree view (top layer first)
    const reversed = [...filteredElements].reverse();

    reversed.forEach((el) => {
      if (el.type === 'frame-desktop' || el.type === 'frame-mobile') {
        frameList.push(el);
      } else if (el.groupId) {
        if (!groupMap[el.groupId]) {
          groupMap[el.groupId] = {
            id: el.groupId,
            name: el.groupName || 'Group',
            elements: [],
          };
        }
        groupMap[el.groupId].elements.push(el);
      } else {
        standalone.push(el);
      }
    });

    return {
      groups: Object.values(groupMap),
      standaloneElements: standalone,
      frames: frameList,
    };
  }, [filteredElements]);

  // Handle grouping currently selected elements
  const canGroup = selectedElementIds.length >= 2;
  const canUngroup = selectedElementIds.some((id) =>
    elements.some((el) => el.id === id && Boolean(el.groupId))
  );

  const handleGroupSelection = () => {
    if (canGroup && onGroupElements) {
      onGroupElements(selectedElementIds);
    }
  };

  const handleUngroupSelection = () => {
    if (canUngroup && onUngroupElements) {
      onUngroupElements(selectedElementIds);
    }
  };

  // Render type icon with semantic coloring
  const renderTypeIcon = (type: ElementType, size = 13) => {
    switch (type) {
      case 'frame-desktop':
        return <Layout size={size} color="#60a5fa" />;
      case 'frame-mobile':
        return <Smartphone size={size} color="#60a5fa" />;
      case 'button':
        return <MousePointerClick size={size} color="#38bdf8" />;
      case 'input':
        return <TextCursorInput size={size} color="#34d399" />;
      case 'text':
        return <Type size={size} color="#c084fc" />;
      case 'image':
        return <ImageIcon size={size} color="#fb923c" />;
      case 'cylinder':
        return <Database size={size} color="#f472b6" />;
      case 'cloud':
        return <Cloud size={size} color="#fbbf24" />;
      case 'service':
        return <Server size={size} color="#818cf8" />;
      case 'diamond':
        return <Diamond size={size} color="#a78bfa" />;
      case 'ellipse':
        return <Circle size={size} color="#94a3b8" />;
      default:
        return <Square size={size} color="#94a3b8" />;
    }
  };

  // Render single element row
  const renderElementRow = (el: CanvasElement, isIndented = false) => {
    const isSelected = selectedElementIds.includes(el.id);
    const isEditing = editingId === el.id;

    return (
      <div
        key={el.id}
        onClick={(e) => {
          onSelectElement(el.id, e.shiftKey || e.ctrlKey || e.metaKey);
        }}
        style={{
          padding: '6px 10px',
          paddingLeft: isIndented ? 26 : 10,
          borderRadius: 6,
          backgroundColor: isSelected ? theme.surfaceActive : theme.surfaceBg,
          border: isSelected ? `1px solid ${theme.accent}` : `1px solid ${theme.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          marginBottom: 3,
          transition: 'all 0.12s ease',
        }}
      >
        {/* Left: Icon & Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {renderTypeIcon(el.type)}
          </span>

          {isEditing ? (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={editingText}
                autoFocus
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename(el.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                style={{
                  width: '100%',
                  fontSize: 12,
                  padding: '2px 6px',
                  backgroundColor: '#0a0d13',
                  border: `1px solid ${theme.accent}`,
                  borderRadius: 4,
                  color: '#ffffff',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => handleSaveRename(el.id)}
                style={miniIconBtnStyle}
                title="Save"
              >
                <Check size={11} color="#10b981" />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                style={miniIconBtnStyle}
                title="Cancel"
              >
                <X size={11} color="#ef4444" />
              </button>
            </div>
          ) : (
            <div
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleStartRename(el.id, el.label);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                overflow: 'hidden',
                flex: 1,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isSelected ? '600' : '400',
                  color: el.hidden ? '#525b6a' : isSelected ? '#ffffff' : theme.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textDecoration: el.hidden ? 'line-through' : 'none',
                }}
                title={el.label}
              >
                {el.label || el.type}
              </span>

              {/* Action indicator badge if element has prototypeAction */}
              {el.prototypeAction && el.prototypeAction !== 'none' && (
                <span
                  title={`Interaction: ${el.prototypeAction}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '1px 4px',
                    borderRadius: 3,
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  <Zap size={9} style={{ marginRight: 2 }} />
                  {el.prototypeAction}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Inline Rename Trigger */}
          {!isEditing && (
            <button
              type="button"
              onClick={() => handleStartRename(el.id, el.label)}
              title="Rename element"
              style={miniIconBtnStyle}
            >
              <Edit2 size={11} color={theme.textMuted} />
            </button>
          )}

          {/* Reorder Up */}
          <button
            type="button"
            onClick={() => onReorderElement(el.id, 'up')}
            title="Bring Forward"
            style={miniIconBtnStyle}
          >
            <ArrowUp size={11} color={theme.textMuted} />
          </button>

          {/* Reorder Down */}
          <button
            type="button"
            onClick={() => onReorderElement(el.id, 'down')}
            title="Send Backward"
            style={miniIconBtnStyle}
          >
            <ArrowDown size={11} color={theme.textMuted} />
          </button>

          {/* Lock Toggle */}
          <button
            type="button"
            onClick={() => onToggleLock(el.id)}
            title={el.locked ? 'Unlock element' : 'Lock element'}
            style={miniIconBtnStyle}
          >
            {el.locked ? <Lock size={11} color="#eab308" /> : <Unlock size={11} color={theme.textMuted} />}
          </button>

          {/* Hide/Show Toggle */}
          <button
            type="button"
            onClick={() => onToggleVisibility(el.id)}
            title={el.hidden ? 'Show element' : 'Hide element'}
            style={miniIconBtnStyle}
          >
            {el.hidden ? <EyeOff size={11} color="#ef4444" /> : <Eye size={11} color={theme.textMuted} />}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme.surfaceBg,
            borderRadius: 6,
            border: `1px solid ${theme.borderSubtle}`,
            padding: '4px 8px',
            gap: 6,
          }}
        >
          <Search size={13} color={theme.textMuted} />
          <input
            type="text"
            placeholder="Filter elements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.textPrimary,
              fontSize: 12,
              width: '100%',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={12} color={theme.textMuted} />
            </button>
          )}
        </div>

        {/* Group / Ungroup / Reorder Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              disabled={!canGroup}
              onClick={handleGroupSelection}
              title="Group selected elements"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: canGroup ? 'rgba(59, 130, 246, 0.15)' : theme.surfaceBg,
                color: canGroup ? '#60a5fa' : theme.textMuted,
                border: `1px solid ${canGroup ? 'rgba(59, 130, 246, 0.3)' : theme.borderSubtle}`,
                cursor: canGroup ? 'pointer' : 'not-allowed',
                opacity: canGroup ? 1 : 0.5,
              }}
            >
              <Group size={12} />
              <span>Group</span>
            </button>

            <button
              type="button"
              disabled={!canUngroup}
              onClick={handleUngroupSelection}
              title="Ungroup selected elements"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: canUngroup ? 'rgba(239, 68, 68, 0.12)' : theme.surfaceBg,
                color: canUngroup ? '#f87171' : theme.textMuted,
                border: `1px solid ${canUngroup ? 'rgba(239, 68, 68, 0.25)' : theme.borderSubtle}`,
                cursor: canUngroup ? 'pointer' : 'not-allowed',
                opacity: canUngroup ? 1 : 0.5,
              }}
            >
              <Ungroup size={12} />
              <span>Ungroup</span>
            </button>
          </div>

          <span style={{ fontSize: 11, color: theme.textMuted }}>
            {elements.length} {elements.length === 1 ? 'element' : 'elements'}
          </span>
        </div>
      </div>

      {/* Hierarchical Structure Tree List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {elements.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', padding: '30px 10px' }}>
            No elements on this board yet. Click + in Elements to add shapes, frames, or components.
          </div>
        ) : filteredElements.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', padding: '30px 10px' }}>
            No elements match "{searchQuery}"
          </div>
        ) : (
          <>
            {/* 1. Frames (Desktop & Mobile) with Nested Content */}
            {frames.map((frame) => {
              // Elements that belong inside this frame
              const childElements = filteredElements.filter((el) => {
                if (el.id === frame.id || el.type === 'frame-desktop' || el.type === 'frame-mobile') return false;
                const elCenterX = el.x + el.width / 2;
                const elCenterY = el.y + el.height / 2;
                return (
                  elCenterX >= frame.x - 10 &&
                  elCenterX <= frame.x + frame.width + 10 &&
                  elCenterY >= frame.y - 10 &&
                  elCenterY <= frame.y + frame.height + 10
                );
              });

              const isCollapsed = Boolean(collapsedGroups[frame.id]);

              return (
                <div key={frame.id} style={{ marginBottom: 6 }}>
                  {/* Frame Header */}
                  <div
                    onClick={() => toggleGroupCollapse(frame.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 6px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#93c5fd',
                      cursor: 'pointer',
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {renderTypeIcon(frame.type, 13)}
                      <span>{frame.label || (frame.type === 'frame-mobile' ? 'Mobile Viewport' : 'Desktop Viewport')}</span>
                      <span style={{ fontSize: 10, color: theme.textMuted, fontWeight: 400 }}>
                        ({childElements.length} inside)
                      </span>
                    </div>

                    <span style={{ fontSize: 10, color: theme.textMuted }}>
                      {isCollapsed ? '▸' : '▾'}
                    </span>
                  </div>

                  {/* Frame Itself */}
                  {renderElementRow(frame, false)}

                  {/* Nested Elements inside Frame */}
                  {!isCollapsed && childElements.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {childElements.map((child) => renderElementRow(child, true))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. Groups */}
            {groups.map((group) => {
              const isCollapsed = Boolean(collapsedGroups[group.id]);
              const groupMemberIds = group.elements.map((e) => e.id);
              const isGroupFullySelected = groupMemberIds.every((id) => selectedElementIds.includes(id));

              return (
                <div
                  key={group.id}
                  style={{
                    marginBottom: 6,
                    border: isGroupFullySelected ? '1px solid rgba(59, 130, 246, 0.5)' : `1px solid ${theme.borderSubtle}`,
                    borderRadius: 6,
                    padding: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.015)',
                  }}
                >
                  {/* Group Folder Header */}
                  <div
                    onClick={(e) => {
                      if (onSelectElements) {
                        onSelectElements(groupMemberIds);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 6px',
                      borderRadius: 4,
                      backgroundColor: isGroupFullySelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupCollapse(group.id);
                        }}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {isCollapsed ? <Folder size={13} color="#f59e0b" /> : <FolderOpen size={13} color="#f59e0b" />}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isGroupFullySelected ? '#ffffff' : theme.textPrimary }}>
                        {group.name}
                      </span>
                      <span style={{ fontSize: 10, color: theme.textMuted }}>
                        ({group.elements.length})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUngroupElements) onUngroupElements(groupMemberIds);
                        }}
                        title="Ungroup"
                        style={miniIconBtnStyle}
                      >
                        <Ungroup size={10} color={theme.textMuted} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupCollapse(group.id);
                        }}
                        style={miniIconBtnStyle}
                      >
                        <span style={{ fontSize: 9, color: theme.textMuted }}>
                          {isCollapsed ? '▸' : '▾'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Group Members */}
                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 3 }}>
                      {group.elements.map((el) => renderElementRow(el, true))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 3. Standalone Elements (not in frame or group) */}
            {standaloneElements
              .filter((el) => {
                // If already rendered inside a frame, don't duplicate
                return !frames.some((frame) => {
                  const elCenterX = el.x + el.width / 2;
                  const elCenterY = el.y + el.height / 2;
                  return (
                    elCenterX >= frame.x - 10 &&
                    elCenterX <= frame.x + frame.width + 10 &&
                    elCenterY >= frame.y - 10 &&
                    elCenterY <= frame.y + frame.height + 10
                  );
                });
              })
              .map((el) => renderElementRow(el, false))}
          </>
        )}
      </div>
    </div>
  );
};

const miniIconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 3,
  borderRadius: 3,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
