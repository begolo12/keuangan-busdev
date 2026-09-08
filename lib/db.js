import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_UvQA2qkdpo5K@ep-broad-tree-b3bl6iud-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export const sql = neon(connectionString);

export async function getSettings() {
  const rows = await sql`SELECT key, value FROM settings`;
  const result = {};
  for (const r of rows) {
    result[r.key] = r.value;
  }
  return result;
}

export async function updateSetting(key, value) {
  await sql`
    INSERT INTO settings (key, value)
    VALUES (${key}, ${String(value)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

export async function getMembers() {
  const members = await sql`SELECT * FROM members ORDER BY urutan ASC, id ASC`;
  const result = [];

  for (const m of members) {
    const stats = await sql`
      SELECT 
        COALESCE(SUM(masuk), 0) as total_masuk,
        COALESCE(SUM(keluar), 0) as total_keluar
      FROM transactions WHERE member_id = ${m.id}
    `;

    const totalMasuk = parseFloat(stats[0]?.total_masuk || 0);
    const totalKeluar = parseFloat(stats[0]?.total_keluar || 0);
    const saldoBuku = totalMasuk - totalKeluar;
    const uangFisik = parseFloat(m.uang_fisik || 0);
    const selisih = uangFisik - saldoBuku;

    let statusFisik = "✅ PAS / KLOP";
    let statusCode = "klop";
    let tindakLanjut = saldoBuku > 0 ? `Setor sisa Rp ${formatNumber(saldoBuku)} ke Kasir` : "Lunas / Pas";

    if (selisih < 0) {
      statusFisik = "❌ KURANG (Tekor)";
      statusCode = "tekor";
      tindakLanjut = `Wajib ganti tekor Rp ${formatNumber(Math.abs(selisih))}`;
    } else if (selisih > 0) {
      statusFisik = "⚠️ LEBIH";
      statusCode = "lebih";
      tindakLanjut = `Setor kelebihan Rp ${formatNumber(selisih)}`;
    }

    result.push({
      id: m.id,
      name: m.name,
      divisi: m.divisi,
      uang_fisik: uangFisik,
      urutan: m.urutan,
      total_masuk: totalMasuk,
      total_keluar: totalKeluar,
      saldo_buku: saldoBuku,
      selisih: selisih,
      status_fisik: statusFisik,
      status_code: statusCode,
      tindak_lanjut: tindakLanjut,
    });
  }

  return result;
}

export async function getSummary() {
  const settings = await getSettings();
  const plafonInduk = parseFloat(settings.plafon_induk || 7000000);
  const members = await getMembers();

  const totalDistribusi = members.reduce((sum, m) => sum + m.total_masuk, 0);
  const sisaKasInduk = plafonInduk - totalDistribusi;

  let statusDistribusi = "100% Teralokasi ke Tim";
  let distribusiCode = "full";
  if (sisaKasInduk > 0) {
    statusDistribusi = "Sebagian Dana Masih di Kas Induk";
    distribusiCode = "partial";
  } else if (sisaKasInduk < 0) {
    statusDistribusi = "PERINGATAN: Melebihi Plafon Kas!";
    distribusiCode = "over";
  }

  const totalRealisasiBelanja = members.reduce((sum, m) => sum + m.total_keluar, 0);
  const totalSaldoBuku = members.reduce((sum, m) => sum + m.saldo_buku, 0);
  const totalUangFisik = members.reduce((sum, m) => sum + m.uang_fisik, 0);
  const totalSelisihFisik = members.reduce((sum, m) => sum + m.selisih, 0);

  let statusSelisihTim = "✅ FISIK TIM KLOP";
  let tindakLanjutTim = "Semua fisik sesuai catatan";
  if (totalSelisihFisik < 0) {
    statusSelisihTim = `❌ TOTAL TEKOR Rp ${formatNumber(Math.abs(totalSelisihFisik))}`;
    tindakLanjutTim = "Investigasi selisih fisik tekor!";
  } else if (totalSelisihFisik > 0) {
    statusSelisihTim = `⚠️ TOTAL LEBIH Rp ${formatNumber(totalSelisihFisik)}`;
    tindakLanjutTim = "Investigasi kelebihan fisik!";
  }

  // Audit Keseimbangan Kas
  // Total Pertanggungjawaban = Realisasi Belanja + Sisa Uang Fisik Tim + Sisa Kas Induk
  const auditTotal = totalRealisasiBelanja + totalUangFisik + sisaKasInduk;
  const auditGap = auditTotal - plafonInduk;

  let statusAudit = `✅ 100% BALANCE (Uang Fisik + Nota Lengkap Rp ${formatNumber(plafonInduk)})`;
  let auditCode = "balance";
  if (auditGap < 0) {
    statusAudit = `❌ FISIK TEKOR / KURANG Rp ${formatNumber(Math.abs(auditGap))}`;
    auditCode = "tekor";
  } else if (auditGap > 0) {
    statusAudit = `⚠️ FISIK LEBIH Rp ${formatNumber(auditGap)}`;
    auditCode = "lebih";
  }

  return {
    plafon_induk: plafonInduk,
    total_distribusi: totalDistribusi,
    sisa_kas_induk: sisaKasInduk,
    status_distribusi: statusDistribusi,
    distribusi_code: distribusiCode,
    total_realisasi_belanja: totalRealisasiBelanja,
    total_saldo_buku: totalSaldoBuku,
    total_uang_fisik: totalUangFisik,
    total_selisih_fisik: totalSelisihFisik,
    status_selisih_tim: statusSelisihTim,
    tindak_lanjut_tim: tindakLanjutTim,
    audit_total_pertanggungjawaban: auditTotal,
    audit_gap: auditGap,
    status_audit: statusAudit,
    audit_code: auditCode,
    members: members,
    tahun: settings.tahun || "2026",
    judul: settings.judul || "DASHBOARD REKAPITULASI DANA PERSEKOT, REIMBURSEMENT & OPNAME KAS FISIK",
  };
}

export async function getTransactions({ memberId, search, kategori, jenis, statusBukti, dateFrom, dateTo } = {}) {
  let rows;
  if (memberId) {
    rows = await sql`
      SELECT t.*, m.name as member_name, m.divisi as member_divisi
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      WHERE t.member_id = ${memberId}
      ORDER BY t.tanggal ASC, t.id ASC
    `;
  } else {
    rows = await sql`
      SELECT t.*, m.name as member_name, m.divisi as member_divisi
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      ORDER BY t.tanggal ASC, t.id ASC
    `;
  }

  // Filter in memory for maximum flexibility
  let filtered = rows;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(r => 
      (r.keterangan && r.keterangan.toLowerCase().includes(s)) ||
      (r.no_bukti && r.no_bukti.toLowerCase().includes(s)) ||
      (r.member_name && r.member_name.toLowerCase().includes(s))
    );
  }
  if (kategori) {
    filtered = filtered.filter(r => r.kategori === kategori);
  }
  if (jenis === 'masuk') {
    filtered = filtered.filter(r => parseFloat(r.masuk) > 0);
  } else if (jenis === 'keluar') {
    filtered = filtered.filter(r => parseFloat(r.keluar) > 0);
  }
  if (statusBukti) {
    filtered = filtered.filter(r => r.status_bukti === statusBukti);
  }
  if (dateFrom) {
    filtered = filtered.filter(r => r.tanggal >= dateFrom);
  }
  if (dateTo) {
    filtered = filtered.filter(r => r.tanggal <= dateTo);
  }

  // Calculate member-wise running balances
  const balances = {};
  return filtered.map(r => {
    const masuk = parseFloat(r.masuk || 0);
    const keluar = parseFloat(r.keluar || 0);
    const mId = r.member_id;
    balances[mId] = (balances[mId] || 0) + (masuk - keluar);

    return {
      id: r.id,
      member_id: r.member_id,
      member_name: r.member_name,
      member_divisi: r.member_divisi,
      tanggal: r.tanggal,
      no_bukti: r.no_bukti,
      keterangan: r.keterangan,
      kategori: r.kategori,
      masuk: masuk,
      keluar: keluar,
      saldo_berjalan: balances[mId],
      status_bukti: r.status_bukti,
      created_at: r.created_at,
    };
  });
}

export async function addTransaction({ member_id, tanggal, no_bukti, keterangan, kategori, masuk = 0, keluar = 0, status_bukti = 'Nota Lengkap' }) {
  const result = await sql`
    INSERT INTO transactions (member_id, tanggal, no_bukti, keterangan, kategori, masuk, keluar, status_bukti)
    VALUES (${member_id}, ${tanggal}, ${no_bukti}, ${keterangan}, ${kategori}, ${masuk}, ${keluar}, ${status_bukti})
    RETURNING id
  `;
  return result[0]?.id;
}

export async function updateTransaction(id, { member_id, tanggal, no_bukti, keterangan, kategori, masuk = 0, keluar = 0, status_bukti = 'Nota Lengkap' }) {
  await sql`
    UPDATE transactions
    SET member_id = ${member_id}, tanggal = ${tanggal}, no_bukti = ${no_bukti},
        keterangan = ${keterangan}, kategori = ${kategori}, masuk = ${masuk},
        keluar = ${keluar}, status_bukti = ${status_bukti}
    WHERE id = ${id}
  `;
}

export async function deleteTransaction(id) {
  await sql`DELETE FROM transactions WHERE id = ${id}`;
}

export async function updateMemberOpname(memberId, uangFisik) {
  await sql`
    UPDATE members
    SET uang_fisik = ${uangFisik}
    WHERE id = ${memberId}
  `;
}

export async function addMember({ name, divisi, uang_fisik = 0, urutan = 0 }) {
  const result = await sql`
    INSERT INTO members (name, divisi, uang_fisik, urutan)
    VALUES (${name}, ${divisi}, ${uang_fisik}, ${urutan})
    RETURNING id
  `;
  return result[0]?.id;
}

export async function updateMember(id, { name, divisi, uang_fisik, urutan }) {
  if (uang_fisik !== undefined && urutan !== undefined) {
    await sql`
      UPDATE members
      SET name = ${name}, divisi = ${divisi}, uang_fisik = ${uang_fisik}, urutan = ${urutan}
      WHERE id = ${id}
    `;
  } else if (uang_fisik !== undefined) {
    await sql`
      UPDATE members
      SET name = ${name}, divisi = ${divisi}, uang_fisik = ${uang_fisik}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE members
      SET name = ${name}, divisi = ${divisi}
      WHERE id = ${id}
    `;
  }
}

export async function deleteMember(id) {
  await sql`DELETE FROM members WHERE id = ${id}`;
}

export async function getCategories() {
  const rows = await sql`SELECT DISTINCT kategori FROM transactions WHERE kategori IS NOT NULL AND kategori != '' ORDER BY kategori ASC`;
  const categories = rows.map(r => r.kategori);
  const defaults = ["Persekot Kas", "Dapur / Konsumsi", "Operasional GA", "Kebersihan / Alat OB", "Transport / Bensin", "Operasional Bisnis", "Lain-lain"];
  for (const d of defaults) {
    if (!categories.includes(d)) categories.push(d);
  }
  return categories;
}

export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(Math.round(num || 0));
}
