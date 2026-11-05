// tests/api/removeNoiseRoute.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/audio/remove-noise/route';
import { NextRequest } from 'next/server';

describe('POST /api/audio/remove-noise', () => {
  it('should reject unauthenticated requests without userId with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/audio/remove-noise', {
      method: 'POST',
      body: JSON.stringify({ audioUrl: 'https://r2.domain.com/temp/audio.wav', durationSeconds: 30 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should reject with 402 if user has exhausted free trial and has zero credits', async () => {
    const req = new NextRequest('http://localhost:3000/api/audio/remove-noise', {
      method: 'POST',
      body: JSON.stringify({
        audioUrl: 'https://r2.domain.com/temp/audio.wav',
        userId: 'mock_exhausted_user',
        durationSeconds: 30,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(402);
  });

  it('should process noise removal successfully for eligible user', async () => {
    const req = new NextRequest('http://localhost:3000/api/audio/remove-noise', {
      method: 'POST',
      body: JSON.stringify({
        audioUrl: 'https://r2.domain.com/temp/audio.wav',
        userId: 'new_video_user_1',
        durationSeconds: 30,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.outputAudioUrl).toBeDefined();
    expect(json.isFreeTrial).toBe(true);
  });
});

