import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationPage, UserRole } from '../../types';
import { 
  Building2, 
  Users, 
  UserPlus, 
  UserMinus, 
  FileText, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  UploadCloud, 
  AlertCircle, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Bell, 
  Check, 
  ChevronDown, 
  Layers,
  Menu,
  X,
  FileSpreadsheet,
  Download
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    activePage, 
    setActivePage, 
    theme, 
    toggleTheme,
    unreadNotificationsCount,
    notifications,
    markNotificationsAsRead,
    requests
  } = useApp();

  const [isEmpMenuOpen, setIsEmpMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadZip = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsDownloading(true);
    try {
      const res = await fetch('/iems-project.zip');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'iems-project.zip');
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 150);
    } catch {
      window.location.href = '/iems-project.zip';
    } finally {
      setIsDownloading(false);
    }
  };

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  const handleNavClick = (page: NavigationPage) => {
    setActivePage(page);
    setIsEmpMenuOpen(false);
    setIsAdminMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const isEmpActive = ['employees-current', 'employees-new', 'employees-left'].includes(activePage);
  const isAdminActive = ['import-manual', 'missing-data', 'audit-logs', 'permissions', 'themes'].includes(activePage);

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a] border-b border-[#1e293b] shadow-md shadow-black/20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-2.5 text-right group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-inner shadow-blue-400/20 group-hover:bg-blue-500 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-tight text-white group-hover:text-blue-300 transition-colors">
                    IEMS
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    إنتركوم
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                  نظام إدارة شؤون العاملين
                </p>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-sm font-medium">
            {/* Dashboard */}
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activePage === 'dashboard'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>الرئيسية</span>
            </button>

            {/* Employees Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsEmpMenuOpen(!isEmpMenuOpen);
                  setIsAdminMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isEmpActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>الموظفون</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {isEmpMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-[#111c38] border border-[#1e3056] rounded-xl shadow-xl shadow-black/50 py-1.5 z-50 text-right backdrop-blur-md"
                  onMouseLeave={() => setIsEmpMenuOpen(false)}
                >
                  <button
                    onClick={() => handleNavClick('employees-current')}
                    className={`w-full px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                      activePage === 'employees-current'
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>الموظفون الحاليون</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('employees-new')}
                    className={`w-full px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                      activePage === 'employees-new'
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>الموظفون الجدد</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('employees-left')}
                    className={`w-full px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                      activePage === 'employees-left'
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <UserMinus className="w-4 h-4 text-rose-400" />
                    <span>الموظفون المغادرون</span>
                    <span className="text-[10px] mr-auto bg-rose-500/10 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/20 font-mono">
                      KPIs
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Requests - Section 7 core */}
            <button
              onClick={() => handleNavClick('requests')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activePage === 'requests'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>الطلبات</span>
              {pendingRequestsCount > 0 && (
                <span className="mr-1 text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            {/* Attendance */}
            <button
              onClick={() => handleNavClick('attendance')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activePage === 'attendance'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>الحضور والانصراف</span>
            </button>

            {/* Performance */}
            <button
              onClick={() => handleNavClick('performance')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activePage === 'performance'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>الأداء والإنتاج</span>
            </button>

            {/* Reports */}
            <button
              onClick={() => handleNavClick('reports')}
              className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                activePage === 'reports'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>التقارير</span>
            </button>

            {/* Admin Modules Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsAdminMenuOpen(!isAdminMenuOpen);
                  setIsEmpMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isAdminActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>إدارة النظام</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {isAdminMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-[#111c38] border border-[#1e3056] rounded-xl shadow-xl shadow-black/50 py-1.5 z-50 text-right backdrop-blur-md"
                  onMouseLeave={() => setIsAdminMenuOpen(false)}
                >
                  <button
                    onClick={() => handleNavClick('import-manual')}
                    className={`w-full px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                      activePage === 'import-manual'
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4 text-blue-400" />
                    <span>الاستيراد والإدخال اليدوي</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('missing-data')}
                    className={`w-full px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                      activePage === 'missing-data'
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>البيانات الناقصة</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('audit-logs')}
                    className={`w-full px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                      activePage === 'audit-logs'
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>سجل الحركات والتدقيق</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('permissions')}
                    className={`w-full px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                      activePage === 'permissions'
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>إدارة الصلاحيات</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Actions & Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Quick Role Switcher Pill - Essential for Section 7 testing */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsRoleMenuOpen(!isRoleMenuOpen);
                  setIsNotifOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#162447] border border-[#233558] hover:border-blue-500/50 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors"
                title="التبديل بين دور المسؤول والموظف لتجربة صفحة الطلبات"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-semibold text-blue-300">
                  {currentUser.role === 'admin' ? 'المسؤول' : currentUser.role === 'employee' ? 'الموظف' : 'المشرف'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isRoleMenuOpen && (
                <div 
                  className="absolute left-0 mt-2 w-64 bg-[#111c38] border border-[#1e3056] rounded-xl shadow-2xl py-2 z-50 text-right"
                  onMouseLeave={() => setIsRoleMenuOpen(false)}
                >
                  <div className="px-3.5 py-1.5 border-b border-slate-700/40 text-[11px] text-slate-400 font-medium">
                    التبديل لتجربة الواجهة وفق الصلاحية:
                  </div>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors ${
                        currentUser.id === u.id
                          ? 'bg-blue-600/20 text-blue-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.roleTitle}</p>
                      </div>
                      {currentUser.id === u.id && (
                        <Check className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsRoleMenuOpen(false);
                }}
                className="p-2 rounded-lg bg-[#162447] border border-[#233558] hover:border-slate-600 text-slate-300 hover:text-white transition-colors relative"
                aria-label="الإشعارات"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div 
                  className="absolute left-0 mt-2 w-80 bg-[#111c38] border border-[#1e3056] rounded-xl shadow-2xl py-2 z-50 text-right"
                  onMouseLeave={() => setIsNotifOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-700/40 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">الإشعارات والتنبيهات</span>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markNotificationsAsRead}
                        className="text-[11px] text-blue-400 hover:underline"
                      >
                        تعليم الكل كمقروء
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.map(n => (
                      <div key={n.id} className="p-3 hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-200">{n.title}</span>
                          <span className="text-slate-400 text-[10px]">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-[#162447] border border-[#233558] hover:border-slate-600 text-slate-300 hover:text-white transition-colors"
              title={theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
              aria-label="تغيير المظهر"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            {/* Direct Download ZIP Button */}
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition-colors disabled:opacity-60"
              title="تحميل كود المشروع كملف مضغوط ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'جاري التحميل...' : 'تحميل ZIP'}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#162447] border border-[#233558] text-slate-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-1">
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'dashboard' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => handleNavClick('employees-current')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'employees-current' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              الموظفون الحاليون
            </button>
            <button
              onClick={() => handleNavClick('employees-new')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'employees-new' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              الموظفون الجدد
            </button>
            <button
              onClick={() => handleNavClick('employees-left')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'employees-left' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              الموظفون المغادرون (مؤشرات KPI)
            </button>
            <button
              onClick={() => handleNavClick('requests')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                activePage === 'requests' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              <span>الطلبات</span>
              {pendingRequestsCount > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  {pendingRequestsCount} معلق
                </span>
              )}
            </button>
            <button
              onClick={() => handleNavClick('attendance')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'attendance' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              الحضور والانصراف
            </button>
            <button
              onClick={() => handleNavClick('performance')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'performance' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              الأداء والإنتاج
            </button>
            <button
              onClick={() => handleNavClick('reports')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'reports' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              التقارير
            </button>
            <button
              onClick={() => handleNavClick('import-manual')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'import-manual' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              الاستيراد والإدخال اليدوي
            </button>
            <button
              onClick={() => handleNavClick('missing-data')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'missing-data' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              البيانات الناقصة
            </button>
            <button
              onClick={() => handleNavClick('audit-logs')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'audit-logs' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              سجل التدقيق
            </button>
            <button
              onClick={() => handleNavClick('permissions')}
              className={`w-full text-right px-3 py-2 rounded-lg text-sm ${
                activePage === 'permissions' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300'
              }`}
            >
              الصلاحيات
            </button>
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleDownloadZip}
                disabled={isDownloading}
                className="w-full py-2.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'جاري التحميل...' : 'تحميل كود المشروع كملف مضغوط (ZIP)'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
