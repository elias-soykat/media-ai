export interface ResizeOptions {
  width?: number;
  height?: number;
  percentage?: number;
  maintainAspectRatio?: boolean;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SupportedFormat = 'jpg' | 'jpeg' | 'png' | 'webp';

export const CROP_PRESETS: { label: string; ratio: string }[] = [
  { label: 'Freeform', ratio: 'free' },
  { label: '1:1 Square', ratio: '1:1' },
  { label: '16:9 Landscape', ratio: '16:9' },
  { label: '4:3 Standard', ratio: '4:3' },
  { label: '4:5 Social Portrait', ratio: '4:5' },
  { label: '9:16 Story / Reel', ratio: '9:16' },
];

export function formatToMimeType(format: string): string {
  const clean = format.toLowerCase().replace(/^\./, '');
  if (clean === 'jpg' || clean === 'jpeg') return 'image/jpeg';
  if (clean === 'png') return 'image/png';
  if (clean === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export function parseAspectRatio(ratio: string | number): number | null {
  if (typeof ratio === 'number') return ratio;
  if (ratio === 'free') return null;

  const parts = ratio.split(':');
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      return num / den;
    }
  }
  return null;
}

export function calculateCropRect(
  sourceWidth: number,
  sourceHeight: number,
  aspectRatio: string | number,
  customArea?: CropRect
): CropRect {
  if (customArea) {
    return {
      x: Math.max(0, Math.min(customArea.x, sourceWidth)),
      y: Math.max(0, Math.min(customArea.y, sourceHeight)),
      width: Math.min(customArea.width, sourceWidth - customArea.x),
      height: Math.min(customArea.height, sourceHeight - customArea.y),
    };
  }

  const targetRatio = parseAspectRatio(aspectRatio);
  if (!targetRatio) {
    return { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  }

  const sourceRatio = sourceWidth / sourceHeight;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceRatio > targetRatio) {
    // Source is wider than target ratio: crop width
    cropWidth = Math.round(sourceHeight * targetRatio);
  } else {
    // Source is taller than target ratio: crop height
    cropHeight = Math.round(sourceWidth / targetRatio);
  }

  const x = Math.round((sourceWidth - cropWidth) / 2);
  const y = Math.round((sourceHeight - cropHeight) / 2);

  return { x, y, width: cropWidth, height: cropHeight };
}

export function calculateTargetDimensions(
  currentWidth: number,
  currentHeight: number,
  options: ResizeOptions
): { width: number; height: number } {
  const { width, height, percentage, maintainAspectRatio = true } = options;

  if (percentage && percentage > 0) {
    const factor = percentage / 100;
    return {
      width: Math.max(1, Math.round(currentWidth * factor)),
      height: Math.max(1, Math.round(currentHeight * factor)),
    };
  }

  if (width && height) {
    if (!maintainAspectRatio) {
      return { width, height };
    }
    const ratio = currentWidth / currentHeight;
    // Fit within bounding box
    if (width / height > ratio) {
      return { width: Math.round(height * ratio), height };
    } else {
      return { width, height: Math.round(width / ratio) };
    }
  }

  if (width && !height) {
    const ratio = currentWidth / currentHeight;
    return {
      width,
      height: maintainAspectRatio ? Math.round(width / ratio) : currentHeight,
    };
  }

  if (height && !width) {
    const ratio = currentWidth / currentHeight;
    return {
      width: maintainAspectRatio ? Math.round(height * ratio) : currentWidth,
      height,
    };
  }

  return { width: currentWidth, height: currentHeight };
}

export function estimateCompressedSize(
  width: number,
  height: number,
  format: 'jpg' | 'png' | 'webp',
  quality: number = 80
): number {
  const totalPixels = width * height;
  const qFactor = Math.max(10, Math.min(100, quality)) / 100;

  if (format === 'png') {
    // PNG is lossless, compression factor is largely structural
    return Math.round(totalPixels * 2.2);
  } else if (format === 'webp') {
    // WebP achieves ~30% higher compression efficiency than JPEG
    return Math.round(totalPixels * 0.4 * qFactor);
  } else {
    // Standard JPEG estimation (~0.6 bytes per pixel at 80% quality)
    return Math.round(totalPixels * 0.6 * qFactor);
  }
}

