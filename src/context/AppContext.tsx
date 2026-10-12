import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  Employee, 
  RequestItem, 
  AttendanceRecord, 
  AuditLog, 
  MissingDataItem, 
  NavigationPage, 
  RequestStatus, 
  RequestType 
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_EMPLOYEES, 
  INITIAL_REQUESTS, 
  INITIAL_ATTENDANCE, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_MISSING_DATA 
} from '../data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  
  // Employees
  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  selectedEmployee: Employee | null;
  setSelectedEmployee: (emp: Employee | null) => void;
  
  // Requests
  requests: RequestItem[];
  submitRequest: (newReq: {
    type: RequestType;
    startDate: string;
    endDate?: string;
    duration: string;
    reason: string;
    notes?: string;
  }) => void;
  approveRequest: (requestId: string, adminNotes?: string) => void;
  rejectRequest: (requestId: string, rejectionReason: string) => void;
  
  // Attendance
  attendance: AttendanceRecord[];
  
  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, target: string, details: string) => void;
  
  // Missing Data
  missingData: MissingDataItem[];
  resolveMissingData: (id: string) => void;
  
  // Notifications
  unreadNotificationsCount: number;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: 'request' | 'attendance' | 'system';
  }>;
  markNotificationsAsRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // default to Admin
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [attendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [missingData, setMissingData] = useState<MissingDataItem[]>(INITIAL_MISSING_DATA);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'طلب إجازة جديد بحاجة لاعتماد',
      message: 'قامت سارة عبد الرحمن بتقديم طلب إجازة اعتيادية لمدة 4 أيام.',
      time: 'منذ 35 دقيقة',
      read: false,
      type: 'request' as const
    },
    {
      id: 'notif-2',
      title: 'طلب إذن تأخير',
      message: 'قدم كريم فهمي طلب إذن تأخير لساعتين صباح الغد.',
      time: 'منذ ساعة',
      read: false,
      type: 'request' as const
    },
    {
      id: 'notif-3',
      title: 'تنبيه مسوغات تعيين ناقصة',
      message: 'يرجى استيفاء شهادة الموقف من التجنيد للموظف زياد طارق.',
      time: 'منذ ساعتين',
      read: false,
      type: 'system' as const
    }
  ]);

  // Apply theme class to document body/html
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.body.classList.remove('bg-[#0b1329]', 'text-slate-100');
      document.body.classList.add('bg-slate-100', 'text-slate-900');
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('bg-slate-100', 'text-slate-900');
      document.body.classList.add('bg-[#0b1329]', 'text-slate-100');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addAuditLog = (action: string, target: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: currentUser.name,
      userRole: currentUser.roleTitle,
      action,
      target,
      details,
      ipAddress: '10.20.14.85'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`
    };
    setEmployees(prev => [newEmp, ...prev]);
    addAuditLog('إضافة موظف جديد', `${newEmp.code} (${newEmp.name})`, `تم إدراج الموظف بقسم ${newEmp.department}`);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...updates } : emp));
  };

  const submitRequest = (newReqData: {
    type: RequestType;
    startDate: string;
    endDate?: string;
    duration: string;
    reason: string;
    notes?: string;
  }) => {
    const reqNum = `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq: RequestItem = {
      id: `req-${Date.now()}`,
      requestNumber: reqNum,
      employeeId: currentUser.id === 'user-employee' ? 'emp-1042' : 'emp-1001',
      employeeName: currentUser.name,
      employeeCode: currentUser.code,
      department: currentUser.department,
      type: newReqData.type,
      startDate: newReqData.startDate,
      endDate: newReqData.endDate,
      duration: newReqData.duration,
      reason: newReqData.reason,
      status: 'pending',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: newReqData.notes
    };
    setRequests(prev => [newReq, ...prev]);
    addAuditLog('تقديم طلب جديد', `${reqNum} - ${newReqData.type}`, `طلب مقدم من ${currentUser.name}`);
    
    // add notification for admin
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `طلب جديد: ${newReqData.type}`,
        message: `تم تقديم طلب بواسطة ${currentUser.name} (${newReqData.duration}).`,
        time: 'الآن',
        read: false,
        type: 'request'
      },
      ...prev
    ]);
  };

  const approveRequest = (requestId: string, adminNotes?: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'approved' as RequestStatus,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          reviewedBy: currentUser.name,
          notes: adminNotes || req.notes || 'تمت الموافقة من قِبل إدارة الموارد البشرية'
        };
      }
      return req;
    }));
    const req = requests.find(r => r.id === requestId);
    addAuditLog('اعتماد طلب', `${req?.requestNumber || requestId} - ${req?.type}`, `تم اعتماد الطلب من قبل ${currentUser.name}`);
  };

  const rejectRequest = (requestId: string, rejectionReason: string) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'rejected' as RequestStatus,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          reviewedBy: currentUser.name,
          rejectionReason
        };
      }
      return req;
    }));
    const req = requests.find(r => r.id === requestId);
    addAuditLog('رفض طلب', `${req?.requestNumber || requestId} - ${req?.type}`, `سبب الرفض: ${rejectionReason}`);
  };

  const resolveMissingData = (id: string) => {
    setMissingData(prev => prev.filter(item => item.id !== id));
    addAuditLog('استيفاء بيانات ناقصة', `مستند / حقل معرّف: ${id}`, 'تم استلام المستند وتحديث ملف الموظف بنجاح');
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      users,
      activePage,
      setActivePage,
      theme,
      setTheme,
      toggleTheme,
      employees,
      addEmployee,
      updateEmployee,
      selectedEmployee,
      setSelectedEmployee,
      requests,
      submitRequest,
      approveRequest,
      rejectRequest,
      attendance,
      auditLogs,
      addAuditLog,
      missingData,
      resolveMissingData,
      unreadNotificationsCount,
      notifications,
      markNotificationsAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
