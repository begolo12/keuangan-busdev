import { NextResponse } from 'next/server';
import { getSummary } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const summary = await getSummary();
    return NextResponse.json(summary);
  } catch (err) {
    console.error("GET /api/summary error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
