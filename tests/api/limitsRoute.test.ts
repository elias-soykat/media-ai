import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/config/limits/route';

describe('GET /api/config/limits Route', () => {
  it('should return merged system constraints matching PRD limits', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.photo.maxFileSizeBytes).toBe(25 * 1024 * 1024);
    expect(data.photo.maxDimensionPx).toBe(8192);
    expect(data.video.maxFileSizeBytes).toBe(100 * 1024 * 1024);
    expect(data.video.maxDurationSeconds).toBe(180);
    expect(data.video.maxResolution).toEqual({ width: 1920, height: 1080 });
    expect(data.storage.retentionHours).toBe(24);
    expect(data.billing.initialFreeCredits).toBe(1);
    expect(data.billing.costs.photoBackgroundRemoval).toBe(1);
    expect(data.billing.costs.audioNoiseRemovalPer30s).toBe(1);
  });
});

