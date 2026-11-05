import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateSessionToken } from '@/lib/auth/authService';
import { prisma } from '@/lib/prisma';
import { APP_CONSTRAINTS } from '@/config/constraints';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const { combined } = hashPassword(password);

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const createdUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: combined,
        creditBalance: APP_CONSTRAINTS.billing.initialFreeCredits,
      },
    });

    const token = generateSessionToken(createdUser.id);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          creditBalance: createdUser.creditBalance,
        },
      },
      { status: 201 }
    );

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signup failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
