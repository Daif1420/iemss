import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  Users, 
  Save, 
  AlertCircle 
} from 'lucide-react';

export const PermissionsPage: React.FC = () => {
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Matrix of roles & capabilities
  const [matrix, setMatrix] = useState([
    { module: 'شؤون الموظفين والعقود', admin: true, hr: true, supervisor: false, employee: false },
    { module: 'إنشاء طلبات الإجازات والأذونات', admin: true, hr: true, supervisor: true, employee: true },
    { module: 'اعتماد وقبول طلبات الإجازات', admin: true, hr: true, supervisor: true, employee: false },
    { module: 'رفض الطلبات وإبداء الأسباب', admin: true, hr: true, supervisor: true, employee: false },
    { module: 'تسجيل وبصمة الحضور والانصراف', admin: true, hr: true, supervisor: true, employee: true },
    { module: 'تعديل سجلات البصمة يدوياً', admin: true, hr: true, supervisor: false, employee: false },
    { module: 'تصدير التقارير الرسمية والشيتات', admin: true, hr: true, supervisor: true, employee: false },
    { module: 'استيراد شيتات الإكسيل الجماعية', admin: true, hr: true, supervisor: false, employee: false },
    { module: 'استيفاء وتعديل مسوغات التعيين', admin: true, hr: true, supervisor: false, employee: false },
    { module: 'الاطلاع على سجل التدقيق الرقابي', admin: true, hr: false, supervisor: false, employee: false },
    { module: 'تعديل الصلاحيات والمستخدمين', admin: true, hr: false, supervisor: false, employee: false }
  ]);

  const togglePerm = (moduleIndex: number, role: 'admin' | 'hr' | 'supervisor' | 'employee') => {
    setMatrix(prev => prev.map((item, idx) => {
      if (idx === moduleIndex) {
        return { ...item, [role]: !item[role] };
      }
      return item;
    }));
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة الصلاحيات ومصفوفة الأدوار"
        description="ضبط سياسات الوصول والتحكم في صلاحيات مسؤولي الموارد البشرية، المشرفين، والموظفين وفق معايير الأمن السيبراني المصرفي."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'إدارة النظام' },
          { label: 'الصلاحيات' }
        ]}
        actions={
          <button
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>حفظ تعديلات المصفوفة</span>
          </button>
        }
      />

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>تم حفظ وتطبيق تحديثات مصفوفة الصلاحيات بنجاح.</span>
        </div>
      )}

      {/* Permissions Matrix Table */}
      <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0d162f] text-slate-400 font-semibold border-b border-[#1e3056]">
              <tr>
                <th className="px-5 py-4 w-1/3">الوحدة / الوظيفة الإدارية</th>
                <th className="px-5 py-4 text-center">المسؤول العام (Admin)</th>
                <th className="px-5 py-4 text-center">أخصائي الموارد البشرية (HR)</th>
                <th className="px-5 py-4 text-center">مشرف الفريق (Supervisor)</th>
                <th className="px-5 py-4 text-center">الموظف العادي (Employee)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3056]/60">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#162447]/60 transition-colors">
                  <td className="px-5 py-4 font-semibold text-white">
                    {row.module}
                  </td>
                  
                  {/* Admin */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => togglePerm(idx, 'admin')}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                        row.admin ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {row.admin ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* HR */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => togglePerm(idx, 'hr')}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                        row.hr ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {row.hr ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Supervisor */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => togglePerm(idx, 'supervisor')}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                        row.supervisor ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {row.supervisor ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  {/* Employee */}
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => togglePerm(idx, 'employee')}
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors ${
                        row.employee ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {row.employee ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
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
