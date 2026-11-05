import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/webhooks/paddle/route';
import { generatePaddleWebhookSignature } from '@/lib/billing/paddleWebhookValidator';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

describe('POST /api/webhooks/paddle Route', () => {
  const secret = process.env.PADDLE_WEBHOOK_SECRET || 'mock_paddle_webhook_secret';

  it('should reject requests with missing or invalid signature header', async () => {
    const payload = JSON.stringify({ event_type: 'transaction.completed' });
    const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
      method: 'POST',
      body: payload,
      headers: {
        'Paddle-Signature': 'ts=1000;h1=invalidhash',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid webhook signature/i);
  });

  it('should accept valid signature and credit user for transaction.completed', async () => {
    const payload = JSON.stringify({
      event_type: 'transaction.completed',
      data: {
        id: 'txn_test_456',
        custom_data: {
          userId: 'test_user_paddle',
          credits: 200,
          packId: 'pro',
        },
      },
    });

    const signature = generatePaddleWebhookSignature(payload, secret);

    const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
      method: 'POST',
      body: payload,
      headers: {
        'Paddle-Signature': signature,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('success');
    expect(json.credited).toBe(200);
  });

  it('should be idempotent and prevent duplicate credits on webhook replay', async () => {
    const payload = JSON.stringify({
      event_type: 'transaction.completed',
      data: {
        id: 'txn_duplicate_789',
        custom_data: {
          userId: 'test_user_paddle',
          credits: 50,
        },
      },
    });

    const signature = generatePaddleWebhookSignature(payload, secret);

    // Mock existing transaction record found in Prisma
    vi.spyOn(prisma.creditTransaction, 'findFirst').mockResolvedValueOnce({
      id: 'txn_rec_1',
      userId: 'test_user_paddle',
      amount: 50,
      reason: 'Paddle purchase: txn_duplicate_789 (starter)',
      createdAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
      method: 'POST',
      body: payload,
      headers: {
        'Paddle-Signature': signature,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('already_processed');
    expect(json.message).toMatch(/already credited/i);
  });
});
