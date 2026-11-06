'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppConstraints } from '@/types/constraints';
import { APP_CONSTRAINTS } from '@/config/constraints';

export interface LocalValidationResult {
  isValid: boolean;
  error: string | null;
}

/** Validates media files locally on the client before initiating upload. */
export function validateFileLocally(
  file: File,
  mediaType: 'photo' | 'video' | 'audio',
  constraints: AppConstraints = APP_CONSTRAINTS
): LocalValidationResult {
  const mime = file.type || '';
  const size = file.size;

  if (mediaType === 'photo') {
    const maxMb = Math.round(constraints.photo.maxFileSizeBytes / (1024 * 1024));
    if (!constraints.photo.supportedMimeTypes.includes(mime)) {
      return {
        isValid: false,
        error: `Unsupported format (${mime || 'unknown'}). Supported: ${constraints.photo.supportedMimeTypes.join(', ')}`,
      };
    }
    if (size > constraints.photo.maxFileSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds the ${maxMb}MB limit.`,
      };
    }
  } else if (mediaType === 'video') {
    const maxMb = Math.round(constraints.video.maxFileSizeBytes / (1024 * 1024));
    if (!constraints.video.supportedMimeTypes.includes(mime)) {
      return {
        isValid: false,
        error: `Unsupported format (${mime || 'unknown'}). Supported: ${constraints.video.supportedMimeTypes.join(', ')}`,
      };
    }
    if (size > constraints.video.maxFileSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds the ${maxMb}MB limit.`,
      };
    }
  } else if (mediaType === 'audio') {
    const maxMb = Math.round(constraints.audio.maxFileSizeBytes / (1024 * 1024));
    if (!constraints.audio.supportedMimeTypes.includes(mime)) {
      return {
        isValid: false,
        error: `Unsupported format (${mime || 'unknown'}). Supported: ${constraints.audio.supportedMimeTypes.join(', ')}`,
      };
    }
    if (size > constraints.audio.maxFileSizeBytes) {
      return {
        isValid: false,
        error: `File size exceeds the ${maxMb}MB limit.`,
      };
    }
  }

  return { isValid: true, error: null };
}

export function inspectVideoMetadata(
  file: File
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return resolve({ duration: 0, width: 0, height: 0 });
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read video metadata'));
    };
  });
}

export function useMediaValidator(mediaType: 'photo' | 'video' | 'audio') {
  const [constraints, setConstraints] = useState<AppConstraints>(APP_CONSTRAINTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDynamicLimits() {
      try {
        setLoading(true);
        const res = await fetch('/api/config/limits');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setConstraints(data);
        }
      } catch {
        // Fall back to built-in APP_CONSTRAINTS
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDynamicLimits();
    return () => {
      isMounted = false;
    };
  }, []);

  const validate = useCallback(
    (file: File) => validateFileLocally(file, mediaType, constraints),
    [mediaType, constraints]
  );

  return { constraints, loading, validate, inspectVideoMetadata };
}

