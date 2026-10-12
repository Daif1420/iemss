import React from 'react';
import { RequestStatus } from '../../types';

interface StatusBadgeProps {
  status: RequestStatus | 'حاضر' | 'متأخر' | 'غياب' | 'إذن' | 'إجازة' | 'نشط' | 'جديد' | 'مغادر';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'approved':
      case 'حاضر':
      case 'نشط':
        return {
          label: status === 'approved' ? 'مقبول' : status,
          className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        };
      case 'pending':
      case 'متأخر':
      case 'إذن':
      case 'جديد':
        return {
          label: status === 'pending' ? 'قيد المراجعة' : status,
          className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        };
      case 'rejected':
      case 'غياب':
      case 'مغادر':
        return {
          label: status === 'rejected' ? 'مرفوض' : status,
          className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        };
      case 'إجازة':
        return {
          label: 'إجازة رسمية',
          className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
        };
      default:
        return {
          label: String(status),
          className: 'bg-slate-700/20 text-slate-300 border border-slate-700/40'
        };
    }
  };

  const { label, className } = getBadgeStyle();
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-md whitespace-nowrap ${padding} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{label}</span>
    </span>
  );
};
