import { describe, it, expect } from 'vitest';
import { CREDIT_PACKS } from '@/lib/billing/paddleClient';
import { APP_CONSTRAINTS } from '@/config/constraints';

describe('Pricing Page Plans', () => {
  it('should present all three PRD credit packages and free tier allowance', () => {
    expect(Object.keys(CREDIT_PACKS)).toEqual(['starter', 'pro', 'studio']);
    expect(CREDIT_PACKS.starter.credits).toBe(50);
    expect(CREDIT_PACKS.starter.priceUsd).toBe(5);
    expect(CREDIT_PACKS.pro.credits).toBe(200);
    expect(CREDIT_PACKS.pro.priceUsd).toBe(15);
    expect(CREDIT_PACKS.studio.credits).toBe(500);
    expect(CREDIT_PACKS.studio.priceUsd).toBe(30);
    expect(APP_CONSTRAINTS.billing.initialFreeCredits).toBe(1);
  });
});
