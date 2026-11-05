import { describe, it, expect } from 'vitest';
import { APP_CONSTRAINTS } from '@/config/constraints';

describe('APP_CONSTRAINTS Configuration', () => {
  it('should enforce the exact PRD photo constraints', () => {
    expect(APP_CONSTRAINTS.photo.maxFileSizeBytes).toBe(25 * 1024 * 1024);
    expect(APP_CONSTRAINTS.photo.maxDimensionPx).toBe(8192);
    expect(APP_CONSTRAINTS.photo.supportedMimeTypes).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('should enforce the exact PRD video constraints', () => {
    expect(APP_CONSTRAINTS.video.maxFileSizeBytes).toBe(100 * 1024 * 1024);
    expect(APP_CONSTRAINTS.video.maxDurationSeconds).toBe(180);
    expect(APP_CONSTRAINTS.video.maxResolution).toEqual({ width: 1920, height: 1080 });
    expect(APP_CONSTRAINTS.video.supportedMimeTypes).toEqual(['video/mp4', 'video/webm', 'video/quicktime']);
  });

  it('should define storage retention and billing defaults', () => {
    expect(APP_CONSTRAINTS.storage.retentionHours).toBe(24);
    expect(APP_CONSTRAINTS.billing.initialFreeCredits).toBe(1);
  });
});
