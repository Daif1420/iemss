import React, { useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  PieChart, 
  TrendingDown, 
  Users, 
  Clock, 
  FileText,
  CheckCircle2
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadReport = (title: string) => {
    setDownloadSuccess(`تم تجهيز وتنزيل تقرير: ${title} بنجاح.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="تقارير الموارد البشرية والتحليلات"
        description="استخراج التقارير الرسمية لنظام IEMS، قياس معدل دوران العمالة (Turnover Rate)، إحصائيات الغياب والإجازات، وإعداد ملفات التفتيش المصرفي."
        breadcrumbs={[
          { label: 'الرئيسية' },
          { label: 'التقارير' }
        ]}
      />

      {downloadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          title="معدل دوران العمالة السنوي"
          value="4.2%"
          subtitle="ضمن الحدود المستهدفة للمؤسسة (< 6%)"
          icon={TrendingDown}
          variant="emerald"
        />

        <KpiCard
          title="متوسط مدة الخدمة"
          value="2.8 سنة"
          subtitle="استقرار الكوادر البشرية بالبنك"
          icon={Users}
          variant="blue"
        />

        <KpiCard
          title="استهلاك الإجازات السنوية"
          value="64%"
          subtitle="متوسط الرصيد المستنفد حتى أكتوبر"
          icon={Calendar}
          variant="amber"
        />

        <KpiCard
          title="ساعات التأخير الشهرية"
          value="18.5 س"
          subtitle="انخفاض بنسبة 12% عن الشهر الماضي"
          icon={Clock}
          variant="indigo"
        />
      </div>

      {/* Available Reports Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: 'تقرير دوران العمالة والمغادرين',
            desc: 'تفصيل أسباب إنهاء الخدمة لكل موظف وتوزيعها حسب القطاعات والوظائف مع التوصيات.',
            format: 'Excel & PDF',
            type: 'شهري'
          },
          {
            title: 'تقرير الحضور والانصراف والورديات',
            desc: 'بيان تفصيلي ببصمات الدخول والانصراف ودقائق التأخير ومعدل الحضور اليومي للمطابقة.',
            format: 'Excel',
            type: 'يومي / شهري'
          },
          {
            title: 'تقرير رصيد الإجازات والأذونات',
            desc: 'بيان الأرصدة المتبقية والمستنفذة من الإجازات الاعتيادية والعارضة والمرضية لكل موظف.',
            format: 'Excel',
            type: 'فصلي'
          },
          {
            title: 'تقرير الرواتب والبدلات والمكافآت',
            desc: 'كشف الأجور الشهري والخصومات الإدارية مع حساب بدل الوردية الليلية والسلف.',
            format: 'Excel مؤمن',
            type: 'شهري'
          },
          {
            title: 'تقرير اكتمال مسوغات التعيين',
            desc: 'حصر بالبيانات الناقصة والشهادات المطلوبة لملفات الموظفين تحت فترة الاختبار.',
            format: 'PDF',
            type: 'دوري'
          },
          {
            title: 'تقرير سجل التدقيق وحركات النظام',
            desc: 'سجل كامل بالحركات والتعديلات التي تمت على قواعد البيانات وأرقام IP للمستخدمين.',
            format: 'CSV & PDF',
            type: 'رقابي'
          }
        ].map((rep, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  {rep.type}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{rep.format}</span>
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">{rep.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{rep.desc}</p>
            </div>

            <button
              onClick={() => handleDownloadReport(rep.title)}
              className="w-full py-2 px-3 rounded-xl bg-[#0d162f] hover:bg-[#162447] text-slate-200 text-xs font-semibold border border-[#1e3056] hover:border-blue-500/50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>تصدير التقرير الآن</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
