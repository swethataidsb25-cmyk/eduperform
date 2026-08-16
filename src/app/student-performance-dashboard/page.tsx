'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import StudentHeader from './components/StudentHeader';
import StudentKPIGrid from './components/StudentKPIGrid';
import StudentChartsRow from './components/StudentChartsRow';
import AssignmentsTable from './components/AssignmentsTable';
import AIInsightsPanel from './components/AIInsightsPanel';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  studentDashboardService,
  type StudentProfile,
  type KPIData,
  type AssignmentRow,
  type GradeHistoryPoint,
  type SubjectScore,
  type AIReport,
} from '@/lib/services/studentDashboardService';

export default function StudentPerformanceDashboardPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [gradeHistory, setGradeHistory] = useState<GradeHistoryPoint[]>([]);
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/sign-up-login-screen');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          setError('Not authenticated. Please log in.');
          setLoading(false);
          return;
        }

        const studentProfile = await studentDashboardService.getStudentProfile(authUser.id);
        setProfile(studentProfile);

        if (!studentProfile) {
          setError('Student profile not found.');
          setLoading(false);
          return;
        }

        const [kpis, asgns, grades, subjects, aiRpt] = await Promise.all([
          studentDashboardService.getKPIData(studentProfile.id),
          studentDashboardService.getAssignments(studentProfile.id),
          studentDashboardService.getGradeHistory(studentProfile.id),
          studentDashboardService.getSubjectScores(studentProfile.id),
          studentDashboardService.getAIReport(studentProfile.id),
        ]);

        setKpiData(kpis);
        setAssignments(asgns);
        setGradeHistory(grades);
        setSubjectScores(subjects);
        setAiReport(aiRpt);
      } catch (err: any) {
        console.error('Dashboard load error:', err);
        setError(err?.message ?? 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user, authLoading]);

  return (
    <AppLayout activeRoute="/student-performance-dashboard">
      <div className="space-y-6 fade-in">
        <StudentHeader profile={profile} loading={loading} />
        <StudentKPIGrid kpiData={kpiData} loading={loading} />

        {error && (
          <div className="bg-negative/10 border border-negative/30 rounded-xl px-5 py-4 text-sm text-negative">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 2xl:col-span-2">
            <StudentChartsRow
              gradeHistory={gradeHistory}
              subjectScores={subjectScores}
              loading={loading}
              studentName={profile?.name ?? 'Student'}
            />
          </div>
          <div className="xl:col-span-1 2xl:col-span-1">
            <AIInsightsPanel aiReport={aiReport} kpiData={kpiData} loading={loading} />
          </div>
        </div>

        <AssignmentsTable assignments={assignments} loading={loading} />
      </div>
    </AppLayout>
  );
}