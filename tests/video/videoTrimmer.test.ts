// tests/video/videoTrimmer.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseTimestamp,
  formatTimestamp,
  validateTrimRange,
  calculateTrimmedDuration,
} from '@/lib/video/videoTrimmer';

describe('Video Trimmer Engine', () => {
  it('should format seconds into MM:SS and HH:MM:SS correctly', () => {
    expect(formatTimestamp(65)).toBe('01:05');
    expect(formatTimestamp(0)).toBe('00:00');
    expect(formatTimestamp(3665, true)).toBe('01:01:05');
  });

  it('should parse timestamp strings into float seconds accurately', () => {
    expect(parseTimestamp('01:05')).toBe(65);
    expect(parseTimestamp('01:01:05')).toBe(3665);
    expect(parseTimestamp('12.5')).toBe(12.5);
    expect(parseTimestamp('invalid')).toBe(0);
  });

  it('should validate trim ranges and reject inverted or out-of-bound times', () => {
    expect(validateTrimRange(0, 10, 60).isValid).toBe(true);
    // Inverted range
    expect(validateTrimRange(20, 10, 60).isValid).toBe(false);
    // Exceeds total duration
    expect(validateTrimRange(0, 70, 60).isValid).toBe(false);
    // Sub-minimum duration (< 0.5s)
    expect(validateTrimRange(10, 10.2, 60).isValid).toBe(false);
  });

  it('should calculate trimmed duration accurately', () => {
    expect(calculateTrimmedDuration(10.5, 25.2)).toBeCloseTo(14.7, 2);
  });
});
