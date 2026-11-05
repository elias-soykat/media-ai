import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/billing/checkout/route';
import { NextRequest } from 'next/server';

describe('POST /api/billing/checkout Route', () => {
  it('should return 400 if packId is missing or invalid', async () => {
    const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ packId: 'invalid_tier' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid credit package/i);
  });

  it('should return 200 and checkoutUrl for valid packId', async () => {
    const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packId: 'pro',
        userId: 'usr_test_123',
        customerEmail: 'customer@example.com',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.checkoutUrl).toBeDefined();
    expect(json.checkoutUrl).toContain('checkout');
    expect(json.transactionId).toBeDefined();
    expect(json.pack.credits).toBe(200);
  });

  it('should return 401 if user is not authenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({
        packId: 'pro',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/Authentication required/i);
  });
});

