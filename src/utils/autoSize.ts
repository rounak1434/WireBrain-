import { CanvasElement, ElementType, Board } from '../types';

export const APP_FONT_FAMILY =
  'Plus Jakarta Sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

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
  fontFamily = APP_FONT_FAMILY
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

  // Fallback: character width factor based on font weight
  const charFactor = fontWeight === '700' ? 0.65 : fontWeight === '600' ? 0.60 : fontWeight === '500' ? 0.56 : 0.53;
  return text.length * fontSize * charFactor;
}

/**
 * Simulate word-wrap calculation for a given maximum line width.
 * Mimics CSS `word-break: break-word` and `white-space: pre-wrap`.
 * Returns array of lines and maximum line width.
 */
export function wrapText(
  text: string,
  maxLineWidth: number,
  fontSize = 14,
  fontWeight: 'normal' | '500' | '600' | '700' = 'normal'
): { lines: string[]; textWidth: number } {
  if (!text) return { lines: [], textWidth: 0 };

  const safeMax = Math.max(20, maxLineWidth);
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

      if (candidateWidth <= safeMax || !currentLine) {
        // If even the single word is wider than safeMax, we allow it on the line
        // or break it if excessively long
        if (!currentLine && candidateWidth > safeMax) {
          // Word alone is wider than line: break word characters if needed
          let chunk = '';
          for (let i = 0; i < word.length; i++) {
            const charCand = chunk + word[i];
            if (measureTextWidth(charCand, fontSize, fontWeight) <= safeMax || !chunk) {
              chunk = charCand;
            } else {
              allLines.push(chunk);
              const cw = measureTextWidth(chunk, fontSize, fontWeight);
              if (cw > maxMeasuredWidth) maxMeasuredWidth = cw;
              chunk = word[i];
            }
          }
          currentLine = chunk;
        } else {
          currentLine = candidate;
          if (candidateWidth > maxMeasuredWidth) {
            maxMeasuredWidth = candidateWidth;
          }
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
 * Shape layout constants extracted from ElementRenderer CSS styles.
 */
interface ShapeStyleSpec {
  padHoriz: number; // total left + right padding
  padVert: number; // total top + bottom padding
  secFontSize: number;
  secLineHeightRatio: number;
  primaryLineHeightRatio: number;
  gapBetweenTexts: number;
  extraHeightOffset: number; // e.g. icons, cylinder top caps
  extraWidthOffset: number; // e.g. icon width + gap in header
  inscribedWidthFactor: number; // for diamond (0.52), ellipse (0.64), rectangle (1.0)
  inscribedHeightFactor: number; // for diamond (0.44), ellipse (0.58), rectangle (1.0)
  minWidth: number;
  minHeight: number;
}

function getShapeSpec(type: ElementType, fontSize: number): ShapeStyleSpec {
  switch (type) {
    case 'diamond':
      return {
        padHoriz: 0,
        padVert: 0,
        secFontSize: Math.max(10, fontSize - 2),
        secLineHeightRatio: 1.3,
        primaryLineHeightRatio: 1.3,
        gapBetweenTexts: 2,
        extraHeightOffset: 12,
        extraWidthOffset: 0,
        inscribedWidthFactor: 0.52,
        inscribedHeightFactor: 0.44,
        minWidth: 130,
        minHeight: 85,
      };

    case 'ellipse':
      return {
        padHoriz: 0,
        padVert: 16,
        secFontSize: Math.max(10, fontSize - 2),
        secLineHeightRatio: 1.3,
        primaryLineHeightRatio: 1.3,
        gapBetweenTexts: 2,
        extraHeightOffset: 8,
        extraWidthOffset: 0,
        inscribedWidthFactor: 0.64,
        inscribedHeightFactor: 0.58,
        minWidth: 130,
        minHeight: 60,
      };

    case 'service':
      return {
        padHoriz: 28, // 14px each side
        padVert: 20, // 10px each side
        secFontSize: 11,
        secLineHeightRatio: 1.3,
        primaryLineHeightRatio: 1.3,
        gapBetweenTexts: 6, // 4px header margin + 2px top margin
        extraHeightOffset: 4,
        extraWidthOffset: 38, // 15px icon + 7px dot + 2 * 8px gap
        inscribedWidthFactor: 1.0,
        inscribedHeightFactor: 1.0,
        minWidth: 170,
        minHeight: 75,
      };

    case 'cylinder':
      return {
        padHoriz: 16, // 8px each side
        padVert: 32, // 24px top cap + 8px bottom
        secFontSize: 10,
        secLineHeightRatio: 1.2,
        primaryLineHeightRatio: 1.2,
        gapBetweenTexts: 2,
        extraHeightOffset: 23, // 15px icon + 4px margin + 4px bottom padding
        extraWidthOffset: 0,
        inscribedWidthFactor: 1.0,
        inscribedHeightFactor: 1.0,
        minWidth: 150,
        minHeight: 90,
      };

    case 'cloud':
      return {
        padHoriz: 32, // 16px each side
        padVert: 16, // 8px each side
        secFontSize: 10,
        secLineHeightRatio: 1.3,
        primaryLineHeightRatio: 1.3,
        gapBetweenTexts: 2,
        extraHeightOffset: 24, // 16px icon + 4px margin + 4px buffer
        extraWidthOffset: 0,
        inscribedWidthFactor: 1.0,
        inscribedHeightFactor: 1.0,
        minWidth: 140,
        minHeight: 75,
      };

    case 'queue':
      return {
        padHoriz: 28, // 14px each side
        padVert: 16, // 8px each side
        secFontSize: 10,
        secLineHeightRatio: 1.3,
        primaryLineHeightRatio: 1.3,
        gapBetweenTexts: 2,
        extraHeightOffset: 4,
        extraWidthOffset: 26, // 16px icon + 10px gap
        inscribedWidthFactor: 1.0,
        inscribedHeightFactor: 1.0,
        minWidth: 160,
        minHeight: 65,
      };

    case 'button':
      return {
        padHoriz: 24,
        padVert: 0,
        secFontSize: 10,
        secLineHeightRatio: 1.35,
        primaryLineHeightRatio: 1.35,
        gapBetweenTexts: 0,
        extraHeightOffset: 18,
        extraWidthOffset: 10,
        inscribedWidthFactor: 1.0,
        inscribedHeightFactor: 1.0,
        minWidth: 90,
        minHeight: 38,
      };

    case 'input':
      return {
        padHoriz: 24,
        padVert: 0,
        secFontSize: 10,
        secLineHeightRatio: 1.35,
        primaryLineHeightRatio: 1.35,
        gapBetweenTexts: 0,
        extraHeightOffset: 16,
        extraWidthOffset: 10,
        inscribedWidthFactor: 1.0,
        inscribedHeightFactor: 1.0,
        minWidth: 120,
        minHeight: 38,
      };

    case 'text':
      return {
        padHoriz: 8,
        padVert: 6,
        secFontSize: 10,
        secLineHeightRatio: 1.35,
        primaryLineHeightRatio: 1.35,
        gapBetweenTexts: 0,
        extraHeightOffset: 4,
        extraWidthOffset: 0,
        inscribedWidthFactor: 1.0,
        inscribedHeightFactor: 1.0,
        minWidth: 60,
        minHeight: 24,
      };

    case 'rectangle':
    default:
      return {
        padHoriz: 28, // 14px each side
        padVert: 24, // 12px each side
        secFontSize: 12, // ElementRenderer renders secondaryText at 12px
        secLineHeightRatio: 1.4, // ElementRenderer renders secondaryText at lineHeight: 1.4
        primaryLineHeightRatio: 1.35,
        gapBetweenTexts: 6, // marginBottom: secondaryText ? 6 : 0
        extraHeightOffset: 4,
        extraWidthOffset: 0,
        inscribedWidthFactor: 1.0,
        inscribedHeightFactor: 1.0,
        minWidth: 140,
        minHeight: 60,
      };
  }
}

/**
 * Calculate the exact required bounding dimensions (width and height)
 * for an element given a specific target container width.
 * Ensures NO text field (title, subtitle, description, labels) overflows.
 */
export function calculateElementRequiredDimensions(
  element: CanvasElement,
  targetWidth?: number
): { width: number; height: number } {
  if (isFixedSizeElementType(element.type)) {
    return { width: element.width, height: element.height };
  }

  const {
    type,
    label = '',
    secondaryText = '',
    fontSize = 13,
    fontWeight = 'normal',
    strokeWidth = 1,
  } = element;

  const spec = getShapeSpec(type, fontSize);
  const primaryLineH = Math.ceil(fontSize * spec.primaryLineHeightRatio);
  const secLineH = Math.ceil(spec.secFontSize * spec.secLineHeightRatio);
  const bordersW = strokeWidth * 2;
  const bordersH = strokeWidth * 2;

  // Determine current available container width for measurement
  const baseW = targetWidth !== undefined && targetWidth > 0 ? targetWidth : element.width || spec.minWidth;
  const candidateW = Math.max(spec.minWidth, baseW);

  // Available inner width for wrapping text inside this shape
  const rawInnerW = (candidateW - bordersW) * spec.inscribedWidthFactor - spec.padHoriz;
  const availW = Math.max(30, rawInnerW);
  const availWPrimary = Math.max(20, availW - spec.extraWidthOffset);

  // Wrap all displayed text fields
  const pWrap = wrapText(label, availWPrimary, fontSize, fontWeight);
  const sWrap = wrapText(secondaryText, availW, spec.secFontSize, 'normal');

  const pLineCount = label ? Math.max(1, pWrap.lines.length) : 0;
  const sLineCount = secondaryText ? Math.max(1, sWrap.lines.length) : 0;
  const hasGap = pLineCount > 0 && sLineCount > 0;

  const contentH =
    pLineCount * primaryLineH +
    (hasGap ? spec.gapBetweenTexts : 0) +
    sLineCount * secLineH +
    spec.extraHeightOffset;

  // Total required height accounting for inscribed shape factor, padding, borders, and subpixel safety buffer
  const rawReqH =
    contentH / spec.inscribedHeightFactor +
    spec.padVert +
    bordersH +
    4; // 4px subpixel anti-aliasing safety buffer

  let requiredH = Math.max(spec.minHeight, Math.ceil(rawReqH));

  // Determine required width based on longest wrapped text lines
  const maxContentW = Math.max(pWrap.textWidth + spec.extraWidthOffset, sWrap.textWidth);
  const rawReqW =
    (maxContentW + spec.padHoriz) / spec.inscribedWidthFactor +
    bordersW +
    4;

  let requiredW = Math.max(spec.minWidth, Math.ceil(rawReqW));

  // For decision diamonds, maintain comfortable diamond aspect ratio (width >= 1.25 * height)
  if (type === 'diamond') {
    requiredW = Math.max(requiredW, Math.round(requiredH * 1.25));
    requiredH = Math.max(requiredH, Math.round(requiredW * 0.72));
  }

  return {
    width: Math.max(candidateW, requiredW),
    height: requiredH,
  };
}

/**
 * Calculate the optimal width and height for a canvas element
 * based on its shape type, label, secondary description, font size, and internal padding.
 * Used for auto-sizing to content and resetting shape dimensions.
 */
export function calculateElementFitSize(element: CanvasElement): { width: number; height: number } {
  const { type, label = '', secondaryText = '', fontSize = 13, fontWeight = '600' } = element;

  if (isFixedSizeElementType(type)) {
    return { width: element.width, height: element.height };
  }

  const spec = getShapeSpec(type, fontSize);

  // Measure single-line text widths to find optimal balanced line width
  const pSingleW = measureTextWidth(label, fontSize, fontWeight);
  const sSingleW = measureTextWidth(secondaryText, spec.secFontSize, 'normal');
  const maxSingleW = Math.max(pSingleW + spec.extraWidthOffset, sSingleW);

  // Choose a comfortable balanced reading width based on text length
  let idealW: number;
  switch (type) {
    case 'diamond':
      idealW = Math.max(140, Math.min(260, Math.ceil(maxSingleW / 0.52 + 32)));
      break;
    case 'ellipse':
      idealW = Math.max(130, Math.min(260, Math.ceil(maxSingleW / 0.64 + 28)));
      break;
    case 'service':
      idealW = Math.max(180, Math.min(320, Math.ceil(maxSingleW + 36)));
      break;
    case 'cylinder':
      idealW = Math.max(150, Math.min(280, Math.ceil(maxSingleW + 28)));
      break;
    case 'cloud':
      idealW = Math.max(140, Math.min(260, Math.ceil(maxSingleW + 36)));
      break;
    case 'queue':
      idealW = Math.max(170, Math.min(280, Math.ceil(maxSingleW + 32)));
      break;
    case 'button':
      idealW = Math.max(90, Math.min(300, Math.ceil(maxSingleW + 34)));
      break;
    case 'input':
      idealW = Math.max(130, Math.min(320, Math.ceil(maxSingleW + 34)));
      break;
    case 'text':
      idealW = Math.max(60, Math.ceil(maxSingleW + 16));
      break;
    case 'rectangle':
    default:
      // Balanced width for process boxes: 170px to 320px
      idealW = Math.max(170, Math.min(320, Math.ceil(maxSingleW + 36)));
      break;
  }

  const dims = calculateElementRequiredDimensions(element, idealW);
  return {
    width: Math.ceil(dims.width / 5) * 5,
    height: Math.ceil(dims.height / 5) * 5,
  };
}

/**
 * Check if the element should grow when edited.
 * If autoSize is true (or undefined for auto-sizeable nodes), returns the grown dimensions
 * ensuring that the element contains ALL its displayed text without clipping or overflow.
 * Avoids unnecessary jitter if dimensions already comfortably fit the content.
 */
export function ensureElementFitsContent(
  element: CanvasElement,
  updatedFields: Partial<CanvasElement>
): { width: number; height: number; autoSize?: boolean } {
  const merged: CanvasElement = { ...element, ...updatedFields };

  // If fixed type or user explicitly disabled autoSize, keep requested or current size
  if (isFixedSizeElementType(merged.type) || merged.autoSize === false) {
    return {
      width: updatedFields.width ?? element.width,
      height: updatedFields.height ?? element.height,
      autoSize: merged.autoSize,
    };
  }

  const targetW = updatedFields.width ?? element.width;
  const targetH = updatedFields.height ?? element.height;

  // Calculate required dimensions for current/target width
  const required = calculateElementRequiredDimensions(merged, targetW);

  // Growth should only expand dimensions if needed to prevent text overflow
  const nextW = Math.max(targetW, required.width);
  const nextH = Math.max(targetH, required.height);

  // Prevent resize loops / jitter if difference is negligible (< 1px)
  const isWidthSame = Math.abs(nextW - element.width) < 1;
  const isHeightSame = Math.abs(nextH - element.height) < 1;

  if (isWidthSame && isHeightSame && updatedFields.width === undefined && updatedFields.height === undefined) {
    return {
      width: element.width,
      height: element.height,
      autoSize: true,
    };
  }

  return {
    width: Math.ceil(nextW),
    height: Math.ceil(nextH),
    autoSize: true,
  };
}

/**
 * Ensure all auto-sizable text-bearing elements in a board fit their content.
 * Used during board loading and example project importing.
 */
export function ensureBoardElementsFit(board: Board): Board {
  let changed = false;
  const updatedElements = board.elements.map((el) => {
    if (isFixedSizeElementType(el.type) || el.autoSize === false) {
      return el;
    }
    const required = calculateElementRequiredDimensions(el, el.width);
    if (required.width > el.width || required.height > el.height) {
      changed = true;
      return {
        ...el,
        width: Math.max(el.width, required.width),
        height: Math.max(el.height, required.height),
      };
    }
    return el;
  });

  return changed ? { ...board, elements: updatedElements } : board;
}
