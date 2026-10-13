import { Board, CanvasElement, Connector } from '../types';
import { getAnchorPoint, generateOrthogonalPath, generateCurvedPath, getBoundingBox } from './geometry';

export function generateBoardSVG(board: Board): string {
  const bbox = getBoundingBox(board.elements);
  const padding = 60;
  const minX = bbox.x - padding;
  const minY = bbox.y - padding;
  const width = bbox.width + padding * 2;
  const height = bbox.height + padding * 2;

  const elementsById = new Map<string, CanvasElement>();
  board.elements.forEach((el) => elementsById.set(el.id, el));

  const defs = `
    <defs>
      <marker id="arrow-end" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M 0 1 L 8 4 L 0 7 Z" fill="#3b82f6" />
      </marker>
      <marker id="arrow-start" markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
        <path d="M 8 1 L 0 4 L 8 7 Z" fill="#3b82f6" />
      </marker>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.3" />
      </filter>
    </defs>
  `;

  // Render elements in order
  const elementsSvg = board.elements
    .filter((el) => !el.hidden)
    .map((el) => renderElementSVG(el))
    .join('\n');

  // Render connectors
  const connectorsSvg = board.connectors
    .map((conn) => {
      const fromEl = elementsById.get(conn.fromId);
      const toEl = elementsById.get(conn.toId);
      if (!fromEl || !toEl) return '';

      const fromPt = getAnchorPoint(fromEl, conn.fromAnchor);
      const toPt = getAnchorPoint(toEl, conn.toAnchor);
      const pathD =
        conn.style === 'curved'
          ? generateCurvedPath(fromPt, toPt)
          : conn.style === 'straight'
          ? `M ${fromPt.x} ${fromPt.y} L ${toPt.x} ${toPt.y}`
          : generateOrthogonalPath(fromPt, toPt, conn.fromAnchor, conn.toAnchor);

      const markerEnd = conn.arrowEnd ? 'marker-end="url(#arrow-end)"' : '';
      const markerStart = conn.arrowStart ? 'marker-start="url(#arrow-start)"' : '';
      const strokeDash = conn.dashed ? 'stroke-dasharray="6,4"' : '';

      const labelSvg = conn.label
        ? `<text x="${(fromPt.x + toPt.x) / 2}" y="${(fromPt.y + toPt.y) / 2 - 8}" fill="#94a3b8" font-size="12" font-family="sans-serif" text-anchor="middle" font-weight="500">${escapeXml(conn.label)}</text>`
        : '';

      return `
        <g class="connector">
          <path d="${pathD}" fill="none" stroke="${conn.color}" stroke-width="${conn.strokeWidth}" ${strokeDash} ${markerEnd} ${markerStart} />
          ${labelSvg}
        </g>
      `;
    })
    .join('\n');

  return `<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#111419" />
  ${defs}
  <g id="elements">
    ${elementsSvg}
  </g>
  <g id="connectors">
    ${connectorsSvg}
  </g>
</svg>`;
}

