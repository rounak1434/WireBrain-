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

export function getOrthogonalWaypoints(
  from: Point,
  to: Point,
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition
): Point[] {
  const pad = 20;

  // Direct straight line if anchors face each other and points are collinear
  if (
    (fromAnchor === 'right' && toAnchor === 'left' && from.y === to.y && to.x >= from.x) ||
    (fromAnchor === 'left' && toAnchor === 'right' && from.y === to.y && to.x <= from.x) ||
    (fromAnchor === 'bottom' && toAnchor === 'top' && from.x === to.x && to.y >= from.y) ||
    (fromAnchor === 'top' && toAnchor === 'bottom' && from.x === to.x && to.y <= from.y)
  ) {
    return [from, to];
  }

  // Calculate departure point p1
  let p1 = { ...from };
  if (fromAnchor === 'right') p1.x += pad;
  else if (fromAnchor === 'left') p1.x -= pad;
  else if (fromAnchor === 'bottom') p1.y += pad;
  else if (fromAnchor === 'top') p1.y -= pad;

  // Calculate arrival point pEnd
  let pEnd = { ...to };
  if (toAnchor === 'right') pEnd.x += pad;
  else if (toAnchor === 'left') pEnd.x -= pad;
  else if (toAnchor === 'bottom') pEnd.y += pad;
  else if (toAnchor === 'top') pEnd.y -= pad;

  const points: Point[] = [from, p1];

  const isHorizFrom = fromAnchor === 'left' || fromAnchor === 'right';
  const isHorizTo = toAnchor === 'left' || toAnchor === 'right';

  if (isHorizFrom && isHorizTo) {
    // Both horizontal anchors
    const canStraightMid =
      (fromAnchor === 'right' && toAnchor === 'left' && to.x > from.x + pad * 2) ||
      (fromAnchor === 'left' && toAnchor === 'right' && to.x < from.x - pad * 2);

    if (canStraightMid) {
      const midX = (from.x + to.x) / 2;
      points.push({ x: midX, y: p1.y });
      points.push({ x: midX, y: pEnd.y });
    } else {
      // Loop or backward link: detour vertically
      const detourY = Math.abs(from.y - to.y) < 40 ? Math.min(from.y, to.y) - 50 : (from.y + to.y) / 2;
      points.push({ x: p1.x, y: detourY });
      points.push({ x: pEnd.x, y: detourY });
    }
    points.push(pEnd);
  } else if (!isHorizFrom && !isHorizTo) {
    // Both vertical anchors
    const canStraightMid =
      (fromAnchor === 'bottom' && toAnchor === 'top' && to.y > from.y + pad * 2) ||
      (fromAnchor === 'top' && toAnchor === 'bottom' && to.y < from.y - pad * 2);

    if (canStraightMid) {
      const midY = (from.y + to.y) / 2;
      points.push({ x: p1.x, y: midY });
      points.push({ x: pEnd.x, y: midY });
    } else {
      // Loop or backward link: detour horizontally
      const detourX = Math.abs(from.x - to.x) < 40 ? Math.max(from.x, to.x) + 60 : (from.x + to.x) / 2;
      points.push({ x: detourX, y: p1.y });
      points.push({ x: detourX, y: pEnd.y });
    }
    points.push(pEnd);
  } else if (isHorizFrom && !isHorizTo) {
    // Horizontal start -> Vertical end
    points.push({ x: pEnd.x, y: p1.y });
    points.push(pEnd);
  } else {
    // Vertical start -> Horizontal end
    points.push({ x: p1.x, y: pEnd.y });
    points.push(pEnd);
  }

  points.push(to);

  // Simplify duplicate or collinear points
  const simplified: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = points[i];
    if (prev.x === curr.x && prev.y === curr.y) continue;

    if (simplified.length >= 2) {
      const pPrev = simplified[simplified.length - 2];
      // Check if collinear
      if (
        (pPrev.x === prev.x && prev.x === curr.x) ||
        (pPrev.y === prev.y && prev.y === curr.y)
      ) {
        // Replace previous point with current
        simplified[simplified.length - 1] = curr;
        continue;
      }
    }
    simplified.push(curr);
  }

  return simplified;
}

export function generateOrthogonalPath(
  from: Point,
  to: Point,
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition
): string {
  const waypoints = getOrthogonalWaypoints(from, to, fromAnchor, toAnchor);
  return `M ${waypoints.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
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

export function getPointAlongPolyline(points: Point[], progress: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];
  const t = Math.max(0, Math.min(1, progress));

  const segmentLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(len);
    totalLength += len;
  }

  if (totalLength === 0) return points[0];

  const targetDist = t * totalLength;
  let accumulated = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    const len = segmentLengths[i];
    if (accumulated + len >= targetDist || i === segmentLengths.length - 1) {
      const segT = len === 0 ? 0 : (targetDist - accumulated) / len;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * segT,
        y: points[i].y + (points[i + 1].y - points[i].y) * segT,
      };
    }
    accumulated += len;
  }

  return points[points.length - 1];
}

export function getPointAlongCubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const clampedT = Math.max(0, Math.min(1, t));
  const u = 1 - clampedT;
  const tt = clampedT * clampedT;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * clampedT;

  const x = uuu * p0.x + 3 * uu * clampedT * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
  const y = uuu * p0.y + 3 * uu * clampedT * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
  return { x, y };
}

export function getPointAlongConnector(
  connector: import('../types').Connector | undefined,
  fromEl: CanvasElement,
  toEl: CanvasElement,
  progress: number
): Point {
  const fromAnchor = connector?.fromAnchor || 'right';
  const toAnchor = connector?.toAnchor || 'left';
  const fromPt = getAnchorPoint(fromEl, fromAnchor);
  const toPt = getAnchorPoint(toEl, toAnchor);

  if (!connector || connector.style === 'straight') {
    const t = Math.max(0, Math.min(1, progress));
    return {
      x: fromPt.x + (toPt.x - fromPt.x) * t,
      y: fromPt.y + (toPt.y - fromPt.y) * t,
    };
  }

  if (connector.style === 'curved') {
    const dx = toPt.x - fromPt.x;
    const p1: Point = { x: fromPt.x + dx * 0.4, y: fromPt.y };
    const p2: Point = { x: toPt.x - dx * 0.4, y: toPt.y };
    return getPointAlongCubicBezier(fromPt, p1, p2, toPt, progress);
  }

  // Orthogonal
  const waypoints = getOrthogonalWaypoints(fromPt, toPt, fromAnchor, toAnchor);
  return getPointAlongPolyline(waypoints, progress);
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
