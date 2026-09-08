import { NextResponse } from 'next/server';
import { getMembers, addMember } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json(members);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = await addMember(body);
    return NextResponse.json({ status: 'ok', id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