function renderElementSVG(el: CanvasElement): string {
  const { x, y, width, height, fillColor, strokeColor, strokeWidth, cornerRadius = 6 } = el;
  const safeLabel = escapeXml(el.label || '');
  const safeSec = escapeXml(el.secondaryText || '');

  switch (el.type) {
    case 'frame-desktop':
      return `
        <g id="${el.id}">
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${cornerRadius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <!-- Window Titlebar -->
          <rect x="${x}" y="${y}" width="${width}" height="36" rx="${cornerRadius}" fill="#1f232c" />
          <circle cx="${x + 16}" cy="${y + 18}" r="5" fill="#ef4444" />
          <circle cx="${x + 32}" cy="${y + 18}" r="5" fill="#eab308" />
          <circle cx="${x + 48}" cy="${y + 18}" r="5" fill="#22c55e" />
          <!-- Address bar -->
          <rect x="${x + 70}" y="${y + 8}" width="${Math.max(100, width - 140)}" height="20" rx="4" fill="#15181f" stroke="#2d3340" stroke-width="1" />
          <text x="${x + 80}" y="${y + 22}" fill="#8892a0" font-size="11" font-family="sans-serif">${escapeXml(el.urlBar || 'https://wirebrain.local')}</text>
        </g>
      `;

    case 'frame-mobile':
      return `
        <g id="${el.id}">
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${cornerRadius || 32}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <!-- Dynamic Island / Speaker notch -->
          <rect x="${x + width / 2 - 40}" y="${y + 12}" width="80" height="18" rx="9" fill="#000000" />
          <!-- Home Indicator -->
          <rect x="${x + width / 2 - 45}" y="${y + height - 16}" width="90" height="4" rx="2" fill="#525b6a" />
        </g>
      `;

    case 'ellipse':
      return `
        <g id="${el.id}">
          <ellipse cx="${x + width / 2}" cy="${y + height / 2}" rx="${width / 2}" ry="${height / 2}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          ${safeLabel ? `<text x="${x + width / 2}" y="${y + height / 2 + 5}" fill="${el.textColor || '#ffffff'}" font-size="${el.fontSize || 14}" font-family="sans-serif" font-weight="${el.fontWeight || 'normal'}" text-anchor="middle">${safeLabel}</text>` : ''}
        </g>
      `;

    case 'diamond': {
      const pts = `${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`;
      return `
        <g id="${el.id}">
          <polygon points="${pts}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          ${safeLabel ? `<text x="${x + width / 2}" y="${y + height / 2 + 5}" fill="${el.textColor || '#ffffff'}" font-size="${el.fontSize || 13}" font-family="sans-serif" font-weight="${el.fontWeight || '600'}" text-anchor="middle">${safeLabel}</text>` : ''}
        </g>
      `;
    }

    case 'cylinder': {
      const capH = 14;
      return `
        <g id="${el.id}">
          <!-- Body -->
          <path d="M ${x} ${y + capH} L ${x} ${y + height - capH} A ${width / 2} ${capH} 0 0 0 ${x + width} ${y + height - capH} L ${x + width} ${y + capH} Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <!-- Top Cap -->
          <ellipse cx="${x + width / 2}" cy="${y + capH}" rx="${width / 2}" ry="${capH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <!-- Bottom arc line -->
          <path d="M ${x} ${y + height - capH} A ${width / 2} ${capH} 0 0 0 ${x + width} ${y + height - capH}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <text x="${x + width / 2}" y="${y + height / 2 + 4}" fill="${el.textColor || '#ffffff'}" font-size="${el.fontSize || 13}" font-family="sans-serif" font-weight="${el.fontWeight || '600'}" text-anchor="middle">${safeLabel}</text>
          ${safeSec ? `<text x="${x + width / 2}" y="${y + height / 2 + 20}" fill="#8d97a6" font-size="11" font-family="sans-serif" text-anchor="middle">${safeSec}</text>` : ''}
        </g>
      `;
    }

    case 'cloud':
      return `
        <g id="${el.id}">
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <text x="${x + width / 2}" y="${y + height / 2 + 4}" fill="${el.textColor || '#ffffff'}" font-size="${el.fontSize || 13}" font-family="sans-serif" font-weight="${el.fontWeight || '600'}" text-anchor="middle">${safeLabel}</text>
          ${safeSec ? `<text x="${x + width / 2}" y="${y + height / 2 + 20}" fill="#8d97a6" font-size="11" font-family="sans-serif" text-anchor="middle">${safeSec}</text>` : ''}
        </g>
      `;

    case 'image':
      return `
        <g id="${el.id}">
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${cornerRadius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <!-- Diagonal crossed lines for wireframe image placeholder -->
          <line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="4,4" opacity="0.6" />
          <line x1="${x}" y1="${y + height}" x2="${x + width}" y2="${y}" stroke="${strokeColor}" stroke-width="1" stroke-dasharray="4,4" opacity="0.6" />
          <rect x="${x + width / 2 - 80}" y="${y + height / 2 - 14}" width="160" height="28" rx="4" fill="#14171f" opacity="0.85" />
          <text x="${x + width / 2}" y="${y + height / 2 + 4}" fill="${el.textColor || '#8d97a6'}" font-size="12" font-family="sans-serif" text-anchor="middle">🖼 ${safeLabel || 'Image'}</text>
        </g>
      `;

    case 'button':
      return `
        <g id="${el.id}">
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${cornerRadius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <text x="${x + width / 2}" y="${y + height / 2 + 5}" fill="${el.textColor || '#ffffff'}" font-size="${el.fontSize || 13}" font-family="sans-serif" font-weight="${el.fontWeight || '600'}" text-anchor="middle">${safeLabel}</text>
        </g>
      `;

    case 'input':
      return `
        <g id="${el.id}">
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${cornerRadius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          <text x="${x + 12}" y="${y + height / 2 + 4}" fill="${el.textColor || '#7b8798'}" font-size="${el.fontSize || 13}" font-family="sans-serif">${safeLabel}</text>
        </g>
      `;

    case 'text':
      return `
        <g id="${el.id}">
          <text x="${x}" y="${y + (el.fontSize || 14)}" fill="${el.textColor || '#e2e8f0'}" font-size="${el.fontSize || 14}" font-family="sans-serif" font-weight="${el.fontWeight || 'normal'}">${safeLabel}</text>
        </g>
      `;

    case 'rectangle':
    case 'service':
    case 'queue':
    default:
      return `
        <g id="${el.id}">
          <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${cornerRadius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          ${safeLabel ? `<text x="${x + 16}" y="${y + 26}" fill="${el.textColor || '#e2e8f0'}" font-size="${el.fontSize || 14}" font-family="sans-serif" font-weight="${el.fontWeight || '600'}">${safeLabel}</text>` : ''}
          ${safeSec ? `<text x="${x + 16}" y="${y + 48}" fill="#8e99a8" font-size="12" font-family="sans-serif">${safeSec}</text>` : ''}
        </g>
      `;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function exportBoardToSVG(board: Board): Promise<boolean> {
  const svgContent = generateBoardSVG(board);
  const fileName = `${board.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`;

  if (window.electronAPI) {
    try {
      const dialogRes = await window.electronAPI.saveFileDialog({
        title: 'Export Board as SVG',
        defaultPath: fileName,
        filters: [{ name: 'SVG Image (*.svg)', extensions: ['svg'] }],
      });
      if (dialogRes && !dialogRes.canceled && dialogRes.filePath) {
        const writeRes = await window.electronAPI.writeFile(dialogRes.filePath, svgContent);
        return writeRes.success;
      }
      return false;
    } catch (e) {
      console.warn('Electron save dialog failed, falling back:', e);
    }
  }

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export async function exportBoardToPNG(board: Board): Promise<boolean> {
  const svgContent = generateBoardSVG(board);
  const bbox = getBoundingBox(board.elements);
  const padding = 60;
  const width = bbox.width + padding * 2;
  const height = bbox.height + padding * 2;
  const scale = 2; // High-DPI scale for crisp raster output

  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(false);
        return;
      }

      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const fileName = `${board.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;

      if (window.electronAPI) {
        try {
          const dialogRes = await window.electronAPI.saveFileDialog({
            title: 'Export Board as PNG',
            defaultPath: fileName,
            filters: [{ name: 'PNG Image (*.png)', extensions: ['png'] }],
          });
          if (dialogRes && !dialogRes.canceled && dialogRes.filePath) {
            const writeRes = await window.electronAPI.writeFile(dialogRes.filePath, base64Data, true);
            resolve(writeRes.success);
            return;
          }
          resolve(false);
          return;
        } catch (e) {
          console.warn('Electron save failed for PNG:', e);
        }
      }

      // Fallback download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      resolve(true);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
}
