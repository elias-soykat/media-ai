import { NextRequest, NextResponse } from 'next/server';
import {
  CREDIT_PACKS,
  CreditPackId,
  createPaddleCheckoutSession,
} from '@/lib/billing/paddleClient';
import { verifySessionToken } from '@/lib/auth/authService';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { packId, returnUrl } = body;

    if (!packId || !CREDIT_PACKS[packId as CreditPackId]) {
      return NextResponse.json(
        {
          error:
            'Invalid credit package. Valid choices are: starter, pro, studio',
        },
        { status: 400 }
      );
    }

    // Resolve authenticated user from session cookie or request payload
    let effectiveUserId = body.userId;
    let customerEmail = body.customerEmail;

    const sessionCookie = req.cookies.get('session_token')?.value;
    if (sessionCookie) {
      const session = verifySessionToken(sessionCookie);
      if (session?.userId) {
        effectiveUserId = session.userId;
      }
    }

    if (!effectiveUserId) {
      return NextResponse.json(
        {
          error:
            'Authentication required. Please sign in or register before purchasing credits.',
        },
        { status: 401 }
      );
    }

    // Attempt to enrich customer email if not explicitly provided
    if (!customerEmail && effectiveUserId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: effectiveUserId },
          select: { email: true },
        });
        if (user?.email) {
          customerEmail = user.email;
        }
      } catch {
        // Continue if DB unavailable
      }
    }

    const session = await createPaddleCheckoutSession({
      packId: packId as CreditPackId,
      userId: effectiveUserId,
      customerEmail,
      returnUrl,
    });

    return NextResponse.json(session, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown checkout error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
