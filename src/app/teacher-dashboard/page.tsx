'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  teacherDashboardService,
  type TeacherKPI,
  type TeacherCourse,
  type AttendanceEntry,
  type TeacherAssignment,
  type TeacherExam,
  type CourseAnalytics,
  type StudentPerformance,
} from '@/lib/services/teacherDashboardService';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import TeacherOverview from './components/TeacherOverview';
import TeacherCourses from './components/TeacherCourses';
import TeacherAttendance from './components/TeacherAttendance';
import TeacherAssignments from './components/TeacherAssignments';
import TeacherExams from './components/TeacherExams';
import TeacherAnalytics from './components/TeacherAnalytics';
import Icon from '@/components/ui/AppIcon';

type TabId = 'overview' | 'courses' | 'attendance' | 'assignments' | 'exams' | 'analytics';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'ChartBarIcon' },
  { id: 'courses', label: 'Courses', icon: 'AcademicCapIcon' },
  { id: 'attendance', label: 'Attendance', icon: 'ClipboardDocumentCheckIcon' },
  { id: 'assignments', label: 'Assignments', icon: 'DocumentTextIcon' },
  { id: 'exams', label: 'Exams', icon: 'PencilSquareIcon' },
  { id: 'analytics', label: 'Analytics', icon: 'ChartPieIcon' },
];

export default function TeacherDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>('Teacher');
  const [kpi, setKpi] = useState<TeacherKPI | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [exams, setExams] = useState<TeacherExam[]>([]);
  const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/sign-up-login-screen');
    }
  }, [user, authLoading, router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Not authenticated. Please log in.');
        setLoading(false);
        return;
      }

      // Get teacher name
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();
      if (userData?.name) setTeacherName(userData.name);

      const tid = await teacherDashboardService.getTeacherId(user.id);
      if (!tid) {
        setError('Teacher profile not found. Please contact your administrator.');
        setLoading(false);
        return;
      }
      setTeacherId(tid);

      const [kpiData, coursesData, attendanceData, assignmentsData, examsData, analyticsData, perfData] =
        await Promise.all([
          teacherDashboardService.getKPIs(tid),
          teacherDashboardService.getCourses(tid),
          teacherDashboardService.getAttendance(tid),
          teacherDashboardService.getAssignments(tid),
          teacherDashboardService.getExams(tid),
          teacherDashboardService.getCourseAnalytics(tid),
          teacherDashboardService.getStudentPerformance(tid),
        ]);

      setKpi(kpiData);
      setCourses(coursesData);
      setAttendance(attendanceData);
      setAssignments(assignmentsData);
      setExams(examsData);
      setAnalytics(analyticsData);
      setStudentPerformance(perfData);
    } catch (err: any) {
      console.error('Teacher dashboard error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time: refresh when attendance, assignments, or exam results change
  useRealtimeSubscription(
    ['attendance', 'assignments', 'assignment_submissions', 'exam_results', 'exams'],
    loadData,
    !!user
  );

  const refreshData = () => loadData();

  return (
    <AppLayout activeRoute="/teacher-dashboard">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Teacher Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, <span className="font-600 text-foreground">{teacherName}</span> · Academic Year 2025–2026
            </p>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-border rounded-xl hover:bg-muted transition-colors shadow-sm"
          >
            <Icon name="ArrowPathIcon" size={15} className="text-muted-foreground" />
            <span className="text-muted-foreground font-500">Refresh</span>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-negative flex items-center gap-2">
            <Icon name="ExclamationTriangleIcon" size={16} className="text-negative flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-2xl p-1.5 overflow-x-auto scrollbar-thin">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-600 whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                activeTab === tab.id
                  ? 'tab-active' :'text-muted-foreground hover:text-foreground hover:bg-white/60'
              }`}
            >
              <Icon
                name={tab.icon as Parameters<typeof Icon>[0]['name']}
                size={14}
                className={activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}
              />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <TeacherOverview kpi={kpi} courses={courses} loading={loading} />
          )}
          {activeTab === 'courses' && (
            <TeacherCourses
              teacherId={teacherId}
              courses={courses}
              loading={loading}
              onRefresh={refreshData}
            />
          )}
          {activeTab === 'attendance' && (
            <TeacherAttendance
              teacherId={teacherId}
              courses={courses}
              attendance={attendance}
              loading={loading}
              onRefresh={refreshData}
            />
          )}
          {activeTab === 'assignments' && (
            <TeacherAssignments
              teacherId={teacherId}
              courses={courses}
              assignments={assignments}
              loading={loading}
              onRefresh={refreshData}
            />
          )}
          {activeTab === 'exams' && (
            <TeacherExams
              teacherId={teacherId}
              courses={courses}
              exams={exams}
              loading={loading}
              onRefresh={refreshData}
            />
          )}
          {activeTab === 'analytics' && (
            <TeacherAnalytics
              analytics={analytics}
              studentPerformance={studentPerformance}
              loading={loading}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
