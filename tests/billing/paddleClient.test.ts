// tests/billing/paddleClient.test.ts
import { describe, it, expect } from 'vitest';
import { CREDIT_PACKS, createPaddleCheckoutSession } from '@/lib/billing/paddleClient';

describe('Paddle Checkout Layer', () => {
  it('should define standard credit packages with volume discounts', () => {
    expect(CREDIT_PACKS.starter.credits).toBe(50);
    expect(CREDIT_PACKS.starter.priceUsd).toBe(5);
    expect(CREDIT_PACKS.pro.credits).toBe(200);
    expect(CREDIT_PACKS.pro.priceUsd).toBe(15);
    expect(CREDIT_PACKS.studio.credits).toBe(500);
    expect(CREDIT_PACKS.studio.priceUsd).toBe(30);
  });

  it('should generate a valid checkout session in test/mock mode', async () => {
    const session = await createPaddleCheckoutSession({
      userId: 'user_123',
      packId: 'pro',
      customerEmail: 'test@example.com',
    });
    expect(session.success).toBe(true);
    expect(session.checkoutUrl).toBeDefined();
    expect(session.checkoutUrl).toContain('checkout');
  });
});

