import { describe, it, expect } from 'vitest';
import { POST as signupPost } from '@/app/api/auth/signup/route';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { GET as sessionGet } from '@/app/api/auth/session/route';
import { NextRequest } from 'next/server';

describe('Auth API Routes', () => {
  it('should validate signup payload and reject weak or missing fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'bademail', password: '123' }),
    });

    const res = await signupPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('should reject login with missing credentials', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '', password: '' }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(400);
  });

  it('should return session state from GET /api/auth/session', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/session', {
      method: 'GET',
    });

    const res = await sessionGet(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authenticated).toBe(false);
  });

  it('should clear cookies on POST /api/auth/logout', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/logout', {
      method: 'POST',
    });

    const res = await logoutPost(req);
    expect(res.status).toBe(200);
    const cookieHeader = res.headers.get('set-cookie');
    expect(cookieHeader).toContain('session_token=');
  });
});

