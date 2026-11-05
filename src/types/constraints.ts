export interface MediaResolution {
  width: number;
  height: number;
}

export interface PhotoConstraints {
  maxFileSizeBytes: number;
  maxDimensionPx: number;
  supportedMimeTypes: string[];
}

export interface VideoConstraints {
  maxFileSizeBytes: number;
  maxDurationSeconds: number;
  maxResolution: MediaResolution;
  supportedMimeTypes: string[];
}

export interface AudioConstraints {
  maxFileSizeBytes: number;
  supportedMimeTypes: string[];
}

export interface StorageConstraints {
  retentionHours: number;
  signedUrlExpirySeconds: number;
}

export interface BillingCosts {
  photoBackgroundRemoval: number;
  photoBackgroundChanger: number;
  audioNoiseRemovalPer30s: number;
}

export interface BillingConstraints {
  initialFreeCredits: number;
  costs: BillingCosts;
}

export interface RateLimits {
  freeJobsPerHour: number;
  paidJobsPerHour: number;
}

export interface AppConstraints {
  photo: PhotoConstraints;
  video: VideoConstraints;
  audio: AudioConstraints;
  storage: StorageConstraints;
  billing: BillingConstraints;
  rateLimits: RateLimits;
}

