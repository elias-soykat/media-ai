/**
 * Browser Canvas Compositor for Background Changer
 * Operates 100% client-side with 0 server compute or external dependencies.
 */

export type CompositorBackgroundType = 'color' | 'gradient' | 'image' | 'transparent';

export interface GradientStop {
  offset: number; // 0.0 to 1.0
  color: string;
}

export interface CompositorGradient {
  id: string;
  name: string;
  stops: GradientStop[];
  direction?: 'to-bottom' | 'to-right' | 'radial';
}

export interface FittedDimensions {
  drawWidth: number;
  drawHeight: number;
  dx: number;
  dy: number;
}

export interface CompositorOptions {
  foregroundImage: HTMLImageElement | HTMLCanvasElement | ImageBitmap;
  targetWidth?: number;
  targetHeight?: number;
  bgType: CompositorBackgroundType;
  bgColor?: string;
  bgGradient?: CompositorGradient;
  bgImage?: HTMLImageElement | HTMLCanvasElement | ImageBitmap;
  bgFit?: 'cover' | 'contain';
  fgScale?: number;
  fgOffsetX?: number;
  fgOffsetY?: number;
}

export const BACKGROUND_PRESETS = {
  solidColors: [
    '#FFFFFF',
    '#000000',
    '#F3F4F6',
    '#E5E7EB',
    '#1F2937',
    '#0F172A',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
  ],
  gradients: [
    {
      id: 'studio-grey',
      name: 'Studio Grey',
      stops: [
        { offset: 0, color: '#374151' },
        { offset: 1, color: '#111827' },
      ],
      direction: 'to-bottom' as const,
    },
    {
      id: 'cool-slate',
      name: 'Cool Slate',
      stops: [
        { offset: 0, color: '#1E293B' },
        { offset: 1, color: '#0F172A' },
      ],
      direction: 'to-bottom' as const,
    },
    {
      id: 'soft-white',
      name: 'Soft Studio White',
      stops: [
        { offset: 0, color: '#FFFFFF' },
        { offset: 1, color: '#E2E8F0' },
      ],
      direction: 'to-bottom' as const,
    },
    {
      id: 'sunset-glow',
      name: 'Sunset Glow',
      stops: [
        { offset: 0, color: '#FB923C' },
        { offset: 1, color: '#EC4899' },
      ],
      direction: 'to-right' as const,
    },
    {
      id: 'cyber-neon',
      name: 'Cyber Neon',
      stops: [
        { offset: 0, color: '#06B6D4' },
        { offset: 1, color: '#3B82F6' },
      ],
      direction: 'to-bottom' as const,
    },
  ],
};

/**
 * Calculates positioning and dimensions for background images fitting into the target canvas.
 */
export function calculateFittedDimensions(
  containerWidth: number,
  containerHeight: number,
  sourceWidth: number,
  sourceHeight: number,
  fit: 'cover' | 'contain' = 'cover'
): FittedDimensions {
  if (sourceWidth <= 0 || sourceHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return { drawWidth: containerWidth, drawHeight: containerHeight, dx: 0, dy: 0 };
  }

  const scale =
    fit === 'cover'
      ? Math.max(containerWidth / sourceWidth, containerHeight / sourceHeight)
      : Math.min(containerWidth / sourceWidth, containerHeight / sourceHeight);

  const drawWidth = Math.round(sourceWidth * scale);
  const drawHeight = Math.round(sourceHeight * scale);
  const dx = Math.round((containerWidth - drawWidth) / 2);
  const dy = Math.round((containerHeight - drawHeight) / 2);

  return { drawWidth, drawHeight, dx, dy };
}

/**
 * Composites a foreground cutout onto a custom solid, gradient, or image background.
 */
export function renderCompositedCanvas(options: CompositorOptions): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    throw new Error('renderCompositedCanvas requires a browser DOM environment');
  }

  const {
    foregroundImage,
    targetWidth = foregroundImage.width,
    targetHeight = foregroundImage.height,
    bgType,
    bgColor = '#FFFFFF',
    bgGradient,
    bgImage,
    bgFit = 'cover',
    fgScale = 1.0,
    fgOffsetX = 0,
    fgOffsetY = 0,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not acquire 2D canvas rendering context');
  }

  // 1. Clear background
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // 2. Render background layer
  if (bgType === 'color') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (bgType === 'gradient' && bgGradient) {
    let gradient: CanvasGradient;
    if (bgGradient.direction === 'to-right') {
      gradient = ctx.createLinearGradient(0, 0, targetWidth, 0);
    } else if (bgGradient.direction === 'radial') {
      const cx = targetWidth / 2;
      const cy = targetHeight / 2;
      const r = Math.max(targetWidth, targetHeight) / 2;
      gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    } else {
      gradient = ctx.createLinearGradient(0, 0, 0, targetHeight);
    }

    for (const stop of bgGradient.stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (bgType === 'image' && bgImage) {
    const fitted = calculateFittedDimensions(
      targetWidth,
      targetHeight,
      bgImage.width,
      bgImage.height,
      bgFit
    );
    ctx.drawImage(bgImage, fitted.dx, fitted.dy, fitted.drawWidth, fitted.drawHeight);
  }

  // 3. Render foreground cutout on top
  const fgWidth = Math.round(foregroundImage.width * fgScale);
  const fgHeight = Math.round(foregroundImage.height * fgScale);
  const fgX = Math.round((targetWidth - fgWidth) / 2 + fgOffsetX);
  const fgY = Math.round((targetHeight - fgHeight) / 2 + fgOffsetY);

  ctx.drawImage(foregroundImage, fgX, fgY, fgWidth, fgHeight);

  return canvas;
}

