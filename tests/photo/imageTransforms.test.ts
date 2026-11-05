import { describe, it, expect } from 'vitest';
import {
  calculateTargetDimensions,
  formatToMimeType,
  calculateCropRect,
} from '@/lib/photo/imageTransforms';

describe('Image Transformations Engine', () => {
  it('should calculate proportional resized dimensions when preserving aspect ratio', () => {
    // 1920x1080 resized to width 960 with aspect ratio preserved
    const target = calculateTargetDimensions(1920, 1080, {
      width: 960,
      maintainAspectRatio: true,
    });
    expect(target.width).toBe(960);
    expect(target.height).toBe(540);
  });

  it('should resize by percentage correctly', () => {
    const target = calculateTargetDimensions(1000, 800, {
      percentage: 50,
      maintainAspectRatio: true,
    });
    expect(target.width).toBe(500);
    expect(target.height).toBe(400);
  });

  it('should map standard formats to MIME types', () => {
    expect(formatToMimeType('jpg')).toBe('image/jpeg');
    expect(formatToMimeType('png')).toBe('image/png');
    expect(formatToMimeType('webp')).toBe('image/webp');
  });

  it('should compute centered crop rectangle for preset aspect ratios', () => {
    // 1920x1080 image cropped to 1:1 square
    const rect = calculateCropRect(1920, 1080, '1:1');
    expect(rect.width).toBe(1080);
    expect(rect.height).toBe(1080);
    expect(rect.x).toBe((1920 - 1080) / 2);
    expect(rect.y).toBe(0);
  });
});

