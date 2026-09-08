'use client';

import React from 'react';

export default function SkeletonCard({ title, showProgress = false }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md p-4 sm:p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        </div>
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
      {showProgress && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-full"></div>
        </div>
      )}
    </div>
  );
}
