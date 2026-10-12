import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { 
  FileSpreadsheet, 
  Search, 
  ShieldCheck, 
  Download, 
  Clock, 
  User, 
  Globe
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.target.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExport = () => {
    const headers = ['التوقيت', 'المستخدم', 'الدور الوظيفي', 'الإجراء', 'الهدف', 'التفاصيل', 'عنوان IP'].join(',');
    const rows = filteredLogs.map(l => 
      `"${l.timestamp}","${l.userName}","${l.userRole}","${l.action}","${l.target}","${l.details}","${l.ipAddress}"`
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل التدقيق والعمليات الرقابية"
        description="سجل غير قابل للتعديل يوثق جميع الأنشطة والاعتمادات والتعديلات المنفذة على النظام، متوافق مع معايير الحوكمة والبنك المركزي."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'إدارة النظام' },
          { label: 'سجل التدقيق' }
        ]}
        actions={
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-[#162447] hover:bg-[#1c2e59] text-slate-200 text-xs font-semibold border border-[#233558] transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>تصدير السجل الرقابي (CSV)</span>
          </button>
        }
      />

      {/* Table */}
      <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e3056] flex items-center justify-between">
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث بالمستخدم، الإجراء، أو التفاصيل..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl pr-10 pl-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredLogs.length} حركات مسجلة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0d162f] text-slate-400 font-semibold border-b border-[#1e3056]">
              <tr>
                <th className="px-5 py-3.5">التوقيت والتاريخ</th>
                <th className="px-5 py-3.5">المستخدم المسؤول</th>
                <th className="px-5 py-3.5">نوع الإجراء</th>
                <th className="px-5 py-3.5">السجل المستهدف</th>
                <th className="px-5 py-3.5">تفاصيل الحركة</th>
                <th className="px-5 py-3.5">عنوان الشبكة (IP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3056]/60 font-mono">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#162447]/60 transition-colors">
                  <td className="px-5 py-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-5 py-3.5 font-sans">
                    <div className="font-bold text-white">{log.userName}</div>
                    <div className="text-[10px] text-slate-400">{log.userRole}</div>
                  </td>
                  <td className="px-5 py-3.5 font-sans">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-200 font-sans font-semibold">
                    {log.target}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-sans max-w-sm text-[11px]">
                    {log.details}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
