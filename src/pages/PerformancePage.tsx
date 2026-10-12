import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { 
  TrendingUp, 
  Target, 
  Award, 
  CheckCircle2, 
  BarChart3, 
  Star,
  Users
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const departmentsPerf = [
    { name: 'العمليات المصرفية', target: '98%', achieved: '99.2%', status: 'متفوق', leader: 'محمود جاد', count: 18 },
    { name: 'خدمة العملاء', target: '92%', achieved: '94.5%', status: 'متفوق', leader: 'طارق يوسف', count: 42 },
    { name: 'تقنية المعلومات', target: '99.9%', achieved: '99.95%', status: 'مطابق', leader: 'أيمن عبد السلام', count: 14 },
    { name: 'التحصيل والمبيعات', target: '100%', achieved: '91.8%', status: 'يحتاج تحسين', leader: 'حازم الصاوي', count: 26 },
    { name: 'مراقبة الجودة', target: '95%', achieved: '97.0%', status: 'متفوق', leader: 'هالة خيري', count: 11 },
    { name: 'الامتثال والمخاطر', target: '100%', achieved: '100%', status: 'مطابق', leader: 'سامح رضوان', count: 8 }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="مؤشرات الأداء والتارجت المؤسسي"
        description="متابعة تحقيق مستهدفات الإنتاجية وجودة الخدمة المصرفية لفرق العمل، قياس اتفاقيات مستوى الخدمة (SLA)، وتقييمات الربع السنوي."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'الإنتاج والتارجت والأداء' }
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="نسبة تحقيق المستهدف العام"
          value="96.4%"
          subtitle="مقارنة بالربع الثالث 2026"
          icon={Target}
          variant="emerald"
        />

        <KpiCard
          title="مؤشر جودة المكالمات والخدمة"
          value="94.8%"
          subtitle="بناءً على عينات التدقيق العشوائي"
          icon={Award}
          variant="blue"
        />

        <KpiCard
          title="معدل سرعة إنجاز المعاملات"
          value="2.8 د"
          subtitle="متوسط زمن خدمة العميل المصرفي"
          icon={TrendingUp}
          variant="amber"
        />

        <KpiCard
          title="فرق العمل المتفوقة"
          value="5 قطاعات"
          subtitle="حققت 100% فأكثر من المستهدف"
          icon={Star}
          variant="indigo"
        />
      </div>

      {/* Performance Grid */}
      <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e3056] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>لوحة تصنيف أداء القطاعات والإدارات</span>
          </h3>
          <span className="text-xs text-slate-400">تقييم الربع المالي الثالث 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0d162f] text-slate-400 font-semibold border-b border-[#1e3056]">
              <tr>
                <th className="px-5 py-3.5">القطاع / الإدارة</th>
                <th className="px-5 py-3.5">المستهدف (Target)</th>
                <th className="px-5 py-3.5">المحقق الفعلي</th>
                <th className="px-5 py-3.5">نسبة الإنجاز</th>
                <th className="px-5 py-3.5">المدير المسؤول</th>
                <th className="px-5 py-3.5">التقييم العام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3056]/60">
              {departmentsPerf.map((dept, idx) => (
                <tr key={idx} className="hover:bg-[#162447]/60 transition-colors">
                  <td className="px-5 py-4 font-bold text-white">
                    {dept.name}
                  </td>
                  <td className="px-5 py-4 font-mono text-slate-300">
                    {dept.target}
                  </td>
                  <td className="px-5 py-4 font-mono font-bold text-blue-300">
                    {dept.achieved}
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-40 bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          dept.status === 'يحتاج تحسين' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: dept.achieved }}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-300">
                    {dept.leader}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                      dept.status === 'متفوق' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : dept.status === 'مطابق'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {dept.status}
                    </span>
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
