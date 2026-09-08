import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getSummary, getTransactions } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const summary = await getSummary();
    const members = summary.members;
    const wb = XLSX.utils.book_new();

    // 1. Resume Sheet
    const resumeData = [
      [`TAHUN ${summary.tahun}`],
      [],
      ["DASHBOARD REKAPITULASI DANA PERSEKOT, REIMBURSEMENT & OPNAME KAS FISIK"],
      [`Monitoring Pengeluaran, Distribusi Kas Bon Tim, dan Audit Keseimbangan Fisik vs Catatan (Plafon Kas: Rp ${summary.plafon_induk.toLocaleString('id-ID')})`],
      [],
      ["", "KONTROL KAS INDUK PERSEKOT"],
      ["", "Total Kas Induk Persekot (Plafon Awal)", "", summary.plafon_induk],
      ["", "Total Persekot Didistribusikan ke Tim", "", summary.total_distribusi],
      ["", "Sisa Dana di Kas Induk (Belum Dibagi)", "", summary.sisa_kas_induk],
      ["", "Status Distribusi Kas Induk", "", summary.status_distribusi],
      [],
      ["REKAPITULASI PENGELUARAN, SALDO BUKU & SISA UANG FISIK RIIL"],
      [
        "No.", "Nama Anggota", "Divisi / Pos", "Persekot Diterima (Rp)",
        "Realisasi Belanja (Rp)", "Saldo Catatan Buku (Rp)", "Sisa Uang Fisik Riil (Rp)",
        "Selisih / Gap Fisik (Rp)", "Status Gap Fisik", "Tindak Lanjut / Action"
      ]
    ];

    members.forEach((m, idx) => {
      resumeData.push([
        idx + 1,
        m.name,
        m.divisi,
        m.total_masuk,
        m.total_keluar,
        m.saldo_buku,
        m.uang_fisik,
        m.selisih,
        m.status_fisik,
        m.tindak_lanjut
      ]);
    });

    resumeData.push([
      "TOTAL KESELURUHAN TIM", "", "",
      summary.total_distribusi,
      summary.total_realisasi_belanja,
      summary.total_saldo_buku,
      summary.total_uang_fisik,
      summary.total_selisih_fisik,
      summary.status_selisih_tim,
      summary.tindak_lanjut_tim
    ]);

    resumeData.push([]);
    resumeData.push(["KONTROL KESEIMBANGAN & AUDIT DANA PERSEKOT (BALANCE CHECK)"]);
    resumeData.push(["", "1. Plafon Kas Induk Persekot (Budget Awal)", "", "", summary.plafon_induk, "", "Plafon dana awal yang disediakan manajemen"]);
    resumeData.push(["", "2. Total Realisasi Belanja Tim (Nota Sah)", "", "", summary.total_realisasi_belanja, "", "Total kuitansi/nota belanja tim yang sudah keluar"]);
    resumeData.push(["", "3. Total Sisa Uang Fisik Riil Tim (Hasil Opname)", "", "", summary.total_uang_fisik, "", "Total lembaran/koin fisik uang di tangan seluruh anggota"]);
    resumeData.push(["", "4. Sisa Fisik Dana di Kas Induk (Belum Dibagi)", "", "", summary.sisa_kas_induk, "", "Fisik uang tunai yang masih tertahan di kasir utama"]);
    resumeData.push(["", "5. Total Pertanggungjawaban Fisik (Belanja + Uang Fisik)", "", "", summary.audit_total_pertanggungjawaban, "", "Total Uang Fisik + Nota (Wajib tepat sama dengan Plafon Kas)"]);
    resumeData.push(["", "6. Selisih / Gap Keseimbangan Kas (Audit Variance)", "", "", summary.audit_gap, "", "Wajib bernilai Rp 0 agar dinyatakan Klop / Balance"]);
    resumeData.push(["", "STATUS KESEIMBANGAN AUDIT KAS (BALANCE CHECK)", "", "", summary.status_audit]);

    const wsResume = XLSX.utils.aoa_to_sheet(resumeData);
    wsResume['!cols'] = [
      { wch: 6 }, { wch: 20 }, { wch: 15 }, { wch: 22 },
      { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
      { wch: 25 }, { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(wb, wsResume, "Resume");

    // 2. Member Sheets
    for (const m of members) {
      const txs = await getTransactions({ memberId: m.id });
      const memberSheetData = [
        [`BUKU PENGELUARAN & REIMBURSEMENT PERSEKOT - ${m.name.toUpperCase()}`],
        [`Nama Pemegang Kas: ${m.name}   |   Divisi: ${m.divisi}   |   Pencatatan Nota & Kas Bon`],
        [],
        ["", "Total Persekot Diterima", "", m.total_masuk],
        ["", "Total Realisasi Belanja (Nota)", "", m.total_keluar],
        ["", "Sisa Saldo Catatan (Buku)", "", m.saldo_buku],
        ["", "Sisa Uang Fisik Riil (Hasil Opname)", "", m.uang_fisik],
        ["", "Selisih / Gap Fisik (Fisik - Buku)", "", m.selisih],
        ["", "Status Keseimbangan Fisik", "", m.status_fisik],
        [],
        [
          "No.", "Tanggal", "No. Bukti / Nota", "Keterangan / Uraian Belanja",
          "Pos / Kategori Biaya", "Persekot Masuk (Rp)", "Pengeluaran / Nota (Rp)",
          "Saldo Berjalan (Rp)", "Status Bukti Fisik"
        ]
      ];

      txs.forEach((t, idx) => {
        memberSheetData.push([
          idx + 1,
          t.tanggal,
          t.no_bukti,
          t.keterangan,
          t.kategori,
          t.masuk > 0 ? t.masuk : "",
          t.keluar > 0 ? t.keluar : "",
          t.saldo_berjalan,
          t.status_bukti
        ]);
      });

      memberSheetData.push([
        "TOTAL PERSEKOT & REALISASI", "", "", "", "",
        m.total_masuk,
        m.total_keluar,
        m.saldo_buku,
        ""
      ]);

      const wsMember = XLSX.utils.aoa_to_sheet(memberSheetData);
      wsMember['!cols'] = [
        { wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 35 },
        { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
        { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, wsMember, m.name.substring(0, 31));
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Keuangan_Busdev_Rekapitulasi.xlsx"',
      },
    });
  } catch (err) {
    console.error("Export Excel error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
