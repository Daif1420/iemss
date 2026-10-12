export type UserRole = 'admin' | 'employee' | 'supervisor';

export interface User {
  id: string;
  name: string;
  code: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatar?: string;
}

export type DepartureReason = 
  | 'استقالة'
  | 'كثرة الغياب'
  | 'انتهاء العقد'
  | 'مخالفة لوائح العمل'
  | 'التقاعد'
  | 'أخرى';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export type RequestType = 
  | 'إجازة اعتيادية'
  | 'إجازة عارضة'
  | 'إجازة مرضية'
  | 'إذن تأخير'
  | 'إذن انصراف مبكر'
  | 'عمل عن بُعد'
  | 'شهادة خبرة'
  | 'سلفة مالية'
  | 'اعتراض على الحضور';

export interface RequestItem {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  type: RequestType;
  startDate: string;
  endDate?: string;
  duration: string; // e.g. "3 أيام", "ساعتان"
  reason: string;
  status: RequestStatus;
  submittedAt: string;
  updatedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
  attachmentName?: string;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  nationalId: string;
  department: string;
  jobTitle: string;
  status: 'active' | 'new' | 'left';
  joinDate: string;
  leaveDate?: string;
  leaveReason?: DepartureReason;
  leaveNotes?: string;
  phone: string;
  email: string;
  manager: string;
  salary: number;
  remainingLeaveDays: number;
  hasMissingData?: boolean;
  missingDataItems?: string[];
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'حاضر' | 'متأخر' | 'غياب' | 'إذن' | 'إجازة';
  delayMinutes: number;
  workHours: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  target: string;
  details: string;
  ipAddress: string;
}

export interface MissingDataItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  missingField: string;
  fieldCategory: 'مستندات' | 'بيانات بنكية' | 'تأمينات' | 'بيانات شخصية';
  severity: 'عالي' | 'متوسط' | 'منخفض';
  daysOverdue: number;
}

export type NavigationPage = 
  | 'dashboard'
  | 'employees-current'
  | 'employees-new'
  | 'employees-left'
  | 'requests'
  | 'attendance'
  | 'performance'
  | 'reports'
  | 'import-manual'
  | 'missing-data'
  | 'audit-logs'
  | 'permissions'
  | 'themes';
