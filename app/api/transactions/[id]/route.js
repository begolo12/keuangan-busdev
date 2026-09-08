import { NextResponse } from 'next/server';
import { updateTransaction, deleteTransaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    await updateTransaction(id, {
      member_id: parseInt(body.member_id, 10),
      tanggal: body.tanggal,
      no_bukti: body.no_bukti,
      keterangan: body.keterangan,
      kategori: body.kategori,
      masuk: parseFloat(body.masuk || 0),
      keluar: parseFloat(body.keluar || 0),
      status_bukti: body.status_bukti || 'Nota Lengkap',
    });
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    await deleteTransaction(id);
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
