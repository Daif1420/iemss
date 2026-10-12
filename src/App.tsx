import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopNavbar } from './components/layout/TopNavbar';
import { DashboardPage } from './pages/DashboardPage';
import { CurrentEmployeesPage } from './pages/CurrentEmployeesPage';
import { NewEmployeesPage } from './pages/NewEmployeesPage';
import { DepartedEmployeesPage } from './pages/DepartedEmployeesPage';
import { RequestsPage } from './pages/RequestsPage';
import { AttendancePage } from './pages/AttendancePage';
import { PerformancePage } from './pages/PerformancePage';
import { ReportsPage } from './pages/ReportsPage';
import { ImportManualEntryPage } from './pages/ImportManualEntryPage';
import { MissingDataPage } from './pages/MissingDataPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { EmployeeDetailModal } from './components/employees/EmployeeDetailModal';

const AppContent: React.FC = () => {
  const { activePage, selectedEmployee, setSelectedEmployee } = useApp();

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'employees-current':
        return <CurrentEmployeesPage />;
      case 'employees-new':
        return <NewEmployeesPage />;
      case 'employees-left':
        return <DepartedEmployeesPage />;
      case 'requests':
        return <RequestsPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'performance':
        return <PerformancePage />;
      case 'reports':
        return <ReportsPage />;
      case 'import-manual':
        return <ImportManualEntryPage />;
      case 'missing-data':
        return <MissingDataPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'permissions':
        return <PermissionsPage />;
      case 'themes':
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      {/* Enterprise Top Navigation Bar */}
      <TopNavbar />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {renderActivePage()}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#1e293b] py-6 px-4 sm:px-6 text-center text-xs text-slate-500 bg-[#0f172a]/70">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">نظام IEMS</span>
            <span>·</span>
            <span>شركة إنتركوم للحلول التقنية بالتنسيق مع البنك الأهلي المصري</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            الإصدار المؤسسي الموحد v4.2 · حماية مشفرة SSL
          </div>
        </div>
      </footer>

      {/* Global Employee Detail Drawer */}
      <EmployeeDetailModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
