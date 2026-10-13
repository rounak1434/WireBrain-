import React from 'react';
import {
  Layers,
  Shapes,
  ListTree,
  GraduationCap,
  Keyboard,
  Grid,
  Magnet,
  Download,
  HelpCircle,
  Moon,
  Sparkles,
} from 'lucide-react';
import { ActiveSidebarTab, ThemeMode } from '../../types';
import { ThemeColors } from '../../styles/theme';

interface NavigationRailProps {
  activeTab: ActiveSidebarTab;
  onTabChange: (tab: ActiveSidebarTab) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onOpenExport: () => void;
  onOpenShortcuts: () => void;
  theme: ThemeColors;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onTabChange,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  onOpenExport,
  onOpenShortcuts,
  theme,
  themeMode,
  onToggleTheme,
}) => {
  return (
    <nav
      aria-label="Navigation Rail"
      style={{
        width: 54,
        backgroundColor: theme.panelBg,
        borderRight: `1px solid ${theme.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Brand Logo Mark */}
      <div
        title="WireBrain"
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: theme.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 16,
          boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)',
        }}
      >
        ❖
      </div>

      {/* Primary Sidebar Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'center' }}>
        <RailButton
          icon={<Layers size={19} />}
          label="Boards Manager"
          isActive={activeTab === 'boards'}
          onClick={() => onTabChange('boards')}
          theme={theme}
        />
        <RailButton
          icon={<Shapes size={19} />}
          label="Elements Library"
          isActive={activeTab === 'elements'}
          onClick={() => onTabChange('elements')}
          theme={theme}
        />
        <RailButton
          icon={<ListTree size={19} />}
          label="Layers Hierarchy"
          isActive={activeTab === 'layers'}
          onClick={() => onTabChange('layers')}
          theme={theme}
        />
        <RailButton
          icon={<GraduationCap size={19} />}
          label="Tutorial & Guides"
          isActive={activeTab === 'tutorial'}
          onClick={() => onTabChange('tutorial')}
          theme={theme}
        />
        <RailButton
          icon={<Keyboard size={19} />}
          label="Shortcuts Guide"
          isActive={activeTab === 'shortcuts'}
          onClick={() => onTabChange('shortcuts')}
          theme={theme}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Utility Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', alignItems: 'center' }}>
        <RailButton
          icon={<Moon size={18} />}
          label={`Theme: ${themeMode === 'pure-black' ? 'Pure Black (Active)' : 'Midnight'}`}
          isActive={themeMode === 'pure-black'}
          onClick={onToggleTheme}
          theme={theme}
        />
        <RailButton
          icon={<Grid size={18} />}
          label={showGrid ? 'Hide Canvas Grid' : 'Show Canvas Grid'}
          isActive={showGrid}
          onClick={onToggleGrid}
          theme={theme}
        />
        <RailButton
          icon={<Magnet size={18} />}
          label={snapToGrid ? 'Disable Grid Snap' : 'Enable Grid Snap'}
          isActive={snapToGrid}
          onClick={onToggleSnap}
          theme={theme}
        />
        <RailButton
          icon={<Download size={18} />}
          label="Export Canvas (PNG, SVG, JSON)"
          onClick={onOpenExport}
          theme={theme}
        />
        <RailButton
          icon={<HelpCircle size={18} />}
          label="Keyboard Shortcuts & Help"
          onClick={onOpenShortcuts}
          theme={theme}
        />
      </div>
    </nav>
  );
};

interface RailButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  theme: ThemeColors;
}

const RailButton: React.FC<RailButtonProps> = ({ icon, label, isActive, onClick, theme }) => {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        border: 'none',
        backgroundColor: isActive ? theme.surfaceActive : 'transparent',
        color: isActive ? theme.accent : theme.textMuted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = theme.surfaceHover;
          e.currentTarget.style.color = theme.textPrimary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = theme.textMuted;
        }
      }}
    >
      {icon}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            backgroundColor: theme.accent,
            borderRadius: '0 2px 2px 0',
          }}
        />
      )}
    </button>
  );
};
