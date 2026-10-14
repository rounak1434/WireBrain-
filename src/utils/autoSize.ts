import { CanvasElement, ElementType } from '../types';

let measurementCanvas: HTMLCanvasElement | null = null;
let measurementCtx: CanvasRenderingContext2D | null = null;

/**
 * Measure single-line text width accurately using an offscreen canvas.
 * Falls back to character count estimation in non-browser environments.
 */
export function measureTextWidth(
  text: string,
  fontSize = 14,
  fontWeight: 'normal' | '500' | '600' | '700' = 'normal',
  fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
): number {
  if (!text) return 0;

  if (typeof document !== 'undefined') {
    if (!measurementCanvas) {
      measurementCanvas = document.createElement('canvas');
      measurementCtx = measurementCanvas.getContext('2d');
    }
    if (measurementCtx) {
      const weightVal = fontWeight === 'normal' ? '400' : fontWeight;
      measurementCtx.font = `${weightVal} ${fontSize}px ${fontFamily}`;
      return measurementCtx.measureText(text).width;
    }
  }

  // Fallback: average char width factor
  const charFactor = fontWeight === '700' ? 0.65 : fontWeight === '600' ? 0.6 : 0.55;
  return text.length * fontSize * charFactor;
}

/**
 * Simulate word-wrap calculation for a given maximum line width.
 * Returns array of lines and max line width.
 */
export function wrapText(
  text: string,
  maxLineWidth: number,
  fontSize = 14,
  fontWeight: 'normal' | '500' | '600' | '700' = 'normal'
): { lines: string[]; textWidth: number } {
  if (!text) return { lines: [], textWidth: 0 };

  const paragraphs = text.split('\n');
  const allLines: string[] = [];
  let maxMeasuredWidth = 0;

  for (const para of paragraphs) {
    if (!para.trim()) {
      allLines.push('');
      continue;
    }

    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const candidateWidth = measureTextWidth(candidate, fontSize, fontWeight);

      if (candidateWidth <= maxLineWidth || !currentLine) {
        currentLine = candidate;
        if (candidateWidth > maxMeasuredWidth) {
          maxMeasuredWidth = candidateWidth;
        }
      } else {
        allLines.push(currentLine);
        const lineW = measureTextWidth(currentLine, fontSize, fontWeight);
        if (lineW > maxMeasuredWidth) maxMeasuredWidth = lineW;
        currentLine = word;
      }
    }

    if (currentLine) {
      allLines.push(currentLine);
      const lineW = measureTextWidth(currentLine, fontSize, fontWeight);
      if (lineW > maxMeasuredWidth) maxMeasuredWidth = lineW;
    }
  }

  return { lines: allLines, textWidth: Math.ceil(maxMeasuredWidth) };
}

/**
 * Elements that must NOT be auto-sized (fixed frames, device chassis, image placeholders)
 */
export function isFixedSizeElementType(type: ElementType): boolean {
  return type === 'frame-desktop' || type === 'frame-mobile' || type === 'image';
}

/**
 * Calculate the optimal width and height for a canvas element based on its
 * shape type, label, secondary description, font size, and internal padding.
 */
