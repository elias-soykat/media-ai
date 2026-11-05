import { describe, it, expect } from 'vitest';
import { calculateAudioSampleCount } from '@/lib/audio/browserAudioExtractor';

describe('Audio Extractor Utility', () => {
  it('should correctly calculate expected audio buffer sample size for target duration and rate', () => {
    const sampleRate = 16000;
    const durationSeconds = 30;
    const samples = calculateAudioSampleCount(durationSeconds, sampleRate);
    expect(samples).toBe(480000);
  });
});

