import { NextRequest, NextResponse } from 'next/server';
import {
  CREDIT_PACKS,
  CreditPackId,
  createPaddleCheckoutSession,
} from '@/lib/billing/paddleClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { packId, userId, customerEmail, returnUrl } = body;

    if (!packId || !CREDIT_PACKS[packId as CreditPackId]) {
      return NextResponse.json(
        {
          error:
            'Invalid credit package. Valid choices are: starter, pro, studio',
        },
        { status: 400 }
      );
    }

    const session = await createPaddleCheckoutSession({
      packId: packId as CreditPackId,
      userId,
      customerEmail,
      returnUrl,
    });

    return NextResponse.json(session, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown checkout error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

