import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs = [{ label: 'الرئيسية' }],
  actions
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#1e3056]">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />}
                {crumb.onClick ? (
                  <button
                    onClick={crumb.onClick}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className={idx === breadcrumbs.length - 1 ? 'text-slate-200' : 'text-slate-400'}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
