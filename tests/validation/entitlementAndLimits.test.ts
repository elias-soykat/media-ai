import { describe, it, expect } from 'vitest';
import { checkUserEligibility } from '@/lib/billing/entitlement';
import { isJobExpired, formatTimeRemaining } from '@/lib/jobs/expiry';

describe('Entitlement and Credit Gatekeeper (Review Focus #3)', () => {
  it('should allow first-time usage as free trial for registered user', () => {
    const result = checkUserEligibility({
      user: { id: 'u1', creditBalance: 0 },
      toolType: 'PHOTO_BG_REMOVER',
      completedJobsCountForTool: 0,
    });
    expect(result.eligible).toBe(true);
    expect(result.isFreeTrial).toBe(true);
  });

  it('should allow usage if user has completed runs but has positive credit balance', () => {
    const result = checkUserEligibility({
      user: { id: 'u1', creditBalance: 5 },
      toolType: 'PHOTO_BG_REMOVER',
      completedJobsCountForTool: 1,
    });
    expect(result.eligible).toBe(true);
    expect(result.isFreeTrial).toBe(false);
  });

  it('should reject with PAYMENT_REQUIRED if free trial was already used and user has 0 credits', () => {
    const result = checkUserEligibility({
      user: { id: 'u1', creditBalance: 0 },
      toolType: 'PHOTO_BG_REMOVER',
      completedJobsCountForTool: 1,
    });
    expect(result.eligible).toBe(false);
    expect(result.statusCode).toBe(402);
    expect(result.error).toMatch(/Credit exhausted/);
  });
});

describe('Job Retention Expiry Logic (Review Focus #5)', () => {
  it('should identify expired jobs correctly', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
    expect(isJobExpired(pastDate)).toBe(true);
  });

  it('should identify active jobs correctly', () => {
    const futureDate = new Date(Date.now() + 3600 * 1000 * 20); // 20 hours in future
    expect(isJobExpired(futureDate)).toBe(false);
    expect(formatTimeRemaining(futureDate)).toMatch(/Expires in 20h/);
  });
});

