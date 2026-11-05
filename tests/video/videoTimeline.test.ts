// tests/video/videoTimeline.test.ts
import { describe, it, expect } from 'vitest';
import { calculateHandlePositions } from '@/components/video/VideoTimeline';

describe('Video Timeline Component Logic', () => {
  it('should calculate percentage positions for start and end trim handles', () => {
    // 60s total, start at 15s, end at 45s
    const { startPct, endPct } = calculateHandlePositions(15, 45, 60);
    expect(startPct).toBe(25);
    expect(endPct).toBe(75);
  });

  it('should handle zero duration gracefully', () => {
    const { startPct, endPct } = calculateHandlePositions(0, 0, 0);
    expect(startPct).toBe(0);
    expect(endPct).toBe(100);
  });
});

