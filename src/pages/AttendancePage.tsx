import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DEPARTMENTS } from '../data/mockData';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Download, 
  Calendar,
  Filter
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { attendance, setSelectedEmployee, employees } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const presentCount = attendance.filter(a => a.status === 'حاضر').length;
  const lateCount = attendance.filter(a => a.status === 'متأخر').length;
  const absentCount = attendance.filter(a => a.status === 'غياب').length;

  const filteredAttendance = useMemo(() => {
    return attendance.filter(record => {
      if (statusFilter !== 'ALL' && record.status !== statusFilter) {
        return false;
      }
      if (departmentFilter !== 'ALL' && record.department !== departmentFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return record.employeeName.toLowerCase().includes(q) || record.employeeCode.toLowerCase().includes(q);
      }
      return true;
    });
  }, [attendance, statusFilter, departmentFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل الحضور والانصراف اليومي"
        description="متابعة تسجيل بصمة الحضور والانصراف اللحظية، حساب ساعات العمل الفعلية، ورصد دقائق التأخير والغياب بالورديات."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'الحضور والانصراف' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono bg-[#0d162f] px-3 py-2 rounded-xl border border-[#1e3056]">
              تاريخ اليوم: 2026-10-12
            </span>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="إجمالي الحاضرين في الموعد"
          value={presentCount}
          subtitle="حضور قبل 08:30 ص"
          icon={CheckCircle2}
          variant="emerald"
          isActive={statusFilter === 'حاضر'}
          onClick={() => setStatusFilter(statusFilter === 'حاضر' ? 'ALL' : 'حاضر')}
          clickableHint="تصفية الحاضرين فقط"
        />

        <KpiCard
          title="حالات التأخير الصباحي"
          value={lateCount}
          subtitle="تجاوز مهلة السماح (15 دقيقة)"
          icon={AlertTriangle}
          variant="amber"
          isActive={statusFilter === 'متأخر'}
          onClick={() => setStatusFilter(statusFilter === 'متأخر' ? 'ALL' : 'متأخر')}
          clickableHint="تصفية المتأخرين فقط"
        />

        <KpiCard
          title="حالات الغياب غير المبرر"
          value={absentCount}
          subtitle="بدون إذن أو إجازة معتمدة"
          icon={XCircle}
          variant="rose"
          isActive={statusFilter === 'غياب'}
          onClick={() => setStatusFilter(statusFilter === 'غياب' ? 'ALL' : 'غياب')}
          clickableHint="تصفية الغائبين فقط"
        />

        <KpiCard
          title="معدل الالتزام بالوردية"
          value="90%"
          subtitle="مؤشر الانضباط العام لليوم"
          icon={Clock}
          variant="blue"
        />
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث باسم الموظف أو الكود..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl pr-10 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">جميع القطاعات</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="حاضر">حاضر</option>
            <option value="متأخر">متأخر</option>
            <option value="غياب">غياب</option>
          </select>

          {(searchQuery || departmentFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDepartmentFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
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
            <thead className="bg-[#0d162f] text-slate-400 font-semibold border-b border-[#1e3056]">
              <tr>
                <th className="px-5 py-3.5">كود الموظف</th>
                <th className="px-5 py-3.5">اسم الموظف</th>
                <th className="px-5 py-3.5">القطاع</th>
                <th className="px-5 py-3.5">وقت الحضور</th>
                <th className="px-5 py-3.5">وقت الانصراف</th>
                <th className="px-5 py-3.5">دقائق التأخير</th>
                <th className="px-5 py-3.5">ساعات العمل</th>
                <th className="px-5 py-3.5">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3056]/60">
              {filteredAttendance.map(record => (
                <tr
                  key={record.id}
                  onClick={() => {
                    const matched = employees.find(e => e.code === record.employeeCode);
                    if (matched) setSelectedEmployee(matched);
                  }}
                  className="hover:bg-[#162447]/60 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4 font-mono font-bold text-blue-400">
                    {record.employeeCode}
                  </td>
                  <td className="px-5 py-4 font-bold text-white group-hover:text-blue-300">
                    {record.employeeName}
                  </td>
                  <td className="px-5 py-4 text-slate-200">
                    {record.department}
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-300">
                    {record.checkIn}
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-300">
                    {record.checkOut}
                  </td>
                  <td className="px-5 py-4 font-mono">
                    {record.delayMinutes > 0 ? (
                      <span className="text-amber-400 font-bold">{record.delayMinutes} دقيقة</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-slate-200">
                    {record.workHours > 0 ? `${record.workHours} س` : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={record.status} />
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
