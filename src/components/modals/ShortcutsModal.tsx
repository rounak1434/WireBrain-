import React from 'react';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 520,
          backgroundColor: '#161920',
          border: '1px solid #282f3c',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #242935',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f3f8' }}>Keyboard Shortcuts</h3>
            <p style={{ fontSize: 12, color: '#7a8698', marginTop: 2 }}>
              Familiar bindings optimized for Windows and macOS
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#7a8698', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Navigation & Canvas">
            <Row label="Pan Canvas" keys={['Space + Drag', 'Middle Click', 'H']} />
            <Row label="Zoom in / out" keys={['Ctrl / Cmd + Wheel']} />
            <Row label="Reset Zoom (100%)" keys={['Click % badge']} />
            <Row label="Box / Marquee Select" keys={['Click + Drag on Canvas']} />
          </Section>

          <Section title="Tools">
            <Row label="Select & Transform" keys={['V']} />
            <Row label="Connector Arrow / Link" keys={['C']} />
            <Row label="Website Desktop Frame" keys={['W']} />
            <Row label="Mobile Phone Frame" keys={['M']} />
            <Row label="Rectangle / Box" keys={['R']} />
            <Row label="Decision Diamond" keys={['D']} />
            <Row label="Database Cylinder" keys={['B']} />
            <Row label="Cloud Resource" keys={['S']} />
            <Row label="Text Box" keys={['T']} />
          </Section>

          <Section title="Editing Actions">
            <Row label="Undo" keys={['Ctrl / Cmd + Z']} />
            <Row label="Redo" keys={['Ctrl / Cmd + Y', 'Ctrl / Cmd + Shift + Z']} />
            <Row label="Duplicate Item" keys={['Ctrl / Cmd + D']} />
            <Row label="Delete Item" keys={['Delete', 'Backspace']} />
            <Row label="Select All Items" keys={['Ctrl / Cmd + A']} />
            <Row label="Inline Text Edit" keys={['Double Click on element']} />
            <Row label="Cancel / Deselect" keys={['Escape']} />
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#6e7a8e',
      }}
    >
      {title}
    </div>
    <div
      style={{
        backgroundColor: '#191d26',
        borderRadius: 8,
        border: '1px solid #272d3b',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {children}
    </div>
  </div>
);

const Row: React.FC<{ label: string; keys: string[] }> = ({ label, keys }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontSize: 13, color: '#cad3df' }}>{label}</span>
    <div style={{ display: 'flex', gap: 4 }}>
      {keys.map((k) => (
        <kbd
          key={k}
          style={{
            backgroundColor: '#12141a',
            border: '1px solid #303746',
            borderRadius: 4,
            padding: '2px 6px',
            fontSize: 11,
            color: '#e2e8f0',
            fontFamily: 'monospace',
          }}
        >
          {k}
        </kbd>
      ))}
    </div>
  </div>
);
