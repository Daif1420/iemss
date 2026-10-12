import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DepartureReason, Employee } from '../types';
import { DEPARTMENTS } from '../data/mockData';
import { 
  UserMinus, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  ArrowUpDown, 
  Eye, 
  Briefcase,
  AlertOctagon,
  Clock,
  UserX,
  FileCheck2,
  Award,
  HelpCircle,
  X
} from 'lucide-react';

export const DepartedEmployeesPage: React.FC = () => {
  const { employees, setSelectedEmployee } = useApp();

  // Departure reason filter state (supports clicking KPI cards as specified in Section 7.1)
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<DepartureReason | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');

  // Base departed employees dataset
  const allDepartedEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'left');
  }, [employees]);

  // Actual departure reasons present in the system
  const departureReasonsList: DepartureReason[] = [
    'استقالة',
    'كثرة الغياب',
    'انتهاء العقد',
    'مخالفة لوائح العمل',
    'التقاعد',
    'أخرى'
  ];

  // Map icons and color variants for each specific reason
  const reasonConfig: Record<DepartureReason, { icon: any; variant: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate'; subtitle: string }> = {
    'استقالة': { icon: Briefcase, variant: 'blue', subtitle: 'استقالة برغبة الموظف' },
    'كثرة الغياب': { icon: Clock, variant: 'amber', subtitle: 'تجاوز حد الغياب القانوني' },
    'انتهاء العقد': { icon: FileCheck2, variant: 'indigo', subtitle: 'انتهاء العقد محدد المدة' },
    'مخالفة لوائح العمل': { icon: AlertOctagon, variant: 'rose', subtitle: 'قرارات لجنة الانضباط' },
    'التقاعد': { icon: Award, variant: 'emerald', subtitle: 'بلوغ السن القانونية' },
    'أخرى': { icon: HelpCircle, variant: 'slate', subtitle: 'انتداب أو أسباب أخرى' }
  };

  // Filtered dataset considering search, department, and year filters
  const contextFilteredDeparted = useMemo(() => {
    return allDepartedEmployees.filter(emp => {
      // Department filter
      if (departmentFilter !== 'ALL' && emp.department !== departmentFilter) {
        return false;
      }
      // Year filter (based on leaveDate)
      if (yearFilter !== 'ALL' && emp.leaveDate && !emp.leaveDate.startsWith(yearFilter)) {
        return false;
      }
      // Search query (name, code, or nationalId)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(query);
        const matchesCode = emp.code.toLowerCase().includes(query);
        const matchesNational = emp.nationalId.includes(query);
        const matchesNotes = emp.leaveNotes?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesCode && !matchesNational && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [allDepartedEmployees, departmentFilter, yearFilter, searchQuery]);

  // Calculate actual counts for each KPI card based on context
  const reasonCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    departureReasonsList.forEach(r => {
      counts[r] = contextFilteredDeparted.filter(e => e.leaveReason === r).length;
    });
    return counts;
  }, [contextFilteredDeparted, departureReasonsList]);

  // Total departed count matching current context filters
  const totalFilteredCount = contextFilteredDeparted.length;

  // Final table items also filtered by the active KPI reason card if selected
  const displayedEmployees = useMemo(() => {
    if (selectedReasonFilter === 'ALL') {
      return contextFilteredDeparted;
    }
    return contextFilteredDeparted.filter(emp => emp.leaveReason === selectedReasonFilter);
  }, [contextFilteredDeparted, selectedReasonFilter]);

  // KPI card click handlers according to Section 7.1
  const handleKpiClick = (reason: DepartureReason | 'ALL') => {
    if (reason === 'ALL') {
      setSelectedReasonFilter('ALL');
    } else {
      // Toggle if already selected, or select
      if (selectedReasonFilter === reason) {
        setSelectedReasonFilter('ALL');
      } else {
        setSelectedReasonFilter(reason);
      }
    }
  };

  const handleExport = () => {
    // Generate CSV content
    const headers = ['كود الموظف', 'الاسم', 'القطاع', 'المسمى الوظيفي', 'تاريخ المغادرة', 'سبب المغادرة', 'ملاحظات'].join(',');
    const rows = displayedEmployees.map(e => 
      `"${e.code}","${e.name}","${e.department}","${e.jobTitle}","${e.leaveDate || ''}","${e.leaveReason || ''}","${e.leaveNotes || ''}"`
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `departed-employees-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="سجل الموظفون المغادرون"
        description="استعراض مؤشرات وحالات إنهاء الخدمة للموظفين المغادرين، مع بطاقات KPI تفاعلية لتصنيف أسباب المغادرة الفعلية وأدوات التدقيق والتصدير."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'الموظفون' },
          { label: 'الموظفون المغادرون' }
        ]}
        actions={
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-[#162447] hover:bg-[#1c2e59] text-slate-200 text-xs font-semibold border border-[#233558] transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>تصدير البيانات (CSV)</span>
          </button>
        }
      />

      {/* Section 7.1: Interactive KPI Cards Row */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">مؤشرات تصنيف المغادرين (اضغط على أي بطاقة لتصفية الجدول أدناه):</span>
          {selectedReasonFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedReasonFilter('ALL')}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>إلغاء التصفية وإظهار الجميع</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* 1. Total Departed Card */}
          <KpiCard
            title="إجمالي المغادرين"
            value={totalFilteredCount}
            subtitle="العدد الكلي للنتائج الحالية"
            icon={UserMinus}
            variant="blue"
            isActive={selectedReasonFilter === 'ALL'}
            onClick={() => handleKpiClick('ALL')}
            clickableHint="عرض جميع الحالات"
          />

          {/* 2. One KPI Card per actual departure reason present in system */}
          {departureReasonsList.map(reason => {
            const config = reasonConfig[reason];
            const count = reasonCounts[reason] || 0;
            return (
              <KpiCard
                key={reason}
                title={reason}
                value={count}
                subtitle={config.subtitle}
                icon={config.icon}
                variant={config.variant}
                isActive={selectedReasonFilter === reason}
                onClick={() => handleKpiClick(reason)}
                clickableHint={`تصفية حسب: ${reason}`}
              />
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-md space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث بالاسم، الكود، الرقم القومي، أو سبب المغادرة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">جميع القطاعات</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">جميع السنوات</option>
              <option value="2026">سنة 2026</option>
              <option value="2025">سنة 2025</option>
              <option value="2024">سنة 2024</option>
            </select>

            {(searchQuery || departmentFilter !== 'ALL' || yearFilter !== 'ALL' || selectedReasonFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDepartmentFilter('ALL');
                  setYearFilter('ALL');
                  setSelectedReasonFilter('ALL');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                title="إعادة ضبط الفلاتر"
              >
                إعادة ضبط
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Indicators */}
        {selectedReasonFilter !== 'ALL' && (
          <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400">التصفية النشطة:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
              <span>سبب المغادرة: {selectedReasonFilter}</span>
              <button
                onClick={() => setSelectedReasonFilter('ALL')}
                className="hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
            <span className="text-slate-400 text-[11px] font-mono mr-auto">
              عرض {displayedEmployees.length} من إجمالي {totalFilteredCount} موظف مغادر
            </span>
          </div>
        )}
      </div>

      {/* Departed Employees Table */}
      <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0d162f] text-slate-400 uppercase tracking-wider font-semibold border-b border-[#1e3056]">
              <tr>
                <th className="px-5 py-3.5">كود الموظف</th>
                <th className="px-5 py-3.5">اسم الموظف</th>
                <th className="px-5 py-3.5">القطاع والوظيفة</th>
                <th className="px-5 py-3.5">تاريخ التعيين</th>
                <th className="px-5 py-3.5">تاريخ المغادرة</th>
                <th className="px-5 py-3.5">سبب المغادرة</th>
                <th className="px-5 py-3.5">ملاحظات وقرار المغادرة</th>
                <th className="px-5 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3056]/60">
              {displayedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <UserMinus className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-400" />
                    <p className="font-semibold text-slate-300">لا توجد سجلات مغادرين مطابقة للفلاتر المحددة</p>
                    <p className="text-[11px] text-slate-400 mt-1">جرّب تغيير فلاتر البحث أو النقر على "إجمالي المغادرين" لإظهار الكل.</p>
                  </td>
                </tr>
              ) : (
                displayedEmployees.map(emp => (
                  <tr 
                    key={emp.id}
                    className="hover:bg-[#162447]/60 transition-colors cursor-pointer group"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <td className="px-5 py-4 font-mono font-bold text-blue-400">
                      {emp.code}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-white group-hover:text-blue-300 transition-colors">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {emp.nationalId}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-200 font-medium">{emp.department}</div>
                      <div className="text-[11px] text-slate-400">{emp.jobTitle}</div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-300">
                      {emp.joinDate}
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-rose-300">
                      {emp.leaveDate || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        {emp.leaveReason || 'مغادر'}
                      </span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-slate-300 line-clamp-2 leading-relaxed text-[11px]">
                        {emp.leaveNotes || 'تم استيفاء إخلاء الطرف وصرف المستحقات.'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployee(emp);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
                        title="عرض الملف الكامل"
                      >
                        <Eye className="w-4 h-4 text-blue-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="px-5 py-3.5 bg-[#0d162f] border-t border-[#1e3056] text-xs text-slate-400 flex items-center justify-between">
          <span className="font-mono">
            إجمالي السجلات المعروضة: <strong>{displayedEmployees.length}</strong> من أصل {allDepartedEmployees.length} مغادر
          </span>
          <span className="text-[11px]">
            جميع البيانات مستمدة من سجلات إنهاء الخدمة الرسمية بالنظام
          </span>
        </div>
      </div>
    </div>
  );
};
