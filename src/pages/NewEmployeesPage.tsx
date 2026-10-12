import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { Modal } from '../components/common/Modal';
import { DEPARTMENTS } from '../data/mockData';
import { 
  UserPlus, 
  Clock, 
  FileCheck, 
  Search, 
  Building2, 
  Eye, 
  Calendar, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const NewEmployeesPage: React.FC = () => {
  const { employees, addEmployee, setSelectedEmployee } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmpForm, setNewEmpForm] = useState({
    name: '',
    code: `EMP-${Math.floor(1100 + Math.random() * 100)}`,
    nationalId: '',
    department: DEPARTMENTS[0],
    jobTitle: '',
    phone: '',
    email: '',
    salary: 15000,
    manager: 'أحمد منصور'
  });

  const newEmployees = employees.filter(e => e.status === 'new');

  const filtered = newEmployees.filter(e => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q) || e.department.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpForm.name.trim() || !newEmpForm.jobTitle.trim()) return;

    addEmployee({
      code: newEmpForm.code,
      name: newEmpForm.name,
      nationalId: newEmpForm.nationalId || '29901011200000',
      department: newEmpForm.department,
      jobTitle: newEmpForm.jobTitle,
      status: 'new',
      joinDate: new Date().toISOString().slice(0, 10),
      phone: newEmpForm.phone || '01000000000',
      email: newEmpForm.email || `${newEmpForm.code.toLowerCase()}@intercom-corp.com`,
      manager: newEmpForm.manager,
      salary: Number(newEmpForm.salary),
      remainingLeaveDays: 21,
      hasMissingData: true,
      missingDataItems: ['شهادة المؤهل الدراسي', 'صحيفة الحالة الجنائية']
    });

    setIsAddModalOpen(false);
    setNewEmpForm({
      name: '',
      code: `EMP-${Math.floor(1100 + Math.random() * 100)}`,
      nationalId: '',
      department: DEPARTMENTS[0],
      jobTitle: '',
      phone: '',
      email: '',
      salary: 15000,
      manager: 'أحمد منصور'
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="الموظفون الجدد وفترة الاختبار"
        description="متابعة تعيينات الموظفين الجدد، مسار التدريب والتأهيل المصرفي، واكتمال مسوغات التعيين الرسمية خلال فترة الاختبار القانونية (3 أشهر)."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'الموظفون' },
          { label: 'الموظفون الجدد' }
        ]}
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>تسجيل موظف جديد</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="الموظفون الجدد (تحت الاختبار)"
          value={newEmployees.length}
          subtitle="خلال الـ 90 يوماً الماضية"
          icon={UserPlus}
          variant="blue"
        />

        <KpiCard
          title="اكتمال مسوغات التعيين"
          value="67%"
          subtitle="مستندات رسمية قيد الفحص والتوثيق"
          icon={FileCheck}
          variant="emerald"
        />

        <KpiCard
          title="متوسط مدة التأهيل"
          value="45 يوماً"
          subtitle="من إجمالي 90 يوماً فترة الاختبار"
          icon={Clock}
          variant="amber"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e3056] flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث بالاسم أو القطاع..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl pr-10 pl-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filtered.length} موظف جديد
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0d162f] text-slate-400 font-semibold border-b border-[#1e3056]">
              <tr>
                <th className="px-5 py-3.5">كود الموظف</th>
                <th className="px-5 py-3.5">اسم الموظف</th>
                <th className="px-5 py-3.5">القطاع والوظيفة</th>
                <th className="px-5 py-3.5">تاريخ بدء العمل</th>
                <th className="px-5 py-3.5">المدير المباشر</th>
                <th className="px-5 py-3.5">مسوغات التعيين</th>
                <th className="px-5 py-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3056]/60">
              {filtered.map(emp => (
                <tr
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  className="hover:bg-[#162447]/60 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4 font-mono font-bold text-blue-400">
                    {emp.code}
                  </td>
                  <td className="px-5 py-4 font-bold text-white group-hover:text-blue-300">
                    {emp.name}
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-slate-200 font-semibold">{emp.department}</div>
                    <div className="text-[11px] text-slate-400">{emp.jobTitle}</div>
                  </td>
                  <td className="px-5 py-4 font-mono text-emerald-300">
                    {emp.joinDate}
                  </td>
                  <td className="px-5 py-4 text-slate-300">
                    {emp.manager}
                  </td>
                  <td className="px-5 py-4">
                    {emp.hasMissingData ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        <AlertCircle className="w-3 h-3" />
                        <span>بانتظار مستندات</span>
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
                    >
                      <Eye className="w-4 h-4 text-blue-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة موظف جديد للنظام"
        subtitle="تسجيل البيانات الأولية وإصدار كود الموظف وبدء فترة الاختبار"
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم الموظف رباعي:</label>
              <input
                type="text"
                required
                placeholder="الاسم الرباعي كاملاً"
                value={newEmpForm.name}
                onChange={e => setNewEmpForm({ ...newEmpForm, name: e.target.value })}
                className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">كود الموظف:</label>
              <input
                type="text"
                required
                value={newEmpForm.code}
                onChange={e => setNewEmpForm({ ...newEmpForm, code: e.target.value })}
                className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">الرقم القومي (14 رقم):</label>
              <input
                type="text"
                maxLength={14}
                placeholder="29XXXXXXXXXXXX"
                value={newEmpForm.nationalId}
                onChange={e => setNewEmpForm({ ...newEmpForm, nationalId: e.target.value })}
                className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">القطاع / الإدارة:</label>
              <select
                value={newEmpForm.department}
                onChange={e => setNewEmpForm({ ...newEmpForm, department: e.target.value })}
                className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">المسمى الوظيفي:</label>
              <input
                type="text"
                required
                placeholder="مثال: أخصائي عمليات مصرفية"
                value={newEmpForm.jobTitle}
                onChange={e => setNewEmpForm({ ...newEmpForm, jobTitle: e.target.value })}
                className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">الراتب الأساسي:</label>
              <input
                type="number"
                value={newEmpForm.salary}
                onChange={e => setNewEmpForm({ ...newEmpForm, salary: Number(e.target.value) })}
                className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف:</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={newEmpForm.phone}
                onChange={e => setNewEmpForm({ ...newEmpForm, phone: e.target.value })}
                className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">المدير المباشر:</label>
              <input
                type="text"
                value={newEmpForm.manager}
                onChange={e => setNewEmpForm({ ...newEmpForm, manager: e.target.value })}
                className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1e3056]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/40"
            >
              حفظ الموظف وبدء الملف
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
