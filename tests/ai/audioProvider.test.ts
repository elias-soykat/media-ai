// tests/ai/audioProvider.test.ts
import { describe, it, expect } from 'vitest';
import { getAudioAiProvider, MockAudioAiProvider } from '@/lib/ai/audioProvider';

describe('AI Audio Provider Adapter', () => {
  it('should return mock audio provider when configured or in test environment', () => {
    const provider = getAudioAiProvider('mock');
    expect(provider).toBeInstanceOf(MockAudioAiProvider);
    expect(provider.providerName).toBe('mock');
  });

  it('should execute mock noise removal and return cleaned audio URL', async () => {
    const provider = new MockAudioAiProvider();
    const result = await provider.removeNoise({
      audioUrl: 'https://example.com/audio.wav',
      durationSeconds: 30,
    });
    expect(result.success).toBe(true);
    expect(result.outputAudioUrl).toBeDefined();
    expect(result.format).toBe('wav');
  });

  it('should preserve base64 data URLs without appending invalid file extensions in mock mode', async () => {
    const provider = new MockAudioAiProvider();
    const dataUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    const result = await provider.removeNoise({
      audioUrl: dataUrl,
      durationSeconds: 15,
    });
    expect(result.success).toBe(true);
    expect(result.outputAudioUrl).toBe(dataUrl);
  });
});

