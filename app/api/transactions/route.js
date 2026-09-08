import { NextResponse } from 'next/server';
import { getTransactions, addTransaction } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id') ? parseInt(searchParams.get('member_id'), 10) : null;
    const search = searchParams.get('search') || null;
    const kategori = searchParams.get('kategori') || null;
    const jenis = searchParams.get('jenis') || null;
    const statusBukti = searchParams.get('status_bukti') || null;
    const dateFrom = searchParams.get('date_from') || null;
    const dateTo = searchParams.get('date_to') || null;

    const txs = await getTransactions({
      memberId,
      search,
      kategori,
      jenis,
      statusBukti,
      dateFrom,
      dateTo
    });

    return NextResponse.json(txs);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const id = await addTransaction({
      member_id: parseInt(body.member_id, 10),
      tanggal: body.tanggal,
      no_bukti: body.no_bukti,
      keterangan: body.keterangan,
      kategori: body.kategori,
      masuk: parseFloat(body.masuk || 0),
      keluar: parseFloat(body.keluar || 0),
      status_bukti: body.status_bukti || 'Nota Lengkap',
    });
    return NextResponse.json({ status: 'ok', id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
