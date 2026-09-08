import { neon } from '@neondatabase/serverless';

const connectionString = "postgresql://neondb_owner:npg_UvQA2qkdpo5K@ep-broad-tree-b3bl6iud-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function migrate() {
  console.log("Migrating database schema on Neon PostgreSQL...");

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      divisi VARCHAR(100) NOT NULL,
      uang_fisik NUMERIC(15, 2) DEFAULT 0,
      urutan INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      member_id INT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      tanggal VARCHAR(20) NOT NULL,
      no_bukti VARCHAR(100) NOT NULL,
      keterangan TEXT NOT NULL,
      kategori VARCHAR(100) NOT NULL,
      masuk NUMERIC(15, 2) DEFAULT 0,
      keluar NUMERIC(15, 2) DEFAULT 0,
      status_bukti VARCHAR(50) DEFAULT 'Nota Lengkap',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Seed settings
  await sql`INSERT INTO settings (key, value) VALUES ('plafon_induk', '7000000') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  await sql`INSERT INTO settings (key, value) VALUES ('tahun', '2026') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;
  await sql`INSERT INTO settings (key, value) VALUES ('judul', 'DASHBOARD REKAPITULASI DANA PERSEKOT, REIMBURSEMENT & OPNAME KAS FISIK') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;

  // Check if members already exist
  const existingMembers = await sql`SELECT COUNT(*) as count FROM members`;
  if (parseInt(existingMembers[0].count, 10) === 0) {
    console.log("Seeding initial data from Excel...");
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
    console.log("Initial data successfully seeded!");
  } else {
    console.log(`Members table already has ${existingMembers[0].count} records.`);
  }

  const members = await sql`SELECT * FROM members ORDER BY urutan ASC`;
  console.log("Members in Neon DB:", members);

  const txs = await sql`SELECT * FROM transactions`;
  console.log(`Total transactions in Neon DB: ${txs.length}`);
}

migrate().catch(console.error);
