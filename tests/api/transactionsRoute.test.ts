import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/account/transactions/route';
import { generateSessionToken } from '@/lib/auth/authService';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

describe('GET /api/account/transactions Route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 when no session cookie is provided', async () => {
    const req = new NextRequest('http://localhost:3000/api/account/transactions', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/Unauthorized/i);
  });

  it('should return transactions for authenticated user ordered by date', async () => {
    const token = generateSessionToken('u_txn_tester');
    const mockTxns = [
      {
        id: 'tx_1',
        userId: 'u_txn_tester',
        amount: 200,
        reason: 'Paddle purchase: txn_123 (pro)',
        createdAt: new Date('2026-11-05T10:00:00Z'),
      },
      {
        id: 'tx_2',
        userId: 'u_txn_tester',
        amount: -1,
        reason: 'AI Background Removal',
        createdAt: new Date('2026-11-05T10:05:00Z'),
      },
    ];

    vi.spyOn(prisma.creditTransaction, 'findMany').mockResolvedValueOnce(mockTxns as any);

    const req = new NextRequest('http://localhost:3000/api/account/transactions', {
      method: 'GET',
      headers: {
        cookie: `session_token=${token}`,
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transactions).toHaveLength(2);
    expect(json.transactions[0].amount).toBe(200);
    expect(json.transactions[1].amount).toBe(-1);
  });
});

