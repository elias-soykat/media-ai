import { describe, it, expect } from 'vitest';
import { buildStorageKey } from '@/lib/storage/presignedUrls';

describe('R2 Storage Key Generation', () => {
  it('should generate properly partitioned transient storage keys with 24h namespace', () => {
    const key = buildStorageKey({ userId: 'user_123', toolType: 'photo_bg_remover', extension: 'png' });
    expect(key).toMatch(/^temp\/user_123\/photo_bg_remover\/[a-zA-Z0-9_-]+\.png$/);
  });
});
