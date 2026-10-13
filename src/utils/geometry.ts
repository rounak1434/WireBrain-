import { AnchorPosition, CanvasElement } from '../types';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function snap(val: number, gridSize: number, enabled: boolean): number {
  if (!enabled || gridSize <= 1) return Math.round(val);
  return Math.round(val / gridSize) * gridSize;
}

export function getAnchorPoint(element: CanvasElement, anchor: AnchorPosition): Point {
  const { x, y, width, height } = element;
  switch (anchor) {
    case 'top':
      return { x: x + width / 2, y };
    case 'right':
      return { x: x + width, y: y + height / 2 };
    case 'bottom':
      return { x: x + width / 2, y: y + height };
    case 'left':
      return { x, y: y + height / 2 };
    case 'center':
    default:
      return { x: x + width / 2, y: y + height / 2 };
  }
}

export function generateOrthogonalPath(
  from: Point,
  to: Point,
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition
): string {
  // Direct straight line if distance is tiny or explicitly linear
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Compute departure and arrival offsets
  const pad = 24;
  let p1 = { ...from };
  let p4 = { ...to };

  if (fromAnchor === 'top') p1.y -= pad;
  else if (fromAnchor === 'bottom') p1.y += pad;
  else if (fromAnchor === 'left') p1.x -= pad;
  else if (fromAnchor === 'right') p1.x += pad;

  if (toAnchor === 'top') p4.y -= pad;
  else if (toAnchor === 'bottom') p4.y += pad;
  else if (toAnchor === 'left') p4.x -= pad;
  else if (toAnchor === 'right') p4.x += pad;

  // Mid points for clean orthogonal routing
  const midX = (p1.x + p4.x) / 2;
  const midY = (p1.y + p4.y) / 2;

  // Decide path layout based on anchor orientations
  const isHorizontalSource = fromAnchor === 'left' || fromAnchor === 'right';
  const isHorizontalTarget = toAnchor === 'left' || toAnchor === 'right';

  let points: Point[] = [from];

  if (isHorizontalSource && isHorizontalTarget) {
    points.push(p1);
    points.push({ x: midX, y: p1.y });
    points.push({ x: midX, y: p4.y });
    points.push(p4);
  } else if (!isHorizontalSource && !isHorizontalTarget) {
    points.push(p1);
    points.push({ x: p1.x, y: midY });
    points.push({ x: p4.x, y: midY });
    points.push(p4);
  } else if (isHorizontalSource && !isHorizontalTarget) {
    points.push({ x: p4.x, y: p1.y });
  } else {
    points.push({ x: p1.x, y: p4.y });
  }

  points.push(to);

  // Build SVG path
  return `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
}

export function generateCurvedPath(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx1 = from.x + dx * 0.4;
  const cy1 = from.y;
  const cx2 = to.x - dx * 0.4;
  const cy2 = to.y;
  return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
}

export function getBoundingBox(elements: CanvasElement[]): Rect {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.hidden) continue;
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  }

  if (minX === Infinity) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(10, maxX - minX),
    height: Math.max(10, maxY - minY),
  };
}

export function rectIntersectsRect(r1: Rect, r2: Rect): boolean {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

export function pointInRect(p: Point, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}
