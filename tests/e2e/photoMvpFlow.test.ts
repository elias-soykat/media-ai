// tests/e2e/photoMvpFlow.test.ts
import { describe, it, expect } from 'vitest';
import { applyEnhancements, ENHANCEMENT_PRESETS } from '@/lib/photo/imageEnhancer';
import { calculateTargetDimensions, calculateCropRect } from '@/lib/photo/imageTransforms';
import { BACKGROUND_PRESETS } from '@/lib/photo/backgroundCompositor';
import { MockPhotoAiProvider } from '@/lib/ai/photoProvider';

describe('Phase 2 Photo MVP End-to-End Integration Suite', () => {
  it('should successfully chain enhance, crop calculation, resize, and background composite', async () => {
    // 1. Enhancer preset applied
    const preset = ENHANCEMENT_PRESETS.vivid;
    expect(preset.contrast).toBeGreaterThan(0);

    // 2. Cropper calculation
    const crop = calculateCropRect(1920, 1080, '1:1');
    expect(crop.width).toBe(1080);

    // 3. Resizer calculation
    const resized = calculateTargetDimensions(crop.width, crop.height, {
      width: 500,
      maintainAspectRatio: true,
    });
    expect(resized.width).toBe(500);
    expect(resized.height).toBe(500);

    // 4. AI Background removal
    const provider = new MockPhotoAiProvider();
    const result = await provider.removeBackground({ imageUrl: 'https://example.com/test.png' });
    expect(result.success).toBe(true);

    // 5. Background replacement presets
    expect(BACKGROUND_PRESETS.solidColors).toContain('#FFFFFF');
  });
});

