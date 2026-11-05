import { describe, it, expect } from 'vitest';
import { applyEnhancements, ENHANCEMENT_PRESETS, clampPixel } from '@/lib/photo/imageEnhancer';

describe('Image Enhancer Engine', () => {
  it('should clamp pixel values strictly between 0 and 255', () => {
    expect(clampPixel(260)).toBe(255);
    expect(clampPixel(-15)).toBe(0);
    expect(clampPixel(128)).toBe(128);
  });

  it('should apply brightness adjustments correctly to RGBA channels without touching alpha', () => {
    // 1x1 image: RGBA(100, 100, 100, 255)
    const rawData = new Uint8ClampedArray([100, 100, 100, 255]);
    const mockImageData = {
      data: rawData,
      width: 1,
      height: 1,
    } as ImageData;

    const enhanced = applyEnhancements(mockImageData, { brightness: 20 });
    // brightness delta is 20: 100 + 20 = 120
    expect(enhanced.data[0]).toBe(120);
    expect(enhanced.data[1]).toBe(120);
    expect(enhanced.data[2]).toBe(120);
    expect(enhanced.data[3]).toBe(255); // Alpha preserved
  });

  it('should include all required PRD presets', () => {
    const presetNames = Object.keys(ENHANCEMENT_PRESETS);
    expect(presetNames).toContain('vivid');
    expect(presetNames).toContain('warm');
    expect(presetNames).toContain('cool');
    expect(presetNames).toContain('studio');
    expect(presetNames).toContain('bw');
  });
});
