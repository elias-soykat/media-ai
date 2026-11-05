import { describe, it, expect } from 'vitest';
import { parseWebhookPayload } from '@/lib/jobs/jobManager';

describe('AI Provider Webhook Parser', () => {
  it('should parse completed provider job and extract result url', () => {
    const rawPayload = {
      job_id: 'job_xyz123',
      status: 'completed',
      output: { url: 'https://r2.domain.com/temp/result.png' },
    };
    const parsed = parseWebhookPayload(rawPayload);
    expect(parsed.jobId).toBe('job_xyz123');
    expect(parsed.status).toBe('COMPLETED');
    expect(parsed.outputUrl).toBe('https://r2.domain.com/temp/result.png');
  });

  it('should parse failed provider job and capture error reason', () => {
    const rawPayload = {
      job_id: 'job_fail456',
      status: 'failed',
      error: 'Subject segmentation ambiguous',
    };
    const parsed = parseWebhookPayload(rawPayload);
    expect(parsed.jobId).toBe('job_fail456');
    expect(parsed.status).toBe('FAILED');
    expect(parsed.errorMessage).toBe('Subject segmentation ambiguous');
  });
});
