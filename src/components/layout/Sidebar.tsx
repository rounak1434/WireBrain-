import React, { useState } from 'react';
import {
  Board,
  CanvasElement,
  ActiveSidebarTab,
  ElementType,
  ReusableComponentDefinition,
} from '../../types';
import { ThemeColors } from '../../styles/theme';
import { TutorialPanel } from '../tutorial/TutorialPanel';
import { ExamplesGalleryPanel } from '../examples/ExamplesGalleryPanel';
import { StructurePanel } from './StructurePanel';
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
  Package,
  Workflow,
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
  onSelectElements?: (ids: string[]) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorderElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onGroupElements?: (ids: string[], name?: string) => void;
  onUngroupElements?: (ids: string[]) => void;
  onRenameElement?: (id: string, newLabel: string) => void;
  theme: ThemeColors;
  onStartGuidedTour: () => void;
  onReplayWelcome: () => void;
  onCreateTutorialBoard: (type: 'architecture' | 'wireframe') => void;
  completedGuides: Record<string, boolean>;
  onToggleGuideComplete: (guideId: string) => void;
  onOpenExampleProject?: (example: ExampleProjectDefinition, mode?: 'edit' | 'prototype' | 'simulate') => void;
  reusableComponents?: ReusableComponentDefinition[];
  onInsertComponentInstance?: (componentDef: ReusableComponentDefinition) => void;
  onDeleteReusableComponent?: (componentId: string) => void;
  width?: number;
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
  onSelectElements,
  onToggleVisibility,
  onToggleLock,
  onReorderElement,
  onGroupElements,
  onUngroupElements,
  onRenameElement,
  theme,
  onStartGuidedTour,
  onReplayWelcome,
  onCreateTutorialBoard,
  completedGuides,
  onToggleGuideComplete,
  onOpenExampleProject,
  reusableComponents,
  onInsertComponentInstance,
  onDeleteReusableComponent,
  width = 270,
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
        width,
        minWidth: width,
        maxWidth: width,
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
          {activeTab === 'layers' && 'Structure & Layers'}
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
                  data-board-id={b.id}
                  data-testid={`board-item-${b.id}`}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1, minWidth: 0 }}>
                        <span style={{ color: isActive ? theme.accent : theme.textMuted, flexShrink: 0 }}>
                          {b.id.includes('web') || b.boardType === 'website' ? (
                            <Layout size={15} />
                          ) : b.id.includes('mob') || b.boardType === 'mobile' ? (
                            <Smartphone size={15} />
                          ) : b.id.includes('flow') || b.boardType === 'flowchart' ? (
                            <Workflow size={15} />
                          ) : (
                            <Server size={15} />
                          )}
                        </span>
                        <span
                          title={b.title}
                          style={{
                            fontWeight: isActive ? 600 : 500,
                            fontSize: 12,
                            color: isActive ? theme.textPrimary : theme.textSecondary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {b.title}
                        </span>
                      </div>
                    )}

                    {!isEditing && (
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
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

            {/* Reusable Components Library */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Package size={13} color="#60a5fa" />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#60a5fa',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Reusable Components
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    backgroundColor: '#172554',
                    color: '#60a5fa',
                    padding: '1px 6px',
                    borderRadius: 10,
                  }}
                >
                  {(reusableComponents || []).length}
                </span>
              </div>

              {(reusableComponents || []).filter(
                (c) =>
                  !searchElements ||
                  c.name.toLowerCase().includes(searchElements.toLowerCase()) ||
                  c.category.toLowerCase().includes(searchElements.toLowerCase())
              ).length > 0 ? (
                (reusableComponents || [])
                  .filter(
                    (c) =>
                      !searchElements ||
                      c.name.toLowerCase().includes(searchElements.toLowerCase()) ||
                      c.category.toLowerCase().includes(searchElements.toLowerCase())
                  )
                  .map((comp) => (
                    <div
                      key={comp.id}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: theme.surfaceBg,
                        border: `1px solid ${theme.borderSubtle}`,
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            title={comp.name}
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#ffffff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {comp.name}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginTop: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                backgroundColor: '#1e293b',
                                color: '#94a3b8',
                                padding: '1px 5px',
                                borderRadius: 4,
                                flexShrink: 0,
                              }}
                            >
                              {comp.category}
                            </span>
                            <span style={{ fontSize: 10, color: theme.textMuted, flexShrink: 0 }}>
                              {comp.elements.length}{' '}
                              {comp.elements.length === 1 ? 'element' : 'elements'}
                            </span>
                          </div>
                        </div>

                        {onDeleteReusableComponent && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteReusableComponent(comp.id);
                            }}
                            title="Delete Component Definition"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: theme.textMuted,
                              cursor: 'pointer',
                              padding: 2,
                              flexShrink: 0,
                              opacity: 0.6,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = theme.textMuted;
                              e.currentTarget.style.opacity = '0.6';
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {comp.description && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: theme.textMuted,
                            lineHeight: 1.3,
                          }}
                        >
                          {comp.description}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => onInsertComponentInstance?.(comp)}
                        style={{
                          marginTop: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          backgroundColor: '#172554',
                          border: '1px solid #1d4ed8',
                          borderRadius: 6,
                          color: '#93c5fd',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1e3a8a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#172554';
                        }}
                      >
                        <Plus size={12} />
                        <span>Place Instance on Board</span>
                      </button>
                    </div>
                  ))
              ) : (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: `1px dashed ${theme.borderSubtle}`,
                    backgroundColor: 'rgba(255,255,255,0.01)',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 11, color: theme.textMuted, lineHeight: 1.4 }}>
                    No matching components found.
                  </p>
                </div>
              )}
            </div>

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

        {/* LAYERS & STRUCTURE TAB */}
        {activeTab === 'layers' && (
          <StructurePanel
            elements={elements}
            selectedElementIds={selectedElementIds}
            onSelectElement={onSelectElement}
            onSelectElements={onSelectElements}
            onToggleVisibility={onToggleVisibility}
            onToggleLock={onToggleLock}
            onReorderElement={onReorderElement}
            onGroupElements={onGroupElements}
            onUngroupElements={onUngroupElements}
            onRenameElement={onRenameElement}
            theme={theme}
          />
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
    <div style={{ color: theme.accent, flexShrink: 0 }}>{icon}</div>
    <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
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
