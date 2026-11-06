import { AppConstraints } from '@/types/constraints';

export const APP_CONSTRAINTS: AppConstraints = {
  photo: {
    maxFileSizeBytes: 25 * 1024 * 1024, // 25 MB
    maxDimensionPx: 8192,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  video: {
    maxFileSizeBytes: 100 * 1024 * 1024, // 100 MB
    maxDurationSeconds: 180, // 3 minutes
    maxResolution: { width: 1920, height: 1080 }, // 1080p
    supportedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
  audio: {
    maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
    supportedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp4'],
  },
  storage: {
    retentionHours: 24, // 24 hours retention.
    signedUrlExpirySeconds: 3600, // 1 hour validity.
  },
  billing: {
    initialFreeCredits: 1, // Exactly 1 successful free run per feature.
    costs: {
      photoBackgroundRemoval: 1,
      photoBackgroundChanger: 1,
      audioNoiseRemovalPer30s: 1,
    },
  },
  rateLimits: {
    freeJobsPerHour: 10,
    paidJobsPerHour: 120,
  },
};

