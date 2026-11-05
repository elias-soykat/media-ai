import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/media/upload-url/route';
import { NextRequest } from 'next/server';

describe('POST /api/media/upload-url Entitlement & Size Tests', () => {
  it('should reject with 402 if user has exhausted free trial and has 0 credits', async () => {
    const req = new NextRequest('http://localhost:3000/api/media/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        mediaType: 'photo',
        fileSizeBytes: 5 * 1024 * 1024,
        mimeType: 'image/png',
        toolType: 'PHOTO_BG_REMOVER',
        userId: 'mock_exhausted_user',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(402);
    const json = await res.json();
    expect(json.error).toMatch(/Credit exhausted/);
  });

  it('should accept valid upload and return presigned url with 24h namespace', async () => {
    const req = new NextRequest('http://localhost:3000/api/media/upload-url', {
      method: 'POST',
      body: JSON.stringify({
        mediaType: 'photo',
        fileSizeBytes: 2 * 1024 * 1024,
        mimeType: 'image/jpeg',
        toolType: 'PHOTO_BG_REMOVER',
        userId: 'new_user_1',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.uploadUrl).toBeDefined();
    expect(json.key).toMatch(/^temp\/new_user_1\/PHOTO_BG_REMOVER\//);
    expect(json.isFreeTrial).toBe(true);
  });
});

