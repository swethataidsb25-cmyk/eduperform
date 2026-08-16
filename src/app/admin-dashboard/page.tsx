'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminKPIGrid from './components/AdminKPIGrid';
import AdminChartsRow from './components/AdminChartsRow';
import AtRiskTable from './components/AtRiskTable';
import ActivityFeed from './components/ActivityFeed';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import AdminUserManagement from './components/AdminUserManagement';
import AdminCourseManagement from './components/AdminCourseManagement';
import AdminDepartmentManagement from './components/AdminDepartmentManagement';
import AdminAnalytics from './components/AdminAnalytics';
import AdminReports from './components/AdminReports';
import AdminRoleManagement from './components/AdminRoleManagement';
import AdminSystemSettings from './components/AdminSystemSettings';
import { adminDashboardService, AdminKPIData, AttendanceByDept, GradeTrendPoint, AtRiskStudent } from '@/lib/services/adminDashboardService';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';

type AdminTab = 'overview' | 'users' | 'courses' | 'departments' | 'analytics' | 'reports' | 'roles' | 'settings';

const tabs: { key: AdminTab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '🏠' },
  { key: 'users', label: 'User Management', icon: '👥' },
  { key: 'courses', label: 'Courses', icon: '📚' },
  { key: 'departments', label: 'Departments', icon: '🏛️' },
  { key: 'analytics', label: 'Analytics', icon: '📊' },
  { key: 'reports', label: 'Reports', icon: '📋' },
  { key: 'roles', label: 'Roles', icon: '🛡️' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [kpiData, setKpiData] = useState<AdminKPIData | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceByDept[]>([]);
  const [gradeTrendData, setGradeTrendData] = useState<GradeTrendPoint[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/sign-up-login-screen');
    }
  }, [user, authLoading, router]);

  async function fetchAll() {
    try {
      setLoading(true);
      const [kpis, attendance, gradeTrend, atRisk] = await Promise.all([
        adminDashboardService.getKPIData(),
        adminDashboardService.getAttendanceByDept(),
        adminDashboardService.getGradeTrend(),
        adminDashboardService.getAtRiskStudents(),
      ]);
      setKpiData(kpis);
      setAttendanceData(attendance);
      setGradeTrendData(gradeTrend);
      setAtRiskStudents(atRisk);
    } catch (err: any) {
      console.error('Admin dashboard fetch error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    fetchAll();
  }, []);

  // Real-time: refresh overview data when relevant tables change
  useRealtimeSubscription(
    ['attendance', 'assignment_submissions', 'exam_results', 'assignments'],
    fetchAll,
    !!user
  );

  return (
    <AppLayout activeRoute="/admin-dashboard">
      <div className="space-y-5 fade-in">
        {/* Page header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Westfield Academy · Academic Year 2025–2026 · Term 3
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border rounded-xl px-3 py-2 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
              Live · {currentTime}
            </div>
            {activeTab === 'overview' && (
              <>
                <select className="text-sm border border-border bg-card rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary">
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Term</option>
                  <option>This Year</option>
                </select>
                <button className="px-3 py-2 bg-primary text-primary-foreground text-sm font-500 rounded-lg hover:opacity-90 transition-all active:scale-95 flex items-center gap-1.5">
                  Export Report
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin bg-muted rounded-2xl p-1.5 border border-border/50">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-600 whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                activeTab === t.key
                  ? 'tab-active' :'text-muted-foreground hover:text-foreground hover:bg-white/60'
              }`}
            >
              <span className="text-sm leading-none">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {error && activeTab === 'overview' && (
          <div className="bg-red-50 border border-red-200 text-negative text-sm rounded-2xl px-5 py-4 flex items-center gap-2">
            <span>⚠️</span> Failed to load dashboard data: {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AdminKPIGrid data={kpiData} loading={loading} />
            <AdminChartsRow attendanceData={attendanceData} gradeTrendData={gradeTrendData} loading={loading} />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <AtRiskTable students={atRiskStudents} loading={loading} />
              </div>
              <div className="xl:col-span-1">
                <ActivityFeed />
              </div>
            </div>
            <AIAnalysisPanel />
          </div>
        )}

        {activeTab === 'users' && <AdminUserManagement />}
        {activeTab === 'courses' && <AdminCourseManagement />}
        {activeTab === 'departments' && <AdminDepartmentManagement />}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'reports' && <AdminReports />}
        {activeTab === 'roles' && <AdminRoleManagement />}
        {activeTab === 'settings' && <AdminSystemSettings />}
      </div>
    </AppLayout>
  );
}