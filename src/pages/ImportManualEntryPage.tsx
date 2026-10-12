import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { DEPARTMENTS } from '../data/mockData';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  ArrowRight,
  Download
} from 'lucide-react';

export const ImportManualEntryPage: React.FC = () => {
  const { addEmployee, addAuditLog } = useApp();
  const [activeTab, setActiveTab] = useState<'import' | 'manual'>('import');

  // Import State
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Manual Form State
  const [form, setForm] = useState({
    code: `EMP-${Math.floor(1200 + Math.random() * 50)}`,
    name: '',
    nationalId: '',
    department: DEPARTMENTS[0],
    jobTitle: '',
    phone: '',
    salary: 16000,
    manager: 'أحمد منصور'
  });
  const [manualSuccess, setManualSuccess] = useState(false);

  const handleSimulatedUpload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setImportSuccess(true);
      addAuditLog('استيراد شيت إكسيل', 'ملف الموظفين الرئيسي 2026', 'تمت معالجة ومطابقة 142 سجلاً بنجاح');
    }, 1200);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.jobTitle) return;

    addEmployee({
      code: form.code,
      name: form.name,
      nationalId: form.nationalId || '29801011200000',
      department: form.department,
      jobTitle: form.jobTitle,
      status: 'active',
      joinDate: new Date().toISOString().slice(0, 10),
      phone: form.phone || '01000000000',
      email: `${form.code.toLowerCase()}@intercom-corp.com`,
      manager: form.manager,
      salary: Number(form.salary),
      remainingLeaveDays: 21,
      hasMissingData: false
    });

    setManualSuccess(true);
    setForm({
      code: `EMP-${Math.floor(1200 + Math.random() * 50)}`,
      name: '',
      nationalId: '',
      department: DEPARTMENTS[0],
      jobTitle: '',
      phone: '',
      salary: 16000,
      manager: 'أحمد منصور'
    });
    setTimeout(() => setManualSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="استيراد البيانات والإدخال اليدوي"
        description="تحديث قاعدة بيانات الموظفين عبر رفع ملفات Excel / CSV المعتمدة أو التسجيل اليدوي الفردي لسجلات الموظفين."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'إدارة النظام' },
          { label: 'الاستيراد والإدخال اليدوي' }
        ]}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e3056] pb-1">
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'import'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'text-slate-400 hover:text-white bg-[#111c38]'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>استيراد ملف Excel جماعي</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'manual'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'text-slate-400 hover:text-white bg-[#111c38]'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>إدخال سجل موظف يدوي</span>
        </button>
      </div>

      {/* Tab 1: File Upload */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div 
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              setUploadedFile('master_employees_october_2026.xlsx');
            }}
            className={`p-10 rounded-2xl border-2 border-dashed text-center transition-all bg-[#111c38]/60 ${
              dragOver ? 'border-blue-400 bg-blue-950/20' : 'border-[#1e3056] hover:border-slate-600'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              اسحب وأفلت ملف الـ Excel هنا
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
              يدعم النظام ملفات Excel (.xlsx, .xls) و ملفات CSV المعتمدة بنموذج شؤون العاملين بإنتركوم.
            </p>

            {uploadedFile ? (
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-900/30 text-blue-200 border border-blue-700/50 text-xs mb-4">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="font-mono font-semibold">{uploadedFile}</span>
                <span className="text-[10px] text-emerald-400">جاهز للمطابقة</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setUploadedFile('intercom_staff_payroll_master.xlsx')}
                className="px-4 py-2 rounded-xl bg-[#162447] hover:bg-[#1c2e59] text-slate-200 text-xs font-semibold border border-[#233558] transition-colors"
              >
                تحديد ملف من الجهاز
              </button>
            )}

            {uploadedFile && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleSimulatedUpload}
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/40 transition-colors flex items-center gap-2"
                >
                  {isProcessing ? 'جاري التحليل والمطابقة...' : 'بدء معالجة واستيراد السجلات'}
                </button>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setImportSuccess(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  إلغاء
                </button>
              </div>
            )}
          </div>

          {importSuccess && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>تم استيراد الملف بنجاح وتحديث قاعدة البيانات</span>
              </div>
              <p className="text-slate-300">
                تم فحص 142 سجلاً: تم تحديث 138 سجلاً بنجاح وإضافة 4 سجلات موظفين جدد إلى قائمة المراجعة.
              </p>
            </div>
          )}

          {/* Template Download Box */}
          <div className="p-4 rounded-2xl bg-[#0d162f] border border-[#1e3056] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">تنزيل نموذج ملف الاستيراد المعتمد (Excel Template)</h4>
                <p className="text-[11px] text-slate-400">يحتوي على كافة الأعمدة المطلوبة وتنسيقات الأرقام القومية وتواريخ التعيين.</p>
              </div>
            </div>
            <button
              onClick={() => alert('تم تنزيل نموذج شيت الموظفين المعتمد بصيغة XLSX.')}
              className="px-3.5 py-1.5 rounded-lg bg-[#162447] text-slate-200 hover:text-white border border-[#233558] text-xs font-semibold"
            >
              تنزيل النموذج
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Manual Entry */}
      {activeTab === 'manual' && (
        <div className="max-w-2xl mx-auto rounded-2xl bg-[#111c38] border border-[#1e3056] p-6 shadow-xl">
          {manualSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم حفظ الموظف بنجاح وإضافته لقائمة الموظفين النشطين.</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم الموظف رباعي:</label>
                <input
                  type="text"
                  required
                  placeholder="محمد أحمد إبراهيم علي"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كود الموظف:</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الرقم القومي (14 رقم):</label>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="29XXXXXXXXXXXX"
                  value={form.nationalId}
                  onChange={e => setForm({ ...form, nationalId: e.target.value })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">القطاع / الإدارة:</label>
                <select
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المسمى الوظيفي:</label>
                <input
                  type="text"
                  required
                  placeholder="أخصائي عمليات مصرفية"
                  value={form.jobTitle}
                  onChange={e => setForm({ ...form, jobTitle: e.target.value })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الراتب الأساسي:</label>
                <input
                  type="number"
                  value={form.salary}
                  onChange={e => setForm({ ...form, salary: Number(e.target.value) })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  placeholder="010XXXXXXXX"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المدير المباشر:</label>
                <input
                  type="text"
                  value={form.manager}
                  onChange={e => setForm({ ...form, manager: e.target.value })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/40"
              >
                إضافة الموظف لقاعدة البيانات
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
