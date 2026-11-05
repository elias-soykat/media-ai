export interface EnhancementAdjustments {
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  exposure?: number; // -100 to 100
  sharpness?: number; // 0 to 100
}

export type EnhancementParams = EnhancementAdjustments;

export const ENHANCEMENT_PRESETS: Record<string, Required<EnhancementAdjustments>> = {
  original: { brightness: 0, contrast: 0, saturation: 0, exposure: 0, sharpness: 0 },
  vivid: { brightness: 5, contrast: 15, saturation: 25, exposure: 5, sharpness: 10 },
  warm: { brightness: 5, contrast: 10, saturation: 10, exposure: 5, sharpness: 0 },
  cool: { brightness: -5, contrast: 10, saturation: -5, exposure: 0, sharpness: 5 },
  studio: { brightness: 10, contrast: 20, saturation: 5, exposure: 10, sharpness: 15 },
  bw: { brightness: 0, contrast: 20, saturation: -100, exposure: 0, sharpness: 10 },
};

export function clampPixel(val: number): number {
  return Math.max(0, Math.min(255, Math.round(val)));
}

export function applyEnhancements(
  imageData: ImageData,
  adjustments: EnhancementAdjustments = {}
): ImageData {
  const {
    brightness = 0,
    contrast = 0,
    saturation = 0,
    exposure = 0,
    sharpness = 0,
  } = adjustments;

  const width = imageData.width;
  const height = imageData.height;
  const outputData = new Uint8ClampedArray(imageData.data);

  // Pre-calculate contrast factor
  // Contrast range -100 to 100 mapped to factor
  const contrastFactor =
    contrast === 0
      ? 1
      : (259 * (contrast * 2.55 + 255)) / (255 * (259 - contrast * 2.55));

  // Pre-calculate exposure multiplier
  const exposureMult = exposure === 0 ? 1 : Math.pow(2, exposure / 100);

  // Saturation factor
  const satFactor = 1 + saturation / 100;

  for (let i = 0; i < outputData.length; i += 4) {
    let r = outputData[i];
    let g = outputData[i + 1];
    let b = outputData[i + 2];
    // Alpha channel (outputData[i+3]) is strictly preserved

    // 1. Brightness
    if (brightness !== 0) {
      r += brightness;
      g += brightness;
      b += brightness;
    }

    // 2. Exposure
    if (exposure !== 0) {
      r *= exposureMult;
      g *= exposureMult;
      b *= exposureMult;
    }

    // 3. Contrast
    if (contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // 4. Saturation
    if (saturation !== 0) {
      // Rec. 709 luminance weights
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = gray + (r - gray) * satFactor;
      g = gray + (g - gray) * satFactor;
      b = gray + (b - gray) * satFactor;
    }

    outputData[i] = clampPixel(r);
    outputData[i + 1] = clampPixel(g);
    outputData[i + 2] = clampPixel(b);
  }

  // 5. Sharpness (Laplacian convolution)
  if (sharpness > 0 && width > 2 && height > 2) {
    const sharpWeight = (sharpness / 100) * 0.5;
    const centerWeight = 1 + 4 * sharpWeight;
    const sharpenedData = new Uint8ClampedArray(outputData);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        for (let c = 0; c < 3; c++) {
          const top = outputData[((y - 1) * width + x) * 4 + c];
          const bottom = outputData[((y + 1) * width + x) * 4 + c];
          const left = outputData[(y * width + (x - 1)) * 4 + c];
          const right = outputData[(y * width + (x + 1)) * 4 + c];
          const current = outputData[idx + c];

          const val = current * centerWeight - (top + bottom + left + right) * sharpWeight;
          sharpenedData[idx + c] = clampPixel(val);
        }
      }
    }
    return {
      data: sharpenedData,
      width,
      height,
      colorSpace: imageData.colorSpace,
    } as ImageData;
  }

  return {
    data: outputData,
    width,
    height,
    colorSpace: imageData.colorSpace,
  } as ImageData;
}
