'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function StatusBadge({ status, size = 'md' }) {
  const statusConfig = {
    seimbang: { icon: CheckCircle2, bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', textColor: 'text-emerald-700 dark:text-emerald-300', label: 'Seimbang' },
    kekurangan: { icon: XCircle, bgColor: 'bg-rose-100 dark:bg-rose-950/40', textColor: 'text-rose-700 dark:text-rose-300', label: 'Kekurangan' },
    berlebihan: { icon: AlertTriangle, bgColor: 'bg-amber-100 dark:bg-amber-950/40', textColor: 'text-amber-700 dark:text-amber-300', label: 'Berlebihan' },
  };

  const config = statusConfig[status];
  if (!config) return null;

  const Icon = config.icon;
  
  const sizeClasses = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm', lg: 'px-3 py-1.5 text-base' };

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${sizeClasses[size]} ${config.bgColor} ${config.textColor}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </span>
  );
}
