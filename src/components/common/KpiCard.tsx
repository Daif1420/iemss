import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  isActive?: boolean;
  onClick?: () => void;
  clickableHint?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  isActive = false,
  onClick,
  clickableHint
}) => {
  const variantStyles = {
    blue: {
      borderActive: 'border-blue-500 ring-1 ring-blue-500/30',
      iconBg: 'bg-blue-500/10 text-blue-400',
      valueColor: 'text-blue-100',
      badgeBg: 'bg-blue-500/20 text-blue-300'
    },
    emerald: {
      borderActive: 'border-emerald-500 ring-1 ring-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      valueColor: 'text-emerald-100',
      badgeBg: 'bg-emerald-500/20 text-emerald-300'
    },
    amber: {
      borderActive: 'border-amber-500 ring-1 ring-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400',
      valueColor: 'text-amber-100',
      badgeBg: 'bg-amber-500/20 text-amber-300'
    },
    rose: {
      borderActive: 'border-rose-500 ring-1 ring-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-400',
      valueColor: 'text-rose-100',
      badgeBg: 'bg-rose-500/20 text-rose-300'
    },
    indigo: {
      borderActive: 'border-indigo-500 ring-1 ring-indigo-500/30',
      iconBg: 'bg-indigo-500/10 text-indigo-400',
      valueColor: 'text-indigo-100',
      badgeBg: 'bg-indigo-500/20 text-indigo-300'
    },
    slate: {
      borderActive: 'border-slate-400 ring-1 ring-slate-400/30',
      iconBg: 'bg-slate-700/30 text-slate-300',
      valueColor: 'text-slate-100',
      badgeBg: 'bg-slate-700/40 text-slate-300'
    }
  };

  const style = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={e => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative p-5 rounded-xl transition-all duration-200 border text-right select-none ${
        isActive 
          ? `bg-[#16274e] ${style.borderActive} shadow-lg shadow-blue-950/40`
          : 'bg-[#111c38] border-[#1e3056] hover:border-slate-600/70 hover:bg-[#142244]'
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="p-2.5 rounded-lg shrink-0 ${style.iconBg}">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 truncate mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight tabular-nums font-mono ${style.valueColor}`}>
              {value}
            </span>
            {isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                محدد
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {clickableHint && !isActive && (
        <div className="mt-2.5 pt-2 border-t border-slate-700/30 text-[10px] text-slate-400 flex items-center justify-between">
          <span>{clickableHint}</span>
          <span className="text-blue-400 font-mono text-[9px]">اضغط للتصفية</span>
        </div>
      )}
    </div>
  );
};
