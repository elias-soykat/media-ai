// tests/ai/photoProvider.test.ts
import { describe, it, expect } from 'vitest';
import { getPhotoAiProvider, MockPhotoAiProvider } from '@/lib/ai/photoProvider';

describe('AI Photo Provider Adapter', () => {
  it('should return mock provider when configured or in test environment', () => {
    const provider = getPhotoAiProvider('mock');
    expect(provider).toBeInstanceOf(MockPhotoAiProvider);
    expect(provider.providerName).toBe('mock');
  });

  it('should execute mock background removal and return transparent cutout result', async () => {
    const provider = new MockPhotoAiProvider();
    const result = await provider.removeBackground({
      imageUrl: 'https://example.com/source.jpg',
    });
    expect(result.success).toBe(true);
    expect(result.outputUrl).toBeDefined();
    expect(result.format).toBe('png');
  });
});

