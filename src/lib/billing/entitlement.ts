import { APP_CONSTRAINTS } from '@/config/constraints';

export interface UserEligibilityInput {
  user: {
    id: string;
    creditBalance: number;
  } | null;
  toolType: string;
  completedJobsCountForTool: number;
}

export interface UserEligibilityResult {
  eligible: boolean;
  isFreeTrial: boolean;
  statusCode?: number;
  error?: string;
}

export function checkUserEligibility(input: UserEligibilityInput): UserEligibilityResult {
  const { user, toolType, completedJobsCountForTool } = input;

  // Browser-native tools are always free for everyone.
  const browserNativeTools = [
    'PHOTO_ENHANCER',
    'PHOTO_CROPPER',
    'PHOTO_RESIZER',
    'PHOTO_COMPRESSOR',
    'PHOTO_CONVERTER',
    'VIDEO_TRIMMER',
    'VIDEO_COMPRESSOR',
    'VIDEO_RESIZER',
    'VIDEO_CONVERTER',
  ];

  if (browserNativeTools.includes(toolType)) {
    return { eligible: true, isFreeTrial: false };
  }

  // AI-powered tools require a user account.
  if (!user) {
    return {
      eligible: false,
      isFreeTrial: false,
      statusCode: 401,
      error: 'Authentication required to access AI-powered editing features.',
    };
  }

  // Exactly 1 successful free run per feature per account.
  const freeTrialAllowance = APP_CONSTRAINTS.billing.initialFreeCredits;
  if (completedJobsCountForTool < freeTrialAllowance) {
    return { eligible: true, isFreeTrial: true };
  }

  // Otherwise, user must have enough credits
  let requiredCredits = 1;
  if (toolType === 'AUDIO_NOISE_REMOVER') {
    requiredCredits = APP_CONSTRAINTS.billing.costs.audioNoiseRemovalPer30s;
  } else if (toolType === 'PHOTO_BG_REMOVER') {
    requiredCredits = APP_CONSTRAINTS.billing.costs.photoBackgroundRemoval;
  } else if (toolType === 'PHOTO_BG_CHANGER') {
    requiredCredits = APP_CONSTRAINTS.billing.costs.photoBackgroundChanger;
  }

  if (user.creditBalance >= requiredCredits) {
    return { eligible: true, isFreeTrial: false };
  }

  return {
    eligible: false,
    isFreeTrial: false,
    statusCode: 402,
    error: `Credit exhausted. You have used your free trial for this feature and have ${user.creditBalance} credits. Purchase credits to continue.`,
  };
}

