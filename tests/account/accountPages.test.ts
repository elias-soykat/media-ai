import { describe, it, expect } from 'vitest';
import { APP_CONSTRAINTS } from '@/config/constraints';

describe('Account Dashboard Configuration', () => {
  it('should respect initial free credit rules in account initialization', () => {
    expect(APP_CONSTRAINTS.billing.initialFreeCredits).toBe(1);
  });
});
