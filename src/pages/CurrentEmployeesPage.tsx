import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DEPARTMENTS } from '../data/mockData';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ShieldAlert, 
  Building2, 
  UserPlus, 
  Phone, 
  Mail,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const CurrentEmployeesPage: React.FC = () => {
  const { employees, setSelectedEmployee, setActivePage } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [missingDataOnly, setMissingDataOnly] = useState(false);

  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'active');
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter(emp => {
      if (departmentFilter !== 'ALL' && emp.department !== departmentFilter) {
        return false;
      }
      if (missingDataOnly && !emp.hasMissingData) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = emp.name.toLowerCase().includes(query);
        const matchesCode = emp.code.toLowerCase().includes(query);
        const matchesNational = emp.nationalId.includes(query);
        const matchesPhone = emp.phone.includes(query);
        if (!matchesName && !matchesCode && !matchesNational && !matchesPhone) {
          return false;
        }
      }
      return true;
    });
  }, [activeEmployees, departmentFilter, missingDataOnly, searchQuery]);

  const totalSalaries = activeEmployees.reduce((sum, e) => sum + e.salary, 0);
  const avgSalary = Math.round(totalSalaries / (activeEmployees.length || 1));
  const missingCount = activeEmployees.filter(e => e.hasMissingData).length;

  const handleExport = () => {
    const headers = ['كود الموظف', 'الاسم', 'الرقم القومي', 'القطاع', 'المسمى الوظيفي', 'تاريخ التعيين', 'الهاتف', 'رصيد الإجازات'].join(',');
    const rows = filteredEmployees.map(e => 
      `"${e.code}","${e.name}","${e.nationalId}","${e.department}","${e.jobTitle}","${e.joinDate}","${e.phone}","${e.remainingLeaveDays}"`
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `current-employees-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل الموظفين الحاليين"
        description="استعراض وإدارة بيانات القوة العاملة النشطة بقطاعات شركة إنتركوم والبنك الأهلي، مع تفاصيل العقود ورصيد الإجازات ومسوغات التعيين."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'الموظفون' },
          { label: 'الموظفون الحاليون' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3.5 py-2 rounded-xl bg-[#162447] hover:bg-[#1c2e59] text-slate-200 text-xs font-semibold border border-[#233558] transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>تصدير (CSV)</span>
            </button>
            <button
              onClick={() => setActivePage('employees-new')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف</span>
            </button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="إجمالي القوة النشطة"
          value={activeEmployees.length}
          subtitle="على رأس العمل بجميع القطاعات"
          icon={Users}
          variant="blue"
        />

        <KpiCard
          title="متوسط الأجور والرواتب"
          value={`${avgSalary.toLocaleString()} ج.م`}
          subtitle="متوسط الراتب الأساسي الشهري"
          icon={Building2}
          variant="emerald"
        />

        <KpiCard
          title="ملفات تحتاج استيفاء بيانات"
          value={missingCount}
          subtitle="مستندات أو حسابات بنكية معلقة"
          icon={ShieldAlert}
          variant="amber"
          isActive={missingDataOnly}
          onClick={() => setMissingDataOnly(!missingDataOnly)}
          clickableHint="تصفية السجلات الناقصة فقط"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث بالاسم، الكود، الرقم القومي، أو الهاتف..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

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

          <button
            onClick={() => setMissingDataOnly(!missingDataOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
              missingDataOnly 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : 'bg-[#0d162f] text-slate-300 border-[#1e3056] hover:text-white'
            }`}
          >
            بيانات ناقصة فقط
          </button>

          {(searchQuery || departmentFilter !== 'ALL' || missingDataOnly) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDepartmentFilter('ALL');
                setMissingDataOnly(false);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              إعادة ضبط
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0d162f] text-slate-400 uppercase tracking-wider font-semibold border-b border-[#1e3056]">
              <tr>
                <th className="px-5 py-3.5">كود الموظف</th>
                <th className="px-5 py-3.5">الاسم والرقم القومي</th>
                <th className="px-5 py-3.5">القطاع والوظيفة</th>
                <th className="px-5 py-3.5">تاريخ التعيين</th>
                <th className="px-5 py-3.5">الهاتف والتواصل</th>
                <th className="px-5 py-3.5">رصيد الإجازات</th>
                <th className="px-5 py-3.5">اكتمال الملف</th>
                <th className="px-5 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3056]/60">
              {filteredEmployees.map(emp => (
                <tr
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className="hover:bg-[#162447]/60 transition-colors cursor-pointer group"
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
                    <div className="text-slate-200 font-semibold">{emp.department}</div>
                    <div className="text-[11px] text-slate-400">{emp.jobTitle}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-300">
                    {emp.joinDate}
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-300 text-[11px]">
                    <div>{emp.phone}</div>
                    <div className="text-slate-400 text-[10px] truncate max-w-[140px]">{emp.email}</div>
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-blue-300">
                    {emp.remainingLeaveDays} <span className="text-[10px] font-normal text-slate-400 font-sans">يوماً</span>
                  </td>
                  <td className="px-5 py-4">
                    {emp.hasMissingData ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <ShieldAlert className="w-3 h-3" />
                        <span>ناقص</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>مكتمل</span>
                      </span>
                    )}
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 bg-[#0d162f] border-t border-[#1e3056] text-xs text-slate-400 flex items-center justify-between">
          <span className="font-mono">
            عرض {filteredEmployees.length} من أصل {activeEmployees.length} موظف
          </span>
          <span className="text-[11px]">
            شؤون العاملين · تحديث دوري مباشر
          </span>
        </div>
      </div>
    </div>
  );
};
