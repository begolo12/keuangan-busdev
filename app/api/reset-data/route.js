import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await sql`DELETE FROM transactions`;
    await sql`DELETE FROM members`;

    await sql`INSERT INTO settings (key, value) VALUES ('plafon_induk', '7000000') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    await sql`INSERT INTO settings (key, value) VALUES ('tahun', '2026') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
    await sql`INSERT INTO settings (key, value) VALUES ('judul', 'DASHBOARD REKAPITULASI DANA PERSEKOT, REIMBURSEMENT & OPNAME KAS FISIK') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;

    const membersData = [
      { name: 'Sri', divisi: 'Dapur', uangFisik: 2500000, persekot: 2500000, urutan: 1 },
      { name: 'Lucky', divisi: 'GA', uangFisik: 3200000, persekot: 3200000, urutan: 2 },
      { name: 'Kur', divisi: 'OB', uangFisik: 300000, persekot: 300000, urutan: 3 },
      { name: 'irvan', divisi: 'Manager', uangFisik: 1000000, persekot: 1000000, urutan: 4 },
    ];

    for (const m of membersData) {
      const inserted = await sql`
        INSERT INTO members (name, divisi, uang_fisik, urutan)
        VALUES (${m.name}, ${m.divisi}, ${m.uangFisik}, ${m.urutan})
        RETURNING id
      `;
      const memberId = inserted[0].id;
      await sql`
        INSERT INTO transactions (member_id, tanggal, no_bukti, keterangan, kategori, masuk, keluar, status_bukti)
        VALUES (${memberId}, '2026-01-09', 'KAS-01', 'Penerimaan Persekot Awal', 'Persekot Kas', ${m.persekot}, 0, 'Kas Diterima')
      `;
    }

    return NextResponse.json({ status: 'ok', message: 'Data berhasil di-reset' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
