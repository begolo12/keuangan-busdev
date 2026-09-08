import './globals.css';

export const metadata = {
  title: 'Keuangan Busdev 2026 - Rekapitulasi Persekot & Opname Kas',
  description: 'Aplikasi Rekapitulasi Dana Persekot, Reimbursement Nota & Audit Keseimbangan Kas Fisik Busdev',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
