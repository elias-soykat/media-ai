// tests/video/videoTransforms.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateVideoCropRect,
  calculateVideoScaledDimensions,
  estimateCompressedVideoSize,
  SUPPORTED_VIDEO_PRESETS,
} from '@/lib/video/videoTransforms';

describe('Video Transforms Engine', () => {
  it('should calculate centered crop rect for 9:16 vertical video from 16:9 landscape source', () => {
    // 1920x1080 source cropped to 9:16
    const rect = calculateVideoCropRect(1920, 1080, '9:16');
    expect(rect.height).toBe(1080);
    // 1080 * (9/16) = 607.5 -> 608px
    expect(rect.width).toBe(608);
    expect(rect.x).toBe(Math.round((1920 - 608) / 2));
    expect(rect.y).toBe(0);

    // Enforce even dimension parity on odd-producing resolutions (e.g. 720 * 9/16 = 405 -> 406)
    const oddSourceRect = calculateVideoCropRect(1280, 720, '9:16');
    expect(oddSourceRect.width % 2).toBe(0);
    expect(oddSourceRect.height % 2).toBe(0);
  });

  it('should scale 1080p video down to 720p and 480p maintaining aspect ratio', () => {
    const s720 = calculateVideoScaledDimensions(1920, 1080, '720p');
    expect(s720.width).toBe(1280);
    expect(s720.height).toBe(720);

    const s480 = calculateVideoScaledDimensions(1920, 1080, '480p');
    expect(s480.width).toBe(854);
    expect(s480.height).toBe(480);
  });

  it('should estimate compressed video file size in bytes based on bitrate and duration', () => {
    // 60 second 1080p medium compression video
    const bytes = estimateCompressedVideoSize(60, '1080p', 'medium');
    expect(bytes).toBeGreaterThan(10 * 1024 * 1024); // > 10MB
    expect(bytes).toBeLessThan(40 * 1024 * 1024); // < 40MB
  });

  it('should expose supported aspect ratio presets with platform metadata', () => {
    expect(SUPPORTED_VIDEO_PRESETS).toHaveProperty('16:9');
    expect(SUPPORTED_VIDEO_PRESETS).toHaveProperty('9:16');
    expect(SUPPORTED_VIDEO_PRESETS).toHaveProperty('1:1');
    expect(SUPPORTED_VIDEO_PRESETS).toHaveProperty('4:5');
  });
});

