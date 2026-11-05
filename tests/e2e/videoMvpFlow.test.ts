// tests/e2e/videoMvpFlow.test.ts
import { describe, it, expect } from 'vitest';
import { validateTrimRange, calculateTrimmedDuration } from '@/lib/video/videoTrimmer';
import {
  calculateVideoCropRect,
  calculateVideoScaledDimensions,
  estimateCompressedVideoSize,
} from '@/lib/video/videoTransforms';
import { calculateAudioExtractionUnits } from '@/lib/video/audioRemuxer';
import { MockAudioAiProvider } from '@/lib/ai/audioProvider';

describe('Phase 3 Video MVP End-to-End Integration Suite', () => {
  it('should successfully chain trim validation, crop calculation, scale, and noise removal', async () => {
    // 1. Trimmer range validation
    const trim = validateTrimRange(10, 40, 120);
    expect(trim.isValid).toBe(true);
    const duration = calculateTrimmedDuration(10, 40);
    expect(duration).toBe(30);

    // 2. Crop to vertical 9:16
    const crop = calculateVideoCropRect(1920, 1080, '9:16');
    expect(crop.width).toBe(608);

    // 3. Scale down to 720p
    const scaled = calculateVideoScaledDimensions(1920, 1080, '720p');
    expect(scaled.width).toBe(1280);

    // 4. Estimate compressed file size
    const estBytes = estimateCompressedVideoSize(duration, '720p', 'medium');
    expect(estBytes).toBeGreaterThan(0);

    // 5. Calculate audio units (30s = 1 unit)
    const audioUnits = calculateAudioExtractionUnits(duration);
    expect(audioUnits.costCredits).toBe(1);

    // 6. AI Audio Noise Removal execution
    const provider = new MockAudioAiProvider();
    const result = await provider.removeNoise({
      audioUrl: 'https://example.com/audio.wav',
      durationSeconds: duration,
    });
    expect(result.success).toBe(true);
  });
});

