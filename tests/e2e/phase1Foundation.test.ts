import { describe, it, expect } from 'vitest';
import { APP_CONSTRAINTS } from '@/config/constraints';
import { validateMediaUpload } from '@/lib/validation/mediaValidator';
import { buildStorageKey } from '@/lib/storage/presignedUrls';
import { parseWebhookPayload } from '@/lib/jobs/jobManager';

describe('Phase 1 Foundation End-to-End Integration Flow', () => {
  it('should validate photo input, create storage key, and handle simulated webhook callback', () => {
    // 1. Pre-flight validation
    const validation = validateMediaUpload(
      {
        mediaType: 'photo',
        fileSizeBytes: 12 * 1024 * 1024,
        mimeType: 'image/png',
      },
      APP_CONSTRAINTS
    );
    expect(validation.isValid).toBe(true);

    // 2. Storage key generation
    const key = buildStorageKey({ userId: 'test_user', toolType: 'photo_bg_remover', extension: 'png' });
    expect(key).toContain('temp/test_user/photo_bg_remover/');

    // 3. Webhook handling
    const webhook = parseWebhookPayload({
      job_id: 'job_test_123',
      status: 'completed',
      output: { url: `https://r2.domain.com/${key}` },
    });
    expect(webhook.status).toBe('COMPLETED');
    expect(webhook.outputUrl).toContain(key);
  });
});

