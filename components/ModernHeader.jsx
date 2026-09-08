'use client';

import React from 'react';
import { Wallet, Plus, FileSpreadsheet, Printer, Settings, Sun, Moon, Search, Bell } from 'lucide-react';

export default function ModernHeader({ onNewTx, darkMode, toggleDarkMode, title = "Keuangan Busdev", subtitle, year = "2026" }) {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-brand-primary to-slate-800 text-white sticky top-0 z-50 shadow-soft">
      {/* Top decorative bar */}
      <div className="h-1 bg-gradient-to-r from-brand-success via-brand-accent to-brand-secondary"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Branding */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <div className="relative group cursor-pointer hover:scale-105 transition-transform duration-200">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-2 ring-white/20 group-hover:ring-brand-success/50 shadow-lg">
                <Wallet className="w-6 h-6 text-brand-success" />
              </div>
            </div>
            
            <div className="hidden sm:block">
              <h1 className="text-lg font-extrabold tracking-tight leading-tight">{title}</h1>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {subtitle || 'Rekapitulasi Persekot & Audit Kas Fisik'} • Tahun {year}
              </p>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-success transition-colors" />
            <input
              type="text"
              placeholder="Cari transaksi, anggota, atau kategori..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-success focus:bg-white/15 transition-all text-sm"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-mono rounded bg-white/10 text-slate-400 hidden xl:inline-block">Ctrl+F</kbd>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button onClick={onNewTx} className="inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-brand-success text-white hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/30 group flex-shrink-0">
              <Plus className="w-4 h-4 mr-1.5 group-hover:-rotate-90 transition-transform duration-200" />
              <span className="hidden sm:inline">Catat Transaksi</span>
              <span className="sm:hidden">+ Catat</span>
            </button>

            <div className="relative group">
              <div className="flex items-center gap-1 p-1">
                <a href="/api/export-excel" download className="p-2.5 text-slate-300 hover:text-brand-success hover:bg-white/10 rounded-xl transition-all" title="Unduh Excel">
                  <FileSpreadsheet className="w-5 h-5" />
                </a>
                <button onClick={() => window.print()} className="p-2.5 text-slate-300 hover:text-brand-success hover:bg-white/10 rounded-xl transition-all" title="Cetak Laporan"><Printer className="w-5 h-5" /></button>
                <button onClick={() => document.dispatchEvent(new CustomEvent('openSettings'))} className="p-2.5 text-slate-300 hover:text-brand-success hover:bg-white/10 rounded-xl transition-all" title="Pengaturan"><Settings className="w-5 h-5" /></button>
                <button onClick={toggleDarkMode} className="p-2.5 text-slate-300 hover:text-brand-warning hover:bg-white/10 rounded-xl transition-all ml-1" title="Ganti Tema">
                  {darkMode ? <Sun className="w-5 h-5 text-brand-warning drop-shadow-lg" /> : <Moon className="w-5 h-5 text-brand-accent drop-shadow-lg" />}
                </button>
                <button className="relative p-2.5 text-slate-300 hover:text-brand-danger hover:bg-white/10 rounded-xl transition-all ml-1">
                  <Bell className="w-5 h-5" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-danger rounded-full animate-pulse"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Sistem Rekapitulasi Dana Persekot & Opname Kas Fisik</span>
          <span className="hidden sm:inline">v1.0.0 | Next.js + Neon PostgreSQL</span>
        </div>
      </div>
    </header>
  );
}
