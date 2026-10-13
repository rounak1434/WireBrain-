import React, { useState } from 'react';
import { ThemeColors } from '../../styles/theme';
import { exampleProjects, ExampleProjectDefinition } from '../../data/exampleProjects';
import {
  Sparkles,
  Layout,
  Smartphone,
  GitBranch,
  Server,
  Cloud,
  Play,
  Eye,
  Plus,
  ExternalLink,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';

interface ExamplesGalleryPanelProps {
  theme: ThemeColors;
  onOpenExample: (example: ExampleProjectDefinition, mode?: 'edit' | 'prototype' | 'simulate') => void;
  activeBoardId?: string;
}

type FilterCategory = 'all' | 'website' | 'mobile' | 'flowchart' | 'architecture' | 'infrastructure';

export const ExamplesGalleryPanel: React.FC<ExamplesGalleryPanelProps> = ({
  theme,
  onOpenExample,
  activeBoardId,
}) => {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [selectedExampleId, setSelectedExampleId] = useState<string | null>(null);

  const filteredProjects =
    filter === 'all'
      ? exampleProjects
      : exampleProjects.filter((p) => p.category === filter);

  const getCategoryIcon = (category: ExampleProjectDefinition['category']) => {
    switch (category) {
      case 'website':
        return <Layout size={14} style={{ color: '#3b82f6' }} />;
      case 'mobile':
        return <Smartphone size={14} style={{ color: '#10b981' }} />;
      case 'flowchart':
        return <GitBranch size={14} style={{ color: '#f59e0b' }} />;
      case 'architecture':
        return <Server size={14} style={{ color: '#8b5cf6' }} />;
      case 'infrastructure':
        return <Cloud size={14} style={{ color: '#06b6d4' }} />;
      default:
        return <Sparkles size={14} style={{ color: '#3b82f6' }} />;
    }
  };

  const categories: Array<{ id: FilterCategory; label: string }> = [
    { id: 'all', label: 'All (5)' },
    { id: 'website', label: 'Web' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'flowchart', label: 'Flow' },
    { id: 'architecture', label: 'System' },
    { id: 'infrastructure', label: 'Cloud' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: theme.panelBg,
        overflow: 'hidden',
      }}
    >
      {/* Category Pills Header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: `1px solid ${theme.borderSubtle}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          backgroundColor: theme.panelHeaderBg,
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            style={{
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
              border: filter === cat.id ? `1px solid ${theme.accent}` : `1px solid ${theme.borderSubtle}`,
              backgroundColor: filter === cat.id ? '#172554' : theme.surfaceBg,
              color: filter === cat.id ? '#60a5fa' : theme.textMuted,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Examples Scrollable List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {filteredProjects.map((ex) => {
          const isCurrentlyLoaded = activeBoardId === ex.board.id;
          const elementCount = ex.board.elements.length;
          const connectorCount = ex.board.connectors.length;

          return (
            <div
              key={ex.id}
              style={{
                backgroundColor: theme.surfaceBg,
                border: isCurrentlyLoaded
                  ? `1px solid ${theme.accent}`
                  : `1px solid ${theme.borderSubtle}`,
                borderRadius: 8,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'border-color 0.15s ease, transform 0.15s ease',
              }}
            >
              {/* Category & Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {getCategoryIcon(ex.category)}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#94a3b8',
                    }}
                  >
                    {ex.badge}
                  </span>
                </div>
                {isCurrentlyLoaded && (
                  <span
                    style={{
                      fontSize: 10,
                      color: '#10b981',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={12} /> Active
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div>
                <h4
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.3,
                  }}
                >
                  {ex.title}
                </h4>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontSize: 11,
                    color: '#8b9bb4',
                    lineHeight: 1.35,
                  }}
                >
                  {ex.subtitle}
                </p>
              </div>

              {/* Compact Stats */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 10,
                  color: '#64748b',
                  fontFamily: 'monospace',
                }}
              >
                <span>{elementCount} nodes</span>
                <span>•</span>
                <span>{connectorCount} links</span>
                <span>•</span>
                <span style={{ color: ex.recommendedMode === 'simulate' ? '#38bdf8' : '#a78bfa' }}>
                  {ex.recommendedMode === 'simulate' ? '⚡ Live Simulation' : '▶ Interactive Prototype'}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => onOpenExample(ex, 'edit')}
                  title="Load or duplicate this board into your project"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    backgroundColor: '#161e2e',
                    border: '1px solid #28354d',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.borderColor = theme.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#161e2e';
                    e.currentTarget.style.borderColor = '#28354d';
                  }}
                >
                  <Plus size={13} /> Open & Edit
                </button>

                {ex.recommendedMode === 'simulate' ? (
                  <button
                    type="button"
                    onClick={() => onOpenExample(ex, 'simulate')}
                    title="Open board and launch live data simulation"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: '#0c2e42',
                      border: '1px solid #0284c7',
                      color: '#38bdf8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0369a1';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#0c2e42';
                      e.currentTarget.style.color = '#38bdf8';
                    }}
                  >
                    <Play size={12} fill="currentColor" /> Simulate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenExample(ex, 'prototype')}
                    title="Open board in interactive prototype preview"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      backgroundColor: '#2e1065',
                      border: '1px solid #7c3aed',
                      color: '#c4b5fd',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#6d28d9';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#2e1065';
                      e.currentTarget.style.color = '#c4b5fd';
                    }}
                  >
                    <Eye size={12} /> Preview
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
