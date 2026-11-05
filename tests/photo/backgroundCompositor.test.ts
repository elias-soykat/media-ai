// tests/photo/backgroundCompositor.test.ts
import { describe, it, expect } from 'vitest';
import {
  BACKGROUND_PRESETS,
  calculateFittedDimensions,
} from '@/lib/photo/backgroundCompositor';

describe('Background Changer Compositor', () => {
  it('should provide preset solid colors and gradient backgrounds', () => {
    expect(BACKGROUND_PRESETS.solidColors).toContain('#FFFFFF');
    expect(BACKGROUND_PRESETS.solidColors).toContain('#000000');
    expect(BACKGROUND_PRESETS.gradients.length).toBeGreaterThan(0);
  });

  it('should calculate correct contain/cover positioning for background layers', () => {
    // 800x600 canvas, 1600x1200 background image with cover fit
    const fitted = calculateFittedDimensions(800, 600, 1600, 1200, 'cover');
    expect(fitted.drawWidth).toBe(800);
    expect(fitted.drawHeight).toBe(600);
    expect(fitted.dx).toBe(0);
    expect(fitted.dy).toBe(0);
  });

  it('should calculate aspect ratio preserving contain fit with letterboxing', () => {
    // 800x800 canvas, 1600x800 (2:1 aspect) background with contain fit
    const fitted = calculateFittedDimensions(800, 800, 1600, 800, 'contain');
    expect(fitted.drawWidth).toBe(800);
    expect(fitted.drawHeight).toBe(400);
    expect(fitted.dx).toBe(0);
    expect(fitted.dy).toBe(200);
  });
});
