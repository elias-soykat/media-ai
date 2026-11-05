import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/auth/authService';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = verifySessionToken(sessionCookie);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await prisma.creditTransaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ transactions }, { status: 200 });
  } catch {
    return NextResponse.json({ transactions: [] }, { status: 200 });
  }
}

