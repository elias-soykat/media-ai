import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/webhooks/paddle/route';
import { generatePaddleWebhookSignature } from '@/lib/billing/paddleWebhookValidator';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

describe('POST /api/webhooks/paddle Route', () => {
  const secret = process.env.PADDLE_WEBHOOK_SECRET || 'mock_paddle_webhook_secret';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

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

  it('should reject requests with expired timestamp beyond tolerance window', async () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago (> 300s)
    const payload = JSON.stringify({ event_type: 'transaction.completed' });
    const signature = generatePaddleWebhookSignature(payload, secret, oldTimestamp);

    const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
      method: 'POST',
      body: payload,
      headers: {
        'Paddle-Signature': signature,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should accept valid signature and credit user atomically for transaction.completed', async () => {
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

    vi.spyOn(prisma.creditTransaction, 'findUnique').mockResolvedValueOnce(null);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      id: 'test_user_paddle',
      email: 'test@example.com',
      passwordHash: 'dummy',
      creditBalance: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.spyOn(prisma, '$transaction').mockResolvedValueOnce([{} as any, {} as any]);

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

    // Mock existing transaction record found in Prisma by unique paddleTxnId
    vi.spyOn(prisma.creditTransaction, 'findUnique').mockResolvedValueOnce({
      id: 'txn_rec_1',
      userId: 'test_user_paddle',
      amount: 50,
      reason: 'Paddle purchase: txn_duplicate_789 (starter)',
      paddleTxnId: 'txn_duplicate_789',
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

  it('should return 500 when database transaction fails so Paddle will retry', async () => {
    const payload = JSON.stringify({
      event_type: 'transaction.completed',
      data: {
        id: 'txn_retry_999',
        custom_data: {
          userId: 'test_user_paddle',
          credits: 50,
        },
      },
    });

    const signature = generatePaddleWebhookSignature(payload, secret);

    vi.spyOn(prisma.creditTransaction, 'findUnique').mockRejectedValueOnce(
      new Error('Connection to database timed out')
    );

    const req = new NextRequest('http://localhost:3000/api/webhooks/paddle', {
      method: 'POST',
      body: payload,
      headers: {
        'Paddle-Signature': signature,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/Database credit fulfillment failed/i);
  });
});
