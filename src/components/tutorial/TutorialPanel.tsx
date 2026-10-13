import React, { useState } from 'react';
import { ThemeColors } from '../../styles/theme';
import {
  GraduationCap,
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  Circle,
  Sparkles,
  Layout,
  Smartphone,
  GitBranch,
  Server,
  ArrowRight,
  ExternalLink,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface TutorialPanelProps {
  theme: ThemeColors;
  onStartGuidedTour: () => void;
  onReplayWelcome: () => void;
  onCreateTutorialBoard: (type: 'architecture' | 'wireframe') => void;
  completedGuides: Record<string, boolean>;
  onToggleGuideComplete: (guideId: string) => void;
}

export const TutorialPanel: React.FC<TutorialPanelProps> = ({
  theme,
  onStartGuidedTour,
  onReplayWelcome,
  onCreateTutorialBoard,
  completedGuides,
  onToggleGuideComplete,
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'getting-started' | 'guides' | 'exercises'>('getting-started');
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>('guide-web');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontSize: 12,
        color: theme.textSecondary,
      }}
    >
      {/* Quick Action Cards: Interactive Tour & Replay Welcome */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          type="button"
          onClick={onStartGuidedTour}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            backgroundColor: theme.accent,
            border: 'none',
            borderRadius: 7,
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 12,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlayCircle size={16} />
            <span>Start Interactive UI Tour</span>
          </div>
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          onClick={onReplayWelcome}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '7px 10px',
            backgroundColor: theme.surfaceBg,
            border: `1px solid ${theme.borderSubtle}`,
            borderRadius: 6,
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          <RotateCcw size={13} />
          <span>Replay Welcome Introduction</span>
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#000000',
          borderRadius: 6,
          padding: 2,
          border: `1px solid ${theme.borderSubtle}`,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveGuideTab('getting-started')}
          style={subTabStyle(activeGuideTab === 'getting-started', theme)}
        >
          Workflow
        </button>
        <button
          type="button"
          onClick={() => setActiveGuideTab('guides')}
          style={subTabStyle(activeGuideTab === 'guides', theme)}
        >
          Guides
        </button>
        <button
          type="button"
          onClick={() => setActiveGuideTab('exercises')}
          style={subTabStyle(activeGuideTab === 'exercises', theme)}
        >
          Exercises
        </button>
      </div>

      {/* TAB 1: Getting Started 5-step Workflow */}
      {activeGuideTab === 'getting-started' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <StepItem
            num={1}
            title="Choose or Create a Board"
            desc="Select Website, Mobile App, or System Map from the top switcher or left Boards tab, or click '+ New' to start fresh."
            theme={theme}
          />
          <StepItem
            num={2}
            title="Place Elements on Canvas"
            desc="Click an element in the Elements tab or choose a tool (R, D, B, S, T, W, M) from the top bar to drop it on the canvas."
            theme={theme}
          />
          <StepItem
            num={3}
            title="Connect with Smart Arrows"
            desc="Select Connector tool (C) or hover over any element to reveal 4 blue anchors. Drag between anchors to establish link."
            theme={theme}
          />
          <StepItem
            num={4}
            title="Customize in Inspector"
            desc="Select any element or connector to tweak position, typography, colors, stroke width, and prototype action links."
            theme={theme}
          />
          <StepItem
            num={5}
            title="Simulate, Preview & Export"
            desc="Click 'Simulate' or 'Preview' in the top bar to test live data flows or prototype navigation, then export to SVG or PNG."
            theme={theme}
          />
        </div>
      )}

      {/* TAB 2: Beginner Guides by Category */}
      {activeGuideTab === 'guides' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <GuideCard
            id="guide-web"
            title="Website Wireframing"
            icon={<Layout size={15} color="#3b82f6" />}
            summary="Structuring web landing pages, navbars, hero grids, and responsive viewports."
            details="Use Desktop Page Frame (W) as the artboard container. Add navigation bars, buttons, and crossed image placeholders. Double-click any element to edit text in-place."
            isExpanded={expandedGuideId === 'guide-web'}
            isDone={!!completedGuides['guide-web']}
            onToggleExpand={() => setExpandedGuideId(expandedGuideId === 'guide-web' ? null : 'guide-web')}
            onToggleComplete={() => onToggleGuideComplete('guide-web')}
            theme={theme}
          />

          <GuideCard
            id="guide-mob"
            title="Mobile App Wireframing"
            icon={<Smartphone size={15} color="#a855f7" />}
            summary="Designing mobile screens with iPhone bezels, thumb zones, and tab bars."
            details="Use Mobile Phone Frame (M) to design for 375×760 resolution. Place app headers, search inputs, list cards, and bottom navigation bars. In Properties Inspector, wire up buttons to prototype screen transitions."
            isExpanded={expandedGuideId === 'guide-mob'}
            isDone={!!completedGuides['guide-mob']}
            onToggleExpand={() => setExpandedGuideId(expandedGuideId === 'guide-mob' ? null : 'guide-mob')}
            onToggleComplete={() => onToggleGuideComplete('guide-mob')}
            theme={theme}
          />

          <GuideCard
            id="guide-flow"
            title="Flowcharts & Decisions"
            icon={<GitBranch size={15} color="#eab308" />}
            summary="Constructing logic trees, conditions, and business processes."
            details="Combine Process Step rectangles with Decision Diamonds (D) and Start/End terminals. Connect them with orthogonal arrows and add label annotations on each branch (e.g. Yes / No)."
            isExpanded={expandedGuideId === 'guide-flow'}
            isDone={!!completedGuides['guide-flow']}
            onToggleExpand={() => setExpandedGuideId(expandedGuideId === 'guide-flow' ? null : 'guide-flow')}
            onToggleComplete={() => onToggleGuideComplete('guide-flow')}
            theme={theme}
          />

          <GuideCard
            id="guide-arch"
            title="Architecture Diagrams"
            icon={<Server size={15} color="#10b981" />}
            summary="Diagramming microservices, Kafka event buses, caches, and cloud databases."
            details="Drop Microservices (service boxes with status dots), PostgreSQL cylinders, Redis in-memory caches, and AWS S3 clouds. Connect with protocol arrows and run Simulation Mode to animate token hops!"
            isExpanded={expandedGuideId === 'guide-arch'}
            isDone={!!completedGuides['guide-arch']}
            onToggleExpand={() => setExpandedGuideId(expandedGuideId === 'guide-arch' ? null : 'guide-arch')}
            onToggleComplete={() => onToggleGuideComplete('guide-arch')}
            theme={theme}
          />
        </div>
      )}

      {/* TAB 3: Hands-On Exercises */}
      {activeGuideTab === 'exercises' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#000000',
              border: `1px solid ${theme.borderSubtle}`,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={16} color="#3b82f6" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                Exercise 1: Microservice Pipeline
              </span>
            </div>
            <p style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 1.4 }}>
              Creates a dedicated, isolated practice board where you can connect a Web Client, API Gateway, and PostgreSQL database without modifying your real work.
            </p>
            <button
              type="button"
              onClick={() => onCreateTutorialBoard('architecture')}
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                backgroundColor: theme.accent,
                border: 'none',
                borderRadius: 5,
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <span>Load Practice Board</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#000000',
              border: `1px solid ${theme.borderSubtle}`,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layout size={16} color="#a855f7" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                Exercise 2: Wireframe Hero & Button
              </span>
            </div>
            <p style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 1.4 }}>
              Creates a blank sandbox with guided challenge notes to design a hero section with a primary CTA and link it to prototype navigation.
            </p>
            <button
              type="button"
              onClick={() => onCreateTutorialBoard('wireframe')}
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                backgroundColor: theme.surfaceBg,
                border: `1px solid ${theme.borderSubtle}`,
                borderRadius: 5,
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              <span>Load Wireframe Sandbox</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const subTabStyle = (active: boolean, theme: ThemeColors): React.CSSProperties => ({
  flex: 1,
  padding: '6px 0',
  backgroundColor: active ? theme.surfaceActive : 'transparent',
  border: 'none',
  borderRadius: 5,
  color: active ? '#ffffff' : theme.textMuted,
  fontSize: 11,
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  textAlign: 'center',
  transition: 'all 0.12s ease',
});

