# Keuangan Busdev 2026

Aplikasi Modern Rekapitulasi Dana Persekot, Reimbursement Nota & Audit Keseimbangan Kas Fisik Tim Business Development 2026.

## Fitur Utama

1. **Dashboard Rekapitulasi Eksekutif**
   - Monitoring Plafon Kas Induk (Plafon Awal: Rp 7.000.000).
   - Distribusi Kas Bon & Persekot ke Tim.
   - Sisa Dana di Kas Induk (Kasir Utama).
   - Realisasi Belanja (Total Nota Keluar).
   - Sisa Uang Fisik Riil Hasil Opname Kas.

2. **Audit Keseimbangan Kas (Balance Check 6 Titik)**
   - Perhitungan otomatis formula keseimbangan kas:
     `Plafon Kas Induk = Realisasi Belanja + Sisa Fisik Tim + Sisa Kas Induk`.
   - Deteksi otomatis status Klop (100% Balance), Tekor (Kurang), atau Lebih.

3. **Buku Kas Khusus Anggota Tim**
   - Buku kas terpisah untuk tiap anggota:
     - Sri (Dapur)
     - Lucky (GA)
     - Kur (OB)
     - Irvan (Manager)
     - Dapat menambah anggota baru secara dinamis.
   - Perhitungan saldo berjalan otomatis pada setiap baris transaksi.
   - Rekomendasi tindak lanjut otomatis ("Setor sisa ke kasir", "Wajib ganti tekor", "Setor kelebihan").

4. **Input Transaksi & Opname Kas Mudah**
   - Modal input transaksi pengeluaran (belanja/nota) dan penerimaan persekot.
   - Status bukti fisik (Nota Lengkap, Nota Menyusul, Tanpa Nota, Kas Diterima).
   - Modal audit opname fisik dengan perbandingan instan terhadap saldo buku.

5. **Semua Transaksi (Unified Ledger)**
   - Pencarian keterangan, nomor bukti, atau nama anggota.
   - Filter berdasarkan kategori belanja, anggota, tipe kas, dan status bukti nota.

6. **Ekspor Excel & Cetak Dokumen**
   - Unduh file Excel (`.xlsx`) lengkap dengan sheet Resume dan sheet masing-masing anggota tim.
   - Desain print-friendly untuk cetak laporan pertanggungjawaban fisik.

## Teknologi

- **Frontend & Full-stack**: Next.js 14, React 18, Tailwind CSS, Lucide Icons.
- **Database Cloud**: Neon PostgreSQL (`@neondatabase/serverless`).
- **Desktop App**: Electron 44 & Electron Builder (Windows Portable & Installer).
- **Deployment**: Vercel Serverless.

## Cara Menjalankan

### 1. Aplikasi Desktop (Electron)
Klik ganda pada file:
```cmd
jalankan_aplikasi.bat
```
Atau melalui terminal:
```bash
npm run electron
```

### 2. Mode Web (Lokal)
```bash
npm run dev
```
Akses di browser pada `http://localhost:8088`.

### 3. Build Desktop Installer (.exe)
```bash
npm run electron:build
```
File installer `.exe` akan dihasilkan di folder `dist-electron/`.
