// tests/api/removeBackgroundRoute.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/photo/remove-background/route';
import { NextRequest } from 'next/server';

describe('POST /api/photo/remove-background', () => {
  it('should reject unauthenticated requests without userId with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/photo/remove-background', {
      method: 'POST',
      body: JSON.stringify({ imageUrl: 'https://r2.domain.com/temp/photo.jpg' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should reject with 402 if user has exhausted free trial and has zero credits', async () => {
    const req = new NextRequest('http://localhost:3000/api/photo/remove-background', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl: 'https://r2.domain.com/temp/photo.jpg',
        userId: 'mock_exhausted_user',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(402);
  });

  it('should process background removal successfully for eligible user', async () => {
    const req = new NextRequest('http://localhost:3000/api/photo/remove-background', {
      method: 'POST',
      body: JSON.stringify({
        imageUrl: 'https://r2.domain.com/temp/photo.jpg',
        userId: 'new_user_1',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.outputUrl).toBeDefined();
    expect(json.isFreeTrial).toBe(true);
  });
});

