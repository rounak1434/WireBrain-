import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ThemeColors } from '../../styles/theme';

interface PanelResizeHandleProps {
  side: 'left' | 'right';
  onResize: (clientX: number) => void;
  onResizeEnd?: () => void;
  onReset: () => void;
  theme: ThemeColors;
}

export const PanelResizeHandle: React.FC<PanelResizeHandleProps> = ({
  side,
  onResize,
  onResizeEnd,
  onReset,
  theme,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      isDraggingRef.current = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;
        moveEvent.preventDefault();
        onResize(moveEvent.clientX);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        if (onResizeEnd) {
          onResizeEnd();
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [onResize, onResizeEnd]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onReset();
    },
    [onReset]
  );

  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const isActive = isDragging || isHovered;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={side === 'left' ? 'Resize Elements & Layers panel' : 'Resize Properties Inspector panel'}
      title="Drag to resize | Double-click to reset width"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 10,
        margin: '0 -5px',
        position: 'relative',
        cursor: 'col-resize',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        flexShrink: 0,
        height: '100%',
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* Subtle Divider Line */}
      <div
        style={{
          width: 2,
          height: '100%',
          backgroundColor: isActive ? theme.accent : 'transparent',
          boxShadow: isDragging ? `0 0 8px ${theme.accent}` : 'none',
          transition: 'all 0.15s ease',
        }}
      />

      {/* Floating Grab Pill Indicator in Center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 4,
          height: 32,
          borderRadius: 2,
          backgroundColor: isActive ? '#ffffff' : theme.borderStrong,
          boxShadow: isActive ? '0 0 6px rgba(59, 130, 246, 0.7)' : 'none',
          opacity: isActive ? 1 : 0.6,
          transition: 'all 0.15s ease',
        }}
      />
    </div>
  );
};
