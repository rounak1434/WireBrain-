import React, { useState } from 'react';
import {
  Board,
  CanvasElement,
  ActiveSidebarTab,
  ElementType,
} from '../../types';
import { ThemeColors } from '../../styles/theme';
import { TutorialPanel } from '../tutorial/TutorialPanel';
import { ExamplesGalleryPanel } from '../examples/ExamplesGalleryPanel';
import { ExampleProjectDefinition } from '../../data/exampleProjects';
import {
  Plus,
  Copy,
  Trash2,
  Edit2,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ArrowUp,
  ArrowDown,
  Layout,
  Smartphone,
  Square,
  Circle,
  Diamond,
  Database,
  Cloud,
  Server,
  Layers,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  TextCursorInput,
  Radio,
  FileCode,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveSidebarTab;
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (title: string) => void;
  onDuplicateBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onRenameBoard: (boardId: string, newTitle: string) => void;
  onAddElement: (type: ElementType, customProps?: Partial<CanvasElement>) => void;
  elements: CanvasElement[];
  selectedElementIds: string[];
  onSelectElement: (id: string, isMulti: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorderElement: (id: string, direction: 'up' | 'down') => void;
  theme: ThemeColors;
  onStartGuidedTour: () => void;
  onReplayWelcome: () => void;
  onCreateTutorialBoard: (type: 'architecture' | 'wireframe') => void;
  completedGuides: Record<string, boolean>;
  onToggleGuideComplete: (guideId: string) => void;
  onOpenExampleProject?: (example: ExampleProjectDefinition, mode?: 'edit' | 'prototype' | 'simulate') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  onDuplicateBoard,
  onDeleteBoard,
  onRenameBoard,
  onAddElement,
  elements,
  selectedElementIds,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onReorderElement,
  theme,
  onStartGuidedTour,
  onReplayWelcome,
  onCreateTutorialBoard,
  completedGuides,
  onToggleGuideComplete,
  onOpenExampleProject,
}) => {
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [searchElements, setSearchElements] = useState('');

  const handleStartRename = (board: Board) => {
    setEditingBoardId(board.id);
    setEditBoardTitle(board.title);
  };

  const handleSaveRename = (boardId: string) => {
    if (editBoardTitle.trim()) {
      onRenameBoard(boardId, editBoardTitle.trim());
    }
    setEditingBoardId(null);
  };

  return (
    <aside
      aria-label="Sidebar Panel"
      style={{
        width: 270,
        backgroundColor: theme.panelBg,
        borderRight: `1px solid ${theme.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${theme.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.panelHeaderBg,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: theme.textMuted,
          }}
        >
          {activeTab === 'boards' && 'Project Boards'}
          {activeTab === 'elements' && 'Elements Library'}
          {activeTab === 'layers' && 'Canvas Layers'}
          {activeTab === 'examples' && 'Example Projects'}
          {activeTab === 'tutorial' && 'Tutorial & Guides'}
          {activeTab === 'shortcuts' && 'Key Bindings'}
        </span>
        {activeTab === 'boards' && (
          <button
            type="button"
            onClick={() => {
              const name = `Board ${boards.length + 1}`;
              onCreateBoard(name);
            }}
            title="Create New Board"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: theme.surfaceBg,
              color: theme.accent,
              border: `1px solid ${theme.borderStrong}`,
              padding: '3px 8px',
              borderRadius: 5,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} /> New
          </button>
        )}
      </div>

      {/* Content based on tab */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {/* BOARDS TAB */}
        {activeTab === 'boards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {boards.map((b) => {
              const isActive = b.id === activeBoardId;
              const isEditing = b.id === editingBoardId;

              return (
                <div
                  key={b.id}
                  onClick={() => !isEditing && onSelectBoard(b.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: isActive ? theme.surfaceActive : theme.surfaceBg,
                    border: isActive ? `1.5px solid ${theme.accent}` : `1px solid ${theme.borderSubtle}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={editBoardTitle}
                        onChange={(e) => setEditBoardTitle(e.target.value)}
                        onBlur={() => handleSaveRename(b.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(b.id);
                          if (e.key === 'Escape') setEditingBoardId(null);
                        }}
                        style={{
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          border: `1px solid ${theme.accent}`,
                          borderRadius: 4,
                          padding: '3px 6px',
                          fontSize: 12,
                          width: '100%',
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <span style={{ color: isActive ? theme.accent : theme.textMuted }}>
                          {b.id.includes('web') ? (
                            <Layout size={15} />
                          ) : b.id.includes('mob') ? (
                            <Smartphone size={15} />
                          ) : (
                            <Server size={15} />
                          )}
                        </span>
                        <span
                          style={{
                            fontWeight: isActive ? 600 : 500,
                            fontSize: 12,
                            color: isActive ? theme.textPrimary : theme.textSecondary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {b.title}
                        </span>
                      </div>
                    )}

                    {!isEditing && (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          title="Rename Board"
                          onClick={() => handleStartRename(b)}
                          style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 2 }}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          title="Duplicate Board"
                          onClick={() => onDuplicateBoard(b.id)}
                          style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 2 }}
                        >
                          <Copy size={12} />
                        </button>
                        {boards.length > 1 && (
                          <button
                            type="button"
                            title="Delete Board"
                            onClick={() => onDeleteBoard(b.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: theme.textMuted,
                      marginTop: 6,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{b.elements.length} elements</span>
                    <span>{b.connectors.length} links</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ELEMENTS TAB */}
        {activeTab === 'elements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="text"
              placeholder="Search elements..."
              value={searchElements}
              onChange={(e) => setSearchElements(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: theme.surfaceBg,
                border: `1px solid ${theme.borderSubtle}`,
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                color: theme.textPrimary,
                outline: 'none',
              }}
            />

            <ElementCategory title="Website Wireframes" theme={theme}>
              <ElementCard
                theme={theme}
                icon={<Layout size={15} />}
                name="Desktop Frame"
                description="Browser window artboard"
                onClick={() =>
                  onAddElement('frame-desktop', {
                    width: 1080,
                    height: 720,
                    label: 'Website Frame',
                    urlBar: 'https://mysite.com',
                    fillColor: '#0e1015',
                    strokeColor: '#252936',
                    strokeWidth: 2,
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<Square size={15} />}
                name="Navigation Bar"
                description="Header bar container"
                onClick={() =>
                  onAddElement('rectangle', {
                    width: 960,
                    height: 60,
                    label: 'Header Navbar',
                    fillColor: '#141720',
                    strokeColor: '#252936',
                    strokeWidth: 1,
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<MousePointerClick size={15} />}
                name="Interactive Button"
                description="Primary CTA with prototype action"
                onClick={() =>
                  onAddElement('button', {
                    width: 140,
                    height: 40,
                    label: 'Get Started',
                    variant: 'primary',
                    fillColor: theme.accent,
                    strokeColor: '#2563eb',
                    textColor: '#ffffff',
                    fontWeight: '600',
                    prototypeAction: 'modal',
                    prototypePayload: 'Registration Dialog Sheet',
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<TextCursorInput size={15} />}
                name="Input Field"
                description="Text entry field"
                onClick={() =>
                  onAddElement('input', {
                    width: 260,
                    height: 40,
                    label: 'Enter email address...',
                    fillColor: '#12151d',
                    strokeColor: '#242a38',
                    textColor: '#7e8a9c',
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<ImageIcon size={15} />}
                name="Image Placeholder"
                description="Wireframe mockup image"
                onClick={() =>
                  onAddElement('image', {
                    width: 320,
                    height: 180,
                    label: 'Hero Visual Mockup',
                    fillColor: '#12151d',
                    strokeColor: '#242a38',
                    textColor: '#7e8a9c',
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<Type size={15} />}
                name="Text Headline"
                description="Large typography block"
                onClick={() =>
                  onAddElement('text', {
                    width: 380,
                    height: 40,
                    label: 'Product Headline Here',
                    fontSize: 22,
                    fontWeight: '700',
                    fillColor: 'transparent',
                    strokeColor: 'transparent',
                    textColor: theme.textPrimary,
                  })
                }
              />
            </ElementCategory>

            <ElementCategory title="Mobile Wireframes" theme={theme}>
              <ElementCard
                theme={theme}
                icon={<Smartphone size={15} />}
                name="Mobile Phone Frame"
                description="375×760 iPhone screen"
                onClick={() =>
                  onAddElement('frame-mobile', {
                    width: 375,
                    height: 760,
                    label: 'Mobile Screen',
                    fillColor: '#0a0c10',
                    strokeColor: '#242936',
                    strokeWidth: 2,
                    cornerRadius: 36,
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<Square size={15} />}
                name="Mobile Card"
                description="List item or feature card"
                onClick={() =>
                  onAddElement('rectangle', {
                    width: 320,
                    height: 90,
                    label: 'Dashboard Metric Card',
                    secondaryText: 'Real-time telemetry metric',
                    fillColor: '#121620',
                    strokeColor: '#242936',
                    cornerRadius: 10,
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<Radio size={15} />}
                name="Bottom Tab Bar"
                description="Mobile navigation tabs"
                onClick={() =>
                  onAddElement('rectangle', {
                    width: 340,
                    height: 54,
                    label: '⚡ Home      📊 Feed      🔔 Alerts      ⚙ Settings',
                    textAlign: 'center',
                    fillColor: '#0f121a',
                    strokeColor: '#1e2432',
                    textColor: '#8c97aa',
                    cornerRadius: 12,
                  })
                }
              />
            </ElementCategory>

            <ElementCategory title="Flowcharts & Logic" theme={theme}>
              <ElementCard
                theme={theme}
                icon={<Square size={15} />}
                name="Process Step"
                description="Action or calculation task"
                onClick={() =>
                  onAddElement('rectangle', {
                    width: 170,
                    height: 70,
                    label: 'Process Step',
                    secondaryText: 'Execute data operation',
                    fillColor: '#121620',
                    strokeColor: '#283144',
                    cornerRadius: 6,
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<Diamond size={15} />}
                name="Decision Diamond"
                description="Branching condition"
                onClick={() =>
                  onAddElement('diamond', {
                    width: 130,
                    height: 85,
                    label: 'Is Authenticated?',
                    fillColor: '#161a24',
                    strokeColor: '#36425a',
                    textColor: '#e2ebf7',
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<Circle size={15} />}
                name="Terminal Start/End"
                description="Flow begin or terminal"
                onClick={() =>
                  onAddElement('ellipse', {
                    width: 130,
                    height: 60,
                    label: 'Start / End',
                    fillColor: '#0f1f17',
                    strokeColor: '#1b4a32',
                    textColor: '#d2f3e2',
                  })
                }
              />
            </ElementCategory>

            <ElementCategory title="System Architecture" theme={theme}>
              <ElementCard
                theme={theme}
                icon={<Server size={15} />}
                name="Microservice"
                description="API / Backend Service box"
                onClick={() =>
                  onAddElement('service', {
                    width: 180,
                    height: 80,
                    label: 'Core Microservice',
                    secondaryText: 'Node.js / gRPC Port 50051',
                    fillColor: '#121724',
                    strokeColor: theme.accent,
                    strokeWidth: 2,
                    cornerRadius: 8,
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<Database size={15} />}
                name="Database Cylinder"
                description="SQL / NoSQL Data Store"
                onClick={() =>
                  onAddElement('cylinder', {
                    width: 160,
                    height: 90,
                    label: 'PostgreSQL DB',
                    secondaryText: 'Primary Master Instance',
                    fillColor: '#0f171f',
                    strokeColor: '#234a68',
                    strokeWidth: 2,
                    textColor: '#daf0fa',
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<Layers size={15} />}
                name="Message Queue"
                description="Kafka / RabbitMQ topic"
                onClick={() =>
                  onAddElement('queue', {
                    width: 170,
                    height: 70,
                    label: 'Event Queue',
                    secondaryText: 'Partitioned Kafka Log',
                    fillColor: '#1a1422',
                    strokeColor: '#52386a',
                    strokeWidth: 2,
                    cornerRadius: 6,
                    textColor: '#eedcf5',
                  })
                }
              />
              <ElementCard
                theme={theme}
                icon={<Cloud size={15} />}
                name="Cloud Storage"
                description="AWS S3 / GCP Bucket"
                onClick={() =>
                  onAddElement('cloud', {
                    width: 160,
                    height: 80,
                    label: 'S3 Asset Bucket',
                    secondaryText: 'Encrypted Cloud Storage',
                    fillColor: '#1c1a12',
                    strokeColor: '#5c501e',
                    strokeWidth: 2,
                    textColor: '#faf3d4',
                  })
                }
              />
            </ElementCategory>
          </div>
        )}

        {/* LAYERS TAB */}
        {activeTab === 'layers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {elements.length === 0 ? (
              <div style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', padding: 20 }}>
                No elements on this board yet.
              </div>
            ) : (
              [...elements].reverse().map((el) => {
                const isSelected = selectedElementIds.includes(el.id);

                return (
                  <div
                    key={el.id}
                    onClick={(e) => onSelectElement(el.id, e.shiftKey || e.ctrlKey || e.metaKey)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      backgroundColor: isSelected ? theme.surfaceActive : theme.surfaceBg,
                      border: isSelected ? `1px solid ${theme.accent}` : `1px solid ${theme.borderSubtle}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <span style={{ color: isSelected ? theme.accent : theme.textMuted }}>
                        {el.type === 'frame-desktop' && <Layout size={13} />}
                        {el.type === 'frame-mobile' && <Smartphone size={13} />}
                        {el.type === 'cylinder' && <Database size={13} />}
                        {el.type === 'cloud' && <Cloud size={13} />}
                        {el.type === 'diamond' && <Diamond size={13} />}
                        {el.type === 'service' && <Server size={13} />}
                        {el.type === 'text' && <Type size={13} />}
                        {el.type === 'image' && <ImageIcon size={13} />}
                        {el.type === 'button' && <MousePointerClick size={13} />}
                        {el.type === 'input' && <TextCursorInput size={13} />}
                        {el.type === 'rectangle' && <Square size={13} />}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: el.hidden ? '#525b6a' : isSelected ? '#ffffff' : theme.textSecondary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textDecoration: el.hidden ? 'line-through' : 'none',
                        }}
                      >
                        {el.label || el.type}
                      </span>
                    </div>

                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onReorderElement(el.id, 'up')}
                        title="Bring Forward"
                        style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 2 }}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReorderElement(el.id, 'down')}
                        title="Send Backward"
                        style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 2 }}
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleLock(el.id)}
                        title={el.locked ? 'Unlock' : 'Lock'}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: el.locked ? '#eab308' : theme.textMuted,
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        {el.locked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleVisibility(el.id)}
                        title={el.hidden ? 'Show' : 'Hide'}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: el.hidden ? '#ef4444' : theme.textMuted,
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TUTORIAL TAB */}
        {activeTab === 'tutorial' && (
          <TutorialPanel
            theme={theme}
            onStartGuidedTour={onStartGuidedTour}
            onReplayWelcome={onReplayWelcome}
            onCreateTutorialBoard={onCreateTutorialBoard}
            completedGuides={completedGuides}
            onToggleGuideComplete={onToggleGuideComplete}
          />
        )}

        {/* EXAMPLES TAB */}
        {activeTab === 'examples' && onOpenExampleProject && (
          <ExamplesGalleryPanel
            theme={theme}
            onOpenExample={onOpenExampleProject}
            activeBoardId={activeBoardId}
          />
        )}

        {/* SHORTCUTS TAB */}
        {activeTab === 'shortcuts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
            <ShortcutGroup title="Tools" theme={theme}>
              <ShortcutRow label="Select / Pointer" keys={['V']} />
              <ShortcutRow label="Hand / Pan View" keys={['H', 'Space']} />
              <ShortcutRow label="Arrow / Connector" keys={['C']} />
              <ShortcutRow label="Text Box" keys={['T']} />
              <ShortcutRow label="Rectangle / Box" keys={['R']} />
              <ShortcutRow label="Decision Diamond" keys={['D']} />
              <ShortcutRow label="Database Cylinder" keys={['B']} />
              <ShortcutRow label="Cloud Resource" keys={['S']} />
            </ShortcutGroup>

            <ShortcutGroup title="Canvas Operations" theme={theme}>
              <ShortcutRow label="Undo" keys={['Ctrl/Cmd', 'Z']} />
              <ShortcutRow label="Redo" keys={['Ctrl/Cmd', 'Y']} />
              <ShortcutRow label="Duplicate Item" keys={['Ctrl/Cmd', 'D']} />
              <ShortcutRow label="Delete Selected" keys={['Delete', 'Backspace']} />
              <ShortcutRow label="Select All" keys={['Ctrl/Cmd', 'A']} />
              <ShortcutRow label="Cancel / Deselect" keys={['Esc']} />
              <ShortcutRow label="Zoom In / Out" keys={['Ctrl', 'Wheel']} />
            </ShortcutGroup>
          </div>
        )}
      </div>
    </aside>
  );
};

const ElementCategory: React.FC<{ title: string; children: React.ReactNode; theme: ThemeColors }> = ({
  title,
  children,
  theme,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: theme.textMuted,
        marginTop: 4,
      }}
    >
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
  </div>
);

interface ElementCardProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  onClick: () => void;
  theme: ThemeColors;
}

const ElementCard: React.FC<ElementCardProps> = ({ icon, name, description, onClick, theme }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 10px',
      borderRadius: 6,
      backgroundColor: theme.surfaceBg,
      border: `1px solid ${theme.borderSubtle}`,
      color: theme.textPrimary,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background-color 0.15s ease, border-color 0.15s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = theme.surfaceHover;
      e.currentTarget.style.borderColor = theme.accent;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = theme.surfaceBg;
      e.currentTarget.style.borderColor = theme.borderSubtle;
    }}
  >
    <div style={{ color: theme.accent }}>{icon}</div>
    <div style={{ flex: 1, overflow: 'hidden' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{name}</div>
      <div style={{ fontSize: 10, color: theme.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {description}
      </div>
    </div>
  </button>
);

const ShortcutGroup: React.FC<{ title: string; children: React.ReactNode; theme: ThemeColors }> = ({
  title,
  children,
  theme,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase' }}>{title}</div>
    <div
      style={{
        backgroundColor: theme.surfaceBg,
        borderRadius: 6,
        padding: '6px 10px',
        border: `1px solid ${theme.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {children}
    </div>
  </div>
);

const ShortcutRow: React.FC<{ label: string; keys: string[] }> = ({ label, keys }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ color: '#97a3b5' }}>{label}</span>
    <div style={{ display: 'flex', gap: 4 }}>
      {keys.map((k) => (
        <kbd
          key={k}
          style={{
            backgroundColor: '#000000',
            border: '1px solid #28303f',
            borderRadius: 4,
            padding: '2px 5px',
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#d0d8e4',
          }}
        >
          {k}
        </kbd>
      ))}
    </div>
  </div>
);
