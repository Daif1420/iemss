import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { 
  User, 
  Building2, 
  Calendar, 
  Phone, 
  Mail, 
  CreditCard, 
  ShieldAlert, 
  FileText, 
  Clock, 
  CheckCircle, 
  Briefcase
} from 'lucide-react';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  onClose: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onClose
}) => {
  const { requests, attendance } = useApp();
  const [activeTab, setActiveTab] = useState<'info' | 'requests' | 'attendance'>('info');

  if (!employee) return null;

  const empRequests = requests.filter(r => r.employeeId === employee.id || r.employeeCode === employee.code);
  const empAttendance = attendance.filter(a => a.employeeId === employee.id || a.employeeCode === employee.code);

  return (
    <Drawer
      isOpen={Boolean(employee)}
      onClose={onClose}
      title={employee.name}
      subtitle={`${employee.code} · ${employee.jobTitle} · ${employee.department}`}
      width="2xl"
    >
      {/* Header Profile Summary */}
      <div className="p-4 rounded-xl bg-[#0d162f] border border-[#1e3056] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-lg">
            {employee.name.split(' ')[0][0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-white">{employee.name}</h4>
              <StatusBadge status={employee.status === 'active' ? 'نشط' : employee.status === 'new' ? 'جديد' : 'مغادر'} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{employee.jobTitle} · {employee.department}</p>
          </div>
        </div>

        <div className="text-left font-mono">
          <span className="text-xs text-slate-400 block">رصيد الإجازات</span>
          <span className="text-lg font-bold text-blue-400 tabular-nums">
            {employee.remainingLeaveDays} <span className="text-xs font-normal text-slate-400 font-sans">يوماً</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e3056] pb-1">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'info'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>البيانات الوظيفية والشخصية</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>سجل الطلبات ({empRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>سجل الحضور ({empAttendance.length})</span>
        </button>
      </div>

      {/* Tab 1: General Info */}
      {activeTab === 'info' && (
        <div className="space-y-5">
          {/* Departed notice if left */}
          {employee.status === 'left' && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  بيانات إنهاء الخدمة / المغادرة
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-200 border border-rose-500/30">
                  {employee.leaveReason || 'مغادر'}
                </span>
              </div>
              <div className="text-xs text-slate-300 flex items-center gap-4">
                <span>تاريخ المغادرة: <strong className="font-mono text-white">{employee.leaveDate}</strong></span>
              </div>
              {employee.leaveNotes && (
                <p className="text-xs text-slate-300 bg-rose-950/30 p-2.5 rounded-lg border border-rose-900/40 leading-relaxed">
                  {employee.leaveNotes}
                </p>
              )}
            </div>
          )}

          {/* Missing data alert */}
          {employee.hasMissingData && employee.missingDataItems && employee.missingDataItems.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1.5">
                <ShieldAlert className="w-4 h-4" />
                تنبيه: مسوغات تعيين أو بيانات غير مكتملة
              </span>
              <ul className="text-xs text-slate-300 list-disc list-inside space-y-0.5">
                {employee.missingDataItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-[#0d162f] border border-[#1e3056]">
              <span className="text-[11px] text-slate-400 block mb-1">الرقم القومي</span>
              <span className="font-mono text-xs text-slate-200 font-semibold">{employee.nationalId}</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0d162f] border border-[#1e3056]">
              <span className="text-[11px] text-slate-400 block mb-1">المدير المباشر</span>
              <span className="text-xs text-slate-200 font-semibold">{employee.manager}</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0d162f] border border-[#1e3056]">
              <span className="text-[11px] text-slate-400 block mb-1">تاريخ التعيين والالتحاق</span>
              <span className="font-mono text-xs text-slate-200 font-semibold">{employee.joinDate}</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0d162f] border border-[#1e3056]">
              <span className="text-[11px] text-slate-400 block mb-1">الراتب الأساسي التقديري</span>
              <span className="font-mono text-xs text-slate-200 font-semibold">{employee.salary.toLocaleString()} ج.م</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0d162f] border border-[#1e3056]">
              <span className="text-[11px] text-slate-400 block mb-1">رقم الهاتف للتواصل</span>
              <span className="font-mono text-xs text-slate-200 font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {employee.phone}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0d162f] border border-[#1e3056]">
              <span className="text-[11px] text-slate-400 block mb-1">البريد الإلكتروني المؤسسي</span>
              <span className="font-mono text-xs text-slate-200 font-semibold flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {employee.email}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Requests History */}
      {activeTab === 'requests' && (
        <div className="space-y-3">
          {empRequests.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">لا توجد طلبات مسجلة لهذا الموظف بعد.</p>
          ) : (
            empRequests.map(req => (
              <div key={req.id} className="p-3.5 rounded-xl bg-[#0d162f] border border-[#1e3056] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-white block">{req.type}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{req.requestNumber}</span>
                  </div>
                  <StatusBadge status={req.status} size="sm" />
                </div>
                <div className="text-xs text-slate-300 flex items-center justify-between border-t border-slate-800 pt-2">
                  <span>المدة: <strong>{req.duration}</strong></span>
                  <span className="font-mono text-[11px] text-slate-400">تاريخ البدء: {req.startDate}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed bg-[#111c38] p-2 rounded">
                  {req.reason}
                </p>
                {req.status === 'rejected' && req.rejectionReason && (
                  <p className="text-xs text-rose-300 bg-rose-950/30 p-2 rounded border border-rose-900/50">
                    <strong>سبب الرفض:</strong> {req.rejectionReason}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="space-y-2">
          {empAttendance.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">لا توجد سجلات حضور مسجلة لهذا الموظف اليوم.</p>
          ) : (
            empAttendance.map(att => (
              <div key={att.id} className="p-3 rounded-lg bg-[#0d162f] border border-[#1e3056] flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-300 block">{att.date}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    حضور: {att.checkIn} · انصراف: {att.checkOut}
                  </span>
                </div>
                <div className="text-left">
                  <StatusBadge status={att.status} size="sm" />
                  <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                    {att.workHours} ساعة
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Drawer>
  );
};
