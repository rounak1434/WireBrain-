import React from 'react';

export type HandleDirection = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface ResizeHandlesProps {
  width: number;
  height: number;
  onResizeStart: (direction: HandleDirection, e: React.MouseEvent) => void;
}

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  width,
  height,
  onResizeStart,
}) => {
  const handles: Array<{ dir: HandleDirection; x: number; y: number; cursor: string }> = [
    { dir: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
    { dir: 'n', x: width / 2, y: 0, cursor: 'ns-resize' },
    { dir: 'ne', x: width, y: 0, cursor: 'nesw-resize' },
    { dir: 'e', x: width, y: height / 2, cursor: 'ew-resize' },
    { dir: 'se', x: width, y: height, cursor: 'nwse-resize' },
    { dir: 's', x: width / 2, y: height, cursor: 'ns-resize' },
    { dir: 'sw', x: 0, y: height, cursor: 'nesw-resize' },
    { dir: 'w', x: 0, y: height / 2, cursor: 'ew-resize' },
  ];

  const handleSize = 8;

  return (
    <>
      {handles.map(({ dir, x, y, cursor }) => (
        <div
          key={dir}
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(dir, e);
          }}
          style={{
            position: 'absolute',
            left: x - handleSize / 2,
            top: y - handleSize / 2,
            width: handleSize,
            height: handleSize,
            backgroundColor: '#ffffff',
            border: '1.5px solid #3b82f6',
            borderRadius: 2,
            cursor,
            zIndex: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}
        />
      ))}
    </>
  );
};
