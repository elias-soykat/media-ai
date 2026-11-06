/**
 * Video Transformation & Resizing Engine
 * Client-side aspect ratio cropping geometry, downscaling, and bitrate/filesize estimation.
 */

export interface VideoCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoScaledDimensions {
  width: number;
  height: number;
}

export interface AspectRatioPreset {
  id: string;
  label: string;
  description: string;
  ratio: number;
}

export const SUPPORTED_VIDEO_PRESETS: Record<string, AspectRatioPreset> = {
  '16:9': {
    id: '16:9',
    label: '16:9 Landscape',
    description: 'YouTube, Television, Desktop screens.',
    ratio: 16 / 9,
  },
  '9:16': {
    id: '9:16',
    label: '9:16 Vertical',
    description: 'TikTok, Instagram Reels, YouTube Shorts.',
    ratio: 9 / 16,
  },
  '1:1': {
    id: '1:1',
    label: '1:1 Square',
    description: 'Instagram Feed, LinkedIn.',
    ratio: 1,
  },
  '4:5': {
    id: '4:5',
    label: '4:5 Social Portrait',
    description: 'Instagram and Facebook in-feed video.',
    ratio: 4 / 5,
  },
};

/**
 * Calculates a centered crop bounding rectangle to transform video to target aspect ratio.
 */
export function calculateVideoCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetAspectRatio: string
): VideoCropRect {
  const preset = SUPPORTED_VIDEO_PRESETS[targetAspectRatio];
  const targetRatio = preset ? preset.ratio : 16 / 9;

  const currentRatio = sourceWidth / sourceHeight;

  if (targetRatio < currentRatio) {
    // Target is narrower/taller than source (e.g. 16:9 to 9:16): clamp height, crop width
    let targetWidth = Math.round(sourceHeight * targetRatio);
    if (targetWidth % 2 !== 0) targetWidth += 1;
    let targetHeight = sourceHeight;
    if (targetHeight % 2 !== 0) targetHeight += 1;
    const x = Math.round((sourceWidth - targetWidth) / 2);
    return {
      x,
      y: 0,
      width: targetWidth,
      height: targetHeight,
    };
  } else {
    // Target is wider than source: clamp width, crop height
    let targetHeight = Math.round(sourceWidth / targetRatio);
    if (targetHeight % 2 !== 0) targetHeight += 1;
    let targetWidth = sourceWidth;
    if (targetWidth % 2 !== 0) targetWidth += 1;
    const y = Math.round((sourceHeight - targetHeight) / 2);
    return {
      x: 0,
      y,
      width: targetWidth,
      height: targetHeight,
    };
  }
}

/**
 * Scales video dimensions down to 1080p, 720p, or 480p while preserving aspect ratio.
 */
export function calculateVideoScaledDimensions(
  sourceWidth: number,
  sourceHeight: number,
  targetResolution: '1080p' | '720p' | '480p'
): VideoScaledDimensions {
  const targetHeights: Record<string, number> = {
    '1080p': 1080,
    '720p': 720,
    '480p': 480,
  };

  const targetH = targetHeights[targetResolution] || 720;

  // Never upscale small videos
  if (sourceHeight <= targetH) {
    return { width: sourceWidth, height: sourceHeight };
  }

  const ratio = sourceWidth / sourceHeight;
  let scaledWidth = Math.round(targetH * ratio);
  // Video codecs require dimensions to be even numbers
  if (scaledWidth % 2 !== 0) {
    scaledWidth += 1;
  }

  return {
    width: scaledWidth,
    height: targetH,
  };
}

/**
 * Estimates output video file size in bytes using standard compression bitrates.
 */
export function estimateCompressedVideoSize(
  durationSeconds: number,
  targetResolution: string,
  qualityPreset: 'low' | 'medium' | 'high' = 'medium'
): number {
  if (durationSeconds <= 0) return 0;

  // Video bitrates in kbps for H.264 / VP9 / AV1
  const bitrateTable: Record<string, Record<string, number>> = {
    '1080p': { low: 2200, medium: 4200, high: 7500 },
    '720p': { low: 1200, medium: 2400, high: 4000 },
    '480p': { low: 600, medium: 1100, high: 1800 },
  };

  const resKey = targetResolution.toLowerCase().includes('1080')
    ? '1080p'
    : targetResolution.toLowerCase().includes('480')
    ? '480p'
    : '720p';

  const videoBitrateKbps = bitrateTable[resKey][qualityPreset] || 2400;
  const audioBitrateKbps = 128; // Standard AAC/Opus audio

  const totalBitrateBps = (videoBitrateKbps + audioBitrateKbps) * 1000;
  const bytesPerSecond = totalBitrateBps / 8;

  return Math.round(bytesPerSecond * durationSeconds);
}
