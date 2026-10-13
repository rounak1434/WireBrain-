import React from 'react';
import { AnchorPosition } from '../../types';

interface AnchorPointsProps {
  width: number;
  height: number;
  onAnchorMouseDown: (anchor: AnchorPosition, e: React.MouseEvent) => void;
  onAnchorMouseUp?: (anchor: AnchorPosition, e: React.MouseEvent) => void;
}

export const AnchorPoints: React.FC<AnchorPointsProps> = ({
  width,
  height,
  onAnchorMouseDown,
  onAnchorMouseUp,
}) => {
  const anchors: Array<{ pos: AnchorPosition; x: number; y: number }> = [
    { pos: 'top', x: width / 2, y: 0 },
    { pos: 'right', x: width, y: height / 2 },
    { pos: 'bottom', x: width / 2, y: height },
    { pos: 'left', x: 0, y: height / 2 },
  ];

  const dotSize = 10;

  return (
    <>
      {anchors.map(({ pos, x, y }) => (
        <div
          key={pos}
          onMouseDown={(e) => {
            e.stopPropagation();
            onAnchorMouseDown(pos, e);
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            if (onAnchorMouseUp) onAnchorMouseUp(pos, e);
          }}
          style={{
            position: 'absolute',
            left: x - dotSize / 2,
            top: y - dotSize / 2,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            border: '2px solid #ffffff',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)',
            cursor: 'crosshair',
            zIndex: 15,
            transition: 'transform 0.1s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      ))}
    </>
  );
};
