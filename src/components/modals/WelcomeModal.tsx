import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ThemeColors } from '../../styles/theme';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Server,
  Database,
  Cloud,
  Layers,
  Smartphone,
  Laptop,
  Play,
  RotateCcw,
  Plus,
  ArrowRight,
  Crosshair,
  CheckCircle2,
  Cpu,
  Activity,
  Globe,
  Radio,
} from 'lucide-react';

export interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard?: (title: string) => void;
  theme: ThemeColors;
}

const TOTAL_SCENES = 4;

const SCENE_NAMES = [
  { id: 0, tag: '01 / CANVAS', title: 'Idea', label: 'The Blank Canvas' },
  { id: 1, tag: '02 / STRUCTURE', title: 'Interface', label: 'Wireframing' },
  { id: 2, tag: '03 / TOPOLOGY', title: 'System', label: 'Architecture' },
  { id: 3, tag: '04 / INTERACTION', title: 'Simulation', label: 'Simulation & Prototypes' },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onSelectBoard,
  onCreateBoard,
  theme,
}) => {
  // Target scene index: 0, 1, 2, or 3
  const [targetScene, setTargetScene] = useState(0);
  // Interpolated progress: 0.0 to 3.0
  const [progress, setProgress] = useState(0);

  // Check user's OS preference for reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Scene 4 Interactive Simulation state
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [simStep, setSimStep] = useState(0);
  const [manualPulseCount, setManualPulseCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Smooth lerp loop connecting targetScene to progress
  useEffect(() => {
    if (!isOpen) return;

    if (prefersReducedMotion) {
      setProgress(targetScene);
      return;
    }

    let running = true;
    const tick = () => {
      if (!running) return;
      setProgress((prev) => {
        const diff = targetScene - prev;
        if (Math.abs(diff) < 0.005) {
          return targetScene;
        }
        return prev + diff * 0.16; // Lerp factor ~0.16 for responsive tactile settle
      });
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, targetScene, prefersReducedMotion]);

  // Simulation pulse timer for Scene 4
  useEffect(() => {
    if (!isOpen || !isSimRunning) return;
    const interval = setInterval(() => {
      setSimStep((s) => (s + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, [isOpen, isSimRunning, manualPulseCount]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setTargetScene((prev) => Math.min(TOTAL_SCENES - 1, prev + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setTargetScene((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setTargetScene(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setTargetScene(TOTAL_SCENES - 1);
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Wheel scrubbing: scoped strictly to modal with deadband & rate limiting
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const now = performance.now();
    // 350ms cooldown prevents rapid wheel clicks from skipping multiple scenes in one flick
    if (now - lastScrollTimeRef.current < 280) return;

    if (Math.abs(e.deltaY) > 25) {
      lastScrollTimeRef.current = now;
      if (e.deltaY > 0) {
        setTargetScene((prev) => Math.min(TOTAL_SCENES - 1, prev + 1));
      } else {
        setTargetScene((prev) => Math.max(0, prev - 1));
      }
    }
  };

  // Touch support for trackpads/screens
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const deltaY = touchStartYRef.current - e.touches[0].clientY;
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        setTargetScene((prev) => Math.min(TOTAL_SCENES - 1, prev + 1));
      } else {
        setTargetScene((prev) => Math.max(0, prev - 1));
      }
      touchStartYRef.current = null;
    }
  };

  if (!isOpen) return null;

  // Scene transition weights (0.0 to 1.0)
  const w0 = Math.max(0, 1 - Math.abs(progress - 0));
  const w1 = Math.max(0, 1 - Math.abs(progress - 1));
  const w2 = Math.max(0, 1 - Math.abs(progress - 2));
  const w3 = Math.max(0, 1 - Math.abs(progress - 3));

  const activeSceneIndex = Math.round(targetScene);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      tabIndex={0}
      aria-label="WireBrain Introduction Tour"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 250,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
        outline: 'none',
        color: '#f8fafc',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* 1. Canvas Blueprint Grid Ground Plane */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${-progress * 40}px ${-progress * 20}px`,
          pointerEvents: 'none',
          opacity: 0.85,
        }}
      />

      {/* Subtle Spatial Coordinate Watermark */}
      <div
        style={{
          position: 'absolute',
          top: 72,
          right: 32,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.08em',
          color: 'rgba(255, 255, 255, 0.22)',
          display: 'flex',
          gap: 16,
          pointerEvents: 'none',
        }}
      >
        <span>CANVAS: 2400 × 1600</span>
        <span>ORIGIN: (0, 0)</span>
        <span>GRID: 8px SNAP</span>
        <span>FPS: 60</span>
      </div>

      {/* 2. Top Navigation & Identity Bar */}
      <header
        style={{
          height: 58,
          borderBottom: '1px solid #141720',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Left: Brand Identity Mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              backgroundColor: theme.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 16,
              boxShadow: '0 0 16px rgba(59, 130, 246, 0.4)',
            }}
          >
            ❖
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                WireBrain
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  backgroundColor: '#121620',
                  color: '#93c5fd',
                  border: '1px solid #1e2638',
                }}
              >
                STUDIO INTRO
              </span>
            </div>
          </div>
        </div>

        {/* Center: Discrete Scene Timeline Switcher */}
        <nav
          aria-label="Scenes timeline"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#0a0c10',
            padding: '4px',
            borderRadius: 8,
            border: '1px solid #181d28',
          }}
        >
          {SCENE_NAMES.map((scene) => {
            const isActive = activeSceneIndex === scene.id;
            return (
              <button
                key={scene.id}
                type="button"
                onClick={() => setTargetScene(scene.id)}
                aria-current={isActive ? 'step' : undefined}
                style={{
                  background: isActive ? '#1e2638' : 'transparent',
                  border: isActive ? '1px solid #2e3b56' : '1px solid transparent',
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#3b82f6' : '#334155',
                    boxShadow: isActive ? '0 0 8px #3b82f6' : 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#f8fafc' : '#7e889b',
                  }}
                >
                  {scene.title}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Skip Action */}
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '1px solid #232938',
            borderRadius: 6,
            color: '#94a3b8',
            fontSize: 12,
            fontWeight: 500,
            padding: '6px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#232938';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          <span>Skip to Studio</span>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              padding: '1px 4px',
              backgroundColor: '#161922',
              borderRadius: 3,
              color: '#64748b',
            }}
          >
            ESC
          </span>
        </button>
      </header>

      {/* 3. Main Narrative & Canvas Stage (Full Window Flex) */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          padding: '24px 36px 16px 36px',
        }}
      >
        {/* Narrative Header: Editorial, Restrained, Dynamic based on active progress */}
        <section
          aria-live="polite"
          style={{
            maxWidth: 720,
            marginBottom: 16,
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#3b82f6',
              marginBottom: 4,
            }}
          >
            {SCENE_NAMES[activeSceneIndex].tag}
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: '0 0 6px 0',
            }}
          >
            {activeSceneIndex === 0 && 'Start with a blank canvas.'}
            {activeSceneIndex === 1 && 'Shape the screen.'}
            {activeSceneIndex === 2 && 'Connect the underlying system.'}
            {activeSceneIndex === 3 && 'See your architecture breathe.'}
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#8b96a8',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: 620,
            }}
          >
            {activeSceneIndex === 0 &&
              'Every interface, architecture, and protocol begins with space and intent. A calm neutral drafting ground where structure takes form without friction.'}
            {activeSceneIndex === 1 &&
              'Assemble desktop viewports, mobile screens, navigation bars, and buttons in seconds. Real hierarchy, deliberate spacing, and instant snapping.'}
            {activeSceneIndex === 2 &&
              'Screens do not live in isolation. Trace APIs, databases, Kafka event streams, and worker services with orthogonal connectors in the same unified space.'}
            {activeSceneIndex === 3 &&
              'Step through live message flows, test prototype interactions, and verify telemetry hops before writing production code.'}
          </p>
        </section>

        {/* Dynamic Canvas Stage World */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 380,
          }}
        >
          {/* Continuous Signature Connector Spine (SVG Vector Layer) */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            <defs>
              <linearGradient id="intro-spine-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="1" />
              </linearGradient>
              <filter id="intro-glow">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* In Scene 2 & 3 & 4: Unrolling spine connecting desktop wireframe button to API Gateway */}
            {progress >= 0.8 && (
              <g opacity={Math.min(1, (progress - 0.8) * 2)}>
                <path
                  d="M 390 236 L 460 236 L 460 190 L 530 190"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray={progress < 2.5 ? 'none' : 'none'}
                />
                <circle cx="390" cy="236" r="4" fill="#3b82f6" />
                <circle cx="530" cy="190" r="4" fill="#3b82f6" />

                {/* Branch to Microservice & Database */}
                {progress >= 1.7 && (
                  <g opacity={Math.min(1, (progress - 1.7) * 2)}>
                    {/* Path from API Gateway to Auth Microservice */}
                    <path
                      d="M 670 170 L 720 170"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    {/* Path from Auth Service to PostgreSQL */}
                    <path
                      d="M 850 170 L 890 170"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    {/* Path from API Gateway down to Event Bus */}
                    <path
                      d="M 600 230 L 600 280 L 720 280"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </g>
                )}

                {/* Scene 4: Travelling Glowing Simulation Token */}
                {progress >= 2.5 && isSimRunning && (
                  <g filter="url(#intro-glow)">
                    {simStep === 0 && (
                      <circle cx="390" cy="236" r="6" fill="#60a5fa">
                        <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {simStep === 1 && (
                      <circle cx="600" cy="190" r="6" fill="#60a5fa">
                        <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {simStep === 2 && (
                      <circle cx="785" cy="170" r="6" fill="#60a5fa">
                        <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {simStep === 3 && (
                      <circle cx="945" cy="170" r="6" fill="#60a5fa">
                        <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                )}
              </g>
            )}
          </svg>

          {/* ========================================================
              SCENE 0: THE BLANK CANVAS (Drafting crosshairs & guides)
             ======================================================== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: w0,
              transform: `scale(${0.95 + w0 * 0.05}) translateY(${(1 - w0) * 20}px)`,
              pointerEvents: w0 > 0.5 ? 'auto' : 'none',
              transition: prefersReducedMotion ? 'none' : 'opacity 0.2s ease, transform 0.2s ease',
            }}
          >
            <div
              style={{
                width: 620,
                height: 360,
                border: '1px dashed #2b3548',
                borderRadius: 12,
                backgroundColor: 'rgba(8, 10, 15, 0.6)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
              }}
            >
              {/* Origin Crosshair */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.25)',
                  }}
                >
                  <Crosshair size={20} />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: '#93c5fd',
                    backgroundColor: '#0b101a',
                    padding: '3px 8px',
                    borderRadius: 4,
                    border: '1px solid #1e293b',
                  }}
                >
                  Origin (0, 0)
                </div>
              </div>

              {/* Dimension Ruler Badges */}
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#64748b',
                  backgroundColor: '#000000',
                  padding: '2px 8px',
                  borderRadius: 3,
                  border: '1px solid #1e2638',
                }}
              >
                WIDTH: 620 PX
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: -38,
                  top: '50%',
                  transform: 'translateY(-50%) rotate(-90deg)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#64748b',
                  backgroundColor: '#000000',
                  padding: '2px 8px',
                  borderRadius: 3,
                  border: '1px solid #1e2638',
                }}
              >
                HEIGHT: 360 PX
              </div>

              {/* Corner Coordinate Pointers */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 16,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#475569',
                }}
              >
                <span>[X: 100, Y: 60]</span>
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 16,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: '#475569',
                }}
              >
                <span>[SNAP: 8PX]</span>
              </div>
            </div>
          </div>

          {/* ========================================================
              SCENE 1: SHAPE A SCREEN (Wireframes assembling)
             ======================================================== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              opacity: w1,
              transform: `scale(${0.96 + w1 * 0.04}) translateY(${(1 - w1) * 20}px)`,
              pointerEvents: w1 > 0.5 ? 'auto' : 'none',
              transition: prefersReducedMotion ? 'none' : 'opacity 0.2s ease, transform 0.2s ease',
            }}
          >
            {/* Desktop Wireframe Browser Frame (500px wide) */}
            <div
              style={{
                width: 500,
                height: 330,
                backgroundColor: '#07090e',
                border: '1px solid #202738',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 18px 48px rgba(0, 0, 0, 0.75)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Browser Header Bar */}
              <div
                style={{
                  height: 36,
                  backgroundColor: '#0d1017',
                  borderBottom: '1px solid #1a202e',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                  <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#eab308' }} />
                  <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                </div>
                {/* URL Bar */}
                <div
                  style={{
                    flex: 1,
                    height: 22,
                    backgroundColor: '#06080d',
                    borderRadius: 4,
                    border: '1px solid #1c2230',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    gap: 6,
                  }}
                >
                  <Globe size={11} color="#64748b" />
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                    https://wirebrain.studio/launch
                  </span>
                </div>
              </div>

              {/* Browser Canvas Wireframe Body */}
              <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Nav Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 10,
                    borderBottom: '1px solid #141824',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>⬢ WireBrain</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#64748b' }}>
                    <span>Canvas</span>
                    <span>Architecture</span>
                    <span>Prototypes</span>
                  </div>
                </div>

                {/* Hero Section Wireframe */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  <div
                    style={{
                      height: 24,
                      width: '75%',
                      backgroundColor: '#161c28',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>
                      Visual systems. Fast & local-first.
                    </span>
                  </div>
                  <div
                    style={{
                      height: 14,
                      width: '90%',
                      backgroundColor: '#10141e',
                      borderRadius: 3,
                    }}
                  />
                  <div
                    style={{
                      height: 14,
                      width: '60%',
                      backgroundColor: '#10141e',
                      borderRadius: 3,
                    }}
                  />

                  {/* Primary CTA Button */}
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        padding: '7px 16px',
                        backgroundColor: '#3b82f6',
                        borderRadius: 6,
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)',
                      }}
                    >
                      <span>Create Account</span>
                      <ArrowRight size={13} />
                    </div>
                    <span style={{ fontSize: 11, color: '#475569' }}>Trigger: POST /api/v1/auth</span>
                  </div>
                </div>

                {/* 2 Feature Mockup Cards */}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#0c0f16',
                      borderRadius: 6,
                      border: '1px solid #181d2a',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                      Infinite Canvas
                    </div>
                    <div style={{ height: 8, width: '80%', backgroundColor: '#141924', borderRadius: 2 }} />
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#0c0f16',
                      borderRadius: 6,
                      border: '1px solid #181d2a',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                      System Topologies
                    </div>
                    <div style={{ height: 8, width: '70%', backgroundColor: '#141924', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Wireframe Frame (200px wide x 330px high) */}
            <div
              style={{
                width: 200,
                height: 330,
                backgroundColor: '#07090e',
                border: '2px solid #252d40',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: '0 18px 48px rgba(0, 0, 0, 0.75)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Mobile Dynamic Island / Speaker Notch */}
              <div
                style={{
                  height: 24,
                  backgroundColor: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 12px',
                }}
              >
                <div style={{ width: 48, height: 10, borderRadius: 10, backgroundColor: '#1e2433' }} />
              </div>

              {/* Mobile Screen Body */}
              <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>Mobile Client</div>
                <div
                  style={{
                    height: 54,
                    backgroundColor: '#10141e',
                    borderRadius: 8,
                    border: '1px solid #1c2333',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ height: 8, width: '60%', backgroundColor: '#1c2438', borderRadius: 2 }} />
                  <div style={{ height: 16, backgroundColor: '#3b82f6', borderRadius: 4 }} />
                </div>

                <div
                  style={{
                    height: 70,
                    backgroundColor: '#0c0f16',
                    borderRadius: 8,
                    border: '1px solid #161b26',
                    padding: '8px',
                  }}
                >
                  <div style={{ height: 8, width: '40%', backgroundColor: '#1a2233', borderRadius: 2, marginBottom: 6 }} />
                  <div style={{ height: 8, width: '85%', backgroundColor: '#141a28', borderRadius: 2, marginBottom: 4 }} />
                  <div style={{ height: 8, width: '65%', backgroundColor: '#141a28', borderRadius: 2 }} />
                </div>
              </div>

              {/* Mobile Bottom Tab Bar */}
              <div
                style={{
                  height: 34,
                  borderTop: '1px solid #161b26',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  padding: '0 10px',
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#3b82f6' }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#202738' }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#202738' }} />
              </div>
            </div>
          </div>

          {/* ========================================================
              SCENE 2: CONNECT THE SYSTEM (Architecture & Flowcharts)
             ======================================================== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: w2,
              transform: `scale(${0.96 + w2 * 0.04}) translateY(${(1 - w2) * 20}px)`,
              pointerEvents: w2 > 0.5 ? 'auto' : 'none',
              transition: prefersReducedMotion ? 'none' : 'opacity 0.2s ease, transform 0.2s ease',
            }}
          >
            <div
              style={{
                width: 900,
                height: 340,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {/* Left: Client UI Trigger Box */}
              <div
                style={{
                  position: 'absolute',
                  left: 20,
                  top: 90,
                  width: 200,
                  padding: '16px',
                  backgroundColor: '#080a0f',
                  border: '1px solid #1e2638',
                  borderRadius: 10,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Laptop size={16} color="#3b82f6" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>Client Viewport</span>
                </div>
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#121824',
                    border: '1px solid #232d42',
                    borderRadius: 6,
                    fontSize: 11,
                    color: '#93c5fd',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  Button Clicked
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: '#64748b', textAlign: 'center' }}>
                  POST /api/v1/auth
                </div>
              </div>

              {/* Middle: API Gateway Node */}
              <div
                style={{
                  position: 'absolute',
                  left: 310,
                  top: 75,
                  width: 170,
                  padding: '16px',
                  backgroundColor: '#0a0d14',
                  border: '1px solid #2563eb',
                  borderRadius: 10,
                  boxShadow: '0 0 24px rgba(37, 99, 235, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Server size={16} color="#60a5fa" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>API Gateway</span>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>Envoy Proxy :443</div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    color: '#34d399',
                    backgroundColor: '#061a12',
                    padding: '2px 6px',
                    borderRadius: 3,
                    display: 'inline-block',
                  }}
                >
                  ROUTE MATCHED
                </div>
              </div>

              {/* Right Top: Auth Microservice */}
              <div
                style={{
                  position: 'absolute',
                  left: 540,
                  top: 40,
                  width: 160,
                  padding: '14px',
                  backgroundColor: '#080a10',
                  border: '1px solid #1e2638',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Cpu size={14} color="#a78bfa" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>Auth Service</span>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>JWT Signer (Go)</div>
              </div>

              {/* Far Right Top: PostgreSQL Cluster */}
              <div
                style={{
                  position: 'absolute',
                  left: 740,
                  top: 40,
                  width: 150,
                  padding: '14px',
                  backgroundColor: '#080a10',
                  border: '1px solid #1e2638',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Database size={14} color="#38bdf8" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>PostgreSQL</span>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>User Accounts DB</div>
              </div>

              {/* Right Bottom: Kafka Event Bus */}
              <div
                style={{
                  position: 'absolute',
                  left: 540,
                  top: 190,
                  width: 160,
                  padding: '14px',
                  backgroundColor: '#080a10',
                  border: '1px solid #312e81',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Layers size={14} color="#818cf8" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>Kafka Queue</span>
                </div>
                <div style={{ fontSize: 10, color: '#818cf8' }}>user.registered.v1</div>
              </div>

              {/* Far Right Bottom: Cloud S3 Storage */}
              <div
                style={{
                  position: 'absolute',
                  left: 740,
                  top: 190,
                  width: 150,
                  padding: '14px',
                  backgroundColor: '#080a10',
                  border: '1px solid #1e2638',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Cloud size={14} color="#fbbf24" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f8fafc' }}>S3 Storage</span>
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>User Assets Bucket</div>
              </div>
            </div>
          </div>

          {/* ========================================================
              SCENE 3: SEE IT MOVE (Simulation in Motion + Final CTAs)
             ======================================================== */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: w3,
              transform: `scale(${0.96 + w3 * 0.04}) translateY(${(1 - w3) * 20}px)`,
              pointerEvents: w3 > 0.5 ? 'auto' : 'none',
              transition: prefersReducedMotion ? 'none' : 'opacity 0.2s ease, transform 0.2s ease',
            }}
          >
            {/* Live Interactive Telemetry & Simulation Controller Stage */}
            <div
              style={{
                width: 860,
                backgroundColor: '#080a0f',
                border: '1px solid #222b3d',
                borderRadius: 12,
                padding: '20px 24px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.85)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Simulation Header & Active Controls */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #182030',
                  paddingBottom: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3b82f6',
                    }}
                  >
                    <Activity size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                      Data Flow Simulation
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Scenario: User Registration & Event Broadcast
                    </div>
                  </div>
                </div>

                {/* Simulation Control Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSimRunning(!isSimRunning);
                      setManualPulseCount((c) => c + 1);
                    }}
                    style={{
                      background: '#121824',
                      border: '1px solid #25334c',
                      borderRadius: 6,
                      color: '#93c5fd',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '5px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isSimRunning ? <RotateCcw size={12} /> : <Play size={12} />}
                    <span>{isSimRunning ? 'Pause Pulse' : 'Resume Flow'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimStep((s) => (s + 1) % 4);
                      setManualPulseCount((c) => c + 1);
                    }}
                    style={{
                      background: '#3b82f6',
                      border: 'none',
                      borderRadius: 6,
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '5px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Step Packet</span>
                  </button>
                </div>
              </div>

              {/* 4 Connected Hops Visualization */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {/* Hop 1: Client Request */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    backgroundColor: simStep === 0 ? '#111827' : '#0a0d14',
                    border: `1px solid ${simStep === 0 ? '#3b82f6' : '#1a2233'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>HOP 1 · CLIENT</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>
                    Create Account
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: simStep === 0 ? '#60a5fa' : '#475569',
                    }}
                  >
                    POST /auth/register
                  </div>
                </div>

                {/* Hop 2: API Gateway */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    backgroundColor: simStep === 1 ? '#111827' : '#0a0d14',
                    border: `1px solid ${simStep === 1 ? '#3b82f6' : '#1a2233'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>HOP 2 · GATEWAY</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>
                    API Gateway
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: simStep === 1 ? '#34d399' : '#475569',
                    }}
                  >
                    {simStep === 1 ? '200 OK — 14ms' : 'Reverse Proxy'}
                  </div>
                </div>

                {/* Hop 3: Auth Microservice */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    backgroundColor: simStep === 2 ? '#111827' : '#0a0d14',
                    border: `1px solid ${simStep === 2 ? '#3b82f6' : '#1a2233'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>HOP 3 · SERVICE</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>
                    Auth Service
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: simStep === 2 ? '#a78bfa' : '#475569',
                    }}
                  >
                    {simStep === 2 ? 'JWT Signed' : 'gRPC Stream'}
                  </div>
                </div>

                {/* Hop 4: PostgreSQL DB */}
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    backgroundColor: simStep === 3 ? '#111827' : '#0a0d14',
                    border: `1px solid ${simStep === 3 ? '#3b82f6' : '#1a2233'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>HOP 4 · PERSISTENCE</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 6 }}>
                    PostgreSQL Cluster
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: simStep === 3 ? '#38bdf8' : '#475569',
                    }}
                  >
                    {simStep === 3 ? 'Committed (1 row)' : 'WAL Replica'}
                  </div>
                </div>
              </div>

              {/* Working Board Launch Actions */}
              <div
                style={{
                  borderTop: '1px solid #182030',
                  paddingTop: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 12, color: '#8892a4', fontWeight: 500 }}>
                  Choose a starter board to enter WireBrain Studio:
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectBoard('board-website');
                      onClose();
                    }}
                    style={{
                      backgroundColor: '#121824',
                      border: '1px solid #25334c',
                      borderRadius: 6,
                      padding: '8px 14px',
                      color: '#f8fafc',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#1a2334';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#25334c';
                      e.currentTarget.style.backgroundColor = '#121824';
                    }}
                  >
                    <Laptop size={14} color="#60a5fa" />
                    <span>Website Wireframe</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectBoard('board-system');
                      onClose();
                    }}
                    style={{
                      backgroundColor: '#121824',
                      border: '1px solid #25334c',
                      borderRadius: 6,
                      padding: '8px 14px',
                      color: '#f8fafc',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#1a2334';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#25334c';
                      e.currentTarget.style.backgroundColor = '#121824';
                    }}
                  >
                    <Server size={14} color="#34d399" />
                    <span>System Architecture</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onCreateBoard) {
                        onCreateBoard('Untitled Architecture Board');
                      } else {
                        onSelectBoard('board-website');
                      }
                      onClose();
                    }}
                    style={{
                      backgroundColor: '#3b82f6',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)',
                    }}
                  >
                    <Plus size={14} />
                    <span>Create Blank Board</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Bottom Controls & Progress Scrubber Bar */}
      <footer
        style={{
          height: 60,
          borderTop: '1px solid #141720',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {/* Left: Input hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 11 }}>
          <Radio size={13} color="#3b82f6" />
          <span>Scroll trackpad / wheel or use Arrow keys (↑ ↓) to travel</span>
        </div>

        {/* Center: Step indicators & Prev/Next buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            disabled={activeSceneIndex === 0}
            onClick={() => setTargetScene((prev) => Math.max(0, prev - 1))}
            style={{
              background: 'transparent',
              border: '1px solid #202738',
              borderRadius: 6,
              color: activeSceneIndex === 0 ? '#334155' : '#cbd5e1',
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 500,
              cursor: activeSceneIndex === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ChevronLeft size={14} />
            <span>Back</span>
          </button>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {SCENE_NAMES.map((s) => (
              <div
                key={s.id}
                onClick={() => setTargetScene(s.id)}
                style={{
                  width: activeSceneIndex === s.id ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: activeSceneIndex === s.id ? '#3b82f6' : '#232b3c',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>

          {activeSceneIndex < TOTAL_SCENES - 1 ? (
            <button
              type="button"
              onClick={() => setTargetScene((prev) => Math.min(TOTAL_SCENES - 1, prev + 1))}
              style={{
                background: '#182030',
                border: '1px solid #28354e',
                borderRadius: 6,
                color: '#f8fafc',
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSelectBoard('board-website');
                onClose();
              }}
              style={{
                background: '#3b82f6',
                border: 'none',
                borderRadius: 6,
                color: '#ffffff',
                padding: '6px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.4)',
              }}
            >
              <span>Start Designing</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* Right: Scene indicator */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#64748b' }}>
          Scene {activeSceneIndex + 1} of {TOTAL_SCENES}
        </div>
      </footer>
    </div>
  );
};
