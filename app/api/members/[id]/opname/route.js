import { NextResponse } from 'next/server';
import { updateMemberOpname } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const uangFisik = parseFloat(body.uang_fisik || 0);
    await updateMemberOpname(id, uangFisik);
    return NextResponse.json({ status: 'ok', uang_fisik: uangFisik });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
