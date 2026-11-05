import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
} from '@/lib/auth/authService';
import {
  CREDIT_PACKS,
  createPaddleCheckoutSession,
} from '@/lib/billing/paddleClient';
import {
  generatePaddleWebhookSignature,
  verifyPaddleWebhookSignature,
} from '@/lib/billing/paddleWebhookValidator';
import { checkUserEligibility } from '@/lib/billing/entitlement';

describe('Phase 4 Monetization End-to-End Suite', () => {
  it('should successfully chain user auth, credit purchase, webhook verification, and entitlement', async () => {
    // 1. Password hashing & verification
    const { hash, salt } = hashPassword('TestPassword123!');
    expect(verifyPassword('TestPassword123!', hash, salt)).toBe(true);
    expect(verifyPassword('WrongPassword', hash, salt)).toBe(false);

    // 2. Session token signing and extraction
    const token = generateSessionToken('u_test_1');
    expect(verifySessionToken(token)?.userId).toBe('u_test_1');

    // 3. Paddle Checkout Session creation
    const checkout = await createPaddleCheckoutSession({
      userId: 'u_test_1',
      packId: 'pro',
      customerEmail: 'test@domain.com',
    });
    expect(checkout.success).toBe(true);
    expect(checkout.pack.credits).toBe(200);
    expect(checkout.checkoutUrl).toBeDefined();

    // 4. Webhook cryptographic HMAC-SHA256 signature verification
    const payload = JSON.stringify({
      event_type: 'transaction.completed',
      data: {
        id: 'txn_e2e_100',
        custom_data: { userId: 'u_test_1', credits: 200, packId: 'pro' },
      },
    });
    const secret = 'pdl_ntfset_secret_key_e2e';
    const sig = generatePaddleWebhookSignature(payload, secret);
    expect(verifyPaddleWebhookSignature(payload, sig, secret)).toBe(true);

    // 5. Entitlement resolution:
    // First run is free trial
    const freeEligibility = checkUserEligibility({
      user: { id: 'u_test_1', creditBalance: 0 },
      toolType: 'PHOTO_BG_REMOVER',
      completedJobsCountForTool: 0,
    });
    expect(freeEligibility.eligible).toBe(true);
    expect(freeEligibility.isFreeTrial).toBe(true);

    // Subsequent run after free trial exhausted consumes purchased credits
    const paidEligibility = checkUserEligibility({
      user: { id: 'u_test_1', creditBalance: 200 },
      toolType: 'PHOTO_BG_REMOVER',
      completedJobsCountForTool: 1, // Free trial already consumed
    });
    expect(paidEligibility.eligible).toBe(true);
    expect(paidEligibility.isFreeTrial).toBe(false);

    // If zero credits remaining after free trial exhausted, rejected with 402
    const exhaustedEligibility = checkUserEligibility({
      user: { id: 'u_test_1', creditBalance: 0 },
      toolType: 'PHOTO_BG_REMOVER',
      completedJobsCountForTool: 1,
    });
    expect(exhaustedEligibility.eligible).toBe(false);
    expect(exhaustedEligibility.error).toMatch(/Credit exhausted/i);
  });
});
