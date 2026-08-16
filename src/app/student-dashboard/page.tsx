'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  studentDashboardFullService,
  type StudentOverviewKPI,
  type CourseItem,
  type AttendanceRecord,
  type AssignmentItem,
  type ExamItem,
} from '@/lib/services/studentDashboardFullService';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import StudentDashboardOverview from './components/StudentDashboardOverview';
import StudentCourseList from './components/StudentCourseList';
import StudentAttendance from './components/StudentAttendance';
import StudentAssignments from './components/StudentAssignments';
import StudentExams from './components/StudentExams';
import StudentAIRecommendations from './components/StudentAIRecommendations';
import Icon from '@/components/ui/AppIcon';

interface AIReportData {
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
  generated_at: string;
}

type TabId = 'overview' | 'courses' | 'attendance' | 'assignments' | 'exams' | 'ai';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'ChartBarIcon' },
  { id: 'courses', label: 'My Courses', icon: 'AcademicCapIcon' },
  { id: 'attendance', label: 'Attendance', icon: 'ClipboardDocumentCheckIcon' },
  { id: 'assignments', label: 'Assignments', icon: 'DocumentTextIcon' },
  { id: 'exams', label: 'Exams', icon: 'PencilSquareIcon' },
  { id: 'ai', label: 'AI Insights', icon: 'SparklesIcon' },
];

export default function StudentDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState<string>('Student');
  const [kpi, setKpi] = useState<StudentOverviewKPI | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [aiReport, setAiReport] = useState<AIReportData | null>(null);
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

      // Get student profile
      const { data: profileData } = await supabase
        .from('students')
        .select('id, users(name)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profileData) {
        setError('Student profile not found. Please contact your administrator.');
        setLoading(false);
        return;
      }

      const sid = profileData.id;
      setStudentId(sid);
      setStudentName((profileData as any).users?.name ?? 'Student');

      const [kpiData, coursesData, attendanceData, assignmentsData, examsData, aiData] = await Promise.all([
        studentDashboardFullService.getOverviewKPIs(sid),
        studentDashboardFullService.getCourses(sid),
        studentDashboardFullService.getAttendanceHistory(sid),
        studentDashboardFullService.getAssignments(sid),
        studentDashboardFullService.getExams(sid),
        studentDashboardFullService.getAIReport(sid),
      ]);

      setKpi(kpiData);
      setCourses(coursesData);
      setAttendance(attendanceData);
      setAssignments(assignmentsData);
      setExams(examsData);
      setAiReport(aiData);
    } catch (err: any) {
      console.error('Student dashboard load error:', err);
      setError(err?.message ?? 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time: refresh when attendance, assignments, or exam results change
  useRealtimeSubscription(
    ['attendance', 'assignment_submissions', 'exam_results'],
    loadData,
    !!user
  );

  const pendingAssignments = assignments.filter((a) => a.status === 'pending' || a.status === 'overdue').length;
  const upcomingExams = exams.filter((e) => e.status === 'upcoming').length;

  return (
    <AppLayout activeRoute="/student-dashboard">
      <div className="space-y-6 fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-700 text-foreground">Student Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, <span className="font-600 text-foreground">{studentName}</span> · Academic Year 2025–2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingAssignments > 0 && (
              <span className="text-xs font-600 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {pendingAssignments} assignment{pendingAssignments > 1 ? 's' : ''} due
              </span>
            )}
            {upcomingExams > 0 && (
              <span className="text-xs font-600 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {upcomingExams} exam{upcomingExams > 1 ? 's' : ''} upcoming
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-negative flex items-center gap-2">
            <Icon name="ExclamationTriangleIcon" size={16} className="text-negative flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-muted rounded-2xl p-1.5 overflow-x-auto scrollbar-thin">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-600 whitespace-nowrap transition-all duration-200 ${
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
              {tab.id === 'assignments' && pendingAssignments > 0 && (
                <span className="text-[10px] font-700 bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {pendingAssignments}
                </span>
              )}
              {tab.id === 'exams' && upcomingExams > 0 && (
                <span className="text-[10px] font-700 bg-blue-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {upcomingExams}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <StudentDashboardOverview kpi={kpi} loading={loading} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <StudentCourseList courses={courses} loading={loading} />
              <StudentAIRecommendations
                aiReport={aiReport}
                kpi={kpi}
                studentName={studentName}
                loading={loading}
              />
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <StudentCourseList courses={courses} loading={loading} />
        )}

        {activeTab === 'attendance' && (
          <StudentAttendance records={attendance} loading={loading} />
        )}

        {activeTab === 'assignments' && studentId && (
          <StudentAssignments
            assignments={assignments}
            studentId={studentId}
            loading={loading}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'exams' && (
          <StudentExams exams={exams} loading={loading} />
        )}

        {activeTab === 'ai' && (
          <StudentAIRecommendations
            aiReport={aiReport}
            kpi={kpi}
            studentName={studentName}
            loading={loading}
          />
        )}
      </div>
    </AppLayout>
  );
}
