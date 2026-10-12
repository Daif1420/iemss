import React from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  Users, 
  Clock, 
  FileText, 
  AlertCircle, 
  UserPlus, 
  UserMinus, 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Building2,
  ChevronLeft
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { 
    currentUser, 
    employees, 
    requests, 
    attendance, 
    missingData, 
    setActivePage, 
    setSelectedEmployee,
    approveRequest,
    rejectRequest
  } = useApp();

  const activeEmployees = employees.filter(e => e.status === 'active');
  const newEmployees = employees.filter(e => e.status === 'new');
  const departedEmployees = employees.filter(e => e.status === 'left');
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const presentCount = attendance.filter(a => a.status === 'حاضر').length;
  const lateCount = attendance.filter(a => a.status === 'متأخر').length;
  const absentCount = attendance.filter(a => a.status === 'غياب').length;

  const attendanceRate = Math.round(((presentCount + lateCount) / attendance.length) * 100);

  // Department counts
  const deptCounts = activeEmployees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-blue-900/40 via-[#111c38] to-[#0f172a] border border-[#1e3056] p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>الإثنين، 12 أكتوبر 2026 · الفترة الصباحية</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              أهلاً بك، {currentUser.name}
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              منظومة الموارد البشرية والعمليات المصرفية لشركة إنتركوم بالشراكة مع البنك الأهلي المصري.
              {currentUser.role === 'admin' ? ' لديك ' + pendingRequests.length + ' طلبات بحاجة للمراجعة والاعتماد اليوم.' : ' يمكنك متابعة رصيد إجازاتك وتقديم طلباتك مباشرة.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActivePage('requests')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{currentUser.role === 'admin' ? 'إدارة الطلبات المعلقة' : 'تقديم طلب جديد'}</span>
            </button>
            <button
              onClick={() => setActivePage('attendance')}
              className="px-3.5 py-2.5 rounded-xl bg-[#162447] hover:bg-[#1c2e59] text-slate-200 text-xs font-semibold border border-[#233558] transition-colors"
            >
              سجل الحضور
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="الموظفون النشطون"
          value={activeEmployees.length}
          subtitle="على قوة العمل بالقطاعات"
          icon={Users}
          variant="blue"
          onClick={() => setActivePage('employees-current')}
          clickableHint="عرض الموظفين الحاليين"
        />

        <KpiCard
          title="نسبة الحضور اليومية"
          value={`${attendanceRate}%`}
          subtitle={`${presentCount} حاضر · ${lateCount} تأخير · ${absentCount} غياب`}
          icon={Clock}
          variant="emerald"
          onClick={() => setActivePage('attendance')}
          clickableHint="عرض سجل البصمة اليومي"
        />

        <KpiCard
          title="طلبات قيد المراجعة"
          value={pendingRequests.length}
          subtitle="تتطلب اتخاذ قرار إداري"
          icon={FileText}
          variant="amber"
          onClick={() => setActivePage('requests')}
          clickableHint="الانتقال إلى صفحة الطلبات"
        />

        <KpiCard
          title="المغادرون هذا العام"
          value={departedEmployees.length}
          subtitle="مع تصنيف أسباب المغادرة"
          icon={UserMinus}
          variant="rose"
          onClick={() => setActivePage('employees-left')}
          clickableHint="استعراض مؤشرات المغادرين"
        />
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Pending Requests Queue & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Requests Box */}
          <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] p-5 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e3056] mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>الطلبات العاجلة بانتظار الإجراء</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  أحدث طلبات الإجازات والأذونات المقدمة من فرق العمل
                </p>
              </div>

              <button
                onClick={() => setActivePage('requests')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                لا توجد طلبات معلقة حالياً، جميع الطلبات معتمدة أو تم اتخاذ قرار بشأنها.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 4).map(req => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-[#0d162f] border border-[#1e3056] hover:border-slate-600 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-900/30 text-blue-300 border border-blue-700/40 flex items-center justify-center font-bold text-xs shrink-0">
                        {req.employeeName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{req.employeeName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({req.employeeCode})</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {req.department}
                          </span>
                        </div>
                        <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
                          <span className="font-semibold text-amber-300">{req.type}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{req.duration}</span>
                          <span className="text-slate-400 text-[11px]">بدءاً من: {req.startDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {currentUser.role === 'admin' ? (
                        <>
                          <button
                            onClick={() => approveRequest(req.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="اعتماد فوري"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>قبول</span>
                          </button>
                          <button
                            onClick={() => setActivePage('requests')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#162447] text-slate-300 hover:text-white border border-[#233558] text-xs font-semibold transition-colors"
                          >
                            مراجعة
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">بانتظار موافقة الإدارة</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] p-5 shadow-lg">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>إجراءات سريعة</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => setActivePage('requests')}
                className="p-3.5 rounded-xl bg-[#0d162f] border border-[#1e3056] hover:border-blue-500/60 hover:bg-[#142244] text-right transition-all group"
              >
                <FileText className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-105 transition-transform" />
                <span className="block text-xs font-bold text-white">إنشاء طلب جديد</span>
                <span className="text-[11px] text-slate-400">إجازة، إذن، شهادة</span>
              </button>

              <button
                onClick={() => setActivePage('employees-new')}
                className="p-3.5 rounded-xl bg-[#0d162f] border border-[#1e3056] hover:border-emerald-500/60 hover:bg-[#142244] text-right transition-all group"
              >
                <UserPlus className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-105 transition-transform" />
                <span className="block text-xs font-bold text-white">إضافة موظف جديد</span>
                <span className="text-[11px] text-slate-400">تعيين وفترة اختبار</span>
              </button>

              <button
                onClick={() => setActivePage('missing-data')}
                className="p-3.5 rounded-xl bg-[#0d162f] border border-[#1e3056] hover:border-amber-500/60 hover:bg-[#142244] text-right transition-all group"
              >
                <AlertCircle className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-105 transition-transform" />
                <span className="block text-xs font-bold text-white">البيانات الناقصة</span>
                <span className="text-[11px] text-slate-400">{missingData.length} سجلات تحتاج استيفاء</span>
              </button>

              <button
                onClick={() => setActivePage('reports')}
                className="p-3.5 rounded-xl bg-[#0d162f] border border-[#1e3056] hover:border-indigo-500/60 hover:bg-[#142244] text-right transition-all group"
              >
                <Calendar className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-105 transition-transform" />
                <span className="block text-xs font-bold text-white">تقارير الموارد البشرية</span>
                <span className="text-[11px] text-slate-400">تحليلات وتصدير</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Department Distribution & System Health */}
        <div className="space-y-6">
          
          {/* Department Breakdown */}
          <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] p-5 shadow-lg">
            <h3 className="text-base font-bold text-white mb-1">
              توزيع الموظفين حسب القطاع
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              إجمالي القوة العاملة النشطة ({activeEmployees.length} موظف)
            </p>

            <div className="space-y-3">
              {Object.entries(deptCounts).map(([dept, count]) => {
                const percentage = Math.round((count / activeEmployees.length) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{dept}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Quality Notice */}
          <div className="rounded-2xl bg-gradient-to-br from-amber-950/20 to-[#111c38] border border-amber-500/30 p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  فحص اكتمال مسوغات التعيين
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  يوجد حالياً <strong className="font-mono text-white">{missingData.length}</strong> مستندات معلقة لبعض الموظفين الجدد (شهادات تجنيد، فيش جنائي، حسابات بنكية).
                </p>
                <button
                  onClick={() => setActivePage('missing-data')}
                  className="mt-3 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <span>استعراض واستيفاء الملفات</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
