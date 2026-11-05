// tests/video/audioRemuxer.test.ts
import { describe, it, expect } from 'vitest';
import {
  calculateAudioExtractionUnits,
  AUDIO_CLEANING_PRESETS,
} from '@/lib/video/audioRemuxer';

describe('Audio Remuxing & Extraction Calculator', () => {
  it('should calculate 30-second billing units correctly (1 credit per 30s)', () => {
    expect(calculateAudioExtractionUnits(15)).toEqual({ units: 1, costCredits: 1 });
    expect(calculateAudioExtractionUnits(30)).toEqual({ units: 1, costCredits: 1 });
    expect(calculateAudioExtractionUnits(31)).toEqual({ units: 2, costCredits: 2 });
    expect(calculateAudioExtractionUnits(75)).toEqual({ units: 3, costCredits: 3 });
  });

  it('should provide standard noise removal presets', () => {
    expect(AUDIO_CLEANING_PRESETS).toHaveProperty('balanced');
    expect(AUDIO_CLEANING_PRESETS).toHaveProperty('aggressive');
    expect(AUDIO_CLEANING_PRESETS).toHaveProperty('subtle');
  });

  it('should handle zero or negative duration safely', () => {
    expect(calculateAudioExtractionUnits(0)).toEqual({ units: 0, costCredits: 0 });
    expect(calculateAudioExtractionUnits(-5)).toEqual({ units: 0, costCredits: 0 });
  });
});
