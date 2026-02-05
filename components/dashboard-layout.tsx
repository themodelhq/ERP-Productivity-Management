'use client';

import { useAuth } from '@/hooks/use-auth';
import { LoginPage } from './login-page';
import { AgentDashboard } from './agent-dashboard';
import { ManagerDashboard } from './manager-dashboard';
import { AdminDashboard } from './admin-dashboard';

export function DashboardLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  // Render appropriate dashboard based on role
  switch (session.role) {
    case 'agent':
      return <AgentDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <LoginPage />;
  }
}
