import React, { useState } from 'react';
import { ThemeColors } from '../../styles/theme';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layout,
  Server,
  Play,
  CheckCircle,
  Database,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBoard: (boardId: string) => void;
  theme: ThemeColors;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onSelectBoard,
  theme,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const totalSlides = 4;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: 580,
          backgroundColor: theme.panelBg,
          border: `1px solid ${theme.borderStrong}`,
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Top Header bar */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: `1px solid ${theme.borderSubtle}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.panelHeaderBg,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                backgroundColor: theme.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              ❖
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, letterSpacing: '0.02em' }}>
              Welcome to WireBrain
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: theme.textMuted,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 4,
            }}
          >
            Skip Intro
          </button>
        </div>

        {/* Slide Body */}
        <div style={{ padding: '24px 28px', minHeight: 330, display: 'flex', flexDirection: 'column' }}>
          {/* SLIDE 0: Wireframes */}
          {currentSlide === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: theme.accent,
                    letterSpacing: '0.05em',
                  }}
                >
                  Step 1 of 4 • Visual Wireframing
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, marginTop: 4 }}>
                  Rapid Website & Mobile Wireframes
                </h2>
                <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
                  Draft responsive desktop browser frames and mobile screens with high-fidelity UI elements including navigation bars, interactive buttons, inputs, and image placeholders.
                </p>
              </div>

              {/* Real Element Mini Preview */}
              <div
                style={{
                  backgroundColor: '#000000',
                  border: `1px solid ${theme.borderSubtle}`,
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {/* Mini Browser Frame */}
                <div
                  style={{
                    backgroundColor: '#0c0d12',
                    border: '1px solid #232734',
                    borderRadius: 6,
                    padding: '8px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #1a1e28', paddingBottom: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#eab308' }} />
                    <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                    <div style={{ flex: 1, backgroundColor: '#13161f', borderRadius: 3, height: 16, padding: '0 8px', fontSize: 10, color: '#707b8c', display: 'flex', alignItems: 'center' }}>
                      🔒 https://acme-cloud.io/dashboard
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff' }}>ACME Platform</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, backgroundColor: '#3b82f6', color: '#fff', fontWeight: 600 }}>
                        Get Started
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 1: Architecture Diagrams */}
          {currentSlide === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: theme.accent,
                    letterSpacing: '0.05em',
                  }}
                >
                  Step 2 of 4 • Architecture & Flows
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, marginTop: 4 }}>
                  Distributed Systems & Flowcharts
                </h2>
                <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
                  Map microservices, event queues, databases, and decision trees. Smart orthogonal connectors automatically route paths and lock to connection anchors.
                </p>
              </div>

              {/* Real Mini Diagram Preview */}
              <div
                style={{
                  backgroundColor: '#000000',
                  border: `1px solid ${theme.borderSubtle}`,
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                }}
              >
                {/* Service 1 */}
                <div
                  style={{
                    backgroundColor: '#0f1420',
                    border: '1px solid #3b82f6',
                    borderRadius: 6,
                    padding: '8px 12px',
                    textAlign: 'center',
                  }}
                >
                  <Server size={14} color="#3b82f6" />
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', marginTop: 2 }}>API Gateway</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: '#3b82f6' }}>
                  <span style={{ fontSize: 10, color: '#687890', marginRight: 4 }}>HTTPS</span>
                  <ArrowRight size={14} />
                </div>

                {/* Service 2 */}
                <div
                  style={{
                    backgroundColor: '#121620',
                    border: '1px solid #283347',
                    borderRadius: 6,
                    padding: '8px 12px',
                    textAlign: 'center',
                  }}
                >
                  <Database size={14} color="#38bdf8" />
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', marginTop: 2 }}>PostgreSQL</div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: Simulation & Prototype */}
          {currentSlide === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: theme.accent,
                    letterSpacing: '0.05em',
                  }}
                >
                  Step 3 of 4 • Simulation & Preview
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, marginTop: 4 }}>
                  Simulate Flows & Test Prototypes
                </h2>
                <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
                  Switch into <strong>Simulate Mode</strong> to watch animated tokens travel across your architecture with detailed trace logs, or test clickable buttons in <strong>Prototype Preview</strong>.
                </p>
              </div>

              {/* Simulation animation preview */}
              <div
                style={{
                  backgroundColor: '#000000',
                  border: `1px solid ${theme.borderSubtle}`,
                  borderRadius: 10,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', fontWeight: 600 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                    Live Token Hop: Gateway → Auth Service (JWT 200 OK)
                  </div>
                  <div style={{ fontSize: 10, color: '#566377' }}>Step 2 of 4</div>
                </div>
                <div style={{ backgroundColor: '#090b10', borderRadius: 6, padding: '8px 10px', fontSize: 11, color: '#8d99ac', fontFamily: 'monospace' }}>
                  Trace: POST /v1/auth/login → Status 200 OK (Issued Session)
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: Getting Started */}
          {currentSlide === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#10b981',
                    letterSpacing: '0.05em',
                  }}
                >
                  All Set • Ready to Design
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, marginTop: 4 }}>
                  Choose Your Starting Workspace
                </h2>
                <p style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
                  Select one of the curated starter boards or jump directly into the full canvas editor. You can always replay this guide or access guided tutorials from the <strong>Tutorial</strong> tab in the navigation rail.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectBoard('board-website');
                    onClose();
                  }}
                  style={starterBoardCardStyle(theme)}
                >
                  <Layout size={18} color="#3b82f6" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>Website Wireframe</span>
                  <span style={{ fontSize: 10, color: '#788497' }}>Hero, navbar & cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectBoard('board-mobile');
                    onClose();
                  }}
                  style={starterBoardCardStyle(theme)}
                >
                  <Layout size={18} color="#a855f7" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>Mobile App</span>
                  <span style={{ fontSize: 10, color: '#788497' }}>iPhone ops dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectBoard('board-system');
                    onClose();
                  }}
                  style={starterBoardCardStyle(theme)}
                >
                  <Server size={18} color="#10b981" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>System Map</span>
                  <span style={{ fontSize: 10, color: '#788497' }}>Microservices & Kafka</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: `1px solid ${theme.borderSubtle}`,
            backgroundColor: theme.panelHeaderBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Progress Dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: currentSlide === idx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: currentSlide === idx ? theme.accent : theme.borderStrong,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '7px 14px',
                  backgroundColor: theme.surfaceBg,
                  border: `1px solid ${theme.borderSubtle}`,
                  borderRadius: 6,
                  color: theme.textSecondary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 18px',
                backgroundColor: theme.accent,
                border: 'none',
                borderRadius: 6,
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
              }}
            >
              <span>{currentSlide === totalSlides - 1 ? 'Start Designing' : 'Continue'}</span>
              {currentSlide < totalSlides - 1 && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const starterBoardCardStyle = (theme: ThemeColors): React.CSSProperties => ({
  backgroundColor: theme.surfaceBg,
  border: `1px solid ${theme.borderSubtle}`,
  borderRadius: 8,
  padding: '14px 10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 6,
  cursor: 'pointer',
  transition: 'border-color 0.15s ease, background-color 0.15s ease',
});
