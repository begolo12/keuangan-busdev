import { NextResponse } from 'next/server';
import { getSettings, updateSetting } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await updateSetting(body.key, body.value);
    return NextResponse.json({ status: 'ok', key: body.key, value: body.value });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
