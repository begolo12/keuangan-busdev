import { NextResponse } from 'next/server';
import { updateMember, deleteMember } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    await updateMember(id, body);
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    await deleteMember(id);
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
