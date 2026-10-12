import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { RequestItem, RequestStatus, RequestType } from '../types';
import { 
  FileText, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  Building2, 
  Check, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  ArrowLeft, 
  Briefcase, 
  DollarSign, 
  FileSignature, 
  HelpCircle,
  Eye,
  Send
} from 'lucide-react';

export const RequestsPage: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser,
    users,
    requests, 
    submitRequest, 
    approveRequest, 
    rejectRequest,
    employees
  } = useApp();

  // Mode: Admin vs Employee view (synced with currentUser.role, with an explicit switch for preview)
  const isAdminView = currentUser.role === 'admin' || currentUser.role === 'supervisor';

  // Filters
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<RequestType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected request for details inspection
  const [inspectedRequest, setInspectedRequest] = useState<RequestItem | null>(null);

  // Rejection modal state (for Admin)
  const [rejectionModalRequest, setRejectionModalRequest] = useState<RequestItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  // Approval confirm state (for Admin)
  const [approvalConfirmRequest, setApprovalConfirmRequest] = useState<RequestItem | null>(null);

  // Create Request Wizard State (for Employee)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [newRequestType, setNewRequestType] = useState<RequestType>('إجازة اعتيادية');
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    duration: 'يومان عمل',
    hours: '2',
    amount: '3000',
    reason: '',
    notes: ''
  });
  const [createSuccessMessage, setCreateSuccessMessage] = useState<string | null>(null);

  // Dataset according to role
  const scopedRequests = useMemo(() => {
    if (isAdminView) {
      return requests;
    }
    // Employee view: only employee's own requests
    return requests.filter(r => r.employeeCode === currentUser.code || r.employeeName.includes(currentUser.name.split(' ')[0]));
  }, [requests, isAdminView, currentUser]);

  // Context filters
  const filteredRequests = useMemo(() => {
    return scopedRequests.filter(req => {
      if (statusFilter !== 'ALL' && req.status !== statusFilter) {
        return false;
      }
      if (typeFilter !== 'ALL' && req.type !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = req.employeeName.toLowerCase().includes(query);
        const matchesCode = req.employeeCode.toLowerCase().includes(query);
        const matchesNum = req.requestNumber.toLowerCase().includes(query);
        const matchesReason = req.reason.toLowerCase().includes(query);
        if (!matchesName && !matchesCode && !matchesNum && !matchesReason) {
          return false;
        }
      }
      return true;
    });
  }, [scopedRequests, statusFilter, typeFilter, searchQuery]);

  // Status breakdown numbers
  const totalCount = scopedRequests.length;
  const pendingCount = scopedRequests.filter(r => r.status === 'pending').length;
  const approvedCount = scopedRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = scopedRequests.filter(r => r.status === 'rejected').length;

  // Handle Create Request Wizard Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) return;

    let computedDuration = formData.duration;
    if (newRequestType === 'إذن تأخير' || newRequestType === 'إذن انصراف مبكر') {
      computedDuration = `${formData.hours} ساعة`;
    } else if (newRequestType === 'سلفة مالية') {
      computedDuration = `مبلغ ${Number(formData.amount).toLocaleString()} ج.م`;
    }

    submitRequest({
      type: newRequestType,
      startDate: formData.startDate,
      endDate: (newRequestType.includes('إجازة') || newRequestType === 'عمل عن بُعد') ? formData.endDate : undefined,
      duration: computedDuration,
      reason: formData.reason,
      notes: formData.notes
    });

    setIsCreateModalOpen(false);
    setWizardStep(1);
    setFormData({
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      duration: 'يومان عمل',
      hours: '2',
      amount: '3000',
      reason: '',
      notes: ''
    });

    setCreateSuccessMessage('تم تقديم طلبك بنجاح وسوف يتم إشعارك فور اتخاذ قرار من الإدارة.');
    setTimeout(() => setCreateSuccessMessage(null), 5000);
  };

  const handleApproveConfirm = () => {
    if (approvalConfirmRequest) {
      approveRequest(approvalConfirmRequest.id);
      setApprovalConfirmRequest(null);
      if (inspectedRequest?.id === approvalConfirmRequest.id) {
        setInspectedRequest(prev => prev ? { ...prev, status: 'approved' } : null);
      }
    }
  };

  const handleRejectConfirm = () => {
    if (rejectionModalRequest && rejectionReasonInput.trim()) {
      setIsSubmittingRejection(true);
      setTimeout(() => {
        rejectRequest(rejectionModalRequest.id, rejectionReasonInput.trim());
        setIsSubmittingRejection(false);
        setRejectionModalRequest(null);
        setRejectionReasonInput('');
        if (inspectedRequest?.id === rejectionModalRequest.id) {
          setInspectedRequest(prev => prev ? { ...prev, status: 'rejected', rejectionReason: rejectionReasonInput.trim() } : null);
        }
      }, 300);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Role Context Switcher */}
      <div className="p-4 rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-400 block mb-0.5">
            {isAdminView ? 'منظومة إدارة الطلبات والاعتمادات الإدارية' : 'بوابة الخدمة الذاتية للموظف'}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {isAdminView ? 'إدارة واعتماد طلبات الموظفين' : 'طلباتي ومتابعة الحالة'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isAdminView 
              ? 'مراجعة وتدقيق طلبات الإجازات والأذونات والسلف واتخاذ القرارات الإدارية بضغطة زر.' 
              : 'إنشاء طلبات الإجازات والأذونات ومتابعة حالة المراجعة وقرارات الإدارة في مكان واحد.'}
          </p>
        </div>

        {/* Switcher button to test both roles seamlessly */}
        <div className="flex items-center gap-2 bg-[#0d162f] p-1.5 rounded-xl border border-[#1e3056] shrink-0">
          <span className="text-[11px] text-slate-400 px-2 font-medium">عرض التجربة كـ:</span>
          <button
            onClick={() => setCurrentUser(users[0])} // Admin
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isAdminView 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المسؤول (Admin)
          </button>
          <button
            onClick={() => setCurrentUser(users[1])} // Employee
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !isAdminView 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الموظف (Employee)
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {createSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold">{createSuccessMessage}</span>
          </div>
          <button onClick={() => setCreateSuccessMessage(null)} className="hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Action & Header Bar for Employee */}
      {!isAdminView && (
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-300">سجل الطلبات الشخصية</h3>
            <p className="text-xs text-slate-400">مجموع الطلبات المسجلة باسمك: {totalCount} طلبات</p>
          </div>
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setWizardStep(1);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إنشاء طلب جديد</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards Grid (Interactive Filtering) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          title="إجمالي الطلبات"
          value={totalCount}
          subtitle={isAdminView ? 'لكافة قطاعات البنك' : 'في سجلك الوظيفي'}
          icon={FileText}
          variant="blue"
          isActive={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
          clickableHint="عرض جميع الحالات"
        />

        <KpiCard
          title="قيد المراجعة"
          value={pendingCount}
          subtitle={isAdminView ? 'تتطلب قراراً فورياً' : 'بانتظار موافقة المدير'}
          icon={Clock}
          variant="amber"
          isActive={statusFilter === 'pending'}
          onClick={() => setStatusFilter('pending')}
          clickableHint="تصفية الطلبات المعلقة"
        />

        <KpiCard
          title="الطلبات المقبولة"
          value={approvedCount}
          subtitle="تم اعتمادها رسمياً"
          icon={CheckCircle2}
          variant="emerald"
          isActive={statusFilter === 'approved'}
          onClick={() => setStatusFilter('approved')}
          clickableHint="تصفية الطلبات المقبولة"
        />

        <KpiCard
          title="الطلبات المرفوضة"
          value={rejectedCount}
          subtitle="مع ذكر سبب الرفض"
          icon={XCircle}
          variant="rose"
          isActive={statusFilter === 'rejected'}
          onClick={() => setStatusFilter('rejected')}
          clickableHint="تصفية الطلبات المرفوضة"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isAdminView ? "البحث بالاسم، الكود، رقم الطلب، أو السبب..." : "البحث برقم الطلب أو السبب..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">جميع أنواع الطلبات</option>
            <option value="إجازة اعتيادية">إجازة اعتيادية</option>
            <option value="إجازة عارضة">إجازة عارضة</option>
            <option value="إجازة مرضية">إجازة مرضية</option>
            <option value="إذن تأخير">إذن تأخير</option>
            <option value="إذن انصراف مبكر">إذن انصراف مبكر</option>
            <option value="عمل عن بُعد">عمل عن بُعد</option>
            <option value="شهادة خبرة">شهادة خبرة</option>
            <option value="سلفة مالية">سلفة مالية</option>
            <option value="اعتراض على الحضور">اعتراض على الحضور</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="pending">قيد المراجعة</option>
            <option value="approved">مقبول</option>
            <option value="rejected">مرفوض</option>
          </select>

          {(searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              إعادة ضبط
            </button>
          )}
        </div>
      </div>

      {/* Requests List / Table */}
      <div className="rounded-2xl bg-[#111c38] border border-[#1e3056] shadow-xl overflow-hidden">
        {filteredRequests.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="لا توجد طلبات مطابقة"
            description={
              !isAdminView 
                ? "لم تقم بتقديم طلبات مطابقة للفلاتر المختارة بعد. اضغط على زر إنشاء طلب جديد للبدء." 
                : "لا توجد طلبات مطابقة لمعايير البحث الحالية."
            }
            actionText={!isAdminView ? "إنشاء طلب جديد الآن" : undefined}
            onAction={!isAdminView ? () => setIsCreateModalOpen(true) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0d162f] text-slate-400 uppercase tracking-wider font-semibold border-b border-[#1e3056]">
                <tr>
                  <th className="px-5 py-3.5">رقم الطلب</th>
                  {isAdminView && <th className="px-5 py-3.5">الموظف والقطاع</th>}
                  <th className="px-5 py-3.5">نوع الطلب</th>
                  <th className="px-5 py-3.5">الفترة / المدة</th>
                  <th className="px-5 py-3.5">تاريخ التقديم</th>
                  <th className="px-5 py-3.5">الحالة</th>
                  <th className="px-5 py-3.5">السبب / الملاحظات</th>
                  <th className="px-5 py-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3056]/60">
                {filteredRequests.map(req => {
                  const isPending = req.status === 'pending';
                  return (
                    <tr
                      key={req.id}
                      onClick={() => setInspectedRequest(req)}
                      className={`hover:bg-[#162447]/60 transition-colors cursor-pointer group ${
                        isPending && isAdminView ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {req.requestNumber}
                      </td>

                      {isAdminView && (
                        <td className="px-5 py-4">
                          <div className="font-bold text-white group-hover:text-blue-300 transition-colors">
                            {req.employeeName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {req.employeeCode} · {req.department}
                          </div>
                        </td>
                      )}

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-200 block">
                          {req.type}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-200">{req.duration}</div>
                        <div className="text-[11px] text-slate-400 font-mono">بدءاً من {req.startDate}</div>
                      </td>

                      <td className="px-5 py-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {req.submittedAt}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={req.status} />
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-slate-300 line-clamp-1 text-[11px]">
                          {req.reason}
                        </p>
                        {req.status === 'rejected' && req.rejectionReason && (
                          <span className="text-[10px] text-rose-400 block line-clamp-1 mt-0.5">
                            الرفض: {req.rejectionReason}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          {/* Admin direct decision buttons */}
                          {isAdminView && isPending ? (
                            <>
                              <button
                                onClick={() => setApprovalConfirmRequest(req)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                title="قبول الطلب"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>قبول</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectionModalRequest(req);
                                  setRejectionReasonInput('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                title="رفض الطلب مع ذكر السبب"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>رفض</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setInspectedRequest(req)}
                              className="px-3 py-1.5 rounded-lg bg-[#162447] text-slate-300 hover:text-white border border-[#233558] text-[11px] font-semibold transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span>التفاصيل</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-5 py-3.5 bg-[#0d162f] border-t border-[#1e3056] text-xs text-slate-400 flex items-center justify-between">
          <span className="font-mono">
            إجمالي السجلات: <strong>{filteredRequests.length}</strong> طلب
          </span>
          <span className="text-[11px]">
            {isAdminView ? 'سجل القرارات مؤمن ومدقق وفق لائحة شؤون الخدمة' : 'يتم الرد على الطلبات خلال 24 ساعة عمل'}
          </span>
        </div>
      </div>

      {/* Drawer: Detailed Inspection and Decision */}
      <Drawer
        isOpen={Boolean(inspectedRequest)}
        onClose={() => setInspectedRequest(null)}
        title={`تفاصيل الطلب: ${inspectedRequest?.requestNumber || ''}`}
        subtitle={`${inspectedRequest?.type || ''} · تم التقديم بتاريخ ${inspectedRequest?.submittedAt || ''}`}
        width="xl"
        footer={
          inspectedRequest && (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setInspectedRequest(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                إغلاق
              </button>

              {isAdminView && inspectedRequest.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRejectionModalRequest(inspectedRequest);
                      setRejectionReasonInput('');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>رفض الطلب</span>
                  </button>
                  <button
                    onClick={() => setApprovalConfirmRequest(inspectedRequest)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد وقبول</span>
                  </button>
                </div>
              )}
            </div>
          )
        }
      >
        {inspectedRequest && (
          <div className="space-y-5">
            {/* Status Header */}
            <div className="p-4 rounded-xl bg-[#0d162f] border border-[#1e3056] flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block mb-1">الحالة الحالية للطلب</span>
                <StatusBadge status={inspectedRequest.status} />
              </div>

              <div className="text-left font-mono">
                <span className="text-xs text-slate-400 block mb-1">المدة المطلوبة</span>
                <span className="text-sm font-bold text-white">{inspectedRequest.duration}</span>
              </div>
            </div>

            {/* Employee Summary Card */}
            <div className="p-4 rounded-xl bg-[#162447]/60 border border-[#233558] space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <span>بيانات مقدم الطلب</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">الاسم:</span>
                  <span className="font-bold text-white">{inspectedRequest.employeeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">كود الموظف:</span>
                  <span className="font-mono text-slate-200">{inspectedRequest.employeeCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">القطاع / الإدارة:</span>
                  <span className="text-slate-200">{inspectedRequest.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">رصيد الإجازات التقديري:</span>
                  <span className="text-blue-300 font-mono font-bold">14 يوماً متبقية</span>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>تفاصيل وأسباب الطلب</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0d162f] border border-[#1e3056]">
                  <span className="text-[11px] text-slate-400 block mb-1">تاريخ البدء</span>
                  <span className="font-mono text-xs text-white font-semibold">{inspectedRequest.startDate}</span>
                </div>

                {inspectedRequest.endDate && (
                  <div className="p-3 rounded-lg bg-[#0d162f] border border-[#1e3056]">
                    <span className="text-[11px] text-slate-400 block mb-1">تاريخ الانتهاء</span>
                    <span className="font-mono text-xs text-white font-semibold">{inspectedRequest.endDate}</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-[#0d162f] border border-[#1e3056]">
                <span className="text-[11px] text-slate-400 block mb-1">مبررات وسبب الطلب</span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {inspectedRequest.reason}
                </p>
              </div>

              {inspectedRequest.notes && (
                <div className="p-3.5 rounded-lg bg-[#0d162f] border border-[#1e3056]">
                  <span className="text-[11px] text-slate-400 block mb-1">ملاحظات إضافية</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {inspectedRequest.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Decision Details if reviewed */}
            {inspectedRequest.status !== 'pending' && (
              <div className="p-4 rounded-xl bg-[#0d162f] border border-[#1e3056] space-y-2">
                <h4 className="text-xs font-bold text-slate-300">سجل القرار الإداري</h4>
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>تم اتخاذ الإجراء بواسطة: <strong className="text-white">{inspectedRequest.reviewedBy || 'الإدارة'}</strong></span>
                  <span className="font-mono text-[11px]">{inspectedRequest.updatedAt}</span>
                </div>

                {inspectedRequest.status === 'rejected' && inspectedRequest.rejectionReason && (
                  <div className="mt-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
                    <strong>سبب الرفض المسجل:</strong> {inspectedRequest.rejectionReason}
                  </div>
                )}

                {inspectedRequest.status === 'approved' && (
                  <div className="mt-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                    تم اعتماد الطلب وتسجيله رسميًا في ملف الحضور والإجازات.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal: Rejection Reason Dialog for Admin */}
      <Modal
        isOpen={Boolean(rejectionModalRequest)}
        onClose={() => setRejectionModalRequest(null)}
        title="رفض الطلب وتسجيل السبب"
        subtitle={`طلب رقم: ${rejectionModalRequest?.requestNumber} (${rejectionModalRequest?.employeeName})`}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectionModalRequest(null)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={!rejectionReasonInput.trim() || isSubmittingRejection}
              onClick={handleRejectConfirm}
              className={`px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors ${
                !rejectionReasonInput.trim() || isSubmittingRejection ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmittingRejection ? 'جاري الحفظ...' : 'تأكيد الرفض'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            وفقاً لسياسة العمل، يجب توضيح سبب الرفض ليظهر للموظف في حسابه مباشرة.
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              سبب الرفض والملاحظات الإدارية:
            </label>
            <textarea
              rows={4}
              required
              placeholder="مثال: تعذر الموافقة لتعارض الموعد مع ذروة العمل بالقطاع أو نقص رصيد الإجازات..."
              value={rejectionReasonInput}
              onChange={e => setRejectionReasonInput(e.target.value)}
              className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </Modal>

      {/* Modal: Approval Confirmation for Admin */}
      <ConfirmDialog
        isOpen={Boolean(approvalConfirmRequest)}
        onClose={() => setApprovalConfirmRequest(null)}
        onConfirm={handleApproveConfirm}
        title="تأكيد اعتماد الطلب"
        message={`هل أنت متأكد من اعتماد طلب ${approvalConfirmRequest?.type} للموظف ${approvalConfirmRequest?.employeeName} (${approvalConfirmRequest?.duration})؟`}
        confirmLabel="نعم، اعتماد الطلب"
        variant="success"
      />

      {/* Modal: Employee Create Request Step-by-Step Wizard */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إنشاء طلب جديد"
        subtitle={`خطوة ${wizardStep} من 3 · ${wizardStep === 1 ? 'اختيار نوع الطلب' : wizardStep === 2 ? 'تعبئة البيانات والمبررات' : 'مراجعة وتأكيد الإرسال'}`}
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5">
          {/* Step 1: Request Type Selector */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                اختر نوع الطلب المطلوب من القائمة المعتمدة لإظهار الحقول المخصصة له:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { type: 'إجازة اعتيادية', desc: 'من الرصيد السنوي' },
                  { type: 'إجازة عارضة', desc: 'للطوارئ (بحد أقصى يومان)' },
                  { type: 'إجازة مرضية', desc: 'مع تقرير طبي رسمي' },
                  { type: 'إذن تأخير', desc: 'ساعات صباحية محددة' },
                  { type: 'إذن انصراف مبكر', desc: 'للظروف قبل نهاية الدوام' },
                  { type: 'عمل عن بُعد', desc: 'العمل من المنزل WFH' },
                  { type: 'شهادة خبرة', desc: 'بيان خدمة رسمي' },
                  { type: 'سلفة مالية', desc: 'تخصم على أقساط شهرية' },
                  { type: 'اعتراض على الحضور', desc: 'تصحيح بصمة أو ماسح' }
                ].map(item => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setNewRequestType(item.type as RequestType)}
                    className={`p-3 rounded-xl border text-right transition-all ${
                      newRequestType === item.type
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-[#0d162f] border-[#1e3056] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-bold text-xs block mb-0.5">{item.type}</span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <span>التالي: إدخال البيانات</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Dynamic Fields Specific to Chosen Type */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
                <span>النوع المختار: <strong>{newRequestType}</strong></span>
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="text-[11px] underline hover:text-white"
                >
                  تغيير النوع
                </button>
              </div>

              {/* Dynamic fields based on request type */}
              {(newRequestType.includes('إجازة') || newRequestType === 'عمل عن بُعد') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ البدء:</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ الانتهاء:</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {(newRequestType === 'إذن تأخير' || newRequestType === 'إذن انصراف مبكر') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ الإذن:</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">عدد الساعات المطلوبة:</label>
                    <select
                      value={formData.hours}
                      onChange={e => setFormData({ ...formData, hours: e.target.value })}
                      className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="1">ساعة واحدة</option>
                      <option value="2">ساعتان (الحد الأقصى المعتاد)</option>
                      <option value="3">3 ساعات (ظرف استثنائي)</option>
                    </select>
                  </div>
                </div>
              )}

              {newRequestType === 'سلفة مالية' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المبلغ المطلوب (جنيه مصري):</label>
                  <input
                    type="number"
                    min="1000"
                    max="10000"
                    step="500"
                    required
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-400 block mt-1">الحد الأقصى للسلفة هو نصف الراتب الأساسي (يخصم على شهرين).</span>
                </div>
              )}

              {/* Reason (mandatory for all) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">سبب ومبررات الطلب (مطلوب):</label>
                <textarea
                  rows={3}
                  required
                  placeholder="اكتب توضيحاً مختصراً ودقيقاً للسبب..."
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Extra notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات أو تنسيق مع الفريق (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: تم التنسيق مع الزميل فلان لتغطية المهام..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#0d162f] border border-[#1e3056] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  رجوع
                </button>
                <button
                  type="button"
                  disabled={!formData.reason.trim()}
                  onClick={() => setWizardStep(3)}
                  className={`px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 ${
                    !formData.reason.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <span>التالي: مراجعة الطلب</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Summary Review & Confirmation */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0d162f] border border-[#1e3056] space-y-2 text-xs">
                <h4 className="font-bold text-sm text-blue-400 mb-2 border-b border-slate-800 pb-2">
                  ملخص بيانات الطلب قبل الإرسال
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">نوع الطلب:</span>
                  <span className="font-bold text-white">{newRequestType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">تاريخ البدء:</span>
                  <span className="font-mono text-slate-200">{formData.startDate}</span>
                </div>
                {formData.endDate && (newRequestType.includes('إجازة') || newRequestType === 'عمل عن بُعد') && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">تاريخ الانتهاء:</span>
                    <span className="font-mono text-slate-200">{formData.endDate}</span>
                  </div>
                )}
                {newRequestType === 'سلفة مالية' && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">المبلغ المطلوب:</span>
                    <span className="font-mono font-bold text-emerald-400">{Number(formData.amount).toLocaleString()} ج.م</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 block mb-1">السبب المسجل:</span>
                  <p className="text-slate-200 bg-[#111c38] p-2 rounded leading-relaxed">
                    {formData.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  تعديل المدخلات
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>تأكيد وإرسال الطلب</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>

    </div>
  );
};
