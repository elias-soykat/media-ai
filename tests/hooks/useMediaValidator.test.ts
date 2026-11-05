import { describe, it, expect } from 'vitest';
import { validateFileLocally } from '@/hooks/useMediaValidator';
import { APP_CONSTRAINTS } from '@/config/constraints';

describe('Client Pre-Flight File Validator', () => {
  it('should flag unsupported mime types immediately before upload', () => {
    const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    const result = validateFileLocally(file, 'photo', APP_CONSTRAINTS);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/Unsupported format/);
  });

  it('should accept valid photo files within limits', () => {
    const file = new File(['valid image bytes'], 'portrait.jpg', { type: 'image/jpeg' });
    const result = validateFileLocally(file, 'photo', APP_CONSTRAINTS);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });
});
