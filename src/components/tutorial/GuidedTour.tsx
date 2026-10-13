import React, { useState } from 'react';
import { ThemeColors } from '../../styles/theme';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

interface TourStep {
  title: string;
  description: string;
  targetArea: 'rail' | 'sidebar' | 'toolbar' | 'canvas' | 'inspector';
  cardPosition: { top?: number; left?: number; right?: number; bottom?: number };
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Navigation Rail',
    description: 'Switch between Project Boards, Elements Palette, Layers hierarchy, and this Tutorial. Also toggles grid display, snapping, and export.',
    targetArea: 'rail',
    cardPosition: { top: 80, left: 66 },
  },
  {
    title: 'Sidebar & Elements Library',
    description: 'Browse categorized elements for Websites, Mobile apps, Flowcharts, and Architecture. Click or drag any item directly onto the canvas.',
    targetArea: 'sidebar',
    cardPosition: { top: 80, left: 335 },
  },
  {
    title: 'Top Toolbar & Mode Actions',
    description: 'Select editing tools (Select, Hand, Connector, Shapes, Frames, Text), undo/redo, zoom controls, and enter Simulation or Prototype Preview modes.',
    targetArea: 'toolbar',
    cardPosition: { top: 60, left: 380 },
  },
  {
    title: 'Infinite Canvas Workspace',
    description: 'Drag objects to position them with 20px grid snapping. Hover over any object to connect arrows from its 4 anchor points. Double-click to edit text.',
    targetArea: 'canvas',
    cardPosition: { top: 160, left: 420 },
  },
  {
    title: 'Properties & Prototype Inspector',
    description: 'Fine-tune position, colors, typography, stroke widths, and wireframe prototype actions (e.g. click button to navigate or open modal).',
    targetArea: 'inspector',
    cardPosition: { top: 80, right: 300 },
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose, theme }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIdx];
  const isFirst = currentStepIdx === 0;
  const isLast = currentStepIdx === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStepIdx(currentStepIdx + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'auto',
        zIndex: 150,
        userSelect: 'none',
      }}
    >
      {/* Target Highlights based on active tour step */}
      {step.targetArea === 'rail' && (
        <div style={highlightBoxStyle({ left: 0, top: 0, width: 54, height: '100%' })} />
      )}
      {step.targetArea === 'sidebar' && (
        <div style={highlightBoxStyle({ left: 54, top: 48, width: 270, height: 'calc(100% - 48px)' })} />
      )}
      {step.targetArea === 'toolbar' && (
        <div style={highlightBoxStyle({ left: 0, top: 0, width: '100%', height: 48 })} />
      )}
      {step.targetArea === 'inspector' && (
        <div style={highlightBoxStyle({ right: 0, top: 48, width: 280, height: 'calc(100% - 48px)' })} />
      )}

      {/* Floating Tour Card */}
      <div
        style={{
          position: 'absolute',
          ...step.cardPosition,
          width: 320,
          backgroundColor: '#0a0c10',
          border: '1.5px solid #3b82f6',
          borderRadius: 10,
          padding: 18,
          boxShadow: '0 16px 40px rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          zIndex: 160,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: '#3b82f6',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              TOUR {currentStepIdx + 1} / {TOUR_STEPS.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#687384', cursor: 'pointer', padding: 2 }}
          >
            <X size={15} />
          </button>
        </div>

        <div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{step.title}</h4>
          <p style={{ fontSize: 12, color: '#9da8b9', marginTop: 4, lineHeight: 1.45 }}>{step.description}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #1c222e' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#7a8597', fontSize: 11, cursor: 'pointer' }}
          >
            Skip Tour
          </button>

          <div style={{ display: 'flex', gap: 6 }}>
            {!isFirst && (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '5px 10px',
                  backgroundColor: '#161a22',
                  border: '1px solid #293140',
                  borderRadius: 5,
                  color: '#d4dde8',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={13} /> Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '5px 12px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: 5,
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>{isLast ? 'Finish' : 'Next'}</span>
              {isLast ? <Check size={13} /> : <ChevronRight size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const highlightBoxStyle = (rect: { top?: number; bottom?: number; left?: number; right?: number; width: number | string; height: number | string }): React.CSSProperties => ({
  position: 'absolute',
  ...rect,
  outline: '2px solid #3b82f6',
  outlineOffset: '-2px',
  boxShadow: '0 0 24px rgba(59, 130, 246, 0.4)',
  pointerEvents: 'none',
  zIndex: 155,
});
