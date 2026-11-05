import { AppConstraints, MediaResolution } from '@/types/constraints';
import { APP_CONSTRAINTS } from '@/config/constraints';

export interface MediaUploadValidationInput {
  mediaType: 'photo' | 'video' | 'audio';
  fileSizeBytes: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  durationSeconds?: number;
  resolution?: MediaResolution;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateMediaUpload(
  payload: MediaUploadValidationInput,
  constraints: AppConstraints = APP_CONSTRAINTS
): ValidationResult {
  const errors: string[] = [];
  const { mediaType, fileSizeBytes, mimeType, dimensions, durationSeconds, resolution } = payload;

  if (mediaType === 'photo') {
    const maxMb = Math.round(constraints.photo.maxFileSizeBytes / (1024 * 1024));
    if (fileSizeBytes > constraints.photo.maxFileSizeBytes) {
      errors.push(`Photo file size exceeds maximum limit of ${maxMb}MB`);
    }

    if (!constraints.photo.supportedMimeTypes.includes(mimeType)) {
      errors.push(`Unsupported photo format: ${mimeType}. Supported formats: ${constraints.photo.supportedMimeTypes.join(', ')}`);
    }

    if (dimensions) {
      if (
        dimensions.width > constraints.photo.maxDimensionPx ||
        dimensions.height > constraints.photo.maxDimensionPx
      ) {
        errors.push(`Photo dimensions exceed maximum limit of ${constraints.photo.maxDimensionPx}px`);
      }
    }
  } else if (mediaType === 'video') {
    const maxMb = Math.round(constraints.video.maxFileSizeBytes / (1024 * 1024));
    if (fileSizeBytes > constraints.video.maxFileSizeBytes) {
      errors.push(`Video file size exceeds maximum limit of ${maxMb}MB`);
    }

    if (!constraints.video.supportedMimeTypes.includes(mimeType)) {
      errors.push(`Unsupported video format: ${mimeType}. Supported formats: ${constraints.video.supportedMimeTypes.join(', ')}`);
    }

    if (durationSeconds !== undefined && durationSeconds > constraints.video.maxDurationSeconds) {
      errors.push(`Video duration exceeds maximum limit of ${constraints.video.maxDurationSeconds} seconds`);
    }

    if (resolution) {
      if (
        resolution.width > constraints.video.maxResolution.width ||
        resolution.height > constraints.video.maxResolution.height
      ) {
        errors.push(`Video resolution exceeds maximum limit of 1080p (${constraints.video.maxResolution.width}x${constraints.video.maxResolution.height})`);
      }
    }
  } else if (mediaType === 'audio') {
    const maxMb = Math.round(constraints.audio.maxFileSizeBytes / (1024 * 1024));
    if (fileSizeBytes > constraints.audio.maxFileSizeBytes) {
      errors.push(`Audio file size exceeds maximum limit of ${maxMb}MB`);
    }

    if (!constraints.audio.supportedMimeTypes.includes(mimeType)) {
      errors.push(`Unsupported audio format: ${mimeType}. Supported formats: ${constraints.audio.supportedMimeTypes.join(', ')}`);
    }
  } else {
    errors.push(`Unsupported media category: ${mediaType}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

