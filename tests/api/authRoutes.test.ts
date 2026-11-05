import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as signupPost } from '@/app/api/auth/signup/route';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { GET as sessionGet } from '@/app/api/auth/session/route';
import { hashPassword, generateSessionToken } from '@/lib/auth/authService';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

describe('Auth API Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

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

  it('should create user and return session cookie on valid signup', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);
    vi.spyOn(prisma.user, 'create').mockResolvedValueOnce({
      id: 'usr_created_123',
      email: 'newuser@example.com',
      passwordHash: 'dummy',
      creditBalance: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newuser@example.com',
        password: 'ValidPassword123!',
      }),
    });

    const res = await signupPost(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.email).toBe('newuser@example.com');
    expect(res.headers.get('set-cookie')).toContain('session_token=');
  });

  it('should reject login with missing credentials', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: '', password: '' }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(400);
  });

  it('should verify password and return session cookie on valid login', async () => {
    const { combined } = hashPassword('MySecretPass123!');
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      id: 'usr_login_123',
      email: 'existing@example.com',
      passwordHash: combined,
      creditBalance: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'MySecretPass123!',
      }),
    });

    const res = await loginPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.id).toBe('usr_login_123');
    expect(res.headers.get('set-cookie')).toContain('session_token=');
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

  it('should return user from GET /api/auth/session when valid session cookie provided', async () => {
    const token = generateSessionToken('usr_session_active');
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce({
      id: 'usr_session_active',
      email: 'active@example.com',
      creditBalance: 12,
      createdAt: new Date(),
    } as any);

    const req = new NextRequest('http://localhost:3000/api/auth/session', {
      method: 'GET',
      headers: {
        cookie: `session_token=${token}`,
      },
    });

    const res = await sessionGet(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.authenticated).toBe(true);
    expect(json.user.email).toBe('active@example.com');
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
