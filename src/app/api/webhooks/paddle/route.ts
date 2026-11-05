import { NextRequest, NextResponse } from 'next/server';
import { verifyPaddleWebhookSignature } from '@/lib/billing/paddleWebhookValidator';
import { prisma } from '@/lib/prisma';

const MAX_WEBHOOK_TOLERANCE_SECONDS = 300; // 5 minutes tolerance to reject replay attacks

export async function POST(req: NextRequest) {
  try {
    const signatureHeader =
      req.headers.get('Paddle-Signature') ||
      req.headers.get('paddle-signature') ||
      '';

    const rawBody = await req.text();
    const configuredSecret = process.env.PADDLE_WEBHOOK_SECRET;

    if (!configuredSecret && process.env.NODE_ENV === 'production') {
      console.error(
        'CRITICAL: PADDLE_WEBHOOK_SECRET environment variable is missing in production.'
      );
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const secret = configuredSecret || 'mock_paddle_webhook_secret';

    const isValid = verifyPaddleWebhookSignature(
      rawBody,
      signatureHeader,
      secret,
      MAX_WEBHOOK_TOLERANCE_SECONDS
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature or expired timestamp' },
        { status: 401 }
      );
    }

    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const eventType = payload.event_type || payload.alert_name;

    // We only grant credits on completed transactions / successful payments
    if (
      eventType !== 'transaction.completed' &&
      eventType !== 'transaction.paid' &&
      eventType !== 'payment_succeeded'
    ) {
      return NextResponse.json(
        { status: 'ignored', message: `Unhandled event type: ${eventType}` },
        { status: 200 }
      );
    }

    const data = payload.data || payload;
    const txnId = data.id || data.order_id || data.p_order_id || 'txn_unknown';

    let customData = data.custom_data || {};
    if (typeof customData === 'string') {
      try {
        customData = JSON.parse(customData);
      } catch {
        customData = {};
      }
    }

    const userId = customData.userId || customData.user_id;
    const credits = Number(customData.credits) || 0;
    const packId = customData.packId || 'pack';

    if (!userId || credits <= 0) {
      return NextResponse.json(
        {
          status: 'acknowledged',
          message: 'No credits or user attached to transaction',
        },
        { status: 200 }
      );
    }

    // Authoritative idempotency check & atomic balance credit
    try {
      // 1. Check if this transaction was already credited using unique paddleTxnId
      const existingTxn = await prisma.creditTransaction.findUnique({
        where: { paddleTxnId: txnId },
      });

      if (existingTxn) {
        return NextResponse.json(
          {
            status: 'already_processed',
            message: 'Transaction already credited',
          },
          { status: 200 }
        );
      }

      // 2. Look up the recipient user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        // Fail so webhook can be retried or investigated
        return NextResponse.json(
          { error: `User not found: ${userId}` },
          { status: 404 }
        );
      }

      // 3. Atomically increment user credit balance and record credit transaction
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            creditBalance: {
              increment: credits,
            },
          },
        }),
        prisma.creditTransaction.create({
          data: {
            userId,
            amount: credits,
            reason: `Paddle purchase: ${txnId} (${packId})`,
            paddleTxnId: txnId,
          },
        }),
      ]);

      return NextResponse.json(
        {
          status: 'success',
          credited: credits,
          transactionId: txnId,
          userId,
        },
        { status: 200 }
      );
    } catch (dbErr: any) {
      // Handle concurrent race condition gracefully if unique constraint is triggered
      if (dbErr?.code === 'P2002') {
        return NextResponse.json(
          {
            status: 'already_processed',
            message: 'Transaction already credited concurrently',
          },
          { status: 200 }
        );
      }

      console.error('Failed to credit Paddle transaction in database:', dbErr);
      return NextResponse.json(
        { error: 'Database credit fulfillment failed. Request retry.' },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Webhook processing error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
