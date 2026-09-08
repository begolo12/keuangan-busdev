'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Coins, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function KPICard({ title, icon: Icon, value, subValue, trend, accentColor = 'brand', onClick, interactive = false }) {
  const gradientColors = {
    brand: 'from-blue-600 to-blue-500',
    success: 'from-green-600 to-green-500',
    warning: 'from-amber-600 to-orange-500',
    danger: 'from-red-600 to-red-500',
    blue: 'from-sky-600 to-cyan-500',
  };

  const bgColor = {
    brand: 'bg-blue-50 dark:bg-blue-950/20',
    success: 'bg-green-50 dark:bg-green-950/20',
    warning: 'bg-amber-50 dark:bg-amber-950/20',
    danger: 'bg-red-50 dark:bg-red-950/20',
    blue: 'bg-sky-50 dark:bg-sky-950/20',
  };

  const textColor = {
    brand: 'text-brand-primary',
    success: 'text-brand-success',
    warning: 'text-brand-warning',
    danger: 'text-brand-danger',
    blue: 'text-sky-700 dark:text-sky-400',
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 shadow-soft hover:shadow-medium transition-all duration-300 ${interactive ? 'cursor-pointer hover:-translate-y-1' : ''}`}
      onClick={onClick}
    >
      {/* Top accent bar with gradient */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradientColors[accentColor]} rounded-t-2xl opacity-80`}></div>
      
      {/* Background glow effect on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors[accentColor]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              {title}
              <Icon className="w-3.5 h-3.5 opacity-60" />
            </p>
            <p className={`text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1.5 truncate ${interactive ? 'group-hover:text-brand-secondary transition-colors' : ''}`}>
              {value}
            </p>
            {subValue && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{subValue}</p>
            )}
          </div>
          
          {/* Icon badge with gradient background */}
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradientColors[accentColor]} bg-opacity-10 dark:bg-opacity-20 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-5 h-5 ${textColor[accentColor]}`} />
          </div>
        </div>
        
        {/* Progress bar for metrics */}
        {trend !== undefined && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className={`font-medium flex items-center gap-1 ${
                trend >= 0 ? 'text-brand-success' : 'text-brand-danger'
              }`}>
                {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${gradientColors[accentColor]} transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(Math.max(trend, 0), 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Interactive hint */}
        {interactive && (
          <div className="mt-3 flex items-center justify-end text-xs text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Klik untuk detail</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1 rotate-[-45deg]" />
          </div>
        )}
      </div>
    </div>
  );
}
