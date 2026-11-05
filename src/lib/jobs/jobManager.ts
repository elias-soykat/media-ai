import { prisma } from '@/lib/prisma';
import { APP_CONSTRAINTS } from '@/config/constraints';

export interface ParsedWebhookResult {
  jobId: string;
  status: 'COMPLETED' | 'FAILED' | 'PROCESSING';
  outputUrl?: string;
  errorMessage?: string;
}

export function parseWebhookPayload(payload: any): ParsedWebhookResult {
  const jobId = payload.job_id || payload.id || payload.requestId || '';
  const rawStatus = (payload.status || '').toLowerCase();

  let status: 'COMPLETED' | 'FAILED' | 'PROCESSING' = 'PROCESSING';
  if (rawStatus === 'completed' || rawStatus === 'succeeded' || rawStatus === 'success') {
    status = 'COMPLETED';
  } else if (rawStatus === 'failed' || rawStatus === 'error') {
    status = 'FAILED';
  }

  const outputUrl =
    payload.output?.url ||
    payload.output?.image_url ||
    payload.output?.audio_url ||
    payload.result_url ||
    payload.outputUrl;

  const errorMessage = payload.error || payload.error_message || payload.message;

  return {
    jobId,
    status,
    outputUrl,
    errorMessage,
  };
}

export async function completeJob(jobId: string, outputUrl: string) {
  const retentionHours = APP_CONSTRAINTS.storage.retentionHours;
  const expiresAt = new Date(Date.now() + retentionHours * 60 * 60 * 1000);

  // Atomic conditional update to prevent duplicate webhook delivery race conditions
  const updateResult = await prisma.job.updateMany({
    where: {
      id: jobId,
      status: { not: 'COMPLETED' },
    },
    data: {
      status: 'COMPLETED',
      outputUrl,
      expiresAt,
    },
  });

  return updateResult;
}

export async function failJob(jobId: string, errorMessage: string) {
  return prisma.job.updateMany({
    where: {
      id: jobId,
      status: { not: 'COMPLETED' },
    },
    data: {
      status: 'FAILED',
      errorMessage,
    },
  });
}