export function calculateElementFitSize(element: CanvasElement): { width: number; height: number } {
  const { type, label = '', secondaryText = '', fontSize = 13, fontWeight = '600' } = element;

  // Fixed elements maintain their dimensions
  if (isFixedSizeElementType(type)) {
    return { width: element.width, height: element.height };
  }

  const primaryFontSize = fontSize;
  const secondaryFontSize = Math.max(10, fontSize - 2);
  const primaryLineHeight = Math.round(primaryFontSize * 1.35);
  const secondaryLineHeight = Math.round(secondaryFontSize * 1.35);

  switch (type) {
    case 'diamond': {
      // Decision Diamond:
      // Inner inscribed rectangle is roughly 56% of width and 46% of height.
      // Choose an initial wrapping width between 110px and 220px.
      const targetWrapWidth = Math.max(110, Math.min(220, Math.ceil(label.length * primaryFontSize * 0.4)));
      const { lines, textWidth } = wrapText(label, targetWrapWidth, primaryFontSize, '700');
      const textHeight = Math.max(1, lines.length) * primaryLineHeight;

      // Calculate rhombus bounding box so text stays comfortably inside
      const requiredW = Math.max(130, Math.ceil(textWidth / 0.54 + 28));
      const requiredH = Math.max(85, Math.ceil(textHeight / 0.44 + 28));

      // Balance diamond proportions (width is typically 1.2x to 1.35x height)
      const balancedW = Math.max(requiredW, Math.round(requiredH * 1.25));
      const balancedH = Math.max(requiredH, Math.round(balancedW * 0.72));

      return {
        width: Math.ceil(balancedW / 5) * 5,
        height: Math.ceil(balancedH / 5) * 5,
      };
    }

    case 'ellipse': {
      // Start/End Terminal Oval:
      // Inscribed rectangle is ~66% of width and ~60% of height.
      const targetWrapWidth = Math.max(120, Math.min(240, Math.ceil(label.length * primaryFontSize * 0.45)));
      const { lines: pLines, textWidth: pWidth } = wrapText(label, targetWrapWidth, primaryFontSize, fontWeight);
      const { lines: sLines, textWidth: sWidth } = wrapText(secondaryText, targetWrapWidth, secondaryFontSize, 'normal');

      const maxTextW = Math.max(pWidth, sWidth);
      const totalTextH =
        pLines.length * primaryLineHeight + (sLines.length > 0 ? sLines.length * secondaryLineHeight + 4 : 0);

      const requiredW = Math.max(130, Math.ceil(maxTextW / 0.65 + 28));
      const requiredH = Math.max(60, Math.ceil(totalTextH / 0.60 + 22));

      return {
        width: Math.ceil(requiredW / 5) * 5,
        height: Math.ceil(requiredH / 5) * 5,
      };
    }

    case 'service': {
      // Microservice Box: Header with icon + dot + label + optional secondaryText
      // Allow width to fit between 170px and 300px
      const targetWrapWidth = Math.max(150, Math.min(280, Math.ceil(label.length * primaryFontSize * 0.55)));
      const { lines: pLines, textWidth: pWidth } = wrapText(label, targetWrapWidth, primaryFontSize, '600');
      const { lines: sLines, textWidth: sWidth } = wrapText(secondaryText, targetWrapWidth, secondaryFontSize, 'normal');

      // Account for 15px icon + 7px dot + margins
      const headerTextW = pWidth + 30;
      const maxContentW = Math.max(headerTextW, sWidth);
      const contentH =
        Math.max(1, pLines.length) * primaryLineHeight +
        (sLines.length > 0 ? sLines.length * secondaryLineHeight + 6 : 0) +
        8; // header margin

      const requiredW = Math.max(170, maxContentW + 28); // 14px padding each side
      const requiredH = Math.max(75, contentH + 24); // 12px padding top/bottom

      return {
        width: Math.ceil(requiredW / 5) * 5,
        height: Math.ceil(requiredH / 5) * 5,
      };
    }

    case 'cylinder': {
      // Database Cylinder: Top cap (24px) + middle + bottom
      const targetWrapWidth = Math.max(140, Math.min(260, Math.ceil(label.length * primaryFontSize * 0.5)));
      const { lines: pLines, textWidth: pWidth } = wrapText(label, targetWrapWidth, primaryFontSize, fontWeight);
      const { lines: sLines, textWidth: sWidth } = wrapText(secondaryText, targetWrapWidth, secondaryFontSize, 'normal');

      const maxTextW = Math.max(pWidth, sWidth);
      const totalTextH =
        20 + // Database icon
        pLines.length * primaryLineHeight +
        (sLines.length > 0 ? sLines.length * secondaryLineHeight + 4 : 0);

      const requiredW = Math.max(150, maxTextW + 36);
      const requiredH = Math.max(90, totalTextH + 42); // top cap + bottom curve

      return {
        width: Math.ceil(requiredW / 5) * 5,
        height: Math.ceil(requiredH / 5) * 5,
      };
    }

    case 'cloud': {
      // Cloud Resource Box
      const targetWrapWidth = Math.max(130, Math.min(240, Math.ceil(label.length * primaryFontSize * 0.5)));
      const { lines: pLines, textWidth: pWidth } = wrapText(label, targetWrapWidth, primaryFontSize, fontWeight);
      const { lines: sLines, textWidth: sWidth } = wrapText(secondaryText, targetWrapWidth, secondaryFontSize, 'normal');

      const maxTextW = Math.max(pWidth, sWidth);
      const totalTextH =
        20 + pLines.length * primaryLineHeight + (sLines.length > 0 ? sLines.length * secondaryLineHeight + 4 : 0);

      const requiredW = Math.max(140, maxTextW + 36);
      const requiredH = Math.max(75, totalTextH + 34);

      return {
        width: Math.ceil(requiredW / 5) * 5,
        height: Math.ceil(requiredH / 5) * 5,
      };
    }

    case 'queue': {
      // Message Queue / Buffer
      const targetWrapWidth = Math.max(140, Math.min(260, Math.ceil(label.length * primaryFontSize * 0.5)));
      const { lines: pLines, textWidth: pWidth } = wrapText(label, targetWrapWidth, primaryFontSize, fontWeight);
      const { lines: sLines, textWidth: sWidth } = wrapText(secondaryText, targetWrapWidth, secondaryFontSize, 'normal');

      const maxTextW = Math.max(pWidth, sWidth);
      const totalTextH =
        pLines.length * primaryLineHeight + (sLines.length > 0 ? sLines.length * secondaryLineHeight + 4 : 0);

      const requiredW = Math.max(160, maxTextW + 48); // 16px icon + gap + padding
      const requiredH = Math.max(65, totalTextH + 26);

      return {
        width: Math.ceil(requiredW / 5) * 5,
        height: Math.ceil(requiredH / 5) * 5,
      };
    }

    case 'button': {
      const { textWidth } = wrapText(label, 300, primaryFontSize, '600');
      const requiredW = Math.max(100, textWidth + 30);
      const requiredH = Math.max(38, primaryLineHeight + 18);
      return {
        width: Math.ceil(requiredW / 5) * 5,
        height: Math.ceil(requiredH / 5) * 5,
      };
    }

    case 'input': {
      const { textWidth } = wrapText(label, 320, primaryFontSize, 'normal');
      const requiredW = Math.max(140, textWidth + 28);
      const requiredH = Math.max(38, primaryLineHeight + 16);
      return {
        width: Math.ceil(requiredW / 5) * 5,
        height: Math.ceil(requiredH / 5) * 5,
      };
    }

    case 'text': {
      const paragraphs = (label || 'Text').split('\n');
      let maxLineW = 0;
      for (const p of paragraphs) {
        const w = measureTextWidth(p || ' ', primaryFontSize, fontWeight);
        if (w > maxLineW) maxLineW = w;
      }
      const requiredW = Math.max(60, Math.ceil(maxLineW + 12));
      const requiredH = Math.max(24, Math.ceil(paragraphs.length * primaryLineHeight + 8));
      return {
        width: Math.ceil(requiredW / 5) * 5,
        height: Math.ceil(requiredH / 5) * 5,
      };
    }

    case 'rectangle':
    default: {
      // Standard Box / Process Step / Card
      // Target comfortable reading width: 160px to 280px
      const targetWrapWidth = Math.max(140, Math.min(260, Math.ceil(label.length * primaryFontSize * 0.55)));
      const { lines: pLines, textWidth: pWidth } = wrapText(label, targetWrapWidth, primaryFontSize, fontWeight);
      const { lines: sLines, textWidth: sWidth } = wrapText(secondaryText, targetWrapWidth, secondaryFontSize, 'normal');

      const maxTextW = Math.max(pWidth, sWidth);
      const totalTextH =
        pLines.length * primaryLineHeight +
        (sLines.length > 0 ? sLines.length * secondaryLineHeight + (label ? 6 : 0) : 0);

      const requiredW = Math.max(140, maxTextW + 28); // 14px padding each side
      const requiredH = Math.max(60, totalTextH + 26); // 13px padding top/bottom

      return {
        width: Math.ceil(requiredW / 5) * 5,
        height: Math.ceil(requiredH / 5) * 5,
      };
    }
  }
}

/**
 * Check if the element should grow when edited.
 * If autoSize is true (or undefined for auto-sizeable nodes), returns the grown dimensions
 * ensuring that the element at least contains its new content.
 */
export function ensureElementFitsContent(
  element: CanvasElement,
  updatedFields: Partial<CanvasElement>
): { width: number; height: number; autoSize?: boolean } {
  const merged: CanvasElement = { ...element, ...updatedFields };

  // If fixed type or user explicitly disabled autoSize, keep current or requested size
  if (isFixedSizeElementType(merged.type) || merged.autoSize === false) {
    return {
      width: updatedFields.width ?? element.width,
      height: updatedFields.height ?? element.height,
      autoSize: merged.autoSize,
    };
  }

  const fit = calculateElementFitSize(merged);

  return {
    width: Math.max(updatedFields.width ?? element.width, fit.width),
    height: Math.max(updatedFields.height ?? element.height, fit.height),
    autoSize: true,
  };
}
