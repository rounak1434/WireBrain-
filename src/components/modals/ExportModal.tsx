import React, { useState } from 'react';
import { Board, Project } from '../../types';
import { exportBoardToPNG, exportBoardToSVG } from '../../utils/export';
import { exportProjectToFile } from '../../utils/storage';
import { FileImage, Code2, FileJson, X, Download, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  project: Project;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  board,
  project,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'svg' | 'json'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedSuccess, setExportedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    let success = false;
    try {
      if (selectedFormat === 'png') {
        success = await exportBoardToPNG(board);
      } else if (selectedFormat === 'svg') {
        success = await exportBoardToSVG(board);
      } else {
        success = await exportProjectToFile(project);
      }
    } finally {
      setIsExporting(false);
      if (success) {
        setExportedSuccess(true);
        setTimeout(() => {
          setExportedSuccess(false);
          onClose();
        }, 1200);
      }
    }
  };

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
          width: 440,
          backgroundColor: '#161920',
          border: '1px solid #282f3c',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
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
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f3f8' }}>Export Workspace</h3>
            <p style={{ fontSize: 12, color: '#7a8698', marginTop: 2 }}>
              Board: <span style={{ color: '#ffffff', fontWeight: 500 }}>{board.title}</span>
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

        {/* Format Selection Cards */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FormatOption
            title="High-DPI PNG Image (.png)"
            description="Crisp 2x retina raster image with background and markers"
            icon={<FileImage size={20} color="#38bdf8" />}
            isSelected={selectedFormat === 'png'}
            onClick={() => setSelectedFormat('png')}
          />
          <FormatOption
            title="Scalable Vector SVG (.svg)"
            description="Infinite resolution vector graphics for web and presentations"
            icon={<Code2 size={20} color="#fbbf24" />}
            isSelected={selectedFormat === 'svg'}
            onClick={() => setSelectedFormat('svg')}
          />
          <FormatOption
            title="Project Data Backup (.json)"
            description="Complete project file with all boards, coordinates, and links"
            icon={<FileJson size={20} color="#a855f7" />}
            isSelected={selectedFormat === 'json'}
            onClick={() => setSelectedFormat('json')}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #242935',
            backgroundColor: '#12141a',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 14px',
              backgroundColor: '#1a1f28',
              border: '1px solid #2b3240',
              borderRadius: 6,
              color: '#d0d8e4',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              backgroundColor: exportedSuccess ? '#10b981' : '#3b82f6',
              border: 'none',
              borderRadius: 6,
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: isExporting ? 'wait' : 'pointer',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
              transition: 'background-color 0.15s ease',
            }}
          >
            {exportedSuccess ? <Check size={16} /> : <Download size={16} />}
            <span>
              {isExporting ? 'Exporting...' : exportedSuccess ? 'Exported!' : `Export ${selectedFormat.toUpperCase()}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const FormatOption: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ title, description, icon, isSelected, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '12px 14px',
      borderRadius: 8,
      backgroundColor: isSelected ? '#1e2432' : '#191d26',
      border: isSelected ? '1.5px solid #3b82f6' : '1px solid #272d3a',
      cursor: 'pointer',
      transition: 'all 0.12s ease',
    }}
  >
    <div>{icon}</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f3f8' }}>{title}</div>
      <div style={{ fontSize: 11, color: '#7a8698', marginTop: 2 }}>{description}</div>
    </div>
    <div
      style={{
        width: 16,
        height: 16,
        borderRadius: '50%',
        border: isSelected ? '5px solid #3b82f6' : '2px solid #455062',
        backgroundColor: '#ffffff',
      }}
    />
  </div>
);