const StepItem: React.FC<{ num: number; title: string; desc: string; theme: ThemeColors }> = ({
  num,
  title,
  desc,
  theme,
}) => (
  <div
    style={{
      padding: '8px 10px',
      backgroundColor: '#000000',
      border: `1px solid ${theme.borderSubtle}`,
      borderRadius: 6,
      display: 'flex',
      gap: 10,
    }}
  >
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        backgroundColor: theme.surfaceBg,
        border: `1px solid ${theme.borderStrong}`,
        color: theme.accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        flexShrink: 0,
        marginTop: 2,
      }}
    >
      {num}
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>{title}</div>
      <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2, lineHeight: 1.35 }}>{desc}</div>
    </div>
  </div>
);

interface GuideCardProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  details: string;
  isExpanded: boolean;
  isDone: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  theme: ThemeColors;
}

const GuideCard: React.FC<GuideCardProps> = ({
  title,
  icon,
  summary,
  details,
  isExpanded,
  isDone,
  onToggleExpand,
  onToggleComplete,
  theme,
}) => (
  <div
    style={{
      backgroundColor: '#000000',
      border: `1px solid ${theme.borderSubtle}`,
      borderRadius: 7,
      overflow: 'hidden',
    }}
  >
    <div
      onClick={onToggleExpand}
      style={{
        padding: '9px 11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          {isDone ? (
            <CheckCircle2 size={15} color="#10b981" />
          ) : (
            <Circle size={15} color={theme.textMuted} />
          )}
        </button>
      </div>
    </div>

    {isExpanded && (
      <div
        style={{
          padding: '8px 12px 12px 12px',
          borderTop: `1px solid ${theme.borderSubtle}`,
          backgroundColor: theme.panelBg,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <p style={{ fontSize: 11, color: theme.textSecondary, lineHeight: 1.4 }}>{summary}</p>
        <p style={{ fontSize: 11, color: '#a0aec0', lineHeight: 1.4, borderLeft: `2px solid ${theme.accent}`, paddingLeft: 8 }}>
          {details}
        </p>
      </div>
    )}
  </div>
);
