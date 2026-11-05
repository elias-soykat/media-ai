import { NextResponse } from 'next/server';
import { getMergedConstraints } from '@/lib/config/getMergedConstraints';

export async function GET() {
  const constraints = await getMergedConstraints();
  return NextResponse.json(constraints, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
