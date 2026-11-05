/**
 * AI Photo Provider Adapter Layer
 * Provides unified interface across remove.bg, fal.ai (BiRefNet), and local mock provider.
 */

export interface BackgroundRemovalInput {
  imageUrl: string;
  apiKey?: string;
  format?: 'png' | 'webp';
  size?: 'preview' | 'full' | 'auto';
}

export interface BackgroundRemovalResult {
  success: boolean;
  outputUrl?: string;
  format: string;
  error?: string;
}

export interface PhotoAiProvider {
  providerName: string;
  removeBackground(options: BackgroundRemovalInput): Promise<BackgroundRemovalResult>;
}

/**
 * Mock provider for unit tests, development, and fallback.
 * Generates deterministic output without incurring external API costs.
 */
export class MockPhotoAiProvider implements PhotoAiProvider {
  public readonly providerName = 'mock';

  async removeBackground(options: BackgroundRemovalInput): Promise<BackgroundRemovalResult> {
    if (!options.imageUrl) {
      return {
        success: false,
        format: options.format || 'png',
        error: 'Missing imageUrl input',
      };
    }

    // In mock mode, construct a mock cutout URL pointing to the transparent variant
    const outputUrl = options.imageUrl.includes('?')
      ? `${options.imageUrl}&cutout=true`
      : `${options.imageUrl.replace(/\.[a-zA-Z0-9]+$/, '')}_cutout.png`;

    return {
      success: true,
      outputUrl,
      format: options.format || 'png',
    };
  }
}

/**
 * remove.bg Provider implementation
 */
export class RemoveBgProvider implements PhotoAiProvider {
  public readonly providerName = 'remove.bg';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REMOVE_BG_API_KEY || '';
  }

  async removeBackground(options: BackgroundRemovalInput): Promise<BackgroundRemovalResult> {
    const key = options.apiKey || this.apiKey;
    if (!key) {
      return {
        success: false,
        format: options.format || 'png',
        error: 'remove.bg API key not configured',
      };
    }

    try {
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: options.imageUrl,
          size: options.size || 'auto',
          format: options.format || 'png',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          format: options.format || 'png',
          error: `remove.bg API error (${response.status}): ${errorText}`,
        };
      }

      // Convert binary output or handle response
      const blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;

      return {
        success: true,
        outputUrl: dataUrl,
        format: options.format || 'png',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        format: options.format || 'png',
        error: `remove.bg network failure: ${message}`,
      };
    }
  }
}

/**
 * fal.ai (BiRefNet) Provider implementation
 */
export class FalAiProvider implements PhotoAiProvider {
  public readonly providerName = 'fal.ai';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FAL_KEY || '';
  }

  async removeBackground(options: BackgroundRemovalInput): Promise<BackgroundRemovalResult> {
    const key = options.apiKey || this.apiKey;
    if (!key) {
      return {
        success: false,
        format: options.format || 'png',
        error: 'fal.ai API key not configured',
      };
    }

    try {
      const response = await fetch('https://queue.fal.run/fal-ai/birefnet', {
        method: 'POST',
        headers: {
          Authorization: `Key ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: options.imageUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          format: options.format || 'png',
          error: `fal.ai API error (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();
      const outputUrl = data.image?.url || data.output?.url;

      if (!outputUrl) {
        return {
          success: false,
          format: options.format || 'png',
          error: 'No image output returned by fal.ai',
        };
      }

      return {
        success: true,
        outputUrl,
        format: options.format || 'png',
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        format: options.format || 'png',
        error: `fal.ai network failure: ${message}`,
      };
    }
  }
}

/**
 * Factory function to resolve the active AI Photo Provider.
 * Defaults to 'mock' if unspecified or during test runs.
 */
export function getPhotoAiProvider(providerName?: string): PhotoAiProvider {
  const selected = providerName || process.env.AI_PHOTO_PROVIDER || 'mock';

  switch (selected.toLowerCase()) {
    case 'remove.bg':
    case 'removebg':
      return new RemoveBgProvider();
    case 'fal':
    case 'fal.ai':
      return new FalAiProvider();
    case 'mock':
    default:
      return new MockPhotoAiProvider();
  }
}

