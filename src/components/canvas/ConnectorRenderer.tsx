import React from 'react';
import { Connector, CanvasElement } from '../../types';
import { getAnchorPoint, generateOrthogonalPath, generateCurvedPath } from '../../utils/geometry';

interface ConnectorRendererProps {
  connector: Connector;
  elementsById: Map<string, CanvasElement>;
  isSelected: boolean;
  onSelect?: (e: React.MouseEvent) => void;
}

export const ConnectorRenderer: React.FC<ConnectorRendererProps> = ({
  connector,
  elementsById,
  isSelected,
  onSelect,
}) => {
  const fromEl = elementsById.get(connector.fromId);
  const toEl = elementsById.get(connector.toId);

  if (!fromEl || !toEl) return null;

  const fromPt = getAnchorPoint(fromEl, connector.fromAnchor);
  const toPt = getAnchorPoint(toEl, connector.toAnchor);

  let pathD = '';
  if (connector.style === 'curved') {
    pathD = generateCurvedPath(fromPt, toPt);
  } else if (connector.style === 'straight') {
    pathD = `M ${fromPt.x} ${fromPt.y} L ${toPt.x} ${toPt.y}`;
  } else {
    pathD = generateOrthogonalPath(fromPt, toPt, connector.fromAnchor, connector.toAnchor);
  }

  const midX = (fromPt.x + toPt.x) / 2;
  const midY = (fromPt.y + toPt.y) / 2;

  const strokeColor = isSelected ? '#3b82f6' : connector.color;
  const strokeWidth = isSelected ? Math.max(connector.strokeWidth + 1, 3) : connector.strokeWidth;

  return (
    <g
      className="connector-group"
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(e);
      }}
      style={{ cursor: onSelect ? 'pointer' : 'default', pointerEvents: onSelect ? 'all' : 'none' }}
    >
      {/* Invisible wider hit area for easy clicking */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(16, strokeWidth * 3)}
        style={{ pointerEvents: 'stroke' }}
      />

      {/* Main Visible Path */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        color={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={connector.dashed ? '6,4' : undefined}
        markerEnd={connector.arrowEnd ? 'url(#arrow-end)' : undefined}
        markerStart={connector.arrowStart ? 'url(#arrow-start)' : undefined}
        style={{
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
          pointerEvents: 'stroke',
        }}
      />

      {/* Optional Label Pill */}
      {connector.label && (
        <g transform={`translate(${midX}, ${midY})`} style={{ pointerEvents: 'all' }}>
          <rect
            x={-connector.label.length * 4 - 8}
            y={-11}
            width={connector.label.length * 8 + 16}
            height={22}
            rx={4}
            fill="#161920"
            stroke={isSelected ? '#3b82f6' : '#2b3240'}
            strokeWidth={1}
            style={{ pointerEvents: 'fill' }}
          />
          <text
            x={0}
            y={4}
            fill={isSelected ? '#ffffff' : '#9ca6b5'}
            fontSize={11}
            fontWeight="500"
            textAnchor="middle"
            fontFamily="sans-serif"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {connector.label}
          </text>
        </g>
      )}
    </g>
  );
};
