import { NextRequest, NextResponse } from 'next/server';
import { parseWebhookPayload, completeJob, failJob } from '@/lib/jobs/jobManager';

export async function POST(req: NextRequest) {
  try {
    const rawPayload = await req.json();
    const parsed = parseWebhookPayload(rawPayload);

    if (!parsed.jobId) {
      return NextResponse.json({ error: 'Missing job identifier in webhook payload' }, { status: 400 });
    }

    if (parsed.status === 'COMPLETED' && parsed.outputUrl) {
      await completeJob(parsed.jobId, parsed.outputUrl);
    } else if (parsed.status === 'FAILED') {
      await failJob(parsed.jobId, parsed.errorMessage || 'Unknown AI provider processing failure');
    }

    return NextResponse.json({ received: true, jobId: parsed.jobId }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
