import { describe, it, expect } from 'vitest';
import { validateMediaUpload } from '@/lib/validation/mediaValidator';
import { APP_CONSTRAINTS } from '@/config/constraints';

describe('Authoritative Media Validator', () => {
  it('should approve valid photo uploads within constraints', () => {
    const result = validateMediaUpload({
      mediaType: 'photo',
      fileSizeBytes: 5 * 1024 * 1024,
      mimeType: 'image/jpeg',
      dimensions: { width: 1920, height: 1080 },
    }, APP_CONSTRAINTS);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject photo exceeding 25MB file size limit', () => {
    const result = validateMediaUpload({
      mediaType: 'photo',
      fileSizeBytes: 26 * 1024 * 1024,
      mimeType: 'image/jpeg',
    }, APP_CONSTRAINTS);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Photo file size exceeds maximum limit of 25MB');
  });

  it('should reject video exceeding 180 seconds duration', () => {
    const result = validateMediaUpload({
      mediaType: 'video',
      fileSizeBytes: 50 * 1024 * 1024,
      mimeType: 'video/mp4',
      durationSeconds: 195,
    }, APP_CONSTRAINTS);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Video duration exceeds maximum limit of 180 seconds');
  });
});

