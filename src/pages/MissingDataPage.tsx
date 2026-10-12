import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { Modal } from '../components/common/Modal';
import { 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  Upload, 
  Clock, 
  ShieldAlert, 
  Search,
  Filter
} from 'lucide-react';

export const MissingDataPage: React.FC = () => {
  const { missingData, resolveMissingData, setSelectedEmployee, employees } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemToResolve, setSelectedItemToResolve] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  const highSeverity = missingData.filter(m => m.severity === 'عالي').length;
  const mediumSeverity = missingData.filter(m => m.severity === 'متوسط').length;

  const filtered = missingData.filter(item => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeCode.toLowerCase().includes(q) ||
        item.missingField.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemToResolve) {
      resolveMissingData(selectedItemToResolve);
      setSelectedItemToResolve(null);
      setResolveNote('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="متابعة واستيفاء البيانات الناقصة"
        description="حصر وتدقيق مسوغات التعيين والمستندات الرسمية المعلقة (شهادات التجنيد، صحف الحالة الجنائية، وأرقام الحسابات البنكية) لضمان الامتثال الرقابي."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'إدارة النظام' },
          { label: 'البيانات الناقصة' }
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="إجمالي السجلات الناقصة"
          value={missingData.length}
          subtitle="تتطلب متابعة من شؤون العاملين"
          icon={AlertCircle}
          variant="amber"
        />

        <KpiCard
          title="مسوغات عالية الأهمية (حاسمة)"
          value={highSeverity}
          subtitle="تجنيد، فيش جنائي، حسابات بنكية"
          icon={ShieldAlert}
          variant="rose"
        />

        <KpiCard
          title="مستندات روتينية"
          value={mediumSeverity}
          subtitle="شهادات دراسية وإيصالات مرافق"
          icon={FileText}
          variant="blue"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e3056] flex items-center justify-between">
          <div className="relative w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث باسم الموظف أو المستند..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl pr-10 pl-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filtered.length} مستندات معلقة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0d162f] text-slate-400 font-semibold border-b border-[#1e3056]">
              <tr>
                <th className="px-5 py-3.5">كود الموظف</th>
                <th className="px-5 py-3.5">اسم الموظف والقطاع</th>
                <th className="px-5 py-3.5">المستند / البيان الناقص</th>
                <th className="px-5 py-3.5">التصنيف</th>
                <th className="px-5 py-3.5">درجة الأهمية</th>
                <th className="px-5 py-3.5">أيام التأخير</th>
                <th className="px-5 py-3.5 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3056]/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
                    <p className="font-semibold text-slate-200">جميع مسوغات التعيين والبيانات مستوفاة بالكامل!</p>
                  </td>
                </tr>
              ) : (
                filtered.map(item => (
                  <tr key={item.id} className="hover:bg-[#162447]/60 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-400">
                      {item.employeeCode}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-white">{item.employeeName}</div>
                      <div className="text-[11px] text-slate-400">{item.department}</div>
                    </td>
                    <td className="px-5 py-4 font-semibold text-amber-300">
                      {item.missingField}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {item.fieldCategory}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${
                        item.severity === 'عالي'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                      }`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-300">
                      {item.daysOverdue} يوماً
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => setSelectedItemToResolve(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>استيفاء وتوثيق</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolve Modal */}
      <Modal
        isOpen={Boolean(selectedItemToResolve)}
        onClose={() => setSelectedItemToResolve(null)}
        title="استيفاء المستند وتحديث ملف الموظف"
        subtitle="توثيق استلام مسوغ التعيين أو تسجيل رقم الحساب البنكي رسمياً"
        maxWidth="md"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            عند تأكيد الاستيفاء، سيتم إزالة هذا البند من قائمة النواقص، وتحديث حالة ملف الموظف، وتسجيل حركة الاستلام في سجل التدقيق الرقابي.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ملاحظات الاستلام ورقم الحفظ بالأرشيف:
            </label>
            <textarea
              rows={3}
              placeholder="تم استلام أصل المستند ومطابقته وحفظه في ملف الخدمة..."
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e3056]">
            <button
              type="button"
              onClick={() => setSelectedItemToResolve(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950"
            >
              تأكيد الاستيفاء والإغلاق
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
