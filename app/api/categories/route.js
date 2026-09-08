import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cats = await getCategories();
    return NextResponse.json(cats);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
