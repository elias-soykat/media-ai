import { NextResponse } from 'next/server';
import { APP_CONSTRAINTS } from '@/config/constraints';

export async function GET() {
  return NextResponse.json(APP_CONSTRAINTS, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
