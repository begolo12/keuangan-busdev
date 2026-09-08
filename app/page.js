'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ModernHeader from '@/components/ModernHeader';
import KPICard from '@/components/KPICard';
import StatusBadge from '@/components/StatusBadge';
import {
  Wallet,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Download,
  Printer,
  Settings,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Moon,
  Sun,
  User,
  Building,
  RefreshCw,
  Edit2,
  Trash2,
  Coins,
  ShieldCheck,
  ChevronRight,
  FileSpreadsheet,
  X,
  Bell,
  TrendingUp,
  TrendingDown,
  CreditCard
} from 'lucide-react';

function formatRupiah(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}
export default function KeuanganBusdevApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', memberId, or 'all_transactions'
  
  // Modals
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [opnameMember, setOpnameMember] = useState(null);
  const [opnameValue, setOpnameValue] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Filters for All Transactions
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatusBukti, setFilterStatusBukti] = useState('');

  // Form State for Transaction
  const [txForm, setTxForm] = useState({
    member_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'keluar', // 'masuk' or 'keluar'
    no_bukti: '',
    keterangan: '',
    kategori: 'Operasional GA',
    nominal: '',
    status_bukti: 'Nota Lengkap'
  });

  // Settings form
  const [plafonForm, setPlafonForm] = useState('');
  const [newMemberForm, setNewMemberForm] = useState({ name: '', divisi: '', uang_fisik: '' });

  // Notifications
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    // Check dark mode preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    }
    loadData();
  }, []);

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [resSummary, resTx, resCats] = await Promise.all([
        fetch('/api/summary').then(r => r.json()),
        fetch('/api/transactions').then(r => r.json()),
        fetch('/api/categories').then(r => r.json()),
      ]);

      setSummary(resSummary);
      setTransactions(resTx);
      setCategories(resCats);
      setPlafonForm(resSummary.plafon_induk || 7000000);
    } catch (err) {
      console.error('Error loading data:', err);
      showToast('Gagal memuat data dari server', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for new transaction
  const openNewTxModal = (presetMemberId = null) => {
    const defaultMemberId = presetMemberId || (activeTab !== 'dashboard' && activeTab !== 'all_transactions' ? activeTab : (summary?.members[0]?.id || ''));
    setEditingTx(null);
    setTxForm({
      member_id: defaultMemberId,
      tanggal: new Date().toISOString().split('T')[0],
      jenis: 'keluar',
      no_bukti: `NOTA-${String(transactions.length + 1).padStart(2, '0')}`,
      keterangan: '',
      kategori: categories[0] || 'Operasional GA',
      nominal: '',
      status_bukti: 'Nota Lengkap'
    });
    setShowTxModal(true);
  };

  // Open modal for editing transaction
  const openEditTxModal = (tx) => {
    setEditingTx(tx);
    const isMasuk = tx.masuk > 0;
    setTxForm({
      member_id: tx.member_id,
      tanggal: tx.tanggal,
      jenis: isMasuk ? 'masuk' : 'keluar',
      no_bukti: tx.no_bukti,
      keterangan: tx.keterangan,
      kategori: tx.kategori,
      nominal: isMasuk ? tx.masuk : tx.keluar,
      status_bukti: tx.status_bukti
    });
    setShowTxModal(true);
  };

  // Save Transaction
  const handleSaveTx = async (e) => {
    e.preventDefault();
    const nominalNum = parseFloat(txForm.nominal) || 0;
    if (nominalNum <= 0) {
      showToast('Nominal harus lebih besar dari 0', 'error');
      return;
    }
    if (!txForm.keterangan.trim()) {
      showToast('Keterangan belanja wajib diisi', 'error');
      return;
    }

    const payload = {
      member_id: parseInt(txForm.member_id, 10),
      tanggal: txForm.tanggal,
      no_bukti: txForm.no_bukti || '-',
      keterangan: txForm.keterangan,
      kategori: txForm.kategori,
      masuk: txForm.jenis === 'masuk' ? nominalNum : 0,
      keluar: txForm.jenis === 'keluar' ? nominalNum : 0,
      status_bukti: txForm.status_bukti
    };

    try {
      if (editingTx) {
        await fetch(`/api/transactions/${editingTx.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('Transaksi berhasil diperbarui');
      } else {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('Transaksi berhasil dicatat');
      }
      setShowTxModal(false);
      loadData();
    } catch (err) {
      showToast('Gagal menyimpan transaksi', 'error');
    }
  };

  // Delete Transaction
  const handleDeleteTx = async (id) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      showToast('Transaksi berhasil dihapus');
      loadData();
    } catch (err) {
      showToast('Gagal menghapus transaksi', 'error');
    }
  };

  // Open Opname Modal
  const openOpnameModalFor = (member) => {
    setOpnameMember(member);
    setOpnameValue(member.uang_fisik || '');
    setShowOpnameModal(true);
  };

  // Save Opname
  const handleSaveOpname = async (e) => {
    e.preventDefault();
    if (!opnameMember) return;
    const fisikNum = parseFloat(opnameValue) || 0;
    try {
      await fetch(`/api/members/${opnameMember.id}/opname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uang_fisik: fisikNum })
      });
      showToast(`Opname uang fisik untuk ${opnameMember.name} berhasil diperbarui`);
      setShowOpnameModal(false);
      loadData();
    } catch (err) {
      showToast('Gagal menyimpan opname fisik', 'error');
    }
  };

  // Save Settings Plafon
  const handleSavePlafon = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'plafon_induk', value: String(plafonForm) })
      });
      showToast('Plafon Kas Induk berhasil diperbarui');
      loadData();
    } catch (err) {
      showToast('Gagal memperbarui plafon', 'error');
    }
  };

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberForm.name.trim()) return;
    try {
      await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMemberForm.name,
          divisi: newMemberForm.divisi,
          uang_fisik: parseFloat(newMemberForm.uang_fisik) || 0,
          urutan: (summary?.members?.length || 0) + 1
        })
      });
      setNewMemberForm({ name: '', divisi: '', uang_fisik: '' });
      showToast('Anggota baru berhasil ditambahkan');
      loadData();
    } catch (err) {
      showToast('Gagal menambah anggota', 'error');
    }
  };

  // Reset Data to Initial Excel
  const handleResetData = async () => {
    if (!confirm('PERINGATAN: Semua perubahan transaksi akan dikembalikan ke data awal Excel. Lanjutkan?')) return;
    try {
      await fetch('/api/reset-data', { method: 'POST' });
      showToast('Data berhasil di-reset ke kondisi awal Excel');
      loadData();
    } catch (err) {
      showToast('Gagal me-reset data', 'error');
    }
  };

  // Filtered transactions for active view
  const currentMember = useMemo(() => {
    if (!summary?.members) return null;
    return summary.members.find(m => m.id === activeTab) || null;
  }, [summary, activeTab]);

  const displayedTransactions = useMemo(() => {
    if (activeTab !== 'dashboard' && activeTab !== 'all_transactions') {
      return transactions.filter(t => t.member_id === activeTab);
    }
    if (activeTab === 'all_transactions') {
      return transactions.filter(t => {
        if (filterMember && t.member_id !== parseInt(filterMember, 10)) return false;
        if (filterCategory && t.kategori !== filterCategory) return false;
        if (filterJenis === 'masuk' && t.masuk <= 0) return false;
        if (filterJenis === 'keluar' && t.keluar <= 0) return false;
        if (filterStatusBukti && t.status_bukti !== filterStatusBukti) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchKet = t.keterangan && t.keterangan.toLowerCase().includes(q);
          const matchBukti = t.no_bukti && t.no_bukti.toLowerCase().includes(q);
          const matchName = t.member_name && t.member_name.toLowerCase().includes(q);
          if (!matchKet && !matchBukti && !matchName) return false;
        }
        return true;
      });
    }
    return transactions;
  }, [transactions, activeTab, filterMember, filterCategory, filterJenis, filterStatusBukti, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 text-sm font-medium transition-all transform animate-bounce ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 text-sm font-medium transition-all transform animate-bounce ${
          toast.type === 'error' ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Modern Header Component */}
      <ModernHeader 
        onNewTx={openNewTxModal}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        title="Keuangan Busdev"
        subtitle="Rekapitulasi Persekot & Audit Kas Fisik"
        year={summary?.tahun || '2026'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Executive Metric Cards Banner - Redesigned with KPICard component */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {/* Plafon Kas Induk */}
            <KPICard
              title="Plafon Kas Induk"
              icon={Wallet}
              value={formatRupiah(summary.plafon_induk)}
              subValue={`Sisa di Kasir: ${formatRupiah(summary.sisa_kas_induk)}`}
              accentColor="brand"
            />

            {/* Total Kas Terdistribusi */}
            <KPICard
              title="Persekot Tim"
              icon={ArrowUpRight}
              value={formatRupiah(summary.total_distribusi)}
              subValue={summary.status_distribusi}
              accentColor="blue"
            />

            {/* Realisasi Belanja */}
            <KPICard
              title="Realisasi Belanja"
              icon={ArrowDownRight}
              value={formatRupiah(summary.total_realisasi_belanja)}
              subValue="Total nota tim"
              accentColor="rose"
            />

            {/* Sisa Uang Fisik */}
            <KPICard
              title="Fisik Opname"
              icon={Coins}
              value={formatRupiah(summary.total_uang_fisik)}
              subValue="Uang tunai tim"
              accentColor="emerald"
            />

            {/* Audit Balance Check */}
            <KPICard
              title="Status Audit"
              icon={ShieldCheck}
              value={summary.audit_code === 'balance' ? '100% BALANCE' : formatRupiah(summary.audit_gap)}
              subValue={summary.status_selisih_tim}
              trend={summary.audit_gap !== 0 ? (summary.audit_gap / summary.plafon_induk * 100) : undefined}
              accentColor={summary.audit_code === 'balance' ? 'emerald' : 'amber'}
            />
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-200 dark:border-slate-700 no-print">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all flex items-center space-x-2 ${
                activeTab === 'dashboard'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <span>Dashboard & Rekap</span>
            </button>

            {summary?.members?.map((m) => {
              const isSelected = activeTab === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveTab(m.id)}
                  className={`px-3.5 py-2.5 rounded-lg whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 opacity-70" />
                  <span>{m.name}</span>
                  <span className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {m.divisi}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setActiveTab('all_transactions')}
              className={`px-4 py-2.5 rounded-lg whitespace-nowrap transition-all flex items-center space-x-2 ${
                activeTab === 'all_transactions'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4 opacity-70" />
              <span>Semua Transaksi</span>
            </button>
          </nav>
        </div>

        {/* TAB 1: DASHBOARD & REKAPITULASI */}
        {activeTab === 'dashboard' && summary && (
          <div className="space-y-6">
            {/* Table 1: Rekapitulasi Tim */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Rekapitulasi Pengeluaran, Saldo Buku & Sisa Uang Fisik Riil
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Posisi dana persekot masing-masing anggota dan perbandingan uang fisik vs catatan buku
                  </p>
                </div>
                <button
                  onClick={() => openNewTxModal()}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300 dark:hover:bg-brand-900/50 transition flex items-center no-print"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Tambah Transaksi
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">No</th>
                      <th className="py-3 px-4">Nama Anggota</th>
                      <th className="py-3 px-3">Divisi</th>
                      <th className="py-3 px-4 text-right">Persekot (Rp)</th>
                      <th className="py-3 px-4 text-right">Realisasi (Rp)</th>
                      <th className="py-3 px-4 text-right">Saldo Buku (Rp)</th>
                      <th className="py-3 px-4 text-right bg-amber-50/50 dark:bg-amber-950/20">Uang Fisik (Rp)</th>
                      <th className="py-3 px-4 text-right">Selisih (Rp)</th>
                      <th className="py-3 px-4 text-center">Status Gap</th>
                      <th className="py-3 px-4">Tindak Lanjut</th>
                      <th className="py-3 px-3 text-center no-print">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {summary.members.map((m, idx) => (
                      <tr key={m.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900/30'}`}>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <button
                            onClick={() => setActiveTab(m.id)}
                            className="hover:text-brand-600 dark:hover:text-brand-400 flex items-center space-x-1 group"
                          >
                            <span>{m.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
                          </button>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {m.divisi}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                          {formatRupiah(m.total_masuk)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                          {formatRupiah(m.total_keluar)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                          {formatRupiah(m.saldo_buku)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700 dark:text-emerald-300 bg-amber-50/40 dark:bg-amber-950/10">
                          {formatRupiah(m.uang_fisik)}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-bold ${
                          m.selisih === 0 ? 'text-emerald-600 dark:text-emerald-400' :
                          m.selisih < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {formatRupiah(m.selisih)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            m.status_code === 'klop'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : m.status_code === 'tekor'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {m.status_fisik}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                          {m.tindak_lanjut}
                        </td>
                        <td className="py-3.5 px-3 text-center no-print">
                          <button
                            onClick={() => openOpnameModalFor(m)}
                            className="p-1.5 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 rounded-lg transition"
                            title="Update uang fisik hasil opname"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 dark:bg-slate-700/60 font-bold text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-600">
                    <tr>
                      <td colSpan="3" className="py-3.5 px-4 text-center">TOTAL KESELURUHAN TIM</td>
                      <td className="py-3.5 px-4 text-right text-blue-700 dark:text-blue-300">{formatRupiah(summary.total_distribusi)}</td>
                      <td className="py-3.5 px-4 text-right text-rose-700 dark:text-rose-300">{formatRupiah(summary.total_realisasi_belanja)}</td>
                      <td className="py-3.5 px-4 text-right">{formatRupiah(summary.total_saldo_buku)}</td>
                      <td className="py-3.5 px-4 text-right text-emerald-700 dark:text-emerald-300 bg-amber-100/50 dark:bg-amber-950/30">{formatRupiah(summary.total_uang_fisik)}</td>
                      <td className="py-3.5 px-4 text-right">{formatRupiah(summary.total_selisih_fisik)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                          {summary.status_selisih_tim}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">{summary.tindak_lanjut_tim}</td>
                      <td className="no-print"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Table 2: Audit Keseimbangan Kas Induk (Balance Check) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <div className="flex items-center space-x-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kontrol Keseimbangan & Audit Dana Persekot (Balance Check)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">1. Plafon Kas Induk (Budget Awal)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(summary.plafon_induk)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">2. Total Realisasi Belanja Tim (Nota)</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{formatRupiah(summary.total_realisasi_belanja)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">3. Total Sisa Uang Fisik Tim (Opname)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(summary.total_uang_fisik)}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">4. Sisa Fisik di Kas Induk (Belum Dibagi)</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatRupiah(summary.sisa_kas_induk)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-brand-50/50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900">
                    <span className="font-medium text-brand-900 dark:text-brand-300">5. Total Pertanggungjawaban Fisik (2+3+4)</span>
                    <span className="font-extrabold text-brand-700 dark:text-brand-400">{formatRupiah(summary.audit_total_pertanggungjawaban)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">6. Selisih / Audit Variance (5 - 1)</span>
                    <span className={`font-bold ${summary.audit_gap === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatRupiah(summary.audit_gap)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Status Keseimbangan Audit:</span>
                <span className={`font-extrabold px-3 py-1 rounded-md ${
                  summary.audit_code === 'balance'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {summary.status_audit}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEMBER LEDGER VIEW */}
        {activeTab !== 'dashboard' && activeTab !== 'all_transactions' && currentMember && (
          <div className="space-y-6">
            {/* Member Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 flex items-center justify-center font-bold text-lg">
                    {currentMember.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>Buku Kas: {currentMember.name}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                        {currentMember.divisi}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Pencatatan Nota Pengeluaran, Kas Bon & Opname Fisik
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 no-print">
                  <button
                    onClick={() => openNewTxModal(currentMember.id)}
                    className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition flex items-center shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Catat Nota / Kas
                  </button>
                  <button
                    onClick={() => openOpnameModalFor(currentMember)}
                    className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center"
                  >
                    <Edit2 className="w-4 h-4 mr-1.5 text-amber-500" />
                    Opname Fisik
                  </button>
                </div>
              </div>

              {/* Member KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Persekot Diterima</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">{formatRupiah(currentMember.total_masuk)}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Realisasi Belanja</div>
                  <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatRupiah(currentMember.total_keluar)}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Saldo Buku</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{formatRupiah(currentMember.saldo_buku)}</div>
                </div>
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-200/60 dark:border-amber-900/40 cursor-pointer" onClick={() => openOpnameModalFor(currentMember)} title="Klik untuk ubah uang fisik">
                  <div className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center justify-center space-x-1">
                    <span>Uang Fisik</span>
                    <Edit2 className="w-2.5 h-2.5 opacity-60" />
                  </div>
                  <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">{formatRupiah(currentMember.uang_fisik)}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Selisih Fisik</div>
                  <div className={`text-base font-bold mt-0.5 ${
                    currentMember.selisih === 0 ? 'text-emerald-600' : currentMember.selisih < 0 ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {formatRupiah(currentMember.selisih)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg flex flex-col justify-center">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status Keseimbangan</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {currentMember.status_fisik}
                  </div>
                </div>
              </div>

              {/* Action Box Recommendation */}
              <div className="mt-4 px-4 py-2.5 rounded-lg bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-900/50 flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-900 dark:text-brand-200">Tindak Lanjut Rekomendasi:</span>
                <span className="font-bold text-brand-700 dark:text-brand-300">{currentMember.tindak_lanjut}</span>
              </div>
            </div>

            {/* Member Transaction Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Daftar Transaksi ({displayedTransactions.length})
                </h3>
              </div>

              {displayedTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-3">
                  <Receipt className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-sm">Belum ada transaksi dicatat untuk {currentMember.name}.</p>
                  <button
                    onClick={() => openNewTxModal(currentMember.id)}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition"
                  >
                    Catat Transaksi Pertama
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-3 text-center w-12">No</th>
                        <th className="py-3 px-3">Tanggal</th>
                        <th className="py-3 px-3">No Bukti</th>
                        <th className="py-3 px-4">Keterangan / Uraian</th>
                        <th className="py-3 px-3">Pos Kategori</th>
                        <th className="py-3 px-4 text-right">Masuk (Rp)</th>
                        <th className="py-3 px-4 text-right">Keluar (Rp)</th>
                        <th className="py-3 px-4 text-right">Saldo (Rp)</th>
                        <th className="py-3 px-3 text-center">Status Bukti</th>
                        <th className="py-3 px-3 text-center no-print">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {displayedTransactions.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                          <td className="py-3 px-3 text-center text-xs text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300">{t.tanggal}</td>
                          <td className="py-3 px-3 whitespace-nowrap text-xs font-semibold text-brand-600 dark:text-brand-400">{t.no_bukti}</td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{t.keterangan}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {t.kategori}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {t.masuk > 0 ? formatRupiah(t.masuk) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                            {t.keluar > 0 ? formatRupiah(t.keluar) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                            {formatRupiah(t.saldo_berjalan)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              t.status_bukti === 'Nota Lengkap' || t.status_bukti === 'Kas Diterima'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : t.status_bukti === 'Nota Menyusul'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {t.status_bukti}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center no-print">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => openEditTxModal(t)}
                                className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                                title="Edit Transaksi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTx(t.id)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 dark:bg-slate-700/60 font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-600">
                      <tr>
                        <td colSpan="5" className="py-3 px-4 text-center">TOTAL</td>
                        <td className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">{formatRupiah(currentMember.total_masuk)}</td>
                        <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">{formatRupiah(currentMember.total_keluar)}</td>
                        <td className="py-3 px-4 text-right">{formatRupiah(currentMember.saldo_buku)}</td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ALL TRANSACTIONS VIEW */}
        {activeTab === 'all_transactions' && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm no-print space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[240px] relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari keterangan, nomor bukti, atau nama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <button
                  onClick={() => openNewTxModal()}
                  className="px-3.5 py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Tambah Transaksi
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {/* Filter Member */}
                <select
                  value={filterMember}
                  onChange={(e) => setFilterMember(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value="">Semua Anggota</option>
                  {summary?.members?.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.divisi})</option>
                  ))}
                </select>

                {/* Filter Kategori */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Filter Jenis */}
                <select
                  value={filterJenis}
                  onChange={(e) => setFilterJenis(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value="">Semua Jenis Arus</option>
                  <option value="keluar">Pengeluaran (Nota Belanja)</option>
                  <option value="masuk">Penerimaan (Persekot)</option>
                </select>

                {/* Filter Status Bukti */}
                <select
                  value={filterStatusBukti}
                  onChange={(e) => setFilterStatusBukti(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                  <option value="">Semua Status Bukti</option>
                  <option value="Nota Lengkap">Nota Lengkap</option>
                  <option value="Nota Menyusul">Nota Menyusul</option>
                  <option value="Kas Diterima">Kas Diterima</option>
                  <option value="Tanpa Nota">Tanpa Nota</option>
                </select>
              </div>
            </div>

            {/* All Transactions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">No</th>
                      <th className="py-3 px-3">Tanggal</th>
                      <th className="py-3 px-3">Pemegang Kas</th>
                      <th className="py-3 px-3">No Bukti</th>
                      <th className="py-3 px-4">Keterangan</th>
                      <th className="py-3 px-3">Pos Kategori</th>
                      <th className="py-3 px-4 text-right">Masuk (Rp)</th>
                      <th className="py-3 px-4 text-right">Keluar (Rp)</th>
                      <th className="py-3 px-4 text-right">Saldo Berjalan</th>
                      <th className="py-3 px-3 text-center">Status Bukti</th>
                      <th className="py-3 px-3 text-center no-print">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {displayedTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="py-8 text-center text-slate-400">
                          Tidak ada transaksi yang cocok dengan filter.
                        </td>
                      </tr>
                    ) : (
                      displayedTransactions.map((t, idx) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                          <td className="py-3 px-3 text-center text-xs text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-slate-300">{t.tanggal}</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 dark:text-white">{t.member_name}</span>
                            <span className="text-xs text-slate-400 block">{t.member_divisi}</span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-xs font-semibold text-brand-600 dark:text-brand-400">{t.no_bukti}</td>
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{t.keterangan}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                              {t.kategori}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {t.masuk > 0 ? formatRupiah(t.masuk) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                            {t.keluar > 0 ? formatRupiah(t.keluar) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                            {formatRupiah(t.saldo_berjalan)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              t.status_bukti === 'Nota Lengkap' || t.status_bukti === 'Kas Diterima'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : t.status_bukti === 'Nota Menyusul'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {t.status_bukti}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center no-print">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => openEditTxModal(t)}
                                className="p-1 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                                title="Edit Transaksi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTx(t.id)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: Tambah / Edit Transaksi */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingTx ? 'Edit Transaksi Kas' : 'Catat Transaksi Kas / Nota'}
              </h3>
              <button
                onClick={() => setShowTxModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="mt-4 space-y-4">
              {/* Jenis Transaksi Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Jenis Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, jenis: 'keluar' })}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold border transition ${
                      txForm.jenis === 'keluar'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Pengeluaran / Nota
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, jenis: 'masuk' })}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold border transition ${
                      txForm.jenis === 'masuk'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Penerimaan Persekot
                  </button>
                </div>
              </div>

              {/* Pemegang Kas */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Pemegang Kas (Anggota)
                </label>
                <select
                  value={txForm.member_id}
                  onChange={(e) => setTxForm({ ...txForm, member_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-medium"
                  required
                >
                  <option value="">Pilih Anggota Tim</option>
                  {summary?.members?.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.divisi})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={txForm.tanggal}
                    onChange={(e) => setTxForm({ ...txForm, tanggal: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                  />
                </div>

                {/* No Bukti */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    No. Bukti / Nota
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: NOTA-01"
                    value={txForm.no_bukti}
                    onChange={(e) => setTxForm({ ...txForm, no_bukti: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Keterangan / Uraian Belanja
                </label>
                <input
                  type="text"
                  placeholder="Misal: Beli sabun, gas LPG, konsumsi rapat"
                  value={txForm.keterangan}
                  onChange={(e) => setTxForm({ ...txForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Pos Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Pos / Kategori Biaya
                  </label>
                  <select
                    value={txForm.kategori}
                    onChange={(e) => setTxForm({ ...txForm, kategori: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Status Bukti Fisik */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Status Bukti Fisik
                  </label>
                  <select
                    value={txForm.status_bukti}
                    onChange={(e) => setTxForm({ ...txForm, status_bukti: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                  >
                    <option value="Nota Lengkap">Nota Lengkap</option>
                    <option value="Nota Menyusul">Nota Menyusul</option>
                    <option value="Kas Diterima">Kas Diterima</option>
                    <option value="Tanpa Nota">Tanpa Nota</option>
                  </select>
                </div>
              </div>

              {/* Nominal */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0"
                  value={txForm.nominal}
                  onChange={(e) => setTxForm({ ...txForm, nominal: e.target.value })}
                  className="w-full px-3 py-2.5 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono"
                  required
                />
                {txForm.nominal && (
                  <p className="mt-1 text-xs text-brand-600 dark:text-brand-400 font-semibold">
                    {formatRupiah(parseFloat(txForm.nominal))}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                >
                  {editingTx ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Opname Kas Fisik */}
      {showOpnameModal && opnameMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Audit Opname Kas Fisik
                </h3>
                <p className="text-xs text-slate-500">{opnameMember.name} ({opnameMember.divisi})</p>
              </div>
              <button
                onClick={() => setShowOpnameModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOpname} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-300">Saldo Catatan Buku Saat Ini:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(opnameMember.saldo_buku)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Sisa Uang Fisik Riil yang Dihitung (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={opnameValue}
                  onChange={(e) => setOpnameValue(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-base font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono"
                  required
                />
                {opnameValue !== '' && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 text-xs space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>Perkiraan Selisih:</span>
                      <span className={
                        parseFloat(opnameValue) - opnameMember.saldo_buku === 0
                          ? 'text-emerald-600 font-bold'
                          : parseFloat(opnameValue) - opnameMember.saldo_buku < 0
                          ? 'text-rose-600 font-bold'
                          : 'text-amber-600 font-bold'
                      }>
                        {formatRupiah(parseFloat(opnameValue) - opnameMember.saldo_buku)}
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {parseFloat(opnameValue) - opnameMember.saldo_buku === 0
                        ? '✅ Fisik Klop dengan Catatan'
                        : parseFloat(opnameValue) - opnameMember.saldo_buku < 0
                        ? '❌ Uang fisik kurang / tekor'
                        : '⚠️ Uang fisik lebih dari catatan'}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowOpnameModal(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                >
                  Simpan Hasil Opname
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Pengaturan & Kelola Tim */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Settings className="w-4 h-4 text-brand-600" />
                <span>Pengaturan & Kelola Anggota</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-6">
              {/* Ubah Plafon */}
              <form onSubmit={handleSavePlafon} className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Plafon Kas Induk (Plafon Awal)</h4>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={plafonForm}
                    onChange={(e) => setPlafonForm(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700"
                  >
                    Simpan Plafon
                  </button>
                </div>
              </form>

              {/* Tambah Anggota */}
              <form onSubmit={handleAddMember} className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tambah Anggota Tim Baru</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Divisi / Pos"
                    value={newMemberForm.divisi}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, divisi: e.target.value })}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                  />
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Uang Fisik Awal (Rp)"
                    value={newMemberForm.uang_fisik}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, uang_fisik: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Tambah Anggota
                  </button>
                </div>
              </form>

              {/* Reset Data Button */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="w-full py-2 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Database ke Data Asli Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 no-print">
        Keuangan Busdev 2026. Aplikasi Rekapitulasi Persekot, Reimbursement & Opname Kas Fisik. Terhubung ke Neon PostgreSQL & Vercel.
      </footer>
    </div>
  );
}
