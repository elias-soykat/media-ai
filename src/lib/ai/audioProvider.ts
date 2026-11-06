/**
 * AI Audio Provider Adapter Layer
 * Provides unified interface across external audio isolation APIs and deterministic local mock.
 */

export interface AudioNoiseRemovalInput {
  audioUrl: string;
  durationSeconds: number;
  preset?: 'balanced' | 'aggressive' | 'subtle';
  apiKey?: string;
}

export interface AudioNoiseRemovalResult {
  success: boolean;
  outputAudioUrl?: string;
  format: string;
  error?: string;
}

/** Interface representing an audio noise isolation provider. */
export interface AudioAiProvider {
  providerName: string;
  removeNoise(options: AudioNoiseRemovalInput): Promise<AudioNoiseRemovalResult>;
}

/**
 * Mock provider for development, tests, and fallback with zero API cost.
 */
export class MockAudioAiProvider implements AudioAiProvider {
  public readonly providerName = 'mock';

  async removeNoise(options: AudioNoiseRemovalInput): Promise<AudioNoiseRemovalResult> {
    if (!options.audioUrl) {
      return {
        success: false,
        format: 'wav',
        error: 'Missing audioUrl input',
      };
    }

    // Preserve data URLs directly without breaking base64 encoding
    let outputAudioUrl = options.audioUrl;
    if (!options.audioUrl.startsWith('data:')) {
      outputAudioUrl = options.audioUrl.includes('?')
        ? `${options.audioUrl}&cleaned=true`
        : `${options.audioUrl.replace(/\.[a-zA-Z0-9]+$/, '')}_cleaned.wav`;
    }

    return {
      success: true,
      outputAudioUrl,
      format: 'wav',
    };
  }
}

/**
 * ElevenLabs Audio Isolation Provider
 */
export class ElevenLabsAudioProvider implements AudioAiProvider {
  public readonly providerName = 'elevenlabs';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY || '';
  }

  async removeNoise(options: AudioNoiseRemovalInput): Promise<AudioNoiseRemovalResult> {
    const key = options.apiKey || this.apiKey;
    if (!key) {
      return {
        success: false,
        format: 'wav',
        error: 'ElevenLabs API key not configured',
      };
    }

    try {
      const formData = new FormData();

      if (options.audioUrl.startsWith('data:')) {
        const base64Data = options.audioUrl.replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'audio/wav' });
        formData.append('audio', blob, 'audio.wav');
      } else {
        const remoteRes = await fetch(options.audioUrl);
        const blob = await remoteRes.blob();
        formData.append('audio', blob, 'audio.wav');
      }

      const response = await fetch('https://api.elevenlabs.io/v1/audio-isolation', {
        method: 'POST',
        headers: {
          'xi-api-key': key,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          format: 'wav',
          error: `ElevenLabs API error (${response.status}): ${errorText}`,
        };
      }

      const blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      const dataUrl = `data:audio/wav;base64,${buffer.toString('base64')}`;

      return {
        success: true,
        outputAudioUrl: dataUrl,
        format: 'wav',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        format: 'wav',
        error: `ElevenLabs network failure: ${message}`,
      };
    }
  }
}

/**
 * Factory function to resolve the active AI Audio Provider.
 */
export function getAudioAiProvider(providerName?: string): AudioAiProvider {
  const selected = providerName || process.env.AI_AUDIO_PROVIDER || 'mock';

  switch (selected.toLowerCase()) {
    case 'elevenlabs':
    case 'eleven_labs':
      return new ElevenLabsAudioProvider();
    case 'mock':
    default:
      return new MockAudioAiProvider();
  }
}

